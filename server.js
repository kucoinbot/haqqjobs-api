const https = require('https');
const http = require('http');

const PORT = process.env.PORT || 3000;

const REED_KEY = 'e3d82bd9-5bda-48c8-9a46-7d7baf45a21a';
const ADZUNA_APP_ID = '6cdb0826';
const ADZUNA_APP_KEY = '267ec9dee63729f0b65a3b7657c0c850';

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ results: [], error: 'Parse error' }); }
      });
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200); res.end(); return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const keywords = url.searchParams.get('keywords') || 'warehouse security construction care cleaning driver';
  const location = url.searchParams.get('location') || '';

  // Health check
  if (url.pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'HaqqJobs API running' }));
    return;
  }

  // Reed jobs
  if (url.pathname === '/api/reed') {
    try {
      const params = new URLSearchParams({
        keywords, locationName: location,
        resultsToTake: '50',
        minimumSalary: '25396'
      });
      const reedUrl = `https://www.reed.co.uk/api/1.0/search?${params}`;
      const auth = Buffer.from(`${REED_KEY}:`).toString('base64');
      const data = await fetchUrl(reedUrl, { 'Authorization': `Basic ${auth}`, 'User-Agent': 'HaqqJobs/1.0' });
      res.writeHead(200);
      res.end(JSON.stringify(data));
    } catch(e) {
      res.writeHead(200);
      res.end(JSON.stringify({ results: [], error: e.message }));
    }
    return;
  }

  // Adzuna jobs
  if (url.pathname === '/api/adzuna') {
    try {
      const params = new URLSearchParams({
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        results_per_page: '50',
        what: keywords,
        where: location,
        salary_min: '25396',
        max_days_old: '2'
      });
      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`;
      const data = await fetchUrl(adzunaUrl, { 'User-Agent': 'HaqqJobs/1.0' });
      res.writeHead(200);
      res.end(JSON.stringify(data));
    } catch(e) {
      res.writeHead(200);
      res.end(JSON.stringify({ results: [], error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`HaqqJobs API server running on port ${PORT}`);
});
