// Private: powers walkinwednesday.net/admin. Needs ADMIN_PASSWORD set in Vercel.
const { ready, ymd, wednesday, redis, body } = require('./_db');
const PAST = 8, FUTURE = 16;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return res.status(500).json({ error: 'Add ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy.' });
  if (req.headers['x-admin-password'] !== pw) return res.status(401).json({ error: 'Wrong password' });
  if (!ready()) return res.status(500).json({ error: 'Database not connected' });
  try {
    if (req.method === 'POST') {
      const { date, on } = body(req);
      if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date || '')) return res.status(400).json({ error: 'Bad date' });
      await redis([['HSET', 'schedule', date, on ? '1' : '0']]);
      return res.status(200).json({ ok: true });
    }
    const weeks = [];
    for (let i = -PAST; i <= FUTURE; i++) weeks.push({ date: ymd(wednesday(i)), offset: i });
    const out = await redis([['MGET', ...weeks.map(w => 'pasta:' + w.date)], ['HGETALL', 'schedule']]);
    const counts = out[0].result || [];
    const flat = out[1].result || [], sched = {};
    for (let i = 0; i < flat.length; i += 2) sched[flat[i]] = flat[i + 1];
    weeks.forEach((w, i) => { w.count = Number(counts[i]) || 0; w.on = sched[w.date] == null ? true : sched[w.date] === '1'; });
    return res.status(200).json({ weeks });
  } catch (e) {
    return res.status(500).json({ error: 'Database error' });
  }
};
