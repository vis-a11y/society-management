const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});

// Email templates
const emailTemplates = {
    newComplaint: (resident, complaint) => ({
        subject: `New Complaint Raised - #${complaint.id}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">New Complaint Raised</h2>
                <p>Dear Admin,</p>
                <p>A new complaint has been raised:</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Title:</strong> ${complaint.title}</p>
                    <p><strong>Priority:</strong> ${complaint.priority}</p>
                    <p><strong>Flat:</strong> ${complaint.flat}</p>
                    <p><strong>Description:</strong> ${complaint.desc}</p>
                </div>
                <p>Please review and take necessary action.</p>
                <p>- SocietyHub Team</p>
            </div>
        `
    }),

    billGenerated: (resident, bill) => ({
        subject: `Maintenance Bill for ${bill.month}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Maintenance Bill Generated</h2>
                <p>Dear ${resident.name},</p>
                <p>Your maintenance bill for ${bill.month} is ready:</p>
                <div style="background: #f0f4ff; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: #666;">Amount</p>
                    <h1 style="color: #667eea; margin: 10px 0;">₹${bill.amount}</h1>
                    <p style="margin: 0; color: #666;">Due Date: ${bill.dueDate}</p>
                </div>
                <p>Please pay at your earliest convenience.</p>
                <p><a href="http://localhost:5000" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Pay</a></p>
                <p>- SocietyHub Team</p>
            </div>
        `
    }),

    paymentConfirmation: (resident, payment) => ({
        subject: `Payment Confirmation - ${payment.month}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Payment Successful!</h2>
                <p>Dear ${resident.name},</p>
                <p>Your payment has been received successfully.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Payment ID:</strong> ${payment.paymentId}</p>
                    <p><strong>Amount:</strong> ₹${payment.amount}</p>
                    <p><strong>Month:</strong> ${payment.month}</p>
                    <p><strong>Date:</strong> ${payment.date}</p>
                </div>
                <p>Thank you for your payment!</p>
                <p>- SocietyHub Team</p>
            </div>
        `
    }),

    announcement: (resident, announcement) => ({
        subject: `New Announcement: ${announcement.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">New Society Announcement</h2>
                <p>Dear ${resident.name},</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${announcement.title}</h3>
                    <p>${announcement.desc}</p>
                    <p style="color: #999; font-size: 0.9rem;">Posted on: ${announcement.date}</p>
                </div>
                <p>- SocietyHub Team</p>
            </div>
        `
    })
};

// Send email function
async function sendEmail(to, template) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'SocietyHub <your-email@gmail.com>',
            to: to,
            subject: template.subject,
            html: template.html
        });
        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

module.exports = { emailTemplates, sendEmail };
