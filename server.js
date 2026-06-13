const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// API keys loaded from Render environment variables — never hardcoded
const REED_KEY = process.env.REED_API_KEY;
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const MIN_SALARY = '25396'; // £12.21/hr annual equivalent

// Allow requests from your website
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  next();
});

// Fetch any HTTPS URL with timeout
function fetchJSON(url, headers = {}, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) {
          reject(new Error('Invalid JSON from API'));
        }
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.on('error', reject);
  });
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'HaqqJobs API is running', version: '2.0' });
});

// Reed jobs endpoint
app.get('/api/reed', async (req, res) => {
  if (!REED_KEY) {
    return res.json({ results: [], error: 'REED_API_KEY not set in environment' });
  }

  const keywords = req.query.keywords || 'warehouse security construction care cleaning driver';
  const location = req.query.location || '';

  const params = new URLSearchParams({
    keywords,
    locationName: location,
    resultsToTake: '50',
    minimumSalary: MIN_SALARY
  });

  const url = `https://www.reed.co.uk/api/1.0/search?${params}`;
  const auth = Buffer.from(`${REED_KEY}:`).toString('base64');

  try {
    const data = await fetchJSON(url, {
      'Authorization': `Basic ${auth}`,
      'User-Agent': 'HaqqJobs/1.0',
      'Accept': 'application/json'
    });
    console.log(`Reed: returned ${(data.results || []).length} jobs`);
    res.json(data);
  } catch(e) {
    console.error('Reed error:', e.message);
    res.json({ results: [], error: e.message });
  }
});

// Adzuna jobs endpoint
app.get('/api/adzuna', async (req, res) => {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    return res.json({ results: [], error: 'ADZUNA keys not set in environment' });
  }

  const keywords = req.query.keywords || 'warehouse security labourer care assistant cleaner driver';
  const location = req.query.location || '';

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: '50',
    what: keywords,
    where: location,
    salary_min: MIN_SALARY,
    max_days_old: '2'
  });

  const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`;

  try {
    const data = await fetchJSON(url, {
      'User-Agent': 'HaqqJobs/1.0',
      'Accept': 'application/json'
    });
    console.log(`Adzuna: returned ${(data.results || []).length} jobs`);
    res.json(data);
  } catch(e) {
    console.error('Adzuna error:', e.message);
    res.json({ results: [], error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`HaqqJobs API server running on port ${PORT}`);
});
