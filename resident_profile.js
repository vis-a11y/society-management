// Resident Profile Management
const API_BASE = "http://localhost:5000/api";

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const residentId = urlParams.get('id');

    if (!residentId) {
        window.location.href = 'index2.html';
        return;
    }

    let resident;

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

    try {
        const response = await fetchWithAuth(`${API_BASE}/residents/${residentId}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error("Resident not found");
            throw new Error("Failed to load resident profile");
        }
        
        resident = await response.json();
        
        // Populate UI
        document.getElementById('residentName').textContent = resident.name;
        document.getElementById('flatNumber').textContent = resident.flat;
        document.getElementById('contactNumber').textContent = resident.phone || 'N/A';
        document.getElementById('emailAddress').textContent = resident.email || 'N/A';
        
        const statusBadge = document.getElementById('residentStatus');
        statusBadge.textContent = resident.status || 'Active';
        statusBadge.className = `badge ${resident.status === 'Inactive' ? 'badge-inactive' : 'badge-active'}`;
        
        document.getElementById('joinDate').textContent = resident.joinDate || 'N/A';

        // Avatar
        const initials = resident.name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('profileAvatar').innerHTML = initials;

    } catch (err) {
        if (window.showToast) window.showToast('Error', err.message, 'error');
        return;
    }

    // Modals
    const editModal = document.getElementById('editModal');
    const closeEdit = document.getElementById('closeEdit');
    const editForm = document.getElementById('editForm');

    // Populate Edit Fields
    const populateEditForm = () => {
        document.getElementById('editName').value = resident.name;
        document.getElementById('editFlat').value = resident.flat;
        document.getElementById('editPhone').value = resident.phone || '';
        document.getElementById('editEmail').value = resident.email || '';
    };

    // Actions
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        populateEditForm();
        editModal.classList.remove('hidden');
    });

    closeEdit.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedData = {
            name: document.getElementById('editName').value,
            flat: document.getElementById('editFlat').value,
            phone: document.getElementById('editPhone').value,
            email: document.getElementById('editEmail').value,
            status: resident.status // keep same for now
        };

        try {
            const response = await fetchWithAuth(`${API_BASE}/residents/${residentId}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                // Update Local UI
                resident = { ...resident, ...updatedData };
                document.getElementById('residentName').textContent = resident.name;
                document.getElementById('flatNumber').textContent = resident.flat;
                document.getElementById('contactNumber').textContent = resident.phone;
                document.getElementById('emailAddress').textContent = resident.email;
                
                const initials = resident.name.split(' ').map(n => n[0]).join('').toUpperCase();
                document.getElementById('profileAvatar').innerHTML = initials;

                editModal.classList.add('hidden');
                if (window.showToast) window.showToast('Profile Updated', 'Changes saved successfully.', 'success');
            }
        } catch (err) {
            if (window.showToast) window.showToast('Error', 'Failed to update profile', 'error');
        }
    });

    document.getElementById('messageBtn').addEventListener('click', () => {
        if (window.showToast) {
            window.showToast('Demo Feature', 'The messaging system is currently in development.', 'info');
        }
    });
});

