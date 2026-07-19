const express = require('express');
const Booking = require('../models/Booking');
const { verifyAdmin } = require('../middleware/verifyAdmin');

const router = express.Router();

// GET /api/admin/bookings — admin only, powers the "View bookings" table.
router.get('/admin/bookings', verifyAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
    // Frontend expects createdAt as something `new Date(...)` can parse —
    // lean() + timestamps already gives ISO strings, so this just works.
    res.json({ bookings });
  } catch (err) {
    console.error('[GET /api/admin/bookings]', err);
    res.status(500).json({ error: 'Could not load bookings.' });
  }
});

// POST /api/admin/bookings/complete — admin only, marks a paid booking done.
router.post('/admin/bookings/complete', verifyAdmin, async (req, res) => {
  try {
    const { merchantTransactionId } = req.body;
    if (!merchantTransactionId) {
      return res.status(400).json({ error: 'merchantTransactionId is required.' });
    }

    const booking = await Booking.findOneAndUpdate(
      { merchantTransactionId, status: 'paid' }, // only a PAID booking can be marked completed
      { status: 'completed' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'No matching paid booking found.' });
    }

    res.json({ ok: true, booking });
  } catch (err) {
    console.error('[POST /api/admin/bookings/complete]', err);
    res.status(500).json({ error: 'Could not update booking.' });
  }
});

module.exports = router;
