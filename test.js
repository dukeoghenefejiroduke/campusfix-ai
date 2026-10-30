/**
 * CampusFix AI - Comprehensive Test Suite
 * Uses Node.js built-in assert, http, and child_process modules.
 */

const assert = require('assert');
const http = require('http');
const { execSync } = require('child_process');
const { diagnoseProblem } = require('./aiService');
const { findSemanticMatches } = require('./tfidfEngine');
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

  async function runMockAiTest(responderFn, testDescription = 'Circuit breaker tripped') {
    const mockServer = http.createServer((req, res) => {
      responderFn(req, res);
    });
    await new Promise(resolve => mockServer.listen(0, resolve));
    const port = mockServer.address().port;
    process.env.OPEN_WEIGHT_API_URL = `http://127.0.0.1:${port}/v1/chat/completions`;
    process.env.OPEN_WEIGHT_API_KEY = 'mock-key';

    const res = await diagnoseProblem('electrical', testDescription);
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

  // Test 1.1: Vague input clarification test
  const vagueRes = await diagnoseProblem('electrical', 'Something is wrong');
  assert.strictEqual(vagueRes.urgency, 'Low', 'Vague input must return Low urgency');
  assert.ok(vagueRes.preliminaryChecks.some(c => c.toLowerCase().includes('specific details')), 'Vague input must request specific details');
  console.log('✅ Vague input clarification test passed.');

  // Test 1.2: Unsafe model instruction attempting breaker reset sanitization test
  const unsafeBreakerRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            urgency: 'Medium',
            possibleCauses: ['Tripped breaker'],
            preliminaryChecks: ['Reset the circuit breaker panel.', 'Open the electrical box.'],
            safetyNotice: 'Be careful.'
          })
        }
      }]
    }));
  }, 'Hallway power failure');
  unsafeBreakerRes.preliminaryChecks.forEach(check => {
    const hasActiveVerb = /\b(reset|open|touch|restart|measure|test|repair|remove|disassemble|isolate|restore|turn|bleed|drain|verify|examine|monitor)\b/i.test(check);
    const hasSafeContext = /\b(without|not|do not|don't|never|avoid|keep away)\b/i.test(check);
    assert.strictEqual(hasActiveVerb && !hasSafeContext, false, `Unsafe breaker/panel instruction must be sanitized: "${check}"`);
  });
  console.log('✅ Unsafe breaker reset instructions sanitization test passed.');

  // Test 2: Missing choices -> Fallback to rules engine
  const missingChoicesRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'no choices' }));
  });
  assert.ok(missingChoicesRes.possibleCauses.length > 0);
  assert.strictEqual(missingChoicesRes.modelInfo.mode, 'remote-model-failed-fallback-to-rules');
  console.log('✅ Missing choices fallback test passed.');

  // Test 1.3: Acoustic metadata integration test (60Hz)
  const acousticRes = await diagnoseProblem('water-pump', 'Pump humming loudly', '', '', {
    peakFrequencyHz: 60,
    acousticClassification: 'Electrical Hum Frequency (50Hz/60Hz)',
    measurementAvailable: true
  });
  assert.ok(acousticRes.possibleCauses.some(c => c.includes('60 Hz')), 'Diagnosis must include acoustic observation');
  console.log('✅ Acoustic metadata integration test passed.');

  // Test 1.4: Acoustic measurement regression tests (Valid 3094 Hz vs 0 Hz / missing)
  const validAcousticRes = await diagnoseProblem('cooling', 'Air handler whistling', '', '', {
    peakFrequencyHz: 3094,
    acousticClassification: 'High-Frequency Peak. Possible air or fluid flow whistle.',
    measurementAvailable: true
  });
  assert.ok(validAcousticRes.possibleCauses.some(c => c.includes('3094 Hz')), 'Valid 3094 Hz frequency must be preserved in pipeline');
  console.log('✅ Valid nonzero acoustic frequency (3094 Hz) regression test passed.');

  const zeroAcousticRes = await diagnoseProblem('cooling', 'Air handler whistling', '', '', {
    peakFrequencyHz: 0,
    acousticClassification: 'Normal',
    measurementAvailable: true
  });
  assert.strictEqual(zeroAcousticRes.possibleCauses.some(c => c.includes('0 Hz')), false, '0 Hz must never be reported as a valid acoustic peak');
  console.log('✅ Zero frequency rejection regression test passed.');

  const missingAcousticRes = await diagnoseProblem('cooling', 'Air handler whistling', '', '', {
    peakFrequencyHz: 0,
    acousticClassification: 'Normal',
    measurementAvailable: false
  });
  assert.strictEqual(missingAcousticRes.possibleCauses.some(c => c.includes('Hz')), false, 'Missing measurement must not report frequency');
  console.log('✅ Missing acoustic measurement regression test passed.');

  // Test 1.5: TF-IDF Similarity Engine category relevance regression tests
  // Plumbing query should prefer plumbing precedent (TICK-104) and not return mismatched cross-category precedents if category mismatch exists
  const plumbingMatches = findSemanticMatches('plumbing', 'sink drain clogged slow drainage', '');
  assert.ok(plumbingMatches.length > 0, 'Plumbing query must find category-compatible match');
  assert.strictEqual(plumbingMatches[0].category, 'plumbing', 'Top match must be category-compatible');
  console.log('✅ TF-IDF similarity category compatibility test passed.');

  const mismatchedMatches = findSemanticMatches('plumbing', 'transformer core vibration electrical room', '');
  assert.strictEqual(mismatchedMatches.length, 0, 'Mismatched category with no compatible precedents must return empty array to prevent misleading matches');
  console.log('✅ TF-IDF similarity mismatched category filtering test passed.');

  // Test 3: Missing message content -> Fallback to rules engine
  const missingContentRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: {} }] }));
  });
  assert.ok(missingContentRes.possibleCauses.length > 0);
  assert.strictEqual(missingContentRes.modelInfo.mode, 'remote-model-failed-fallback-to-rules');
  console.log('✅ Missing message content fallback test passed.');

  // Test 4: Empty content -> Fallback to rules engine
  const emptyContentRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: '   ' } }] }));
  });
  assert.strictEqual(emptyContentRes.modelInfo.mode, 'remote-model-failed-fallback-to-rules');
  console.log('✅ Empty content fallback test passed.');

  // Test 5: Invalid JSON content -> Fallback to rules engine
  const invalidJsonContentRes = await runMockAiTest((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: 'not-json' } }] }));
  });
  assert.strictEqual(invalidJsonContentRes.modelInfo.mode, 'remote-model-failed-fallback-to-rules');
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
  assert.strictEqual(httpErrorRes.modelInfo.mode, 'remote-model-failed-fallback-to-rules');
  console.log('✅ HTTP 401 error fallback test passed.');

  // Test 10: HTTP Error (429) -> Fallback to rules engine
  const rateLimitErrorRes = await runMockAiTest((req, res) => {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rate limit' }));
  });
  assert.strictEqual(rateLimitErrorRes.modelInfo.mode, 'remote-model-failed-fallback-to-rules');
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

  // Test Outage Broadcast API Endpoint with Resolved / Fixed status
  const resolvedOutageData = await httpRequest('POST', `http://localhost:${testPort}/api/outages/report`, {
    category: 'plumbing',
    description: 'Test fixed water leak',
    urgency: 'Medium',
    status: 'Resolved / Fixed'
  });
  assert.strictEqual(resolvedOutageData.status, 200);
  console.log('✅ Resolved outage broadcast endpoint test passed.');

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

  // Test SSE Multi-Client Broadcasting
  await new Promise((resolve, reject) => {
    let receivedCount = 0;
    const client1 = http.request({ hostname: '127.0.0.1', port: testPort, path: '/api/outages/stream', method: 'GET' }, res1 => {
      res1.on('data', chunk => {
        const text = chunk.toString();
        if (text.includes('OUTAGE_ALERT')) {
          receivedCount++;
          if (receivedCount === 2) {
            client1.destroy();
            client2.destroy();
            resolve();
          }
        }
      });
    });
    client1.on('error', () => {});
    client1.end();

    const client2 = http.request({ hostname: '127.0.0.1', port: testPort, path: '/api/outages/stream', method: 'GET' }, res2 => {
      res2.on('data', chunk => {
        const text = chunk.toString();
        if (text.includes('OUTAGE_ALERT')) {
          receivedCount++;
          if (receivedCount === 2) {
            client1.destroy();
            client2.destroy();
            resolve();
          }
        }
      });
    });
    client2.on('error', () => {});
    client2.end();

    setTimeout(() => {
      httpRequest('POST', `http://127.0.0.1:${testPort}/api/outages/report`, {
        category: 'electrical',
        description: 'Multi-client SSE test alert',
        urgency: 'High'
      }).catch(reject);
    }, 100);
  });
  console.log('✅ SSE multi-client broadcasting test passed.');

  // Test Persistent Outage History Endpoint
  const historyRes = await httpRequest('GET', `http://localhost:${testPort}/api/outages/history`);
  assert.strictEqual(historyRes.status, 200);
  const historyJson = JSON.parse(historyRes.body);
  assert.ok(Array.isArray(historyJson), 'Outage history must be an array');
  assert.ok(historyJson.length > 0, 'Outage history must contain recorded alerts');
  console.log('✅ Persistent outage history endpoint test passed.');

  // Test Expanded TF-IDF Real Campus Maintenance Records
  const labMatches = findSemanticMatches('other', 'lab fume hood airflow alarm buzzing low velocity', '');
  assert.ok(labMatches.length > 0, 'Expanded records must match lab fume hood query');
  assert.strictEqual(labMatches[0].id, 'TICK-108', 'Top match must be TICK-108 (lab fume hood)');
  console.log('✅ Expanded real campus maintenance records TF-IDF test passed.');

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
