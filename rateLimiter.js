/**
 * CampusFix AI - In-Memory IP Rate Limiter
 * Securely limits requests per IP address using req.socket.remoteAddress to prevent header spoofing.
 */

const rateLimitMap = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 30; // Max 30 requests per minute per IP

function checkRateLimit(req) {
  // Use socket remote address directly to prevent IP spoofing via X-Forwarded-For headers
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + WINDOW_MS };
    rateLimitMap.set(ip, record);
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Periodically clean up old entries to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

module.exports = { checkRateLimit };
