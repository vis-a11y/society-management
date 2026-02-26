const API_BASE = "http://localhost:5000/api";

// Elements
const viewMode = document.getElementById("viewMode");
const editMode = document.getElementById("editMode");
const editBtn = document.getElementById("editBtn");
const cancelBtn = document.getElementById("cancelBtn");
const successMessage = document.getElementById("successMessage");

// Display spans
const displayName = document.getElementById("displayName");
const displayAddress = document.getElementById("displayAddress");
const displayFlats = document.getElementById("displayFlats");
const displayManager = document.getElementById("displayManager");

// Form inputs
const societyForm = document.getElementById("editMode");
const societyNameInput = document.getElementById("societyName");
const societyAddressInput = document.getElementById("societyAddress");
const numFlatsInput = document.getElementById("numFlats");
const societyManagerInput = document.getElementById("societyManager");

// Error messages
const nameError = document.getElementById("nameError");
const addressError = document.getElementById("addressError");
const flatsError = document.getElementById("flatsError");
const managerError = document.getElementById("managerError");

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

// Pre-fill form with current data
function fillForm() {
    societyNameInput.value = displayName.textContent;
    societyAddressInput.value = displayAddress.textContent;
    numFlatsInput.value = displayFlats.textContent;
    societyManagerInput.value = displayManager.textContent;
}

// Toggle view/edit modes
if (editBtn) {
    editBtn.addEventListener("click", () => {
        viewMode.classList.add("hidden");
        editMode.classList.remove("hidden");
        fillForm();
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
        editMode.classList.add("hidden");
        viewMode.classList.remove("hidden");
        clearErrors();
    });
}

// Clear error messages
function clearErrors() {
    [nameError, addressError, flatsError, managerError].forEach(el => {
        if (el) el.style.display = "none";
    });
}

// Load data from backend on init
async function loadSocietyInfo() {
    try {
        const response = await fetchWithAuth(`${API_BASE}/society-info`);
        const info = await response.json();
        if (info) {
            displayName.textContent = info.name;
            displayAddress.textContent = info.address;
            displayFlats.textContent = info.flats;
            displayManager.textContent = info.manager;
        }
    } catch (err) {
        console.error("Failed to load society info", err);
    }
}

// Form submission
if (societyForm) {
    societyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();
        let valid = true;

        if (!societyNameInput.value.trim()) {
            nameError.style.display = "block";
            valid = false;
        }
        if (!societyAddressInput.value.trim()) {
            addressError.style.display = "block";
            valid = false;
        }
        if (!numFlatsInput.value || numFlatsInput.value < 1) {
            flatsError.style.display = "block";
            valid = false;
        }
        if (!societyManagerInput.value.trim()) {
            managerError.style.display = "block";
            valid = false;
        }

        if (valid) {
            const info = {
                name: societyNameInput.value,
                address: societyAddressInput.value,
                flats: numFlatsInput.value,
                manager: societyManagerInput.value
            };
            
            try {
                const response = await fetchWithAuth(`${API_BASE}/society-info`, {
                    method: 'POST',
                    body: JSON.stringify(info)
                });

                if (response.ok) {
                    displayName.textContent = info.name;
                    displayAddress.textContent = info.address;
                    displayFlats.textContent = info.flats;
                    displayManager.textContent = info.manager;

                    successMessage.style.display = "block";
                    setTimeout(() => successMessage.style.display = "none", 3000);

                    editMode.classList.add("hidden");
                    viewMode.classList.remove("hidden");
                }
            } catch (err) {
                console.error("Failed to update society info", err);
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", loadSocietyInfo);

