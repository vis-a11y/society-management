/**
 * SMART AI ASSISTANT - SocietyHub
 * Provides intelligent, context-aware responses to residents and admins.
 */

class SocietyHubBot {
    constructor(role = "Resident") {
        this.role = role;
        this.messages = [];
        this.isOpen = false;
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        this.addBotMessage(`Hello! I'm your SocietyHub AI. How can I assist you today?`);
    }

    render() {
        const container = document.createElement('div');
        container.className = 'chatbot-container';
        container.innerHTML = `
            <div class="chatbot-window hidden" id="chatbotWindow">
                <div class="chatbot-header">
                    <h4><i class="fas fa-robot"></i> Society AI Assistant</h4>
                    <button class="btn-ghost" onclick="window.societyBot.toggle()" style="color: white; padding: 5px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chatbot-messages" id="chatbotMessages"></div>
                <form class="chatbot-input" id="chatbotForm">
                    <input type="text" placeholder="Type your message..." id="chatbotTextInput">
                    <button type="submit" class="btn btn-primary btn-sm">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
            <button class="chatbot-toggle" id="chatbotToggle">
                <i class="fas fa-comment-dots"></i>
            </button>
        `;
        document.body.appendChild(container);
    }

    setupEventListeners() {
        const toggle = document.getElementById('chatbotToggle');
        const form = document.getElementById('chatbotForm');
        
        toggle.addEventListener('click', () => this.toggle());
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('chatbotTextInput');
            const text = input.value.trim();
            if (text) {
                this.addUserMessage(text);
                this.processInput(text);
                input.value = '';
            }
        });
    }

    toggle() {
        const window = document.getElementById('chatbotWindow');
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            window.classList.remove('hidden');
        } else {
            window.classList.add('hidden');
        }
    }

    addBotMessage(text) {
        this.addMessage(text, 'bot');
    }

    addUserMessage(text) {
        this.addMessage(text, 'user');
    }

    addMessage(text, side) {
        const msgContainer = document.getElementById('chatbotMessages');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${side}`;
        bubble.textContent = text;
        msgContainer.appendChild(bubble);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    processInput(input) {
        input = input.toLowerCase();
        let response = "";

        // Sample logic for AI-like responses
        if (input.includes("bill") || input.includes("maintenance")) {
            response = this.role === "Admin" 
                ? "You can check pending collections in the Finance tab. There are currently 5 defaulters."
                : "Your current pending balance is visible on the dashboard. You can pay via the 'My Bills' section.";
        } else if (input.includes("complaint")) {
            response = this.role === "Admin"
                ? "There are 3 new complaints today. You can assign them from the Complaints management page."
                : "You can raise a new complaint using the 'Raise Complaint' button in your dashboard. Our team typically responds within 24 hours.";
        } else if (input.includes("parking")) {
            response = "Parking Slot A-12 is currently free. You can request a visitor parking pass from the Parking section.";
        } else if (input.includes("help") || input.includes("what can you do")) {
            response = "I can help you check bills, report issues, book facilities like the gym or pool, and provide society updates!";
        } else if (input.includes("sos") || input.includes("emergency")) {
            response = "🚨 IF THIS IS A REAL EMERGENCY, PLEASE PRESS THE RED SOS BUTTON AT THE TOP OF THE PAGE IMMEDIATELY!";
        } else {
            response = "That's a great question. I'm still learning, but you can find more information in the 'Society Information' tab or contact the manager directly.";
        }

        setTimeout(() => this.addBotMessage(response), 600);
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    const isPageAdmin = window.location.pathname.includes('admin');
    window.societyBot = new SocietyHubBot(isPageAdmin ? "Admin" : "Resident");
});
