const API_BASE = "http://localhost:5000/api";
let residentsData = [];
let collectedFees = [];

// DOM Elements
const residentSelect = document.getElementById("residentSelect");
const feeForm = document.getElementById("feeForm");
const feeTableBody = document.querySelector("#feeTable tbody");
const successMessage = document.getElementById("successMessage");

let editIndex = null;

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

// Populate residents dropdown
async function populateResidents() {
    try {
        const response = await fetchWithAuth(`${API_BASE}/residents`);
        residentsData = await response.json();
        
        residentSelect.innerHTML = `<option value="">Select Resident</option>`;
        residentsData.forEach(resident => {
            const option = document.createElement("option");
            option.value = resident.id;
            option.textContent = `${resident.name} (${resident.flat})`;
            residentSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load residents", err);
    }
}

// Render fees table
async function renderFeesTable() {
    try {
        const response = await fetchWithAuth(`${API_BASE}/fees`);
        collectedFees = await response.json();
        
        feeTableBody.innerHTML = "";
        if (collectedFees.length === 0) {
            feeTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #999; padding: 2rem;">No fee records found.</td></tr>`;
            return;
        }

        collectedFees.forEach((fee, index) => {
            const resident = residentsData.find(r => r.id == fee.residentId);
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${resident ? resident.name : "Unknown"}</td>
                <td>${fee.month}</td>
                <td>₹${parseInt(fee.amount).toLocaleString()}</td>
                <td><span class="status-badge ${fee.status.toLowerCase()}">${fee.status}</span></td>
                <td>
                    <!-- Edit/Delete suppressed for backend demo unless implemented -->
                </td>
            `;
            feeTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Failed to load fees", err);
    }
}

// Handle form submission
feeForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const residentId = residentSelect.value;
    const month = document.getElementById("feeMonth").value;
    const amount = document.getElementById("feeAmount").value;
    const status = document.getElementById("feeStatus").value;

    if (!residentId || !month || !amount || !status) return;

    const newFee = { residentId: parseInt(residentId), month, amount, status };

    try {
        const response = await fetchWithAuth(`${API_BASE}/fees`, {
            method: 'POST',
            body: JSON.stringify(newFee)
        });

        if (response.ok) {
            successMessage.style.display = "block";
            setTimeout(() => { successMessage.style.display = "none"; }, 3000);
            feeForm.reset();
            await renderFeesTable();
        }
    } catch (err) {
        console.error("Failed to save fee", err);
    }
});

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
    await populateResidents();
    await renderFeesTable();
});

