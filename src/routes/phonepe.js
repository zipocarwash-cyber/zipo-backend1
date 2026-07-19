const express = require('express');
const { StandardCheckoutPayRequest } = require('@phonepe-pg/pg-sdk-node');
const { getPhonePeClient } = require('../lib/phonepeClient');
const Booking = require('../models/Booking');

const router = express.Router();

// POST /api/phonepe/initiate — public. Called when a customer taps
// "Book" and submits their details. Creates the booking record as
// "pending", asks PhonePe for a checkout URL, and hands that back.
router.post('/phonepe/initiate', async (req, res) => {
  try {
    const {
      planName,
      amount, // paise, GST-inclusive — computed by the frontend
      merchantTransactionId,
      customerName,
      customerPhone,
      carNumber,
      carModel,
      location,
      pincode,
      apartment,
      timeSlot,
      addons,
      addonsTotal
    } = req.body;

    if (!planName || !amount || !merchantTransactionId) {
      return res.status(400).json({ error: 'planName, amount, and merchantTransactionId are required.' });
    }
    if (amount < 100) {
      return res.status(400).json({ error: 'Amount must be at least ₹1 (100 paise).' });
    }

    // Save the booking up front as "pending" so it shows in the admin
    // table even if the customer abandons checkout on PhonePe's page.
    await Booking.create({
      merchantTransactionId,
      planName,
      amount,
      customerName,
      customerPhone,
      carNumber,
      carModel,
      location,
      pincode,
      apartment,
      timeSlot,
      addons,
      addonsTotal,
      status: 'pending'
    });

    const client = getPhonePeClient();
    const redirectUrl = `${process.env.FRONTEND_URL}/?booking=${encodeURIComponent(merchantTransactionId)}`;

    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantTransactionId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const phonepeResponse = await client.pay(payRequest);

    await Booking.updateOne(
      { merchantTransactionId },
      { phonepeOrderId: phonepeResponse.orderId }
    );

    res.json({ redirectUrl: phonepeResponse.redirectUrl });
  } catch (err) {
    console.error('[POST /api/phonepe/initiate]', err);
    res.status(500).json({ error: err.message || 'Could not start payment.' });
  }
});

// POST /api/phonepe/callback — PhonePe calls THIS (server-to-server, not
// the browser) when a payment finishes. Configure this exact URL as your
// webhook/callback URL in the PhonePe dashboard, along with the username
// and password set in PHONEPE_CALLBACK_USERNAME / PHONEPE_CALLBACK_PASSWORD.
router.post('/phonepe/callback', express.text({ type: '*/*' }), async (req, res) => {
  try {
    const client = getPhonePeClient();
    const authorizationHeader = req.headers.authorization || '';
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const callback = client.validateCallback(
      process.env.PHONEPE_CALLBACK_USERNAME,
      process.env.PHONEPE_CALLBACK_PASSWORD,
      authorizationHeader,
      rawBody
    );

    const merchantOrderId = callback.payload.originalMerchantOrderId;
    const state = callback.payload.state; // e.g. COMPLETED, FAILED

    if (merchantOrderId) {
      const status = state === 'COMPLETED' ? 'paid' : state === 'FAILED' ? 'failed' : 'pending';
      await Booking.updateOne({ merchantTransactionId: merchantOrderId }, { status });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[POST /api/phonepe/callback] invalid callback:', err.message);
    res.status(400).json({ error: 'Invalid callback.' });
  }
});

// GET /api/phonepe/status/:merchantTransactionId — public. Useful for the
// redirect landing page to actively confirm status (webhooks can be
// delayed), rather than relying on the callback alone.
router.get('/phonepe/status/:merchantTransactionId', async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    const client = getPhonePeClient();

    const statusResponse = await client.getOrderStatus(merchantTransactionId);
    const state = statusResponse.state; // e.g. COMPLETED, FAILED, PENDING

    const status = state === 'COMPLETED' ? 'paid' : state === 'FAILED' ? 'failed' : 'pending';
    const booking = await Booking.findOneAndUpdate(
      { merchantTransactionId },
      { status },
      { new: true }
    );

    res.json({ status, booking });
  } catch (err) {
    console.error('[GET /api/phonepe/status]', err);
    res.status(500).json({ error: 'Could not fetch payment status.' });
  }
});

module.exports = router;
