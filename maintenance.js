const API_BASE = "http://localhost:5000/api";
let residentsData = [];
let maintenanceRecords = [];

const residentSelect = document.getElementById("residentSelect");
const maintenanceForm = document.getElementById("maintenanceForm");
const maintenanceTableBody = document.getElementById("maintenanceTable").querySelector("tbody");
const successMessage = document.getElementById("successMessage");

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

// Populate resident select
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

async function renderMaintenanceTable() {
    try {
        const response = await fetchWithAuth(`${API_BASE}/maintenance`);
        maintenanceRecords = await response.json();
        
        maintenanceTableBody.innerHTML = "";
        if (maintenanceRecords.length === 0) {
            maintenanceTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #999; padding: 2rem;">No maintenance records found.</td></tr>`;
            return;
        }

        maintenanceRecords.forEach(record => {
            const resident = residentsData.find(r => r.id == record.residentId);
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${resident ? resident.name : "Unknown"}</td>
                <td>${record.month}</td>
                <td>₹${parseInt(record.amount).toLocaleString()}</td>
                <td>${record.remark}</td>
                <td><span class="status-badge ${record.status.toLowerCase()}">${record.status}</span></td>
            `;
            maintenanceTableBody.appendChild(row);
        });
    } catch (err) {
        console.error("Failed to load maintenance records", err);
    }
}

// Handle form submission
maintenanceForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const residentId = residentSelect.value;
    const month = document.getElementById("maintenanceMonth").value;
    const amount = document.getElementById("maintenanceAmount").value;
    const remark = document.getElementById("maintenanceRemark").value; 
    const status = document.getElementById("maintenanceStatus").value;

    if (!residentId || !month || !amount || !status) return;

    const newRecord = {
        residentId: parseInt(residentId),
        month,
        amount,
        remark,
        status
    };

    try {
        const response = await fetchWithAuth(`${API_BASE}/maintenance`, {
            method: 'POST',
            body: JSON.stringify(newRecord)
        });

        if (response.ok) {
            await renderMaintenanceTable();
            maintenanceForm.reset();
            successMessage.style.display = "block";
            setTimeout(() => successMessage.style.display = "none", 3000);
        }
    } catch (err) {
        console.error("Failed to save maintenance record", err);
    }
});

// Initial Load
document.addEventListener("DOMContentLoaded", async () => {
    await populateResidents();
    await renderMaintenanceTable();
});

