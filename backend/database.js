const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Database Connection Pooling
let pool;

const DB_PASS = 'Vishal@7673'; // Defined your password globally

async function initDB() {
    try {
        // Connect generic first to create database if missing
        const bootstrap = await mysql.createConnection({
            host: '127.0.0.1', user: 'root', password: DB_PASS
        });
        await bootstrap.query("CREATE DATABASE IF NOT EXISTS societyHub");
        await bootstrap.end();

        // Connect specifically to our database
        pool = mysql.createPool({
            host: '127.0.0.1',
            user: 'root',
            password: DB_PASS,
            database: 'societyHub',
            waitForConnections: true,
            connectionLimit: 10
        });

        console.log('Successfully connected to MySQL Database!');

        // Run migrations -> Create tables
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            flat VARCHAR(50), phone VARCHAR(50), 
            password VARCHAR(255) NOT NULL,
            parking_slot VARCHAR(100), vehicle_details VARCHAR(255)
        )`);
        await pool.query(`CREATE TABLE IF NOT EXISTS notices (id INT AUTO_INCREMENT PRIMARY KEY, title TEXT, content TEXT, date DATETIME)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS visitors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), flat VARCHAR(50), purpose TEXT, phone VARCHAR(50), status VARCHAR(50), entry_time DATETIME, exit_time DATETIME)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS staff (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), role VARCHAR(50), shift VARCHAR(50), salary INT, attendance VARCHAR(50))`);
        await pool.query(`CREATE TABLE IF NOT EXISTS events (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(100), date VARCHAR(50), description TEXT)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS maintenance (id INT AUTO_INCREMENT PRIMARY KEY, resident_id INT, month VARCHAR(50), amount INT, status VARCHAR(50) DEFAULT 'Pending')`);
        await pool.query(`CREATE TABLE IF NOT EXISTS complaints (id INT AUTO_INCREMENT PRIMARY KEY, resident_id INT, subject VARCHAR(200), description TEXT, status VARCHAR(50) DEFAULT 'Pending', date DATETIME)`);

        // Check and Seed Default Admin logic (If users table is empty)
        const [rows] = await pool.query("SELECT * FROM users WHERE role = 'Admin'");
        if (rows.length === 0) {
            const hash = await bcrypt.hash('admin@123', 10);
            await pool.query(`INSERT INTO users (role, name, flat, phone, password) VALUES ('Admin', 'admin@gmail.com', 'N/A', 'N/A', ?)`, [hash]);
            console.log("Default Admin created -> username: admin@gmail.com | pwd: admin@123");
        }
    } catch (err) {
        console.error("Failed to connect to MySQL backend:", err.message);
        console.error("Please ensure XAMPP (or MySQL) is installed and the 'MySQL' module is actively running locally.");
    }
}

initDB();

module.exports = {
    getPool: () => pool
};
