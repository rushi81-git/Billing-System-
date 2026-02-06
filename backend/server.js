const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();

/* 🔥 CORS FIX (ALLOW NGROK + LOCAL) */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://raviney-noble-lightish.ngrok-free.dev'
  ],
  methods: ['GET', 'POST', 'PUT'],
  credentials: true
}));

app.use(express.json());

connectDB();

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
