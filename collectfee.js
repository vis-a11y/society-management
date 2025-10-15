/* Collect Fee Page Container */
// Sample residents data (replace with your existing residentsData if available)
const residentsData = JSON.parse(localStorage.getItem("residentsData")) || [
    { id: 1, name: "Rajesh Kumar", flat: "A-204" },
    { id: 2, name: "Priya Sharma", flat: "B-305" },
    { id: 3, name: "Amit Patel", flat: "C-102" },
    { id: 4, name: "Sunita Gupta", flat: "A-506" },
    { id: 5, name: "Sneha Reddy", flat: "C-408" }
];

// Initialize fees array
let collectedFees = JSON.parse(localStorage.getItem("collectedFees")) || [];

// DOM Elements
const residentSelect = document.getElementById("residentSelect");
const feeForm = document.getElementById("feeForm");
const feeTableBody = document.querySelector("#feeTable tbody");
const successMessage = document.getElementById("successMessage");

// Populate residents dropdown
function populateResidents() {
    residentSelect.innerHTML = `<option value="">Select Resident</option>`;
    residentsData.forEach(resident => {
        const option = document.createElement("option");
        option.value = resident.id;
        option.textContent = `${resident.name} (${resident.flat})`;
        residentSelect.appendChild(option);
    });
}

// Render fees table
function renderFeesTable() {
    feeTableBody.innerHTML = "";
    collectedFees.forEach(fee => {
        const resident = residentsData.find(r => r.id == fee.residentId);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${resident ? resident.name : "Unknown"}</td>
            <td>${fee.month}</td>
            <td>₹${fee.amount}</td>
            <td><span class="fee-status ${fee.status}">${fee.status}</span></td>
        `;
        feeTableBody.appendChild(tr);
    });
}

// Handle form submission
feeForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const residentId = residentSelect.value;
    const month = document.getElementById("feeMonth").value;
    const amount = document.getElementById("feeAmount").value;
    const status = document.getElementById("feeStatus").value;

    if (!residentId || !month || !amount || !status) return;

    // Add fee to collectedFees array
    const newFee = { residentId: parseInt(residentId), month, amount, status };
    collectedFees.push(newFee);

    // Save to localStorage
    localStorage.setItem("collectedFees", JSON.stringify(collectedFees));

    // Render table
    renderFeesTable();

    // Show success message
    successMessage.style.display = "block";
    setTimeout(() => {
        successMessage.style.display = "none";
    }, 3000);

    // Reset form
    feeForm.reset();
});

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    populateResidents();
    renderFeesTable();
});
