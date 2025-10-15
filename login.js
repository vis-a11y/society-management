document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault(); // prevent form from refreshing

  let username = e.target[0].value;
  let password = e.target[1].value;

  // Example credentials
  if(username === "admin" && password === "admin123") {
    window.location.href = "index.html"; // Redirect to dashboard
  } else {
    alert("Invalid username or password!");
  }
});
