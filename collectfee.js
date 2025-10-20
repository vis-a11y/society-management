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

let editIndex = null; // Track index of fee being edited

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
    collectedFees.forEach((fee, index) => {
        const resident = residentsData.find(r => r.id == fee.residentId);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${resident ? resident.name : "Unknown"}</td>
            <td>${fee.month}</td>
            <td>₹${fee.amount}</td>
            <td><span class="fee-status ${fee.status}">${fee.status}</span></td>
            <td>
                <button class="action-btn edit-btn" data-index="${index}">Edit</button>
                <button class="action-btn delete-btn" data-index="${index}">Delete</button>
            </td>
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

    if (editIndex !== null) {
        // Edit existing fee
        collectedFees[editIndex] = {
            residentId: parseInt(residentId),
            month,
            amount,
            status
        };
        editIndex = null; // Reset edit index
    } else {
        // Add new fee
        collectedFees.push({
            residentId: parseInt(residentId),
            month,
            amount,
            status
        });
    }

    // Save to localStorage
    localStorage.setItem("collectedFees", JSON.stringify(collectedFees));

    // Render table
    renderFeesTable();

    // Show success message
    successMessage.textContent = "Fee saved successfully!";
    successMessage.style.display = "block";
    setTimeout(() => {
        successMessage.style.display = "none";
    }, 3000);

    // Reset form
    feeForm.reset();
});

// Handle Edit/Delete buttons using event delegation
feeTableBody.addEventListener("click", function (e) {
    const index = e.target.getAttribute("data-index");
    if (e.target.classList.contains("delete-btn")) {
        // Delete fee
        collectedFees.splice(index, 1);
        localStorage.setItem("collectedFees", JSON.stringify(collectedFees));
        renderFeesTable();
    } else if (e.target.classList.contains("edit-btn")) {
        // Edit fee: populate form
        const fee = collectedFees[index];
        residentSelect.value = fee.residentId;
        document.getElementById("feeMonth").value = fee.month;
        document.getElementById("feeAmount").value = fee.amount;
        document.getElementById("feeStatus").value = fee.status;
        editIndex = index; // Track which fee is being edited
        successMessage.textContent = "Editing fee. Update and submit.";
        successMessage.style.display = "block";
        setTimeout(() => {
            successMessage.style.display = "none";
        }, 3000);
    }
});

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
    populateResidents();
    renderFeesTable();
});
