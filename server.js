const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Lee config del lado del servidor
const CONFIG = require('./config.js') || {};
// Soporte para ambas formas: module.exports o const CONFIG global
const getConfig = () => {
  try { return require('./config.js'); } catch { return {}; }
};

function proxyRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Proxy para Notion API
app.post('/notion', async (req, res) => {
  const cfg = (() => { try { return require('./config.js'); } catch { return {}; } })();
  const token = cfg.NOTION_TOKEN || CONFIG.NOTION_TOKEN;
  const { method = 'GET', path: notionPath, body } = req.body;

  const bodyStr = body ? JSON.stringify(body) : null;
  const options = {
    hostname: 'api.notion.com',
    port: 443,
    path: notionPath,
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
    }
  };

  try {
    const result = await proxyRequest(options, body);
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(500).json({ error: 'Error conectando con Notion', detail: err.message });
  }
});

// Proxy para Anthropic API
app.post('/anthropic', async (req, res) => {
  const cfg = (() => { try { return require('./config.js'); } catch { return {}; } })();
  const apiKey = cfg.ANTHROPIC_API_KEY || CONFIG.ANTHROPIC_API_KEY;
  const bodyStr = JSON.stringify(req.body);

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr)
    }
  };

  try {
    const result = await proxyRequest(options, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(500).json({ error: 'Error conectando con Anthropic', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`TaskRadar corriendo en http://localhost:${PORT}`);
  console.log('Abrí http://localhost:3000 en el browser');
});
