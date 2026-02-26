const API_BASE = "http://localhost:5000/api";
const form = document.getElementById('addAnnouncementForm');

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

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('Announcement').value;
        const date = document.getElementById('MeetingDate').value;
        const time = document.getElementById('MeetingTime').value;
        const ampm = document.querySelector('select[name="ampm"]').value;
        const desc = document.getElementById('description').value;

        const newAnnouncement = {
            title: title,
            content: desc,
            type: "Important", // default
            date: `${date} ${time} ${ampm}`,
            isPinned: false
        };

        try {
            const response = await fetchWithAuth(`${API_BASE}/announcements`, {
                method: 'POST',
                body: JSON.stringify(newAnnouncement)
            });

            if (response.ok) {
                document.getElementById('successMessage').style.display = 'block';
                form.reset();
                setTimeout(() => {
                    window.location.href = 'adminDashboard.html';
                }, 1500);
            } else {
                const data = await response.json();
                alert(data.message || "Failed to post announcement");
            }
        } catch (err) {
            console.error("Error posting announcement", err);
        }
    });
}
