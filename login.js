// Backend Config
const API_BASE = window.location.origin + "/api";

const loginForm = document.getElementById("loginForm");
const loginID = document.getElementById("loginID");
const password = document.getElementById("password");
const errorMessage = document.getElementById("errorMessage");

// Landing Page Interactions
const header = document.querySelector('.landing-header');
const openPortalBtn = document.getElementById('openPortalBtn');
const openAdminBtn = document.getElementById('openAdminBtn');
const openPortalBtnHero = document.getElementById('openPortalBtnHero');
const loginModal = document.getElementById('loginModal');
const closePortal = document.getElementById('closePortal');
const forgotClose = document.getElementById('forgotClose');
const regClose = document.getElementById('regClose');

// Forgot Password Elements
const forgotPassword = document.getElementById("forgotPassword");
const forgotModal = document.getElementById("forgotModal");
const resetBtn = document.getElementById("resetBtn");
const forgotID = document.getElementById("forgotID");
const resetMessage = document.getElementById("resetMessage");

// Register Elements
const registerUser = document.getElementById("registerUser");
const registerModal = document.getElementById("registerModal");
const regID = document.getElementById("regID");
const regPassword = document.getElementById("regPassword");
const role = document.getElementById("role");
const registerBtn = document.getElementById("registerBtn");
const registerMessage = document.getElementById("registerMessage");

// Sticky Header
if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Modal Toggles
const toggleModal = (modal, show) => {
    if (!modal) return;
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
};

if (openPortalBtn) openPortalBtn.addEventListener('click', () => toggleModal(loginModal, true));
if (openAdminBtn) openAdminBtn.addEventListener('click', () => toggleModal(loginModal, true));
if (openPortalBtnHero) openPortalBtnHero.addEventListener('click', () => toggleModal(loginModal, true));
if (closePortal) closePortal.addEventListener('click', () => toggleModal(loginModal, false));
if (forgotClose) forgotClose.addEventListener('click', () => toggleModal(forgotModal, false));
if (regClose) regClose.addEventListener('click', () => toggleModal(registerModal, false));

// Login
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: loginID.value, password: password.value })
        });

        const data = await response.json();

        if (response.ok) {
            errorMessage.style.display = "none";
            // Store session
            localStorage.setItem("token", data.token);
            localStorage.setItem("currentUser", JSON.stringify({ id: data.id, role: data.role }));
            
            // Success animation
            const container = document.querySelector(".login-container");
            if (container) {
                container.style.opacity = "0";
                container.style.transform = "translateY(-20px)";
                container.style.transition = "all 0.5s ease";
            }
            
            setTimeout(() => {
                if(data.role === "Admin") window.location.href = "admin-portal.html";
                else window.location.href = "resident-portal.html";
            }, 500);
        } else if (response.status === 403) {
            throw new Error(data.message || "Your account is pending approval from the administrator.");
        } else {
            throw new Error(data.message || "Invalid login credentials!");
        }
    } catch (err) {
        errorMessage.style.display = "block";
        errorMessage.textContent = err.message;
        loginForm.classList.add("shake");
        setTimeout(() => loginForm.classList.remove("shake"), 500);
    }
});

// Forgot Password
forgotPassword.addEventListener("click", (e) => {
    e.preventDefault();
    toggleModal(loginModal, false);
    toggleModal(forgotModal, true);
});

resetBtn.addEventListener("click", () => {
    resetMessage.style.color = "green";
    resetMessage.textContent = "A password reset link has been sent to your registered email/phone if it exists.";
});

// Register User
registerUser.addEventListener("click", (e) => {
    e.preventDefault();
    toggleModal(loginModal, false);
    toggleModal(registerModal, true);
});

registerBtn.addEventListener("click", async () => {
    // Validation
    if(!regID.value || !regPassword.value) {
        registerMessage.style.color = "red";
        registerMessage.textContent = "Please fill all fields!";
        return;
    }
    
    if(regPassword.value.length < 6) {
        registerMessage.style.color = "red";
        registerMessage.textContent = "Password must be at least 6 characters!";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: regID.value, password: regPassword.value, role: role ? role.value : "User" })
        });

        const data = await response.json();

        if (response.ok) {
            registerMessage.style.color = "green";
            registerMessage.textContent = "User registered successfully! Please wait for Admin approval before logging in.";
            
            setTimeout(() => {
                toggleModal(registerModal, false);
                regID.value = "";
                regPassword.value = "";
            }, 1500);
        } else {
            throw new Error(data.message || "Registration failed");
        }
    } catch (err) {
        registerMessage.style.color = "red";
        registerMessage.textContent = err.message;
    }
});
