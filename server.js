require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./src/db');
const contentRoutes = require('./src/routes/content');
const bookingRoutes = require('./src/routes/bookings');
const phonepeRoutes = require('./src/routes/phonepe');

const app = express();

// PhonePe's callback route needs the raw text body (handled in its own
// route with express.text()), so keep express.json() from swallowing it
// by mounting JSON parsing after that route, or just let express.json()
// skip non-JSON content types (it does, by default) — safe either way.
app.use(express.json({ limit: '10mb' })); // 10mb to allow the base64 showcase photo

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'zipo-backend' });
});

app.use('/api', contentRoutes);
app.use('/api', bookingRoutes);
app.use('/api', phonepeRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] zipo-backend listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  });
