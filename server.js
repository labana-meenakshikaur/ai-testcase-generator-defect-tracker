require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const qaRoutes = require('./routes/qaRoutes');

const app = express();

// Allow all origins, methods, and headers for local dev
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express built-in body parser
app.use(express.json());

// Handshake / test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is active on port 5001' });
});

// Primary Routes
app.use('/api/qa', qaRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ Database Connection Error:', err.message));

// Switched to port 5001 to avoid AirPlay conflict on macOS
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));