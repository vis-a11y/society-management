# Society Management System

A comprehensive web application designed to manage residential societies efficiently. It comes complete with a backend system, MySQL database architecture, and a responsive frontend interface. 

## Features

- **Admin & Resident Portals:** Distinct dashboards for admins and residents.
- **Complaint Management:** Residents can lodge complaints, which admins can track and resolve.
- **Notice Board:** Real-time digital notice board for society announcements.
- **Visitor Logs:** Keep track of visitors' entry and exit.
- **Staff Management:** Manage society staff, shifts, and salaries.
- **Event Management:** Create and track society events and gatherings.
- **Maintenance Tracking:** Track the monthly maintenance payments of residents.

## Tech Stack

- **Frontend:** HTML, CSS (Vanilla and modern layouts), JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** bcryptjs for hashed passwords

## Getting Started

### Database Setup

1. Install XAMPP (or a standalone MySQL instance).
2. Start the MySQL service.
3. The project backend script `database.js` will automatically create a database named `societyHub` and set up the necessary tables upon its first run.
4. Update the `DB_PASS` variable in `backend/database.js` with your MySQL local credentials if they differ.

### Default Admin Credentials

If the database is freshly generated and the `users` table is empty, a default admin account will be automatically populated:

- **Username / ID:** `admin@gmail.com`
- **Password:** `admin@123`

### Running the Application

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the necessary NPM packages:
   ```bash
   npm install
   ```
3. Start the Node server (or use nodemon for dev mode):
   ```bash
   npm start
   ```
4. Access the frontend functionality by opening the appropriate `.html` file (e.g., `admin-portal.html`, `login.html`) in your preferred browser.
