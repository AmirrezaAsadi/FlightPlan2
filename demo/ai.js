// AI layer. Two jobs only:
//   1. translateUpdate: one clinical item -> one plain family sentence + icon (clinician approves before display)
//   2. companionReply:  "Skye", the stay guide, answers family questions ONLY from family-safe facts
// The demo always works without AI (template sentences + scripted answers).
(function () {
  const ALLOWED_ICONS = window.FP_ICON_CHOICES;
  const JARGON = /\b(mL|kg|mg|sats?|SpO2|ACR|AMR|VIS|CT|NC|PO|HR|BP|EF|BNP|ECMO|chylothorax|tacrolimus|milrinone|octreotide|methylpred\w*|ISHLT|POD|arrhythmia|extubat\w*|intubat\w*|inotrope\w*)\b/i;

  function settings() { return window.FP_SETTINGS.get(); }

  function mode() {
    const s = settings();
    if (!s.aiEnabled) return "off";
    if (s.apiKey) return "direct";
    if (/^https?:$/.test(location.protocol)) return "proxy";
    return "off";
  }

  async function call(messages, { json = false } = {}) {
    const s = settings();
    const m = mode();
    if (m === "off") throw new Error("AI is off");
    let res, data;
    if (m === "direct") {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + s.apiKey },
        body: JSON.stringify({
          model: s.model || "gpt-4o-mini", messages, max_completion_tokens: 400,
          ...(json ? { response_format: { type: "json_object" } } : {})
        })
      });
      data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data.error && data.error.message) || "OpenAI error " + res.status);
      return (data.choices && data.choices[0] && data.choices[0].message.content) || "";
    }
    // proxy: Vercel function at /api/ai keeps the key on the server
    res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-passcode": s.passcode || "" },
      body: JSON.stringify({ messages, json })
    });
    data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "AI proxy error " + res.status);
    return data.content || "";
  }

  function parseJSON(s) {
    try { return JSON.parse(s); } catch (e) {
      const m = String(s).match(/\{[\s\S]*\}/);
      if (m) { try { return JSON.parse(m[0]); } catch (e2) { /* fallthrough */ } }
      return null;
    }
  }

  // Deterministic safety check on every AI family sentence (§19.4 rules 4 and 6).
  function checkFamilySentence(text) {
    if (!text || typeof text !== "string") return "empty";
    if (/\d/.test(text)) return "contains numbers";
    if (JARGON.test(text)) return "contains medical shorthand";
    if (text.split(/\s+/).length > 22) return "too long";
    if (/!/.test(text)) return "exclamation mark";
    return null;
  }

  async function translateUpdate(p, item) {
    const sys = [
      "You write ONE short update for a family's in-room screen on a children's heart unit.",
      "Rules: one sentence, at most 18 words, 6th-grade reading level, warm and calm, no exclamation marks.",
      "Use the child's first name. No numbers, units, abbreviations, medicine names, doses, or medical jargon.",
      "Never interpret, predict, diagnose, or add reassurance that is not in the item. Say only what happened.",
      "If it cannot be said safely without numbers or interpretation, return {\"skip\": true, \"why\": \"...\"}.",
      "Pick an icon from exactly this list: " + ALLOWED_ICONS.join(", ") + ".",
      "Return JSON: {\"text\": \"...\", \"icon\": \"...\"}"
    ].join("\n");
    const user = JSON.stringify({
      childFirstName: p.firstName, pronouns: p.pronouns, ageGroup: p.ageGroup,
      clinicalItem: item, timeWindow: "overnight / last 24 hours"
    });
    const out = parseJSON(await call([{ role: "system", content: sys }, { role: "user", content: user }], { json: true }));
    if (!out) throw new Error("AI reply was not readable");
    if (out.skip) return { skip: true, why: out.why || "AI chose not to word this for families." };
    const problem = checkFamilySentence(out.text);
    if (problem) return { blocked: true, why: "AI draft failed the safety check (" + problem + "): “" + out.text + "”" };
    return { text: out.text.trim(), icon: ALLOWED_ICONS.includes(out.icon) ? out.icon : "star" };
  }

  const EMERGENCY = /\b(not breathing|can'?t breathe|turning blue|blue lips|seizure|unresponsive|won'?t wake|bleeding|emergency|dying|chest pain|passed out|faint)/i;

  async function companionReply(facts, history) {
    const sys = [
      "You are Skye, a warm, calm guide on a family's in-room screen in a children's heart hospital.",
      "Think of a kind flight attendant: welcoming, steady, reassuring in manner, honest in content. You are NOT a doctor or nurse.",
      "Answer ONLY from FACTS below. If the answer is not in FACTS, say you don't know and that the nurse or care team can tell them, and offer to save the question for the team.",
      "Never: give medical advice, interpret results or numbers, diagnose, predict outcomes, talk about medicine doses, name infections, compare with other children, or promise a date. The going-home date is only an estimate.",
      "If someone is worried or upset: name the feeling, be gentle, remind them the team is close by, and offer one small next step.",
      "Style: 1-3 short sentences, at most 60 words, everyday words, no lists, no exclamation marks, no emojis.",
      "FACTS (family-safe, approved for this screen):",
      JSON.stringify(facts)
    ].join("\n");
    const msgs = [{ role: "system", content: sys }].concat(history.slice(-8).map(m => ({ role: m.role, content: m.text })));
    let text = (await call(msgs)).trim();
    if (/\d+\s?(mg|mL|ml|mcg|units?)\b/i.test(text)) {
      text = "I'm not able to talk about medicine amounts. Your nurse can go over that with you anytime.";
    }
    return text;
  }

  window.FP_AI = { mode, call, translateUpdate, companionReply, checkFamilySentence, EMERGENCY };
})();
