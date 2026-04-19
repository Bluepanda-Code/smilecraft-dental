const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

router.post('/subscribe', async (req, res) => {
    const { email } = req.body;
    try {
        const existing = await Subscriber.findOne({ email });
        if (existing) return res.json({ message: 'You are already subscribed!' });

        await new Subscriber({ email }).save();
        res.json({ success: true, message: 'Subscribed successfully!' });
    } catch (err) { 
        res.status(500).json({ error: 'Subscription failed.' });
    }
});

module.exports = router;