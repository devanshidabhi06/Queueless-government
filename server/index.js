const express = require('express');
const cors = require('cors');
require('dotenv').config();

const citizenRoutes = require('./routes/citizen');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/citizen', citizenRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`QueueLess API Server running on port ${PORT}`);
});
