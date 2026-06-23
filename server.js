const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const REED_KEY = process.env.REED_API_KEY;
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ results: [] }); }
      });
    }).on('error', () => resolve({ results: [] }));
  });
}

// Reed
app.get('/api/reed', async (req, res) => {
  const { keywords = '', location = '', page = 1 } = req.query;

  const params = new URLSearchParams({
    keywords,
    locationName: location,
    resultsToTake: '100',
    resultsToSkip: (page - 1) * 100
  });

  const url = `https://www.reed.co.uk/api/1.0/search?${params}`;
  const auth = Buffer.from(`${REED_KEY}:`).toString('base64');

  const data = await fetchJSON(url, { Authorization: `Basic ${auth}` });
  res.json(data);
});

// Adzuna
app.get('/api/adzuna', async (req, res) => {
  const { keywords = '', location = '', page = 1 } = req.query;

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: '100',
    what: keywords,
    where: location
  });

  const url = `https://api.adzuna.com/v1/api/jobs/gb/search/${page}?${params}`;
  const data = await fetchJSON(url);

  res.json(data);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log('Server running'));
