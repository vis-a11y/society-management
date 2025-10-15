 const form = document.getElementById('addResidentForm');
    const residentName = document.getElementById('residentName');
    const flatNumber = document.getElementById('flatNumber');
    const contactNumber = document.getElementById('contactNumber');
    const emailID = document.getElementById('emailID');


    const nameError = document.getElementById('nameError');
    const flatError = document.getElementById('flatError');
    const contactError = document.getElementById('contactError');
    const successMessage = document.getElementById('successMessage');
    const emailError = document.getElementById('emailError');
  

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Hide error and success messages
      nameError.style.display = 'none';
      flatError.style.display = 'none';
      contactError.style.display = 'none';
      successMessage.style.display = 'none';

      let isValid = true;

      // Validate resident name (only letters and spaces)
      const nameVal = residentName.value.trim();
      if (!nameVal || !/^[a-zA-Z\s]+$/.test(nameVal)) {
        nameError.style.display = 'block';
        isValid = false;
      }

      // Validate flat number (non-empty)
      if (!flatNumber.value.trim()) {
        flatError.style.display = 'block';
        isValid = false;
      }

      // Validate contact number (10 digits)
      const contactVal = contactNumber.value.trim();
      if (!/^\d{10}$/.test(contactVal)) {
        contactError.style.display = 'block';
        isValid = false;
      }

      if (isValid) {
        // Show success message and reset form
        successMessage.style.display = 'block';
        form.reset();
      }

     if (!emailID.value.trim() || !emailID.checkValidity()) {
    emailError.style.display = 'block';
    isValid = false;
    } else {
    emailError.style.display = 'none';
    }
     if (isValid) {
    // Create resident object
    const newResident = {
      id: Date.now(), // unique ID
      name: residentName.value.trim(),
      flat: flatNumber.value.trim(),
      phone: contactNumber.value.trim(),
      email: emailID.value.trim(),
      status: "Active",
      joinDate: new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
    };

    // Save to localStorage
    let residents = JSON.parse(localStorage.getItem('residents')) || [];
    residents.push(newResident);
    localStorage.setItem('residents', JSON.stringify(residents));

    // Show success
    successMessage.style.display = 'block';

    // Reset form
    form.reset();

    setTimeout(() => {
      window.location.href ='index.html'
    },1500);
  }
 });





 
