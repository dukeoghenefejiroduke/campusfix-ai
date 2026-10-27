/**
 * CampusFix AI - Zero-Dependency Pure-JS TF-IDF Semantic Memory Engine
 * Performs vector space cosine similarity matching against historical campus maintenance tickets
 * to surface exact precedent fixes without external vector databases.
 */

const HISTORICAL_TICKETS = [
  {
    id: 'TICK-101',
    category: 'water-pump',
    text: 'water pump making loud humming noise not pumping water thermal overload tripped',
    resolution: 'Maintenance example: intake air lock was reported and addressed by qualified maintenance personnel. This illustrative record is not a verified campus incident.',
    timestamp: '2 days ago'
  },
  {
    id: 'TICK-102',
    category: 'electrical',
    text: 'outlet sparking burning smell black mark on receptacle',
    resolution: 'Emergency shutdown. Replaced burned duplex receptacle and checked wiring insulation.',
    timestamp: 'Yesterday'
  },
  {
    id: 'TICK-103',
    category: 'cooling',
    text: 'air conditioner blowing warm air evaporator coil frozen dirty filter',
    resolution: 'Thawed evaporator coils, replaced clogged air filter, verified refrigerant pressure.',
    timestamp: '3 days ago'
  },
  {
    id: 'TICK-104',
    category: 'plumbing',
    text: 'sink drain clogged slow drainage grease buildup trap',
    resolution: 'Cleaned P-trap, removed grease blockage, flushed with hot water.',
    timestamp: '4 days ago'
  },
  {
    id: 'TICK-105',
    category: 'water-pump',
    text: 'booster pump pressure switch failing cycling rapidly',
    resolution: 'Adjusted pressure differential switch and cleared intake strainer sediment.',
    timestamp: '1 week ago'
  }
];

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

// Compute Term Frequency (TF)
function computeTF(tokens) {
  const tf = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  // Normalize by total tokens
  Object.keys(tf).forEach(token => {
    tf[token] = tf[token] / tokens.length;
  });
  return tf;
}

// Compute Inverse Document Frequency (IDF) across historical tickets
const docTokensList = HISTORICAL_TICKETS.map(ticket => tokenize(ticket.text + ' ' + ticket.resolution));
const totalDocs = HISTORICAL_TICKETS.length;
const idf = {};

docTokensList.forEach(tokens => {
  const unique = new Set(tokens);
  unique.forEach(token => {
    idf[token] = (idf[token] || 0) + 1;
  });
});

Object.keys(idf).forEach(token => {
  idf[token] = Math.log(totalDocs / idf[token]);
});

// Compute TF-IDF Vector
function computeVector(tokens) {
  const tf = computeTF(tokens);
  const vector = {};
  Object.keys(tf).forEach(token => {
    vector[token] = tf[token] * (idf[token] || 0.1);
  });
  return vector;
}

// Compute Cosine Similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  allKeys.forEach(key => {
    const valA = vecA[key] || 0;
    const valB = vecB[key] || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  });

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search historical tickets for semantic matches to the current problem description.
 */
function findSemanticMatches(category, description, symptoms, topK = 2) {
  const queryText = `${category} ${description} ${symptoms || ''}`;
  const queryTokens = tokenize(queryText);
  const queryVector = computeVector(queryTokens);

  const scored = HISTORICAL_TICKETS.map(ticket => {
    const ticketTokens = docTokensList[HISTORICAL_TICKETS.indexOf(ticket)];
    const ticketVector = computeVector(ticketTokens);
    const score = cosineSimilarity(queryVector, ticketVector);
    return { ...ticket, similarityScore: Number(score.toFixed(3)) };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, topK).filter(item => item.similarityScore > 0.05);
}

module.exports = { findSemanticMatches };
