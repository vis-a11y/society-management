const API_BASE = "http://localhost:5000/api";
const createPollForm = document.getElementById('createPollForm');
const optionsContainer = document.getElementById('optionsContainer');
const adminPollsList = document.getElementById('adminPollsList');

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

function addOption() {
    const div = document.createElement('div');
    div.className = 'option-input-group';
    div.innerHTML = `
        <input type="text" class="poll-opt" required placeholder="New Option">
        <button type="button" class="remove-option" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    optionsContainer.appendChild(div);
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
    adminPollsList.innerHTML = polls.map(poll => {
        const totalVotes = poll.voteCounts.reduce((acc, curr) => acc + curr.count, 0);
        return `
            <div class="card mb-2" style="background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0;">${poll.question}</h4>
                        <p style="color: #64748b; font-size: 0.875rem; margin-top: 0.5rem;">Expires: ${new Date(poll.expiresAt).toLocaleDateString()} | Total Votes: ${totalVotes}</p>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    ${poll.options.map((opt, idx) => {
                        const count = poll.voteCounts.find(v => v.optionIndex === idx)?.count || 0;
                        const pct = totalVotes > 0 ? (count / totalVotes * 100).toFixed(0) : 0;
                        return `
                            <div style="margin-bottom: 0.5rem;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;">
                                    <span>${opt}</span>
                                    <span>${pct}% (${count})</span>
                                </div>
                                <div style="height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${pct}%; height: 100%; background: var(--primary);"></div>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    }).join("");
}

createPollForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const options = Array.from(document.querySelectorAll('.poll-opt')).map(input => input.value);
    const poll = {
        question: document.getElementById('pollQuestion').value,
        options: options,
        expiresAt: document.getElementById('pollExpires').value
    };

    try {
        const response = await fetchWithAuth(`${API_BASE}/polls`, {
            method: 'POST',
            body: JSON.stringify(poll)
        });
        if (response.ok) {
            if (window.showToast) window.showToast('Poll Created', 'New poll has been published successfully.', 'success');
            createPollForm.reset();
            loadPolls();
        }
    } catch (err) {
        console.error("Poll creation failed", err);
    }
});

document.addEventListener('DOMContentLoaded', loadPolls);
