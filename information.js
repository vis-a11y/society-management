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
const societyName = document.getElementById("societyName");
const societyAddress = document.getElementById("societyAddress");
const numFlats = document.getElementById("numFlats");
const societyManager = document.getElementById("societyManager");

// Error messages
const nameError = document.getElementById("nameError");
const addressError = document.getElementById("addressError");
const flatsError = document.getElementById("flatsError");
const managerError = document.getElementById("managerError");

// Pre-fill form with current data
function fillForm() {
    societyName.value = displayName.textContent;
    societyAddress.value = displayAddress.textContent;
    numFlats.value = displayFlats.textContent;
    societyManager.value = displayManager.textContent;
}

// Toggle view/edit modes
editBtn.addEventListener("click", () => {
    viewMode.classList.add("hidden");
    editMode.classList.remove("hidden");
    fillForm();
});

cancelBtn.addEventListener("click", () => {
    editMode.classList.add("hidden");
    viewMode.classList.remove("hidden");
    clearErrors();
});

// Clear error messages
function clearErrors() {
    nameError.style.display = "none";
    addressError.style.display = "none";
    flatsError.style.display = "none";
    managerError.style.display = "none";
}

// Form submission
societyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();
    let valid = true;

    if (!societyName.value.trim()) {
        nameError.style.display = "block";
        valid = false;
    }
    if (!societyAddress.value.trim()) {
        addressError.style.display = "block";
        valid = false;
    }
    if (!numFlats.value || numFlats.value < 1) {
        flatsError.style.display = "block";
        valid = false;
    }
    if (!societyManager.value.trim()) {
        managerError.style.display = "block";
        valid = false;
    }

    if (valid) {
        displayName.textContent = societyName.value;
        displayAddress.textContent = societyAddress.value;
        displayFlats.textContent = numFlats.value;
        displayManager.textContent = societyManager.value;

        successMessage.style.display = "block";
        setTimeout(() => successMessage.style.display = "none", 3000);

        editMode.classList.add("hidden");
        viewMode.classList.remove("hidden");
    }
});
