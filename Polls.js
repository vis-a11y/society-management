const API_BASE = "http://localhost:5000/api";
const pollsList = document.getElementById('pollsList');

// Helper for authenticated requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    return fetch(url, options);
}

async function loadPolls() {
    try {
        const response = await fetchWithAuth(`${API_BASE}/polls`);
        const polls = await response.json();
        renderPolls(polls);
    } catch (err) {
        console.error("Failed to load polls", err);
    }
}

function renderPolls(polls) {
    if (polls.length === 0) {
        pollsList.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; background: var(--card); border-radius: 12px; border: 1px dashed var(--border);">
                <i class="fas fa-poll-h" style="font-size: 3rem; color: var(--muted-foreground); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--muted-foreground);">No active polls at the moment. Stay tuned!</p>
            </div>`;
        return;
    }

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    pollsList.innerHTML = polls.map(poll => {
        const totalVotes = poll.voteCounts.reduce((acc, curr) => acc + curr.count, 0);
        
        return `
            <div class="poll-card shadow-sm" style="animation: fadeInUp 0.5s ease-out forwards;">
                <div class="poll-question">${poll.question}</div>
                <div class="poll-options">
                    ${poll.options.map((opt, index) => {
                        const votesForThis = poll.voteCounts.find(v => v.optionIndex === index)?.count || 0;
                        const percentage = totalVotes > 0 ? (votesForThis / totalVotes * 100).toFixed(0) : 0;
                        const color = colors[index % colors.length];
                        
                        return `
                            <button class="poll-option" onclick="vote(${poll.id}, ${index})">
                                <div class="poll-progress" style="width: ${percentage}%; background: ${color}20"></div>
                                <div class="poll-content">
                                    <span style="font-weight: 500;">${opt}</span>
                                    <div style="text-align: right;">
                                        <span class="poll-vote-count" style="color: ${color}">${percentage}%</span>
                                        <div style="font-size: 0.7rem; color: var(--muted-foreground);">${votesForThis} votes</div>
                                    </div>
                                </div>
                                <div style="position: absolute; bottom: 0; left: 0; height: 2px; width: ${percentage}%; background: ${color}; transition: width 0.8s ease;"></div>
                            </button>
                        `;
                    }).join("")}
                </div>
                <div class="poll-meta" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 1rem;">
                        <span title="Total Participants"><i class="fas fa-users"></i> ${totalVotes}</span>
                        <span title="Deadline"><i class="fas fa-clock"></i> ${new Date(poll.expiresAt).toLocaleDateString()}</span>
                    </div>
                    <span style="font-size: 0.75rem; background: var(--secondary); padding: 0.2rem 0.6rem; border-radius: 10px; color: var(--muted-foreground);">Live Results</span>
                </div>
            </div>
        `;
    }).join("");
}

async function vote(pollId, optionIndex) {
    try {
        const response = await fetchWithAuth(`${API_BASE}/polls/${pollId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ optionIndex })
        });

        if (response.ok) {
            if (window.showToast) window.showToast('Vote Recorded', 'Thank you for participating!', 'success');
            loadPolls();
        } else {
            const data = await response.json();
            if (window.showToast) window.showToast('Action Denied', data.message, 'warning');
        }
    } catch (err) {
        console.error("Voting failed", err);
    }
}

document.addEventListener('DOMContentLoaded', loadPolls);
