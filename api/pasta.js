// Shared pasta counter. Needs an Upstash Redis database connected in Vercel (Storage tab).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// One count per week. The week rolls over on Thursday (Richmond time).
function weekKey() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  now.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7));
  return 'pasta:' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
}

async function redis(commands) {
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands)
  });
  return r.json();
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Database not connected' });
  const key = weekKey();
  try {
    if (req.method === 'POST') {
      const out = await redis([['INCR', key], ['EXPIRE', key, 864000]]);
      return res.status(200).json({ count: Number(out[0].result) || 0 });
    }
    const out = await redis([['GET', key]]);
    return res.status(200).json({ count: Number(out[0].result) || 0 });
  } catch (e) {
    return res.status(500).json({ error: 'Counter unavailable' });
  }
};
