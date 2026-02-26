// ============================================================================
// SKILLS EXCHANGE FUNCTIONALITY
// ============================================================================

// Load all skills
async function loadSkills() {
    try {
        const response = await fetchWithAuth(`${API_BASE}/skills`);
        if (response.ok) {
            allSkills = await response.json();
            renderSkills();
        }
    } catch (err) {
        console.error("Error loading skills", err);
    }
}

// Render skills grid
function renderSkills() {
    const skillsGrid = document.getElementById("skillsGrid");
    if (!skillsGrid) return;

    const category = document.getElementById('skillCategoryFilter')?.value || 'all';
    let filtered = category === 'all' ? allSkills : allSkills.filter(s => s.category === category);

    if (filtered.length === 0) {
        skillsGrid.innerHTML = '<p class="muted">No skills found in this category</p>';
        return;
    }

    skillsGrid.innerHTML = filtered.map(skill => `
        <div class="card">
            <div class="card-content">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h4 style="margin: 0;">${skill.skillName}</h4>
                        <p class="muted" style="font-size: 0.85rem; margin: 0.25rem 0;">by ${skill.residentName} • ${skill.flat}</p>
                    </div>
                    <span class="badge" style="background: var(--primary); color: white; padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem;">${skill.category}</span>
                </div>
                <p style="font-size: 0.9rem; margin-bottom: 1rem;">${skill.description || 'No description provided'}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <div>
                        <div style="font-size: 0.85rem; color: var(--muted);">
                            <i class="fas fa-star" style="color: #fbbf24;"></i> ${skill.rating ? skill.rating.toFixed(1) : 'No ratings'} 
                            ${skill.reviewCount ? `(${skill.reviewCount})` : ''}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem;">
                            <i class="fas fa-clock"></i> ${skill.availability}
                        </div>
                    </div>
                    ${skill.residentId !== currentResident?.id ? 
                        `<button class="btn btn-sm btn-primary" onclick="showRequestSkillModal(${skill.id}, '${skill.skillName}', '${skill.residentName}')">
                            <i class="fas fa-paper-plane"></i> Request
                        </button>` : 
                        `<div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span class="badge" style="background: var(--success); color: white; padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem;">Your Skill</span>
                            <button class="btn btn-sm" style="color: var(--danger); background: none; border: 1px solid var(--danger);" onclick="deleteSkill(${skill.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                         </div>`
                    }
                </div>
            </div>
        </div>
    `).join("");
}

window.filterSkills = renderSkills;

// Show request skill modal
window.showRequestSkillModal = (skillId, skillName, providerName) => {
    document.getElementById('requestSkillId').value = skillId;
    document.getElementById('requestSkillInfo').textContent = `Request "${skillName}" from ${providerName}`;
    showModal('requestSkillModal');
};

// Add skill form handler
document.addEventListener('DOMContentLoaded', () => {
    const addSkillForm = document.getElementById('addSkillForm');
    if (addSkillForm) {
        addSkillForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newSkill = {
                residentId: currentResident?.id,
                residentName: currentResident?.name,
                flat: currentResident?.flat,
                skillName: document.getElementById('skillName').value.trim(),
                category: document.getElementById('skillCategory').value,
                description: document.getElementById('skillDescription').value.trim(),
                availability: document.getElementById('skillAvailability').value.trim()
            };

            try {
                const response = await fetchWithAuth(`${API_BASE}/skills`, {
                    method: 'POST',
                    body: JSON.stringify(newSkill)
                });

                if (response.ok) {
                    if (window.showToast) {
                        window.showToast('Success', 'Skill shared successfully! +8 points earned!', 'success');
                    }
                    closeModal('addSkillModal');
                    addSkillForm.reset();
                    await loadSkills();
                    
                    // Award points for sharing skill
                    await awardPoints('SKILL_SHARE', 'Shared a new skill', 8);
                }
            } catch (err) {
                console.error("Error adding skill", err);
                if (window.showToast) {
                    window.showToast('Error', 'Failed to share skill', 'error');
                }
            }
        });
    }

    // Request skill form handler
    const requestSkillForm = document.getElementById('requestSkillForm');
    if (requestSkillForm) {
        requestSkillForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const skillId = document.getElementById('requestSkillId').value;
            const request = {
                requesterId: currentResident?.id,
                requesterName: currentResident?.name,
                requesterFlat: currentResident?.flat,
                message: document.getElementById('requestMessage').value.trim()
            };

            try {
                const response = await fetchWithAuth(`${API_BASE}/skills/${skillId}/request`, {
                    method: 'POST',
                    body: JSON.stringify(request)
                });

                if (response.ok) {
                    if (window.showToast) {
                        window.showToast('Success', 'Request sent successfully!', 'success');
                    }
                    closeModal('requestSkillModal');
                    requestSkillForm.reset();
                }
            } catch (err) {
                console.error("Error requesting skill", err);
                if (window.showToast) {
                    window.showToast('Error', 'Failed to send request', 'error');
                }
            }
        });
    }
});

// ============================================================================
// CREDIT SCORE & GAMIFICATION
// ============================================================================

// Load credit score
async function loadCreditScore() {
    if (!currentResident?.id) return;
    
    try {
        const response = await fetchWithAuth(`${API_BASE}/credit-score/resident/${currentResident.id}`);
        if (response.ok) {
            myCreditScore = await response.json();
            updateCreditScoreDisplay();
        }
    } catch (err) {
        console.error("Error loading credit score", err);
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetchWithAuth(`${API_BASE}/credit-score/leaderboard`);
        if (response.ok) {
            leaderboard = await response.json();
            renderLeaderboard();
        }
    } catch (err) {
        console.error("Error loading leaderboard", err);
    }
}

// Update credit score display
function updateCreditScoreDisplay() {
    if (!myCreditScore) return;
    
    const pointsEl = document.getElementById('myTotalPoints');
    const levelEl = document.getElementById('myLevel');
    const rankEl = document.getElementById('myRank');
    
    if (pointsEl) pointsEl.textContent = myCreditScore.totalPoints || 0;
    if (levelEl) levelEl.textContent = myCreditScore.level || 1;
    if (rankEl) rankEl.textContent = myCreditScore.rank || '-';
}

// Render leaderboard
function renderLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboardTableBody");
    if (!leaderboardBody) return;

    if (leaderboard.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">No data yet</td></tr>';
        return;
    }

    leaderboardBody.innerHTML = leaderboard.map((resident, index) => {
        let title = "Resident";
        let titleColor = "var(--primary)";
        if (resident.totalPoints > 50) { title = "Elite Member"; titleColor = "#8b5cf6"; }
        else if (resident.totalPoints > 20) { title = "Active Contributor"; titleColor = "#10b981"; }
        
        return `
        <tr ${resident.residentId === currentResident?.id ? 'style="background: var(--muted); font-weight: 600;"' : ''}>
            <td>
                <div style="font-weight: 800;">${index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</div>
            </td>
            <td>
                <div style="font-weight: 600;">${resident.residentName}</div>
                <div style="font-size: 0.75rem; color: ${titleColor}; font-weight: 700;">${title}</div>
            </td>
            <td>${resident.flat}</td>
            <td><strong style="color: var(--primary); font-size: 1.1rem;">${resident.totalPoints}</strong></td>
            <td>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    <span class="badge" style="background: var(--gradient-primary); color: white; border: none;">Lvl ${resident.level}</span>
                    ${resident.totalPoints > 30 ? '<i class="fas fa-medal" style="color: #fbbf24;" title="Gold Contributor"></i>' : ''}
                </div>
            </td>
        </tr>
    `;}).join("");
}

// Award points helper function
async function awardPoints(activityType, description, points) {
    if (!currentResident?.id) return;
    
    try {
        await fetchWithAuth(`${API_BASE}/credit-score/add-points`, {
            method: 'POST',
            body: JSON.stringify({
                residentId: currentResident.id,
                activityType,
                description,
                points
            })
        });
        
        // Reload credit score
        await loadCreditScore();
    } catch (err) {
        console.error("Error awarding points", err);
    }
}

// Delete skill
async function deleteSkill(skillId) {
    if (!confirm("Are you sure you want to remove this skill?")) return;
    
    try {
        const response = await fetchWithAuth(`${API_BASE}/skills/${skillId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            if (window.showToast) {
                window.showToast('Success', 'Skill removed successfully', 'success');
            }
            await loadSkills();
        }
    } catch (err) {
        console.error("Error deleting skill", err);
    }
}

// module.exports = { awardPoints };
