const API_BASE = "http://localhost:5000/api";
const form = document.getElementById('addResidentForm');
const residentName = document.getElementById('residentName');
const flatNumber = document.getElementById('flatNumber');
const contactNumber = document.getElementById('contactNumber');
const emailID = document.getElementById('emailID');

const nameError = document.getElementById('nameError');
const flatError = document.getElementById('flatError');
const contactError = document.getElementById('contactError');
const successMessage = document.getElementById('successMessage');
const emailError = document.getElementById('EmailError');

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

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset messages
    [nameError, flatError, contactError, emailError, successMessage].forEach(el => {
        if (el) el.style.display = 'none';
    });

    let isValid = true;

    // Validate resident name
    const nameVal = residentName.value.trim();
    if (!nameVal || !/^[a-zA-Z\s]+$/.test(nameVal)) {
        nameError.style.display = 'block';
        isValid = false;
    }

    // Validate flat number
    if (!flatNumber.value.trim()) {
        flatError.style.display = 'block';
        isValid = false;
    }

    // Validate contact number
    const contactVal = contactNumber.value.trim();
    if (!/^\d{10}$/.test(contactVal)) {
        contactError.style.display = 'block';
        isValid = false;
    }

    // Validate email
    const emailVal = emailID.value.trim();
    if (!emailVal || !emailID.checkValidity()) {
        emailError.style.display = 'block';
        isValid = false;
    }

    if (isValid) {
        const newResident = {
            name: nameVal,
            flat: flatNumber.value.trim(),
            phone: contactVal,
            email: emailVal,
            status: "Active",
            joinDate: new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
        };

        try {
            const response = await fetchWithAuth(`${API_BASE}/residents`, {
                method: 'POST',
                body: JSON.stringify(newResident)
            });

            if (response.ok) {
                successMessage.style.display = 'block';
                form.reset();

                setTimeout(() => {
                    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
                    if (currentUser && currentUser.role === "Admin") {
                        window.location.href = 'adminDashboard.html';
                    } else {
                        window.location.href = 'index2.html';
                    }
                }, 1500);
            } else {
                const data = await response.json();
                alert(data.message || "Failed to add resident");
            }
        } catch (err) {
            console.error("Error adding resident", err);
        }
    }
});






 
