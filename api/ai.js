// Vercel serverless function: POST /api/ai
// Keeps the OpenAI key on the server (env OPENAI_API_KEY). The browser never sees it.
// Optional env: OPENAI_MODEL (default gpt-4o-mini), DEMO_PASSCODE (require header x-demo-passcode).
const MAX_MESSAGES = 20;
const MAX_CHARS = 16000;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const passcode = process.env.DEMO_PASSCODE;
  if (passcode && req.headers["x-demo-passcode"] !== passcode) {
    return res.status(401).json({ error: "Wrong or missing demo passcode (set it in the app's settings)" });
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const messages = body && body.messages;
  const ok = Array.isArray(messages) && messages.length > 0 && messages.length <= MAX_MESSAGES &&
    messages.every(m => m && ["system", "user", "assistant"].includes(m.role) && typeof m.content === "string") &&
    messages.reduce((n, m) => n + m.content.length, 0) <= MAX_CHARS;
  if (!ok) return res.status(400).json({ error: "Bad request" });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
        max_completion_tokens: 400,
        ...(body.json ? { response_format: { type: "json_object" } } : {})
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: (data.error && data.error.message) || "OpenAI error" });
    const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    return res.status(200).json({ content });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach OpenAI" });
  }
};
