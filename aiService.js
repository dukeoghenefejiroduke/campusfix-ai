/**
 * CampusFix AI - AI Service Adapter
 * Supports plugging in an eligible open-weight model API (Groq endpoint: https://api.groq.com/openai/v1/chat/completions, model: openai/gpt-oss-20b)
 * with robust seamless fallback to the local rules-based diagnostic engine and TF-IDF text similarity matches.
 *
 * CRITICAL SAFETY MANDATE: Deterministic safety guardrails are applied authoritatively
 * to all outputs (both remote model and local rules) to ensure students are never
 * instructed to perform unsafe actions (touching wiring, breakers, measuring voltage,
 * opening panels, restarting equipment, lubricating, or DIY repairs).
 */

const https = require('https');
const http = require('http');
const { findSemanticMatches } = require('./tfidfEngine');

const APPROVED_CONTACT_TEXT = "Contact your institution's verified campus facilities or emergency contact channel.";

/**
 * Sanitize preliminary checks to strictly remove any unsafe actions.
 * Rejects active operational/maintenance verbs unless framed purely as safe prohibitions or passive observations.
 */
function sanitizePreliminaryChecks(checks) {
  if (!Array.isArray(checks)) return getDefaultPreliminaryChecks('other');

  const activeVerbsPattern = /\b(check|inspect|test|measure|adjust|operate|lubricate|clean|clear|start|restart|open|touch|fix|repair|remove|disassemble|isolate|restore|reset|turn|bleed|drain|verify|examine|monitor)\b/i;
  const safeContextPattern = /\b(without|not|do not|don't|never|avoid|keep away)\b/i;

  const sanitized = checks
    .map(c => typeof c === 'string' ? c.trim() : '')
    .filter(c => {
      if (c.length === 0 || c.length >= 200) return false;
      const hasActiveVerb = activeVerbsPattern.test(c);
      const hasSafeContext = safeContextPattern.test(c);
      if (hasActiveVerb && !hasSafeContext) return false;
      return true;
    });

  if (sanitized.length === 0) {
    return [
      'Observe the equipment from a safe distance.',
      'Do not touch, open, or attempt to repair the equipment.',
      'Report the symptoms to qualified campus maintenance personnel.'
    ];
  }

  return sanitized;
}

function getDefaultPreliminaryChecks(category) {
  switch (category) {
    case 'electrical':
      return [
        'Observe the area and equipment from a safe distance.',
        'Note whether other devices in the room have power.',
        'Do not touch switches, outlets, cords, or exposed components.',
        'Report symptoms immediately to qualified maintenance personnel.'
      ];
    case 'water-pump':
      return [
        'Observe the equipment from a safe distance.',
        'Note whether water flow has stopped or changed.',
        'Look from a safe distance for visible leakage without approaching hazards.',
        'Record externally visible indicator lights without touching equipment or opening panels.',
        'Report symptoms to qualified maintenance personnel.'
      ];
    case 'plumbing':
      return [
        'Observe the area from a safe distance.',
        'Clear items away from the leak or blocked drain to prevent water damage without touching pipes or valves.',
        'Report symptoms to qualified maintenance personnel.'
      ];
    case 'cooling':
      return [
        'Check thermostat display for error codes from a safe distance without opening units.',
        'Note whether vents are blocked by furniture or books.',
        'Report symptoms to qualified maintenance personnel.'
      ];
    default:
      return [
        'Review equipment user manual or operating instructions if posted nearby from a safe distance.',
        'Document exact error messages or abnormal sounds.',
        'Report symptoms to qualified maintenance personnel.'
      ];
  }
}

function sanitizePossibleCauses(causes) {
  if (!Array.isArray(causes)) return ['General mechanical or operational wear and tear'];
  return causes
    .map(c => typeof c === 'string' ? c.trim() : '')
    .filter(c => c.length > 0 && c.length < 200)
    .slice(0, 5);
}

function enforceSafetyGuardrails(category, description, symptoms, result) {
  const text = (description + ' ' + (symptoms || '')).toLowerCase();

  const hasElectricalDanger = /spark|smoke|burn|smell|shock|tingle|exposed|wire|live|outlet black/i.test(text);
  const hasWaterHazard = /flood|burst|overflow|ceiling leak|short circuit/i.test(text);

  let urgency = 'Medium';
  if (result.urgency && ['Low', 'Medium', 'High', 'Emergency'].includes(result.urgency)) {
    urgency = result.urgency;
  }

  let safetyNotice = 'SAFETY FIRST: Never touch live electrical parts, open electrical panels, or attempt repairs yourself.';
  let preliminaryChecks = sanitizePreliminaryChecks(result.preliminaryChecks);
  let possibleCauses = sanitizePossibleCauses(result.possibleCauses);

  if (hasElectricalDanger) {
    urgency = 'Emergency';
    safetyNotice = 'CRITICAL SAFETY HAZARD: Electrical sparks, burning smells, or exposed wires detected. Immediately keep well away from the area, do not touch any equipment, and contact campus emergency personnel or qualified technicians right away.';
    preliminaryChecks = [
      'Keep well away from the affected equipment and area.',
      'Do not touch switches, outlets, cords, or exposed components.',
      'Contact campus emergency personnel or qualified technicians immediately.'
    ];
  } else if (hasWaterHazard && category === 'plumbing') {
    urgency = 'High';
    safetyNotice = 'WATER HAZARD: Active leak or flooding detected. Keep away from electrical outlets and wet floors. Report to facilities immediately.';
  }

  const contactTechnician = APPROVED_CONTACT_TEXT;
  const historicalPrecedents = findSemanticMatches(category, description, symptoms);

  return {
    category,
    urgency,
    possibleCauses,
    preliminaryChecks,
    contactTechnician,
    safetyNotice,
    historicalPrecedents,
    modelInfo: result.modelInfo || {
      provider: 'Local Rules Engine',
      model: 'rules-engine-tfidf',
      openWeightReady: true,
      mode: 'rules-engine-tfidf'
    },
    timestamp: new Date().toISOString()
  };
}

function diagnoseWithRules(category, description, symptoms, startDate) {
  let possibleCauses = [];
  let preliminaryChecks = getDefaultPreliminaryChecks(category);
  let urgency = 'Medium';

  switch (category) {
    case 'electrical':
      possibleCauses = [
        'Tripped circuit breaker or overloaded circuit',
        'Faulty wiring, damaged insulation, or failing outlet receptacle',
        'Appliance internal electrical fault'
      ];
      break;

    case 'water-pump':
      possibleCauses = [
        'Pump motor overheating or thermal overload tripped',
        'Loss of prime or air lock in intake suction line',
        'Clogged intake strainer or pressure switch failure',
        'Electrical supply disconnection to pump control box'
      ];
      break;

    case 'plumbing':
      possibleCauses = [
        'Local pipe clog, grease buildup, or trapped debris',
        'Faulty flapper valve, worn washer, or loose pipe joint connection',
        'Excessive water pressure or municipal supply fluctuation'
      ];
      break;

    case 'cooling':
      possibleCauses = [
        'Dirty air filter restricting airflow and causing evaporator coil freeze-up',
        'Thermostat battery depletion or incorrect setting',
        'Blocked condenser intake or drainage condensate line backup',
        'Refrigerant level drop or compressor relay fault'
      ];
      break;

    default:
      possibleCauses = [
        'General mechanical or operational wear and tear',
        'Temporary power or connectivity glitch',
        'User control setting configuration error'
      ];
      break;
  }

  const rawResult = {
    category,
    urgency,
    possibleCauses,
    preliminaryChecks,
    contactTechnician: APPROVED_CONTACT_TEXT,
    safetyNotice: 'SAFETY FIRST: Never touch live electrical parts or attempt repairs yourself.',
    modelInfo: {
      provider: 'Local Rules Engine',
      model: 'rules-engine-tfidf',
      openWeightReady: true,
      mode: 'rules-engine-tfidf'
    }
  };

  return enforceSafetyGuardrails(category, description, symptoms, rawResult);
}

/**
 * Safely parse and validate remote API response.
 */
function parseRemoteApiResponse(data) {
  let parsedTop;
  try {
    parsedTop = JSON.parse(data);
  } catch (e) {
    throw new Error('Invalid top-level JSON response from remote API');
  }

  if (!parsedTop || typeof parsedTop !== 'object') {
    throw new Error('Remote API response is not a JSON object');
  }

  // Extract content from OpenAI-compatible chat completion or legacy .response format
  const rawContent = parsedTop.choices?.[0]?.message?.content ?? parsedTop.response;

  if (rawContent === undefined || rawContent === null) {
    throw new Error('Missing message content in remote API response');
  }

  let aiResult;
  if (typeof rawContent === 'string') {
    if (rawContent.trim().length === 0) {
      throw new Error('Empty message content in remote API response');
    }
    try {
      aiResult = JSON.parse(rawContent);
    } catch (e) {
      throw new Error('Failed to parse inner JSON content from remote API');
    }
  } else if (typeof rawContent === 'object' && rawContent !== null) {
    aiResult = rawContent;
  } else {
    throw new Error('Invalid message content type in remote API response');
  }

  if (!aiResult || typeof aiResult !== 'object') {
    throw new Error('Parsed model content is not a valid JSON object');
  }

  // Validate and normalize urgency
  const validUrgencies = ['Low', 'Medium', 'High', 'Emergency'];
  const urgency = validUrgencies.includes(aiResult.urgency) ? aiResult.urgency : 'Medium';

  return {
    urgency,
    possibleCauses: Array.isArray(aiResult.possibleCauses) ? aiResult.possibleCauses : ['Model analysis completed.'],
    preliminaryChecks: Array.isArray(aiResult.preliminaryChecks) ? aiResult.preliminaryChecks : ['Observe equipment from safe distance.'],
    safetyNotice: typeof aiResult.safetyNotice === 'string' ? aiResult.safetyNotice : 'SAFETY FIRST: Never touch live electrical parts.'
  };
}

async function diagnoseProblem(category, description, symptoms, startDate) {
  const apiUrl = process.env.OPEN_WEIGHT_API_URL;
  const apiKey = process.env.OPEN_WEIGHT_API_KEY;
  const modelName = process.env.OPEN_WEIGHT_MODEL_NAME || 'openai/gpt-oss-20b';

  if (!apiUrl) {
    return diagnoseWithRules(category, description, symptoms, startDate);
  }

  try {
    const payload = JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are CampusFix AI, a safe equipment troubleshooting assistant for universities. Return strict JSON with keys: urgency (Low/Medium/High/Emergency), possibleCauses (array of strings), preliminaryChecks (array of strings), contactTechnician (string), safetyNotice (string). Do not instruct users to touch wires, open panels, measure voltage, lubricate parts, or perform repairs.'
        },
        {
          role: 'user',
          content: `Category: ${category}\nDescription: ${description}\nSymptoms: ${symptoms || 'None'}\nStarted: ${startDate || 'Unknown'}`
        }
      ],
      temperature: 0.1
    });

    const parsedUrl = new URL(apiUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : '',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 5000
    };

    const validatedAiResult = await new Promise((resolve, reject) => {
      const req = client.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const validated = parseRemoteApiResponse(data);
              resolve(validated);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`AI API returned status ${res.statusCode}`));
          }
        });
      });

      req.on('error', err => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('AI API request timed out'));
      });

      req.write(payload);
      req.end();
    });

    const rawResult = {
      category,
      urgency: validatedAiResult.urgency,
      possibleCauses: validatedAiResult.possibleCauses,
      preliminaryChecks: validatedAiResult.preliminaryChecks,
      contactTechnician: APPROVED_CONTACT_TEXT,
      safetyNotice: validatedAiResult.safetyNotice,
      modelInfo: {
        provider: 'Remote Model API',
        model: modelName,
        openWeightReady: true,
        mode: 'remote-model-configured-unverified'
      }
    };

    return enforceSafetyGuardrails(category, description, symptoms, rawResult);
  } catch (err) {
    console.warn(`[CampusFix AI] AI API unavailable (${err.message}). Falling back to local rules engine.`);
    return diagnoseWithRules(category, description, symptoms, startDate);
  }
}

module.exports = { diagnoseProblem };
