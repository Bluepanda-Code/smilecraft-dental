const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const Subscriber = require('../models/Subscriber');

// Middleware to verify admin token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        req.admin = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Admin login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
});

// Get all appointments
router.get('/appointments', verifyToken, async (req, res) => {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments);
});

// Update appointment status
router.patch('/appointments/:id', verifyToken, async (req, res) => {
    const { status } = req.body;
    await Appointment.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true });
});

// Get all subscribers
router.get('/subscribers', verifyToken, async (req, res) => {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
});

module.exports = router;