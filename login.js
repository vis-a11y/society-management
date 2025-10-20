// Initialize localStorage users
if(!localStorage.getItem("smsUsers")) {
    const defaultUsers = [
        { id: "admin", password: "admin123", role: "Admin" }
    ];
    localStorage.setItem("smsUsers", JSON.stringify(defaultUsers));
}

const loginForm = document.getElementById("loginForm");
const loginID = document.getElementById("loginID");
const password = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");

// Forgot Password Elements
const forgotPassword = document.getElementById("forgotPassword");
const forgotModal = document.getElementById("forgotModal");
const closeModal = document.querySelector(".close");
const resetBtn = document.getElementById("resetBtn");
const forgotID = document.getElementById("forgotID");
const resetMessage = document.getElementById("resetMessage");

// Register Elements
const registerUser = document.getElementById("registerUser");
const registerModal = document.getElementById("registerModal");
const registerClose = document.getElementById("registerClose");
const regID = document.getElementById("regID");
const regPassword = document.getElementById("regPassword");
const role = document.getElementById("role");
const registerBtn = document.getElementById("registerBtn");
const registerMessage = document.getElementById("registerMessage");

// Login
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("smsUsers")) || [];
    const user = users.find(u => u.id === loginID.value && u.password === password.value);
    if(user) {
        errorMessage.style.display = "none";
        alert(`Login Successful! Role: ${user.role}`);
        // Redirect based on role
        if(user.role === "Admin") {
            window.location.href = "adminDashboard.html";
        } else {
            window.location.href = "userDashboard.html";
        }
    } else {
        errorMessage.style.display = "block";
    }
});

// Forgot Password
forgotPassword.addEventListener("click", (e) => {
    e.preventDefault();
    forgotModal.classList.remove("hidden");
});

closeModal.addEventListener("click", () => {
    forgotModal.classList.add("hidden");
    resetMessage.textContent = "";
    forgotID.value = "";
});

resetBtn.addEventListener("click", () => {
    const users = JSON.parse(localStorage.getItem("smsUsers")) || [];
    const user = users.find(u => u.id === forgotID.value);
    if(user) {
        resetMessage.style.color = "green";
        resetMessage.textContent = `Password for ${user.id} is: ${user.password}`;
    } else {
        resetMessage.style.color = "red";
        resetMessage.textContent = "User not found!";
    }
});

// Register User
registerUser.addEventListener("click", (e) => {
    e.preventDefault();
    registerModal.classList.remove("hidden");
});

registerClose.addEventListener("click", () => {
    registerModal.classList.add("hidden");
    registerMessage.textContent = "";
    regID.value = "";
    regPassword.value = "";
    role.value = "User";
});

registerBtn.addEventListener("click", () => {
    const users = JSON.parse(localStorage.getItem("smsUsers")) || [];
    if(!regID.value || !regPassword.value) {
        registerMessage.style.color = "red";
        registerMessage.textContent = "Please fill all fields!";
        return;
    }
    const existingUser = users.find(u => u.id === regID.value);
    if(existingUser) {
        registerMessage.style.color = "red";
        registerMessage.textContent = "User already exists!";
        return;
    }
    users.push({ id: regID.value, password: regPassword.value, role: role.value });
    localStorage.setItem("smsUsers", JSON.stringify(users));
    registerMessage.style.color = "green";
    registerMessage.textContent = "User registered successfully!";
    regID.value = "";
    regPassword.value = "";
});



