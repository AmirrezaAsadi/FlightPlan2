// Vercel serverless function: POST /api/tts  -> audio/mpeg
// Skye's calm voice. Key stays on the server. Optional env: OPENAI_TTS_MODEL, OPENAI_TTS_VOICE, DEMO_PASSCODE.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const passcode = process.env.DEMO_PASSCODE;
  if (passcode && req.headers["x-demo-passcode"] !== passcode) return res.status(401).json({ error: "Wrong or missing demo passcode" });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const text = body && typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 800) return res.status(400).json({ error: "Bad request" });
  try {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE || "shimmer",
        input: text,
        instructions: "Speak slowly, softly and warmly, like a calm, kind flight attendant reassuring a family. Gentle pauses.",
        response_format: "mp3"
      })
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); return res.status(r.status).json({ error: (d.error && d.error.message) || "OpenAI error" }); }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).json({ error: "Could not reach OpenAI" });
  }
};
