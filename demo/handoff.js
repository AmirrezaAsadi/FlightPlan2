/* Handoff Flight Plan (Widget-UI-Element.md, Widget 4; InteractionPlan §8).
   Suggest -> modify (sender) -> replay & acknowledge (receiver) -> complete. Hard stop until everything is acknowledged. */
(function () {
  const A = () => window.FP_APP;
  const VIEWS = (window.FP_VIEWS = window.FP_VIEWS || {});
  let playTimer = 0;

  function senderDefault(p) {
    const f = p.careTeam.find(c => c.role === "Cardiology fellow") || p.careTeam[0];
    return f ? `${f.name} (${f.role})` : "Day team";
  }
  function ho(p) {
    const st = A().state;
    st.handoff = st.handoff || {};
    if (!st.handoff[p.id]) st.handoff[p.id] = { stage: "build", removed: {}, added: {}, ack: {}, familyNone: false, sender: senderDefault(p), receiver: "Night cardiology fellow", summary: null, summarySource: "template", completedAt: null };
    return st.handoff[p.id];
  }

  // Rule-based suggestion (explainable): setbacks, procedures, medicine/therapy changes, new results, what changed, open loops.
  function candidates(p) {
    const { cap, D, fmtShort, fmtTime } = A();
    const items = [];
    p.events.forEach(e => {
      let reason = null;
      if (e.kind === "setback") reason = "Setback";
      else if (e.kind === "result" && e.new24h) reason = "New result";
      else if (e.kind === "therapy" || /inotrope|steroid|milrinone|diet|formula/i.test(e.title)) reason = "Medicine / therapy change";
      else if (e.kind === "procedure") reason = "Procedure";
      else if (e.new24h) reason = "Last 24 hours";
      items.push({ id: e.id, at: e.at, title: e.title, detail: e.shorthand, reason, suggested: !!reason, group: "event" });
    });
    p.whatChanged.forEach(w => items.push({ id: w.id, at: D.now, title: w.category === "overnight" ? "Overnight" : cap(w.category), detail: w.item, reason: "What changed", suggested: true, group: "changed" }));
    p.actions.filter(a => a.status === "open" || a.type === "decision" || a.type === "contingency").forEach(a => items.push({
      id: a.id, at: a.due || D.now, title: cap(a.type.replace("_", " ")),
      detail: `${a.text} · ${a.owner}${a.due ? " · due " + fmtShort(a.due) + " " + fmtTime(a.due) : ""}`,
      reason: a.type === "decision" ? "Decision" : "Open loop", suggested: true, group: "action"
    }));
    ((A().state.questions || {})[p.id] || []).forEach((q, i) => { if (!q.answered) items.push({ id: "Q" + i, at: q.at, title: "Family question (saved with Skye)", detail: "“" + q.text + "”", reason: "Open loop", suggested: true, group: "question" }); });
    return items;
  }
  const included = (p, h) => candidates(p).filter(c => (c.suggested && !h.removed[c.id]) || h.added[c.id]).sort((a, b) => new Date(a.at) - new Date(b.at));

  function safety(p) {
    const sn = p.snapshot;
    const cont = p.actions.filter(a => a.type === "contingency").map(a => a.text);
    return [
      { id: "S-weight", label: "Weight (for dosing)", value: p.weightKg + " kg" },
      { id: "S-allergy", label: "Allergies", value: "Not in the record we have. Confirm out loud.", missing: true },
      { id: "S-code", label: "Code status", value: "Not in the record we have. Confirm out loud.", missing: true },
      { id: "S-cc", label: "CrossCheck", value: p.crosscheck ? "Flagged vulnerable before major procedures" : "Not flagged" },
      { id: "S-course", label: "Course correction", value: sn.threshold || "No thresholds set" },
      { id: "S-cont", label: "Contingencies", value: cont.length ? cont.join(" · ") : "None recorded" },
      { id: "S-path", label: "Trajectory", value: `Day ${p.dayOfStay}${p.pod != null ? " · POD " + p.pod : ""} · ${p.location} · ${sn.onTrack === "behind" ? "behind pathway" : "on track with pathway"}` }
    ];
  }
  function familyTold(p) { return p.actions.filter(a => a.type === "family_update").map(a => a.text); }
  function templateSummary(p) {
    const sn = p.snapshot;
    return `${p.age}, ${p.diagnoses.join("; ")}. Day ${p.dayOfStay}${p.pod != null ? ", POD " + p.pod : ""}, ${p.location}, ${sn.onTrack === "behind" ? "behind pathway" : "on track"}. Active: ${sn.activeConcerns.join(", ") || "none listed"}.`;
  }
  function ackTargets(p, h) {
    return [...safety(p).map(s => s.id), ...included(p, h).map(i => i.id), "F-family"];
  }

  /* ---------- views ---------- */
  function stepper(stage) {
    const steps = [["build", "1 · Suggest & edit"], ["replay", "2 · Replay & acknowledge"], ["done", "3 · Complete"]];
    const idx = steps.findIndex(s => s[0] === stage);
    return `<ol class="stepper">${steps.map(([k, t], i) => `<li class="${i < idx ? "past" : i === idx ? "cur" : ""}">${t}</li>`).join("")}</ol>`;
  }

  VIEWS.handoff = function (p) {
    const { esc, icon } = A();
    const h = ho(p);
    if (!h.summary) h.summary = templateSummary(p);
    const head = `<header class="team-head">
        <div><p class="mono">HANDOFF FLIGHT PLAN</p><h1>${esc(p.displayLabel)} <span class="muted">· ${esc(p.age)} · ${esc(p.room)}</span></h1></div>
        ${stepper(h.stage)}
      </header>`;
    if (h.stage === "replay") return `<main class="team ho">${head}${replayView(p, h)}</main>`;
    if (h.stage === "done") return `<main class="team ho">${head}${doneView(p, h)}</main>`;

    const all = candidates(p);
    const inc = included(p, h);
    const removed = all.filter(c => c.suggested && h.removed[c.id]);
    const others = all.filter(c => !c.suggested && !h.added[c.id]);
    const told = familyTold(p);
    const familyOk = told.length || h.familyNone;
    const aiOn = window.FP_AI.mode() !== "off";
    return `<main class="team ho">${head}
      <div class="ho-who card">
        <label>From <input data-act="ho-field" data-f="sender" value="${esc(h.sender)}"></label>
        <span class="ho-arrow">${icon("plane")}</span>
        <label>To <input data-act="ho-field" data-f="receiver" value="${esc(h.receiver)}"></label>
      </div>
      <div class="team-grid">
        <section class="card">
          <p class="eyebrow">Patient summary <span class="src">${h.summarySource === "ai" ? "AI draft · check it" : "from the record"}</span></p>
          <textarea class="ho-sum" data-act="ho-field" data-f="summary" rows="3">${esc(h.summary)}</textarea>
          <div class="q-btns"><button class="btn small ghost" data-act="ho-ai" ${aiOn ? "" : 'disabled title="Turn on AI in settings"'}>${icon("sparkle")} Draft with AI</button>
            <button class="btn small ghost" data-act="ho-reset-sum">Reset to record</button></div>
        </section>
        <section class="card">
          <p class="eyebrow">${icon("shield")} Safety-critical <span class="src">always included</span></p>
          <ul class="ho-safe">${safety(p).map(s => `<li class="${s.missing ? "missing" : ""}"><span class="k">${esc(s.label)}</span><span>${s.missing ? icon("info") + " " : ""}${esc(s.value)}</span></li>`).join("")}</ul>
        </section>
        <section class="card">
          <p class="eyebrow">${icon("sparkle")} Suggested highlight reel <span class="src">${inc.length} items · tap × to remove</span></p>
          <ul class="ho-list">${inc.map(c => itemRow(c, "remove")).join("")}</ul>
          ${removed.length ? `<p class="k" style="margin-top:12px">Removed</p><ul class="ho-list faded">${removed.map(c => itemRow(c, "restore")).join("")}</ul>` : ""}
        </section>
        <div class="stack">
          <section class="card">
            <p class="eyebrow">${icon("clock")} Add from the timeline</p>
            ${others.length ? `<ul class="ho-list">${others.map(c => itemRow(c, "add")).join("")}</ul>` : '<p class="muted">Everything on the timeline is already in the reel.</p>'}
          </section>
          <section class="card">
            <p class="eyebrow">${icon("people")} Family</p>
            <p class="k">What the family has been told</p>
            ${told.length ? `<ul class="ho-told">${told.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : `<label class="ho-none"><input type="checkbox" data-act="ho-none" ${h.familyNone ? "checked" : ""}> Nothing was communicated to the family this shift</label>`}
          </section>
        </div>
      </div>
      <div class="ho-foot">
        ${familyOk ? "" : `<p class="warn-line">${icon("info")} Fill in what the family has been told, or confirm that nothing was communicated.</p>`}
        <button class="btn" data-act="ho-send" ${familyOk && h.summary.trim() ? "" : "disabled"}>Send to ${esc(h.receiver)} ${icon("send")}</button>
      </div>
    </main>`;
  };

  function itemRow(c, mode) {
    const { esc, icon, fmtShort, fmtTime } = A();
    const btn = mode === "remove" ? `<button class="icon-btn sm" data-act="ho-remove" data-id="${c.id}" aria-label="Remove">${icon("x")}</button>`
      : mode === "restore" ? `<button class="btn small ghost" data-act="ho-restore" data-id="${c.id}">Restore</button>`
      : `<button class="btn small ghost" data-act="ho-add" data-id="${c.id}">+ Add</button>`;
    return `<li>${c.reason ? `<span class="tag ${/Setback|Open loop|New result/.test(c.reason) ? "warn" : ""}">${esc(c.reason)}</span>` : `<span class="tag">${esc(fmtShort(c.at))}</span>`}
      <span><b>${esc(c.title)}</b><small>${esc(c.detail)}</small><small class="muted">${esc(fmtShort(c.at))} ${esc(fmtTime(c.at))}</small></span>${btn}</li>`;
  }

  function replayView(p, h) {
    const { esc, icon, fmtShort, fmtTime } = A();
    const targets = ackTargets(p, h);
    const done = targets.filter(id => h.ack[id]).length;
    const left = targets.length - done;
    const C = 2 * Math.PI * 18;
    const told = familyTold(p);
    const node = (id, title, body, meta, cls = "") => `<li class="reel-node ${cls} ${h.ack[id] ? "acked" : ""}" data-node="${id}">
        <span class="reel-dot"></span>
        <div class="reel-card"><p class="reel-meta mono">${meta}</p><p class="reel-title">${title}</p>${body ? `<p class="reel-body">${body}</p>` : ""}</div>
        <button class="ack ${h.ack[id] ? "on" : ""}" data-act="ho-ack" data-id="${id}" aria-pressed="${!!h.ack[id]}">${icon("check")}<span>${h.ack[id] ? "Acknowledged" : "Acknowledge"}</span></button>
      </li>`;
    return `
      <div class="ho-replay-head card">
        <div class="ring-row"><svg class="ring big" viewBox="0 0 44 44" aria-hidden="true"><circle class="r-bg" cx="22" cy="22" r="18"/><circle class="r-fg" cx="22" cy="22" r="18" stroke-dasharray="${(C * done / targets.length).toFixed(1)} ${C.toFixed(1)}"/></svg>
          <div><p class="reel-count">${done} / ${targets.length}</p><p class="muted">acknowledged by ${esc(h.receiver)}</p></div></div>
        <p class="ho-sum-read">${esc(h.summary)}</p>
        <div class="q-btns"><button class="btn ghost small" data-act="ho-play">${icon("plane")} Play the reel</button><button class="btn ghost small" data-act="ho-back">← Back to edit</button></div>
      </div>
      <ol class="reel">
        <li class="reel-sep mono">SAFETY-CRITICAL · PINNED</li>
        ${safety(p).map(s => node(s.id, esc(s.label), (s.missing ? icon("info") + " " : "") + esc(s.value), "ALWAYS INCLUDED", s.missing ? "missing" : "")).join("")}
        <li class="reel-sep mono">THE STAY · IN ORDER</li>
        ${included(p, h).map(c => node(c.id, esc(c.title), esc(c.detail), `${esc(fmtShort(c.at).toUpperCase())} ${esc(fmtTime(c.at))}${c.reason ? " · " + esc(c.reason.toUpperCase()) : ""}`, /Setback|Open loop|New result/.test(c.reason || "") ? "warm" : "")).join("")}
        <li class="reel-sep mono">FAMILY</li>
        ${node("F-family", "What the family has been told", told.length ? told.map(esc).join(" · ") : "Nothing communicated this shift (confirmed by sender).", "REQUIRED")}
      </ol>
      <div class="ho-foot">
        ${left ? `<p class="warn-line">${icon("lock")} ${left} item${left > 1 ? "s" : ""} still to acknowledge. The handoff can’t close until every item is checked.</p>` : `<p class="ok-line">${icon("check")} Everything acknowledged.</p>`}
        <button class="btn" data-act="ho-complete" ${left ? "disabled" : ""}>${icon("check")} Complete handoff</button>
      </div>`;
  }

  function doneView(p, h) {
    const { esc, icon, fmtShort, fmtTime } = A();
    const n = ackTargets(p, h).length;
    return `<section class="card ho-done">
        <p class="ho-done-ic">${icon("check")}</p>
        <h2>Handoff complete</h2>
        <p>${esc(h.sender)} → ${esc(h.receiver)}</p>
        <p class="muted">${esc(fmtShort(h.completedAt))} ${esc(fmtTime(h.completedAt))} · ${n} items acknowledged · logged</p>
        <p class="ho-sum-read">${esc(h.summary)}</p>
        <button class="btn ghost" data-act="ho-new">Start a new handoff</button>
      </section>`;
  }

  function stopPlay() { clearInterval(playTimer); playTimer = 0; document.querySelectorAll(".reel-node.playing").forEach(n => n.classList.remove("playing")); }

  /* ---------- events ---------- */
  document.addEventListener("click", async e => {
    const el = e.target.closest("[data-act^='ho-']"); if (!el) return;
    const app = A(); const p = app.D.patients[app.state.patientId]; const h = ho(p);
    const id = el.dataset.id;
    switch (el.dataset.act) {
      case "ho-remove": h.removed[id] = true; delete h.added[id]; return app.commit();
      case "ho-restore": delete h.removed[id]; return app.commit();
      case "ho-add": h.added[id] = true; return app.commit();
      case "ho-none": h.familyNone = el.checked; return app.commit();
      case "ho-reset-sum": h.summary = templateSummary(p); h.summarySource = "template"; return app.commit();
      case "ho-send": h.stage = "replay"; h.ack = {}; app.toast("Sent. The receiver now replays and acknowledges each item."); return app.commit();
      case "ho-back": stopPlay(); h.stage = "build"; return app.commit();
      case "ho-ack": h.ack[id] = !h.ack[id]; app.commit(); { const n = document.querySelector(`[data-node="${id}"]`); if (n && h.ack[id]) n.classList.add("just"); } return;
      case "ho-complete": {
        const left = ackTargets(p, h).filter(x => !h.ack[x]);
        if (left.length) { app.toast("Hard stop: acknowledge every item first."); return; }
        stopPlay(); h.stage = "done"; h.completedAt = new Date().toISOString(); return app.commit();
      }
      case "ho-new": delete app.state.handoff[p.id]; return app.commit();
      case "ho-play": {
        if (playTimer) { stopPlay(); return; }
        const nodes = [...document.querySelectorAll(".reel-node")];
        let i = 0;
        const step = () => {
          nodes.forEach(n => n.classList.remove("playing"));
          if (i >= nodes.length) { stopPlay(); return; }
          nodes[i].classList.add("playing"); nodes[i].scrollIntoView({ behavior: "smooth", block: "center" }); i++;
        };
        step(); playTimer = setInterval(step, 2600); return;
      }
      case "ho-ai": {
        el.disabled = true; el.textContent = "Writing…";
        try {
          const facts = { age: p.age, diagnoses: p.diagnoses, dayOfStay: p.dayOfStay, pod: p.pod, location: p.location, pathway: p.snapshot.onTrack, concerns: p.snapshot.activeConcerns, reel: included(p, h).map(c => c.title + ": " + c.detail) };
          const out = await window.FP_AI.call([
            { role: "system", content: "Write a clinician-to-clinician handoff patient summary (I-PASS style) in 1-2 sentences, at most 45 words. Clinical shorthand is fine. Use only the facts given. No recommendations, no predictions." },
            { role: "user", content: JSON.stringify(facts) }]);
          if (out && out.trim()) { h.summary = out.trim(); h.summarySource = "ai"; }
        } catch (err) { app.toast("AI: " + err.message); }
        return app.commit();
      }
    }
  });
  document.addEventListener("input", e => {
    if (e.target.dataset.act !== "ho-field") return;
    const app = A(); const h = ho(app.D.patients[app.state.patientId]);
    h[e.target.dataset.f] = e.target.value;
    if (e.target.dataset.f === "summary") h.summarySource = "edited";
    app.commit(false);
  });
  document.addEventListener("change", e => {
    if (e.target.dataset.act === "ho-field") A().commit(); // refresh button labels (receiver name)
  });
})();
