const express = require('express');
const router = express.Router();
const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const db = require('../database');

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
    try {
        const { amount, billId, month } = req.body;

        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `bill_${billId}_${Date.now()}`,
            notes: {
                billId: billId,
                month: month
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID'
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// Verify Payment
router.post('/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            billId
        } = req.body;

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment is verified, update bill status
            db.run(
                `UPDATE fees SET status = 'Paid', paymentId = ?, paymentDate = ? WHERE id = ?`,
                [razorpay_payment_id, new Date().toLocaleDateString(), billId],
                function(err) {
                    if (err) {
                        console.error('Error updating bill status:', err);
                        return res.status(500).json({ error: 'Failed to update bill status' });
                    }
                    
                    // Award points for bill payment
                    db.get("SELECT residentId FROM fees WHERE id = ?", [billId], (err, fee) => {
                        if (!err && fee && fee.residentId) {
                            db.run(`UPDATE credit_scores SET totalPoints = totalPoints + 10 WHERE residentId = ?`, [fee.residentId]);
                            const createdAt = new Date().toLocaleDateString();
                            db.run(`INSERT INTO activity_log (residentId, activityType, description, points, createdAt) VALUES (?, 'BILL_PAYMENT', 'Paid maintenance bill on time', 10, ?)`, [fee.residentId, createdAt]);
                        }
                    });
                    
                    res.json({ success: true, message: 'Payment verified and points awarded' });
                }
            );
        } else {
            res.status(400).json({ error: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

module.exports = router;
