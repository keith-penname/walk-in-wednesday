// Public: is this Wednesday on or off? Weeks you haven't set are ON.
const { ready, ymd, wednesday, redis } = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!ready()) return res.status(500).json({ error: 'Database not connected' });
  const date = ymd(wednesday());
  try {
    const out = await redis([['HGET', 'schedule', date]]);
    const v = out[0].result;
    return res.status(200).json({ date, on: v == null ? true : v === '1' });
  } catch (e) {
    return res.status(500).json({ error: 'Schedule unavailable' });
  }
};
