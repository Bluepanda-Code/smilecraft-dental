const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// GET available time slots for a date
router.get('/slots', async (req, res) => {
    const { date } = req.query;
    const allSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
        '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
        '04:30 PM', '05:00 PM'
    ];

    try {
        const booked = await Appointment.find({ date, status: { $ne: 'cancelled' } }).select('time');
        const bookedTimes = booked.map(a => a.time);
        const available = allSlots.filter(slot => !bookedTimes.includes(slot));
        res.json({ available });
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch slots' });
    }
});

// POST book an appointment
router.post('/book', async (req, res) => {
    const { name, email, phone, service, date, time, message } = req.body;

    try {
        // Check if slot is still available
        const existing = await Appointment.findOne({ date, time, status: { $ne: 'cancelled' } });
        if (existing) {
            return res.status(400).json({ error: 'This slot was just taken. Please choose another time.' });
        }

        // Save appointment
        const appointment = new Appointment({ name, email, phone, service, date, time, message });
        await appointment.save();

        // Send confirmation email to patient
        await transporter.sendMail({
            from: `"SmileCraft Dental" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '✅ Appointment Confirmed — SmileCraft Dental Studio',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0f5f2; border-radius: 10px;">
                    <h2 style="color: #0a7c6e;">Your Appointment is Confirmed! 🦷</h2>
                    <p>Hi <strong>${name}</strong>, we've received your booking. Here are your details:</p>
                    <table style="width:100%; margin: 20px 0;">
                        <tr><td><strong>Service:</strong></td><td>${service}</td></tr>
                        <tr><td><strong>Date:</strong></td><td>${date}</td></tr>
                        <tr><td><strong>Time:</strong></td><td>${time}</td></tr>
                    </table>
                    <p>Please arrive 10 minutes early. If you need to reschedule, call us at <strong>+91 98765 43210</strong>.</p>
                    <p style="color: #0a7c6e; font-weight: bold;">— SmileCraft Dental Studio Team</p>
                </div>
            `
        });

        // Notify admin
        await transporter.sendMail({
            from: `"SmileCraft System" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: `📅 New Appointment — ${name}`,
            html: `<p>New booking from <strong>${name}</strong> (${email}, ${phone})<br>
                   Service: ${service}<br>Date: ${date} at ${time}<br>
                   Message: ${message || 'None'}</p>`
        });

        res.json({ success: true, message: 'Appointment booked successfully!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Booking failed. Please try again.' });
    }
});

module.exports = router;