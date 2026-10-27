/**
 * CampusFix AI - Comprehensive Test Suite
 * Uses Node.js built-in assert, http, and child_process modules.
 */

const assert = require('assert');
const http = require('http');
const { execSync } = require('child_process');
const { diagnoseProblem } = require('./aiService');
const server = require('./server');

async function runTests() {
  console.log('=== [CampusFix AI] Starting Test Suite ===');

  // 1. Syntax Checks
  console.log('Running syntax checks...');
  try {
    execSync('node -c server.js aiService.js rateLimiter.js tfidfEngine.js public/app.js test.js', { stdio: 'inherit' });
    console.log('✅ Syntax checks passed.');
  } catch (err) {
    console.error('❌ Syntax check failed');
    process.exit(1);
  }

  // 2. Unit Testing Safety & Conservatism
  console.log('Running safety & conservatism unit tests...');

  // Test A: Electrical Sparking (Emergency override)
  const sparkingRes = await diagnoseProblem('electrical', 'Outlet is sparking and making crackling sounds');
  assert.strictEqual(sparkingRes.urgency, 'Emergency', 'Sparking outlet must trigger Emergency urgency');
  assert.ok(sparkingRes.safetyNotice.includes('CRITICAL SAFETY HAZARD'), 'Must include critical safety hazard warning');
  console.log('✅ Electrical sparking safety test passed.');

  // Test B: Burning smell & smoke
  const smokeRes = await diagnoseProblem('cooling', 'AC unit is emitting black smoke and burning smell');
  assert.strictEqual(smokeRes.urgency, 'Emergency', 'Smoke/burning smell must trigger Emergency urgency');
  console.log('✅ Burning smell & smoke safety test passed.');

  // Test C: Water pump safety check sanitization
  const pumpRes = await diagnoseProblem('water-pump', 'Pump making loud humming noise');
  pumpRes.preliminaryChecks.forEach(check => {
    const hasActiveVerb = /\b(check|inspect|test|measure|adjust|operate|lubricate|clean|clear|start|restart|open|touch|fix|repair|remove|disassemble|isolate|restore|reset|turn|bleed|drain|verify|examine|monitor)\b/i.test(check);
    const hasSafeContext = /\b(without|not|do not|don't|never|avoid|keep away)\b/i.test(check);
    const isUnsafeInstruction = hasActiveVerb && !hasSafeContext;
    assert.strictEqual(isUnsafeInstruction, false, `Preliminary check must not contain unsafe actions: "${check}"`);
  });
  console.log('✅ Water pump preliminary checks safety sanitization test passed.');

  // 3. Mock AI Model Server Tests (Response Parsing Edge Cases & Fallback Verification)
  console.log('Running Mock AI Model Server parsing & error handling tests...');

  async function runMockAiTest(responderFn) {
    const mockServer = http.createServer((req, res) => {
      responderFn(req, res);
    });
    await new Promise(resolve => mockServer.listen(0, resolve));
    const port = mockServer.address().port;
    process.env.OPEN_WEIGHT_API_URL = `http://localhost:${port}/v1/chat/completions`;
    process.env.OPEN_WEIGHT_API_KEY = 'mock-key';

    const res = await diagnoseProblem('electrical', 'Circuit breaker tripped');
    mockServer.close();
    delete process.env.OPEN_WEIGHT_API_URL;
    delete process.env.OPEN_WEIGHT_API_KEY;
    return res;
  }

  // Test 1: Valid OpenAI-compatible response
  const validRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            urgency: 'Low',
            possibleCauses: ['Minor power flicker'],
            preliminaryChecks: ['Observe the area from a safe distance.'],
            safetyNotice: 'Be cautious.'
          })
        }
      }]
    }));
  });
  assert.strictEqual(validRes.urgency, 'Low');
  assert.ok(validRes.possibleCauses.length > 0);
  console.log('✅ Valid OpenAI-compatible response test passed.');

  // Test 2: Missing choices -> Fallback to rules engine
  const missingChoicesRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'no choices' }));
  });
  assert.ok(missingChoicesRes.possibleCauses.length > 0);
  assert.strictEqual(missingChoicesRes.modelInfo.mode, 'rules-engine-tfidf');
  console.log('✅ Missing choices fallback test passed.');

  // Test 3: Missing message content -> Fallback to rules engine
  const missingContentRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: {} }] }));
  });
  assert.ok(missingContentRes.possibleCauses.length > 0);
  assert.strictEqual(missingContentRes.modelInfo.mode, 'rules-engine-tfidf');
  console.log('✅ Missing message content fallback test passed.');

  // Test 4: Empty content -> Fallback to rules engine
  const emptyContentRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: '   ' } }] }));
  });
  assert.strictEqual(emptyContentRes.modelInfo.mode, 'rules-engine-tfidf');
  console.log('✅ Empty content fallback test passed.');

  // Test 5: Invalid JSON content -> Fallback to rules engine
  const invalidJsonContentRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: 'not-json' } }] }));
  });
  assert.strictEqual(invalidJsonContentRes.modelInfo.mode, 'rules-engine-tfidf');
  console.log('✅ Invalid JSON content fallback test passed.');

  // Test 6: JSON object missing urgency (should normalize to Medium)
  const missingUrgencyRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            possibleCauses: ['Unknown cause'],
            preliminaryChecks: ['Observe equipment.']
          })
        }
      }]
    }));
  });
  assert.strictEqual(missingUrgencyRes.urgency, 'Medium');
  console.log('✅ Missing urgency normalization test passed.');

  // Test 7: Invalid urgency value (should normalize to Medium)
  const invalidUrgencyRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            urgency: 'SuperCritical',
            possibleCauses: ['Unknown cause'],
            preliminaryChecks: ['Observe equipment.']
          })
        }
      }]
    }));
  });
  assert.strictEqual(invalidUrgencyRes.urgency, 'Medium');
  console.log('✅ Invalid urgency normalization test passed.');

  // Test 8: Remote response containing unsafe instructions (should be sanitized)
  const unsafeModelRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            urgency: 'Low',
            possibleCauses: ['Wiring fault'],
            preliminaryChecks: [
              'Touch the exposed wires.',
              'Open the electrical panel box.'
            ]
          })
        }
      }]
    }));
  });
  unsafeModelRes.preliminaryChecks.forEach(check => {
    const hasActiveVerb = /\b(touch|open|restart|measure|test|repair|remove|disassemble|isolate|restore|reset|turn|bleed|drain|verify|examine|monitor)\b/i.test(check);
    const hasSafeContext = /\b(without|not|do not|don't|never|avoid|keep away)\b/i.test(check);
    assert.strictEqual(hasActiveVerb && !hasSafeContext, false, `Unsafe model check must be filtered out: "${check}"`);
  });
  console.log('✅ Unsafe remote instructions sanitization test passed.');

  // Test 9: HTTP Error (401) -> Fallback to rules engine
  const httpErrorRes = await runMockAiTest((req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
  });
  assert.strictEqual(httpErrorRes.modelInfo.mode, 'rules-engine-tfidf');
  console.log('✅ HTTP 401 error fallback test passed.');

  // Test 10: HTTP Error (429) -> Fallback to rules engine
  const rateLimitErrorRes = await runMockAiTest((req, res) => {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rate limit' }));
  });
  assert.strictEqual(rateLimitErrorRes.modelInfo.mode, 'rules-engine-tfidf');
  console.log('✅ HTTP 429 error fallback test passed.');

  // 4. HTTP Server & Endpoint Tests
  console.log('Starting HTTP test server...');
  await new Promise(resolve => server.listen(0, resolve));
  const testPort = server.address().port;

  // Test Health Endpoint
  const healthData = await httpRequest('GET', `http://localhost:${testPort}/api/health`);
  assert.strictEqual(healthData.status, 200);
  const healthJson = JSON.parse(healthData.body);
  assert.strictEqual(healthJson.status, 'ok');
  console.log('✅ Health endpoint test passed.');

  // Test Diagnose API Endpoint
  const diagnoseData = await httpRequest('POST', `http://localhost:${testPort}/api/diagnose`, {
    category: 'electrical',
    description: 'Test circuit breaker tripped'
  });
  assert.strictEqual(diagnoseData.status, 200);
  const diagnoseJson = JSON.parse(diagnoseData.body);
  assert.ok(diagnoseJson.possibleCauses, 'Diagnosis response should contain possibleCauses');
  console.log('✅ Diagnose endpoint test passed.');

  // Test Outage Broadcast API Endpoint
  const outageData = await httpRequest('POST', `http://localhost:${testPort}/api/outages/report`, {
    category: 'electrical',
    description: 'Test hallway power outage',
    urgency: 'High'
  });
  assert.strictEqual(outageData.status, 200);
  const outageJson = JSON.parse(outageData.body);
  assert.strictEqual(outageJson.success, true);
  console.log('✅ Outage broadcast endpoint test passed.');

  // Test Invalid Outage Category (400)
  const badOutageData = await httpRequest('POST', `http://localhost:${testPort}/api/outages/report`, {
    category: 'invalid-cat',
    description: 'Test outage',
    urgency: 'High'
  });
  assert.strictEqual(badOutageData.status, 400);
  console.log('✅ Invalid outage category test passed.');

  // Test Invalid JSON Payload (400)
  const badJsonData = await httpRequestRaw('POST', `http://localhost:${testPort}/api/diagnose`, 'invalid-json-string');
  assert.strictEqual(badJsonData.status, 400);
  console.log('✅ Invalid JSON payload test passed.');

  // Test Unknown Route (404)
  const notFoundData = await httpRequest('GET', `http://localhost:${testPort}/api/nonexistent`);
  assert.strictEqual(notFoundData.status, 404);
  console.log('✅ Unknown route 404 test passed.');

  // Close test server
  server.close();

  console.log('🎉 All CampusFix AI tests completed successfully!');
  process.exit(0);
}

function httpRequest(method, url, jsonBody) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method,
      headers: jsonBody ? { 'Content-Type': 'application/json' } : {}
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (jsonBody) req.write(JSON.stringify(jsonBody));
    req.end();
  });
}

function httpRequestRaw(method, url, rawBody) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(rawBody);
    req.end();
  });
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  server.close();
  process.exit(1);
});
