require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { connectDB } = require('./config/database');
require('./models/index'); // initialize associations

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const billRoutes = require('./routes/billRoutes');
const productRoutes = require('./routes/productRoutes');
const testRoutes    = require('./routes/testRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { startPaymentReminderCron } = require('./cron/paymentReminder');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS ─────────────────────────────────────────────────
const allowedOrigins = [
  process.env.APP_BASE_URL || 'http://localhost:5173',
  'http://localhost:3000',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      // Allow localhost and any local network IP (192.168.x.x / 10.x.x.x / 172.x.x.x)
      const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin);
      if (isLocalNetwork || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ── Rate Limiting ────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
    data: null,
  },
});
app.use('/api', apiLimiter);

// ── Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Body Parsers ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files (PDF invoices) ──────────────────────────
app.use(
  '/public',
  express.static(path.join(__dirname, 'public'))
);

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart POS API is running.',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
    },
  });
});

// ── API Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/products', productRoutes);
app.use('/api/test',     testRoutes);      // dev: test notifications

// ── 404 Handler ──────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

// ── Unhandled Rejections ─────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message);
  process.exit(1);
});

// ── Start Server ─────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  startPaymentReminderCron();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Smart POS Backend running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

startServer();

module.exports = app;
