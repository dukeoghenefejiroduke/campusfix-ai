/**
 * CampusFix AI - Backend Server
 * Node.js built-in modules only (no external dependencies).
 * Includes rate limiting, PWA support, Remote Model API adapter, TF-IDF Text Similarity, and Server-Mediated Outage Stream.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { checkRateLimit } = require('./rateLimiter');
const { diagnoseProblem } = require('./aiService');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY_SIZE = 10 * 1024; // 10 KB limit for POST requests

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Server-Mediated Outage Stream clients store
const sseClients = new Set();

function broadcastOutageAlert(alertData) {
  const dataString = `data: ${JSON.stringify(alertData)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(dataString);
    } catch (e) {
      sseClients.delete(client);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');

  // API Health Endpoint
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'CampusFix AI API',
      version: '1.2.0',
      mode: process.env.OPEN_WEIGHT_API_URL
        ? 'remote-model-configured-unverified'
        : 'rules-engine-tfidf',
      activeStreamClients: sseClients.size,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Server-Mediated Outage Stream Endpoint
  if (pathname === '/api/outages/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to CampusFix Outage Stream'})}\n\n`);

    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // API Broadcast Outage Endpoint
  if (pathname === '/api/outages/report' && req.method === 'POST') {
    if (!checkRateLimit(req)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Rate limit exceeded.' }));
      return;
    }

    let body = '';
    let bodySize = 0;
    let finished = false;

    req.on('data', chunk => {
      if (finished) return;

      bodySize += chunk.length;

      if (bodySize > MAX_BODY_SIZE) {
        finished = true;
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Payload too large. Maximum request size is 10KB.' }));
        req.resume();
        return;
      }

      body += chunk.toString('utf8');
    });

    req.on('end', () => {
      if (finished || res.writableEnded) return;

      try {
        const alert = JSON.parse(body);

        if (!alert || typeof alert !== 'object' || Array.isArray(alert)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Request must contain a JSON object.' }));
          return;
        }

        const allowedCategories = [
          'electrical', 'water-pump', 'plumbing', 'cooling', 'other', 'general'
        ];
        const allowedUrgencies = ['Low', 'Medium', 'High', 'Emergency'];

        const category = typeof alert.category === 'string'
          ? alert.category.trim()
          : 'general';

        const description = typeof alert.description === 'string'
          ? alert.description.trim()
          : 'Equipment failure reported';

        const urgency = typeof alert.urgency === 'string'
          ? alert.urgency.trim()
          : 'Medium';

        if (!allowedCategories.includes(category)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid outage category.' }));
          return;
        }

        if (!description || description.length > 500) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Description must contain 1–500 characters.' }));
          return;
        }

        if (!allowedUrgencies.includes(urgency)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid urgency value.' }));
          return;
        }

        broadcastOutageAlert({
          type: 'OUTAGE_ALERT',
          category,
          description,
          urgency,
          timestamp: new Date().toISOString()
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
      }
    });

    req.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Could not read request body.' }));
      }
    });

    return;
  }

  // API Diagnose Endpoint
  if (pathname === '/api/diagnose' && req.method === 'POST') {
    // Apply Rate Limiting
    if (!checkRateLimit(req)) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Too many requests. Please wait a moment before trying again.' }));
      return;
    }

    let body = '';
    let bodySize = 0;

    req.on('data', chunk => {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        req.destroy();
        if (!res.headersSent) {
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Payload too large. Maximum request size is 10KB.' }));
        }
      } else {
        body += chunk;
      }
    });

    req.on('end', async () => {
      if (res.headersSent) return;

      try {
        const data = JSON.parse(body);
        const { category, description, symptoms, startDate } = data;

        if (!category || typeof category !== 'string' || !description || typeof description !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Invalid input: "category" and "description" are required strings.' }));
          return;
        }

        if (description.trim().length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Problem description cannot be empty.' }));
          return;
        }

        const diagnosis = await diagnoseProblem(
          category.trim(),
          description.trim(),
          symptoms ? String(symptoms).trim() : '',
          startDate ? String(startDate).trim() : ''
        );

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(diagnosis));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = pathname === '/' ? '/index.html' : pathname;
  // Prevent path traversal
  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.join(PUBLIC_DIR, safePath);

  // Ensure absolutePath stays within PUBLIC_DIR
  if (!absolutePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(absolutePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1><p>The requested resource was not found on CampusFix AI server.</p>');
      return;
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(absolutePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Internal Server Error');
      }
    });
    stream.pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[CampusFix AI] Server running at http://localhost:${PORT}`);
    console.log(`[CampusFix AI] Mode: ${process.env.OPEN_WEIGHT_API_URL ? 'Remote Model API + Text Similarity Engine' : 'Local Rules Engine + Text Similarity Engine'}`);
  });
}

module.exports = server;
