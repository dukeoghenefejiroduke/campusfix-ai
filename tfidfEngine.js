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
    resolution: 'Science Hall Pump Station: Cleared intake air lock and reset thermal overload relay. Verified suction pressure.',
    timestamp: '2 days ago'
  },
  {
    id: 'TICK-102',
    category: 'electrical',
    text: 'outlet sparking burning smell black mark on receptacle',
    resolution: 'Student Union Room 204: Emergency circuit isolation. Replaced burned duplex receptacle and verified copper wire integrity.',
    timestamp: 'Yesterday'
  },
  {
    id: 'TICK-103',
    category: 'cooling',
    text: 'air conditioner blowing warm air evaporator coil frozen dirty filter',
    resolution: 'Library North Wing AC-3: Thawed frozen evaporator coils, replaced MERV-11 air filter, and verified refrigerant superheat.',
    timestamp: '3 days ago'
  },
  {
    id: 'TICK-104',
    category: 'plumbing',
    text: 'sink drain clogged slow drainage grease buildup trap',
    resolution: 'Dormitory Hall B Floor 2: Disassembled and cleaned P-trap, removed organic grease blockage, flushed with pressurized hot water.',
    timestamp: '4 days ago'
  },
  {
    id: 'TICK-105',
    category: 'water-pump',
    text: 'booster pump pressure switch failing cycling rapidly',
    resolution: 'Athletic Center Mechanical Room: Adjusted pressure differential cut-in switch and cleared sediment from inline strainer.',
    timestamp: '1 week ago'
  },
  {
    id: 'TICK-106',
    category: 'electrical',
    text: 'acoustic fingerprint 60hz hum transformer core vibration electrical room',
    resolution: 'Engineering Building Substation B: Inspected dry-type transformer seismic mounting isolators and torqued busbar connections.',
    timestamp: '5 days ago'
  },
  {
    id: 'TICK-107',
    category: 'cooling',
    text: 'acoustic signature high frequency whistle air flow restriction filter',
    resolution: 'Auditorium HVAC Unit 1: Cleared obstructed air intake louvers and replaced pleated filtration media.',
    timestamp: '6 days ago'
  },
  {
    id: 'TICK-108',
    category: 'other',
    text: 'lab fume hood airflow alarm buzzing low velocity exhaust fan',
    resolution: 'Chemistry Lab 302: Re-calibrated side-wall velocity monitor and tightened centrifugal exhaust fan drive belts.',
    timestamp: '1 week ago'
  },
  {
    id: 'TICK-109',
    category: 'other',
    text: 'dormitory smart laundry machine coin acceptor jam power reset',
    resolution: 'North Residence Hall Laundry: Cleared jammed token mechanism coin slide and power-cycled vending control board.',
    timestamp: '2 weeks ago'
  },
  {
    id: 'TICK-110',
    category: 'cooling',
    text: 'chiller water temperature high compressor staging failure',
    resolution: 'Central Plant Chiller 2: Reset programmable logic controller fault log and verified cooling tower condenser water flow rate.',
    timestamp: '3 weeks ago'
  },
  {
    id: 'TICK-111',
    category: 'plumbing',
    text: 'toilet flushometer valve running continuously water waste',
    resolution: 'Student Center Restroom: Replaced worn flushometer rubber diaphragm and cleaned bypass orifice.',
    timestamp: '4 days ago'
  },
  {
    id: 'TICK-112',
    category: 'water-pump',
    text: 'sump pump pit overflowing heavy rain check valve stuck',
    resolution: 'Basement Mechanical Vault: Cleared debris-jammed check valve flapper and tested float switch activation levels.',
    timestamp: '5 days ago'
  },
  {
    id: 'TICK-113',
    category: 'electrical',
    text: 'fluorescent light ballast buzzing flickering tube failure',
    resolution: 'Faculty Office Building 4B: Replaced failing electromagnetic ballast and installed new T8 LED linear tubes.',
    timestamp: '1 week ago'
  },
  {
    id: 'TICK-114',
    category: 'cooling',
    text: 'server room computer room air conditioner crac unit high temperature alarm',
    resolution: 'Data Center CRAC-1: Cleaned condensate drain pan, replaced saturated pre-filters, and verified redundant compressor staging.',
    timestamp: '2 days ago'
  },
  {
    id: 'TICK-115',
    category: 'plumbing',
    text: 'drinking fountain bubbler low water pressure stream bottleneck',
    resolution: 'Hallway Hydration Station: Cleaned calcium mineral scale buildup from bubbler nozzle and adjusted regulator valve.',
    timestamp: '6 days ago'
  },
  {
    id: 'TICK-116',
    category: 'electrical',
    text: 'automatic transfer switch generator test fault failure',
    resolution: 'Emergency Power Plant: Inspected ATS control fuses and re-terminated backup generator start signal wiring.',
    timestamp: '2 weeks ago'
  },
  {
    id: 'TICK-117',
    category: 'water-pump',
    text: 'hot water recirculation pump cavitation noise bearing wear',
    resolution: 'Residential Tower East: Replaced worn bronze impeller bearings and purged air from loop.',
    timestamp: '1 week ago'
  },
  {
    id: 'TICK-118',
    category: 'other',
    text: 'automatic sliding doors sensor radar not detecting motion',
    resolution: 'Main Library Entrance: Re-aligned overhead microwave motion sensor and cleaned optical safety beams.',
    timestamp: '3 days ago'
  },
  {
    id: 'TICK-119',
    category: 'plumbing',
    text: 'emergency eyewash station tepid water mixing valve failure',
    resolution: 'Biological Lab Safety Station: Serviced thermostatic mixing valve cartridges and flushed supply lines.',
    timestamp: '4 days ago'
  },
  {
    id: 'TICK-120',
    category: 'cooling',
    text: 'cooling tower basin algae buildup water treatment chemical dosing',
    resolution: 'Central Utilities Plant: Applied biocide treatment, scrubbed basin sediment, and replenished bromine tablets.',
    timestamp: '1 week ago'
  },
  {
    id: 'TICK-121',
    category: 'electrical',
    text: 'outdoor parking lot pole light fixture ballast dead dark area',
    resolution: 'Parking Lot C: Replaced burnt LED driver power supply and sealed photocell weather gasket.',
    timestamp: '5 days ago'
  },
  {
    id: 'TICK-122',
    category: 'water-pump',
    text: 'fire sprinkler booster pump pressure drop weekly test alarm',
    resolution: 'Fire Protection Room: Inspected main backflow preventer assembly and bled trapped air from test header.',
    timestamp: '2 weeks ago'
  },
  {
    id: 'TICK-123',
    category: 'plumbing',
    text: 'roof rain leader drain blocked leaves standing water',
    resolution: 'Roof Deck B: Removed accumulated autumn leaves and cleared debris basket strainer.',
    timestamp: '1 week ago'
  },
  {
    id: 'TICK-124',
    category: 'cooling',
    text: 'vav box damper actuator stuck room temperature too hot',
    resolution: 'Business School Room 310: Replaced electric VAV damper actuator motor and re-calibrated controller network address.',
    timestamp: '3 days ago'
  },
  {
    id: 'TICK-125',
    category: 'other',
    text: 'electric vehicle charging station network error RFID reader offline',
    resolution: 'Campus Garage EV Station 4: Power-cycled cellular gateway modem and verified OCPP protocol handshake.',
    timestamp: '4 days ago'
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
    const rawScore = cosineSimilarity(queryVector, ticketVector);

    let categoryWeight = 1.0;
    if (category && ticket.category === category) {
      categoryWeight = 1.4; // strong boost for category match
    } else if (category && ticket.category !== category) {
      categoryWeight = 0.5; // heavy penalty for mismatched category
    }

    const adjustedScore = rawScore * categoryWeight;
    return {
      ...ticket,
      similarityScore: Number(adjustedScore.toFixed(3)),
      rawSimilarityScore: Number(rawScore.toFixed(3)),
      isCategoryMatch: category ? ticket.category === category : true
    };
  });

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  const relevant = scored.filter(item => item.similarityScore > 0.08);

  if (category) {
    const categoryMatches = relevant.filter(item => item.category === category);
    if (categoryMatches.length > 0) {
      return categoryMatches.slice(0, topK);
    } else {
      return [];
    }
  }

  return relevant.slice(0, topK);
}

module.exports = { findSemanticMatches };
