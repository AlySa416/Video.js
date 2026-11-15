// Vercel serverless function: lists your Mux assets with the token kept on the server.
// Set MUX_TOKEN_ID and MUX_TOKEN_SECRET (no VITE_ prefix) in Vercel → Settings → Environment Variables.
export default async function handler(req, res) {
  const id = process.env.MUX_TOKEN_ID;
  const secret = process.env.MUX_TOKEN_SECRET;
  if (!id || !secret) {
    res.status(500).json({ error: 'MUX_TOKEN_ID / MUX_TOKEN_SECRET are not set on the server.' });
    return;
  }
  try {
    const upstream = await fetch('https://api.mux.com/video/v1/assets?limit=100', {
      headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}` },
    });
    const body = await upstream.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).json({ error: 'Could not reach Mux.' });
  }
}
