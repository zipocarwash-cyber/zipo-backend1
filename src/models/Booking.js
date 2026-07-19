const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    // Our own order id, also used as PhonePe's merchantOrderId.
    merchantTransactionId: { type: String, required: true, unique: true, index: true },
    // PhonePe's own order id for this transaction, filled in after initiate.
    phonepeOrderId: { type: String },

    planName: { type: String, required: true },
    amount: { type: Number, required: true }, // paise, GST-inclusive total

    customerName: String,
    customerPhone: String,
    carNumber: String,
    carModel: String,
    location: String,
    pincode: String,
    apartment: String,
    timeSlot: String,
    addons: String, // human-readable comma-separated list, as sent by the frontend
    addonsTotal: Number, // rupees

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'completed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
