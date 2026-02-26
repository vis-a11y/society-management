# 🏢 SocietyHub - Advanced AI-Powered Society Management

**SocietyHub** is a next-generation, premium property management ecosystem. It integrates **AI-driven insights**, **IoT-style resource analytics**, and **Gamified community engagement** to transform residential living into a smart, efficient, and interconnected experience.

---

## 🌟 **Cutting-Edge Features**

### 🤖 **1. AI-Powered Smart Hub**
*   **AI Chatbot Assistant**: A context-aware virtual assistant (`chatbot.js`) that handles billing queries, facility bookings, and complaint status for both Residents and Admins.
*   **AI Predictive Maintenance**: Uses machine learning logic to scan infrastructure (Lifts, Water Tanks) based on historical repair data, providing early "Risk Alerts" before failures occur.

### 🔋 **2. Smart Infrastructure & IoT Dynamics**
*   **Resource Visualization**: High-fidelity progress bars for **Electricity & Water Consumption**, with color-coded safety thresholds (Red-line alerts for overconsumption).
*   **Society Health Score**: A real-time performance metric (0-100%) tracking financial compliance, security efficiency, and maintenance resolution speeds.

### 🏆 **3. Community Ecosystem & Gamification**
*   **Skill Exchange**: A "neighborhood marketplace" where residents share professional skills (Plumbing, Tutoring, Yoga) with a built-in review system.
*   **Resident Credit Score**: A gamified contribution model. Residents earn points, levels (e.g., *Level 5: Community Pillar*), and visual medals for paying bills on time and helping neighbors.
*   **Pre-Approved Visitors**: QR-ready visitor entry system with resident-side scheduling.

### ⚖️ **4. Finance & Operations**
*   **Razorpay Integration**: Fully integrated secure payment gateway for maintenance, fine, and facility fees.
*   **Digital Receipts**: Automated, high-quality printable PDF-style payment receipts generated instantly.
*   **Audit Transparency**: Transparent society expense logs visible to residents (Admin controlled).

### 🚨 **5. Premium Security & Safety**
*   **Pulsing SOS Alert**: High-priority medical/security emergency button with pulsing visual animations and immediate Admin notification.
*   **KYC Verification**: Multi-stage document approval system (Aadhar, PAN, Rent Agreement) with secure status tracking.

---

## 🎨 **Design System**
*   **Rich Aesthetics**: State-of-the-art **Glassmorphism** UI with backdrop-filters and smooth gradients.
*   **Adaptive Theming**: Native support for **Dynamic Dark Mode** and light mode with system-matching transitions.
*   **Fluid Motion**: 60fps micro-animations (`hover-lift`, `bounce`, `slide-up`) for a premium "App-like" feel.

---

## 🛠️ **Technology Stack**
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (ES6+), Font Awesome |
| **Backend** | Node.js, Express.js, JWT, Multer (File Handling) |
| **Database** | SQLite3 (Persistent storage with initialized schemas) |
| **Integration** | Razorpay SDK, Nodemailer, bcryptjs (Security) |

---

## 🚀 **Quick Setup**

### **1. Prerequisites**
Ensure you have **Node.js** installed on your system.

### **2. Installation**
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

### **3. Access the Portals**
1.  Open [http://localhost:5000](http://localhost:5000) in your browser.
2.  **Default Credentials**:
    *   **Admin Access**: `admin` / `admin123`
    *   **Resident Access**: `user` / `user123`

---

## 📂 **Project Architecture**
*   `/backend/server.js`: Central API Hub with 30+ endpoints.
*   `/backend/database.js`: SQLite schema initialization and data injection.
*   `/style.css`: Unified Design Tokens and Modern UI library.
*   `/admin.js` & `/resident.js`: Modular frontend logic controllers.
*   `/chatbot.js`: Autonomous AI dialogue engine.

---

## 🚀 **Deployment Guide**

### **1. Cloud Deployment (Render / Heroku / Railway)**
SocietyHub is ready for "One-Click" deployment. 
1.  **Connect GitHub**: Push your code to a private or public repository.
2.  **Settings**:
    *   **Build Command**: `cd backend && npm install && cd ..`
    *   **Start Command**: `npm start` (Runs `node backend/server.js`)
3.  **Environment Variables**: 
    Add `JWT_SECRET` and `PORT=5000` (or the platform default) in the platform's dashboard.

### **2. Manual Deployment (Linux/VPS)**
If you are hosting on a dedicated server:
1.  Install **Node.js** and **PM2** (`npm install -g pm2`).
2.  Clone the repository and run:
    ```bash
    npm install-all
    pm2 start backend/server.js --name "SocietyHub"
    ```
3.  Configure **Nginx** as a reverse proxy for port `5000`.

### **3. Mobile Use (Local Network)**
To test on your phone:
1.  Connect your PC and Phone to the same Wi-Fi.
2.  Run `npm start` on your PC.
3.  Open `http://[YOUR_PC_IP]:5000` on your phone browser.

---
*Developed for excellence in urban community living.*
