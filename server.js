// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------
// REED API PROXY
// -----------------------------
app.get('/api/reed', async (req, res) => {
  try {
    const response = await axios.get(
      'https://www.reed.co.uk/api/1.0/search',
      {
        params: req.query,
        auth: {
          username: process.env.REED_API_KEY,
          password: ''
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Reed API error:', err.message);
    res.status(500).json({ error: 'Reed API failed' });
  }
});

// -----------------------------
// ADZUNA API PROXY
// -----------------------------
app.get('/api/adzuna', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.adzuna.com/v1/api/jobs/gb/search/1`,
      {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,
          ...req.query
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Adzuna API error:', err.message);
    res.status(500).json({ error: 'Adzuna API failed' });
  }
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, () => {
  console.log(`AbayJobs backend running on port ${PORT}`);
});
