const API_BASE = "http://localhost:5000/api";
const bookingForm = document.getElementById('bookingForm');
const selectionHint = document.getElementById('selectionHint');
const slotsGrid = document.getElementById('slotsGrid');
const bookingDate = document.getElementById('bookingDate');

let selectedFacility = '';
let selectedSlot = '';
let allBookings = [];

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

function selectFacility(name) {
    selectedFacility = name;
    document.getElementById('selectedFacility').value = name;
    bookingForm.classList.remove('hidden');
    selectionHint.classList.add('hidden');
    checkAvailability();
}

async function checkAvailability() {
    if (!selectedFacility || !bookingDate.value) return;
    
    try {
        const response = await fetchWithAuth(`${API_BASE}/bookings`);
        allBookings = await response.json();
        renderSlots();
    } catch (err) {
        console.error("Failed to load bookings", err);
    }
}

function renderSlots() {
    const slots = ["07:00 - 09:00", "09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00", "15:00 - 17:00", "17:00 - 19:00", "19:00 - 21:00"];
    const date = bookingDate.value;
    
    slotsGrid.innerHTML = slots.map(slot => {
        const isBooked = allBookings.some(b => b.facility === selectedFacility && b.date === date && b.slot === slot && b.status === "Confirmed");
        return `
            <button type="button" 
                class="slot-btn ${isBooked ? 'booked' : ''} ${selectedSlot === slot ? 'selected' : ''}" 
                ${isBooked ? 'disabled' : ''} 
                onclick="selectSlot('${slot}')">
                ${slot}
            </button>
        `;
    }).join("");
}

function selectSlot(slot) {
    selectedSlot = slot;
    renderSlots();
}

bookingDate.addEventListener('change', checkAvailability);

bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
        if (window.showToast) window.showToast('Select Slot', 'Please choose an available time slot.', 'warning');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    // Note: We need the residentId which is different from userId. 
    // In a real app, we'd fetch this. For now, we'll assume a dummy or fetch it first.
    // Let's assume we can find the resident by searching for their name or ID.
    
    try {
        // Fetch residents to find the one matching current user ID
        const resResponse = await fetchWithAuth(`${API_BASE}/residents`);
        const residents = await resResponse.json();
        // Since we don't have a direct mapping in this simplified schema yet, 
        // we'll pick the first active resident for demo purposes if not found.
        const resident = residents.find(r => r.name.toLowerCase().includes(currentUser.id.toLowerCase())) || residents[0];

        const booking = {
            residentId: resident.id,
            facility: selectedFacility,
            date: bookingDate.value,
            slot: selectedSlot
        };

        const response = await fetchWithAuth(`${API_BASE}/bookings`, {
            method: 'POST',
            body: JSON.stringify(booking)
        });

        if (response.ok) {
            if (window.showToast) window.showToast('Booking Confirmed', `You have reserved the ${selectedFacility} for ${bookingDate.value}.`, 'success');
            checkAvailability();
            selectedSlot = '';
        } else {
            const data = await response.json();
            throw new Error(data.message);
        }
    } catch (err) {
        if (window.showToast) window.showToast('Booking Failed', err.message, 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    bookingDate.min = today;
});
