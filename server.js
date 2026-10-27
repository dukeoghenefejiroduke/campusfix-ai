/**
 * CampusFix AI - Backend Server
 * Node.js built-in modules only (no external dependencies).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY_SIZE = 10 * 1024; // 10 KB limit for POST requests

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Diagnostic rules engine (Demo Mode with Open-Weight Model Readiness)
function diagnoseProblem(category, description, symptoms, startDate) {
  const text = (description + ' ' + (symptoms || '')).toLowerCase();
  
  let urgency = 'Medium';
  let possibleCauses = [];
  let preliminaryChecks = [];
  let contactTechnician = 'Contact maintenance if preliminary checks do not resolve the issue.';
  let safetyNotice = 'SAFETY FIRST: Never touch live electrical parts, open electrical panels, or attempt high-pressure plumbing repairs yourself.';

  // Safety override for dangerous keywords
  const hasElectricalDanger = /spark|smoke|burn|smell|shock|tingle|exposed|wire|live|outlet black/i.test(text);
  const hasWaterHazard = /flood|burst|overflow|ceiling leak|short circuit/i.test(text);

  if (hasElectricalDanger) {
    urgency = 'Emergency';
    safetyNotice = 'CRITICAL SAFETY HAZARD: Electrical sparks, burning smells, or exposed wires detected. Immediately shut off power if safe to do so, evacuate the area or keep well away, and contact emergency campus facilities or technicians right away.';
  } else if (hasWaterHazard && category === 'plumbing') {
    urgency = 'High';
  }

  switch (category) {
    case 'electrical':
      if (hasElectricalDanger) {
        possibleCauses = [
          'Severe short circuit or overloaded circuit breaker',
          'Faulty wiring, damaged insulation, or failing outlet receptacle',
          'Appliance internal electrical fault'
        ];
        preliminaryChecks = [
          'DO NOT touch any exposed wires, switches, or outlets.',
          'If you know where the local circuit breaker or wall switch is and it is safe to reach without hazards, turn it off.',
          'Unplug any connected devices only if it is completely safe and dry.'
        ];
        contactTechnician = 'Contact campus electricians immediately. Do not attempt DIY electrical repairs.';
      } else {
        possibleCauses = [
          'Tripped circuit breaker due to moderate power draw',
          'Loose plug connection or blown fuse in power strip',
          'Faulty wall switch or receptacle'
        ];
        preliminaryChecks = [
          'Check if other devices in the room have power to confirm if it is a general outage.',
          'Inspect the power strip or extension cord for indicator lights.',
          'Do not insert objects into outlets or touch internal contacts.'
        ];
        contactTechnician = 'Contact maintenance if the circuit breaker trips repeatedly or outlets remain dead.';
      }
      break;

    case 'water-pump':
      urgency = hasWaterHazard ? 'High' : 'Medium';
      possibleCauses = [
        'Pump motor overheating or thermal overload tripped',
        'Loss of prime or air lock in intake suction line',
        'Clogged intake strainer or pressure switch failure',
        'Electrical supply disconnection to pump control box'
      ];
      preliminaryChecks = [
        'Check indicator lights on the pump controller or control panel.',
        'Verify that the power isolator switch for the pump is switched on.',
        'Listen for unusual humming or silence when the pump is triggered.',
        'Check for visible leaks around seals or valves.'
      ];
      contactTechnician = 'Contact facilities maintenance technician if the pump fails to prime, hums without running, or leaks.';
      break;

    case 'plumbing':
      urgency = hasWaterHazard ? 'High' : 'Medium';
      possibleCauses = [
        'Local pipe clog, grease buildup, or trapped debris',
        'Faulty flapper valve, worn washer, or loose pipe joint connection',
        'Excessive water pressure or municipal supply fluctuation'
      ];
      preliminaryChecks = [
        'Locate the nearest shut-off valve (angle stop or main valve) and know how to close it if a leak worsens.',
        'Clear items away from the leak or blocked drain to prevent water damage.',
        'Check if neighboring fixtures are experiencing similar drainage issues.'
      ];
      contactTechnician = 'Contact campus plumbing team immediately if water is actively flooding or main supply lines are leaking.';
      break;

    case 'cooling':
      urgency = 'Medium';
      possibleCauses = [
        'Dirty air filter restricting airflow and causing evaporator coil freeze-up',
        'Thermostat battery depletion or incorrect setting',
        'Blocked condenser intake or drainage condensate line backup',
        'Refrigerant level drop or compressor relay fault'
      ];
      preliminaryChecks = [
        'Check thermostat display for error codes and ensure mode is set correctly.',
        'Inspect visible air filters for dust accumulation.',
        'Check if circuit breaker for the HVAC unit is switched on.',
        'Ensure vents are not blocked by furniture or books.'
      ];
      contactTechnician = 'Contact HVAC technicians if the unit blows warm air, leaks water indoors, or displays error codes.';
      break;

    default:
      possibleCauses = [
        'General mechanical or operational wear and tear',
        'Temporary power or connectivity glitch',
        'User control setting configuration error'
      ];
      preliminaryChecks = [
        'Review equipment user manual or operating instructions if posted nearby.',
        'Perform a safe power cycle (turn off, wait 30 seconds, turn back on) only if electrical safety is assured.',
        'Document exact error messages or abnormal sounds.'
      ];
      contactTechnician = 'Contact campus facilities service desk with a detailed description of the problem.';
      break;
  }

  return {
    category,
    urgency,
    possibleCauses,
    preliminaryChecks,
    contactTechnician,
    safetyNotice,
    modelInfo: {
      provider: 'CampusFix Demo Rules Engine (Open-Weight Ready)',
      model: 'campusfix-rule-matcher-v1',
      openWeightReady: true,
      note: 'This demo troubleshooting mode uses a structured rules engine. The backend is architected to plug in an eligible open-weight model API in future updates without rewriting frontend code.'
    },
    timestamp: new Date().toISOString()
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers for local testing convenience
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');

  // API Health Endpoint
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'CampusFix AI API',
      version: '1.0.0',
      mode: 'demo-rules-engine',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // API Diagnose Endpoint
  if (pathname === '/api/diagnose' && req.method === 'POST') {
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

    req.on('end', () => {
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

        const diagnosis = diagnoseProblem(
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

server.listen(PORT, () => {
  console.log(`[CampusFix AI] Server running at http://localhost:${PORT}`);
  console.log(`[CampusFix AI] Mode: Demo Rules Engine (Open-Weight Ready)`);
});
