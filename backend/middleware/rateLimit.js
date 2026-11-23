// Small in-memory rate limiter (per IP + route). Good for a single server.
// If you run several server instances, move this to Redis.
const hits = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, v] of hits) if (v.reset < now) hits.delete(key);
}, 60 * 1000).unref();

module.exports = function rateLimit({ windowMs, max, message }) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ success: false, message: message || "Too many attempts. Please wait a few minutes and try again." });
    }
    next();
  };
};