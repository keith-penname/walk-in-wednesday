// Shared pasta counter: GET = this week's taps, POST = add one tap (or {undo: n} to take some back)
const { ready, ymd, wednesday, redis, body } = require('./_db');
const KEEP = 60 * 60 * 24 * 400; // keep each week's count for ~a year so it shows in /admin

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!ready()) return res.status(500).json({ error: 'Database not connected' });
  const key = 'pasta:' + ymd(wednesday());
  try {
    if (req.method === 'POST') {
      const undo = Math.max(0, Math.min(1000, parseInt(body(req).undo, 10) || 0));
      if (undo) {
        const out = await redis([['DECRBY', key, undo]]);
        let count = Number(out[0].result) || 0;
        if (count < 0) { await redis([['SET', key, 0, 'EX', KEEP]]); count = 0; }
        return res.status(200).json({ count });
      }
      const out = await redis([['INCR', key], ['EXPIRE', key, KEEP]]);
      return res.status(200).json({ count: Number(out[0].result) || 0 });
    }
    const out = await redis([['GET', key]]);
    return res.status(200).json({ count: Number(out[0].result) || 0 });
  } catch (e) {
    return res.status(500).json({ error: 'Counter unavailable' });
  }
};
