// Sample residents (you can fetch from database)
const residents = ["Rajesh Kumar", "Priya Sharma","Amit Patel", "Sunita Gupta","Sneha Reddy"];

const residentSelect = document.getElementById("residentSelect");
const maintenanceForm = document.getElementById("maintenanceForm");
const maintenanceTable = document.getElementById("maintenanceTable").querySelector("tbody");
const successMessage = document.getElementById("successMessage");

// Populate resident select
residents.forEach(resident => {
    const option = document.createElement("option");
    option.value = resident;
    option.textContent = resident;
    residentSelect.appendChild(option);
});

// Handle form submission
maintenanceForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const resident = residentSelect.value;
    const month = document.getElementById("maintenanceMonth").value;
    const amount = document.getElementById("maintenanceAmount").value;
    const remark = document.getElementById("maintenanceRemark").value; 
    const status = document.getElementById("maintenanceStatus").value;

    // Add to table
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${resident}</td>
        <td>${month}</td>
        <td>₹${amount}</td>
        <td>${Remark}</td>
        <td><span class="status-badge ${status}">${status}</span></td>
    `;
    maintenanceTable.appendChild(row);

    // Reset form
    maintenanceForm.reset();

    // Show success message
    successMessage.style.display = "block";
    setTimeout(() => successMessage.style.display = "none", 3000);
});
