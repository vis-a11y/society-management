 // Handle form submission
    document.getElementById("loginForm").addEventListener("submit", function(e) {
      e.preventDefault(); // Prevent default form submission
      // Optional: Validate username and password here
      // Redirect to dashboard page
      window.location.href = "index.html"; // replace with your dashboard page URL
    });