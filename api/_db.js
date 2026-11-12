// Shared helpers for the API (files starting with _ are not public pages)
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const ymd = d => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

// The upcoming Wednesday in Richmond time (today if it's Wednesday). Rolls over on Thursday.
function wednesday(offsetWeeks = 0) {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7) + offsetWeeks * 7);
  return d;
}

async function redis(commands) {
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands)
  });
  return r.json();
}

function body(req) {
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b;
}

module.exports = { ready: () => !!(URL_ && TOKEN), ymd, wednesday, redis, body };
