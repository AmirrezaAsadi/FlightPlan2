/* Conference room view: weekly FlightPlan conference (Performance Rounds).
   Widget-UI-Element.md: Pathway Variance Plot + Outcome & Ratings Heatmap. InteractionPlan §9.4: capture decisions
   and action items with owners during the meeting; draft a family summary that a clinician must review.
   Ratings and outcome dots live here only — never in family views (§7, §10.2). */
(function () {
  const A = () => window.FP_APP;
  const VIEWS = (window.FP_VIEWS = window.FP_VIEWS || {});
  const ROWS = [["Procedure", 5], ["Intubated", 4], ["Extubated", 3], ["ACCU", 2], ["Home", 1]];
  const DOT = { green: "green outcome", yellow: "yellow outcome", red: "red outcome" };

  function conf() {
    const st = A().state;
    st.conf = st.conf || { stay: null, event: null, decisions: {}, summaries: {} };
    st.conf.decisions = st.conf.decisions || {}; st.conf.summaries = st.conf.summaries || {};
    return st.conf;
  }
  function stays() { return A().D.stays; }
  function homeOffset(s) { const h = s.pathway.find(x => x.row === "Discharged"); return h ? h.dayOffset : null; }
  function variance(s) {
    const { NOW, DAY } = A();
    const end = s.discharge ? new Date(s.discharge) : NOW;
    const actual = (end - new Date(s.admit)) / DAY;
    const h = homeOffset(s);
    if (h == null) return { text: "No pathway", cls: "" };
    const diff = Math.round(actual - h);
    if (s.discharge) return diff > 0 ? { text: `Home +${diff} day${diff > 1 ? "s" : ""} vs pathway`, cls: "warm" } : diff < 0 ? { text: `Home ${-diff} day${diff < -1 ? "s" : ""} early`, cls: "ok" } : { text: "Home on pathway", cls: "ok" };
    return actual > h ? { text: `Still in · +${Math.ceil(actual - h)} days vs pathway`, cls: "warm" } : { text: "Inpatient · on track", cls: "ok" };
  }
  const short = s => (s.procedures[0] || {}).procedure || s.admitReason;

  /* ---------- Pathway Variance Plot with compressed quiet stretches ---------- */
  function plot(s, selected) {
    const { esc, NOW, DAY, midnight, LOC } = A();
    const W = 1400, H = 330, L = 110, R = 40, T = 44, B = 52, GAP = 0.8;
    const t0 = midnight(s.admit).getTime();
    const end = s.discharge ? new Date(s.discharge).getTime() : NOW.getTime();
    const h = homeOffset(s);
    const endOff = Math.max((end - t0) / DAY, h != null ? (new Date(s.admit).getTime() - t0) / DAY + h : 0) + 0.6;
    const comp = s.compressed.map(c => [c.from - 1, c.to]);
    const warp = d => { let o = d; comp.forEach(([a, b]) => { if (d >= b) o -= (b - a) - GAP; else if (d > a) o -= (d - a) - GAP * (d - a) / (b - a); }); return o; };
    const total = warp(endOff);
    const x = t => L + warp((new Date(t).getTime() - t0) / DAY) / total * (W - L - R);
    const xo = d => L + warp(d) / total * (W - L - R);
    const y = lvl => T + (5 - lvl) * (H - T - B) / 4;
    let g = `<svg class="vplot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pathway variance plot: actual course (solid) against expected pathway (dashed)">
      <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" style="stroke: rgba(var(--cy-rgb), .3)" stroke-width="2"/></pattern></defs>`;
    ROWS.forEach(([lab, l]) => { g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(l)}" y2="${y(l)}"/><text class="rowlab" x="${L - 12}" y="${y(l) + 4}" text-anchor="end">${lab}</text>`; });
    const nDays = Math.ceil(endOff);
    for (let d = 1; d <= nDays; d++) {
      if (comp.some(([a, b]) => d - 1 >= a && d <= b)) continue;
      const step = (W - L - R) / total < 30 ? 2 : 1;
      if ((d - 1) % step) continue;
      g += `<text class="tick" x="${xo(d - 0.5)}" y="${H - 18}" text-anchor="middle">D${d}</text>`;
    }
    comp.forEach(([a, b]) => {
      const cx = xo(a) + (xo(b) - xo(a)) / 2;
      let z = `M${cx},${T - 10}`; for (let yy = T - 10, k = 0; yy < H - B + 6; yy += 10, k++) z += `L${cx + (k % 2 ? -6 : 6)},${yy + 10}`;
      g += `<path class="zig" d="${z}"/><text class="tick" x="${cx}" y="${H - 18}" text-anchor="middle">D${a + 1}–${b}</text><text class="tick dim" x="${cx}" y="${H - 4}" text-anchor="middle">quiet</text>`;
    });
    // ECMO shading (pattern + label, not color alone)
    s.segments.forEach(sg => { if (sg.shading) { const xs = x(sg.start), xe = x(sg.end); g += `<rect x="${xs}" y="${T - 6}" width="${Math.max(xe - xs, 4)}" height="${H - T - B + 12}" fill="url(#hatch)" opacity=".55"/><text class="shade-lab" x="${(xs + xe) / 2}" y="${T - 12}" text-anchor="middle">${esc(sg.shading)}</text>`; } });
    // pathway (dashed)
    const admitT = new Date(s.admit).getTime();
    let dp = "";
    s.pathway.forEach((pt, i) => { const tx = x(admitT + pt.dayOffset * DAY), ty = y(pt.level); dp += i ? `V${ty}` : `M${tx},${ty}`; const nx = s.pathway[i + 1]; dp += `H${nx ? x(admitT + nx.dayOffset * DAY) : W - R}`; });
    g += `<path class="pathway" d="${dp}"/>`;
    // actual course
    s.segments.forEach((sg, i) => {
      const xs = x(sg.start), xe = x(Math.min(new Date(sg.end).getTime(), end));
      if (i > 0) g += `<line class="conn" x1="${xs}" x2="${xs}" y1="${y(s.segments[i - 1].level)}" y2="${y(sg.level)}"/>`;
      if (sg.row === "Discharged") return;
      g += `<line class="seg" x1="${xs}" x2="${Math.max(xe, xs + 4)}" y1="${y(sg.level)}" y2="${y(sg.level)}" stroke="${sg.color}"/>`;
      if (xe - xs > 50) g += `<text class="seglab" x="${(xs + xe) / 2}" y="${y(sg.level) - 12}" text-anchor="middle" fill="${sg.color}">${esc((LOC[sg.location] || {}).short || sg.location)}</text>`;
    });
    if (!s.discharge) g += `<line class="now" x1="${x(NOW)}" x2="${x(NOW)}" y1="${T - 24}" y2="${H - B}"/><text class="nowlab" x="${x(NOW)}" y="${T - 28}" text-anchor="middle">Now · Day ${s.dayOfStay}</text>`;
    // numbered event markers (semantic zoom: tap to open the callout; nothing overlaps on the plot)
    s.events.forEach((e, i) => {
      const t = new Date(e.at).getTime();
      const sg = s.segments.find(q => t >= new Date(q.start).getTime() && t < new Date(q.end).getTime()) || s.segments[s.segments.length - 1];
      const ex = x(t), ey = y(sg.level);
      g += `<g class="cev ${e.kind === "setback" ? "setback" : ""} ${selected === e.id ? "sel" : ""}" data-act="cf-event" data-id="${e.id}" tabindex="0" role="button" aria-label="${i + 1}. ${esc(e.title)}">
        <circle class="hit" cx="${ex}" cy="${ey}" r="18"/><circle class="m" cx="${ex}" cy="${ey}" r="11"/><text x="${ex}" y="${ey + 4}" text-anchor="middle">${i + 1}</text></g>`;
    });
    return g + "</svg>";
  }

  function callout(s, id) {
    const { esc, fmtShort, fmtTime } = A();
    const i = s.events.findIndex(e => e.id === id);
    if (i < 0) return `<p class="muted small cf-hint">Tap a numbered marker to open its callout. Setbacks are ringed in amber.</p>`;
    const e = s.events[i];
    return `<div class="cf-callout"><span class="cf-num">${i + 1}</span>
      <div><p><b>${esc(e.title)}</b> <span class="tag ${e.kind === "setback" ? "warn" : ""}">${esc(e.kind)}</span></p>
      <p class="mono">${esc(fmtShort(e.at).toUpperCase())} ${esc(fmtTime(e.at))} · DAY ${e.day}${e.pod != null ? " · POD " + e.pod : ""}</p>
      <p class="cf-sh">${esc(e.shorthand)}</p><p class="muted small">Family wording: ${esc(e.familyText)}</p></div>
      <button class="btn small ghost" data-act="cf-link" data-id="${e.id}">Link a decision</button></div>`;
  }

  /* ---------- Outcome & Ratings Heatmap ---------- */
  function heatmap(sel) {
    const { esc } = A();
    const cols = [["Procedure", ["Operating room", "Cath lab"]], ["CICU", ["CICU"]], ["ACCU", ["ACCU"]]];
    return `<div class="heat-wrap"><table class="heat"><thead><tr><th></th>${cols.map(c => `<th>${c[0]}</th>`).join("")}</tr></thead><tbody>
      ${stays().map(s => `<tr class="${s.id === sel ? "sel" : ""}" data-act="cf-stay" data-id="${s.id}">
        <th>${esc(s.label)}${s.directFlight ? ' <span class="df">DF</span>' : ""}</th>
        ${cols.map(([, names]) => { const r = s.ratings.filter(x => names.includes(x.phase)); if (!r.length) return `<td class="na">—</td>`;
          return `<td>${r.map(x => `<div class="cell" style="--a:${(0.05 + x.score * 0.08).toFixed(2)}"><b>${x.score}</b><span>${esc(x.meaning)}${names.length > 1 ? " · " + (x.phase === "Cath lab" ? "cath" : "OR") : ""}</span><i class="od ${x.dot}" title="${esc(DOT[x.dot] || x.dot)}"></i><small>${esc(DOT[x.dot] || x.dot)}</small></div>`).join("")}</td>`; }).join("")}
      </tr>`).join("")}</tbody></table></div>`;
  }

  VIEWS.conference = function () {
    const { esc, icon, fmtShort, fmtDate } = A();
    const c = conf();
    const all = stays();
    const discussed = all.filter(s => !s.directFlight);
    const direct = all.filter(s => s.directFlight);
    const s = all.find(x => x.id === c.stay) || discussed[0];
    c.stay = s.id;
    const v = variance(s);
    const decisions = c.decisions[s.stayId] || [];
    const summary = c.summaries[s.stayId];
    const owners = s.careTeam;
    const lastConf = all.flatMap(x => x.conferences.map(k => k.date)).sort().pop();
    const card = x => { const vv = variance(x); return `<button class="cf-case ${x.id === s.id ? "sel" : ""}" data-act="cf-stay" data-id="${x.id}">
        <span class="cf-case-top"><b>${esc(x.label)}</b><span class="muted">${esc(x.age)}</span></span>
        <span class="cf-case-proc">${esc(short(x))}</span>
        <span class="tag ${vv.cls === "warm" ? "warn" : "ok"}">${esc(vv.text)}</span>
        <span class="dots">${x.ratings.map(r => `<i class="od ${r.dot}" title="${esc(r.phase)}: ${esc(DOT[r.dot])}"></i>`).join("")}</span></button>`; };
    return `<main class="conf">
      <header class="conf-head">
        <div><p class="mono">FLIGHTPLAN CONFERENCE · PERFORMANCE ROUNDS</p><h1>${esc(fmtDate(lastConf + "T12:00:00", { weekday: "long", month: "long", day: "numeric" }))}</h1></div>
        <p class="conf-motto">Blameless, but accountable. <span class="muted">Ratings are for review only and never shown to families.</span></p>
      </header>
      <div class="conf-grid">
        <aside class="conf-agenda">
          <p class="mono">DISCUSSED CASES · ${discussed.length}</p>
          ${discussed.map(card).join("")}
          <p class="mono" style="margin-top:18px">DIRECT FLIGHTS · ${direct.length}</p>
          <p class="muted small">No unplanned events, all green. Grouped together.</p>
          <div class="df-row">${direct.map(x => `<button class="df-chip ${x.id === s.id ? "sel" : ""}" data-act="cf-stay" data-id="${x.id}">${icon("check")} ${esc(x.label)} <span class="muted">${esc(x.age)}</span></button>`).join("")}</div>
        </aside>

        <div class="conf-main">
          <section class="card">
            <div class="cf-case-head">
              <div><h2>${esc(s.label)} <span class="muted">· ${esc(s.age)} · ${esc(short(s))}</span></h2>
                <p class="muted">${esc(s.diagnoses.join(" · "))}</p></div>
              <div class="cf-facts">
                <span class="tag ${v.cls === "warm" ? "warn" : "ok"}">${esc(v.text)}</span>
                <span class="tag">${s.discharge ? "Discharged " + esc(fmtShort(s.discharge)) : "Inpatient · day " + s.dayOfStay}</span>
                <span class="tag">Discussed ${s.conferences.length}×</span>
                ${s.directFlight ? `<span class="tag ok">${icon("check")} Direct Flight</span>` : ""}
              </div>
            </div>
            ${s.threshold ? `<p class="cf-cc"><span class="k">Course correction</span> ${esc(s.threshold)}</p>` : ""}
            ${plot(s, c.event)}
            ${callout(s, c.event)}
          </section>

          <div class="team-grid">
            <section class="card">
              <p class="eyebrow">${icon("star")} Outcome &amp; ratings <span class="src">team score 1–4 · outcome dot · review only</span></p>
              ${heatmap(s.id)}
            </section>
            <div class="stack">
              <section class="card">
                <p class="eyebrow">${icon("clipboard")} Decisions &amp; actions <span class="src">captured in the meeting</span></p>
                <form class="cf-form" data-act="cf-add">
                  <div class="cf-form-row">
                    <select name="type" aria-label="Type"><option>Decision</option><option>Action item</option><option>Follow-up</option><option>Learning</option></select>
                    <select name="owner" aria-label="Owner">${owners.map(o => `<option value="${esc(o.role)} — ${esc(o.name)}">${esc(o.role)} — ${esc(o.name)}</option>`).join("")}</select>
                  </div>
                  <input name="text" placeholder="What was decided or needs doing?" aria-label="Decision or action" autocomplete="off">
                  <div class="cf-form-row">
                    <select name="event" aria-label="Linked event"><option value="">Link to an event (optional)</option>${s.events.map((e, i) => `<option value="${e.id}" ${c.event === e.id ? "selected" : ""}>${i + 1}. ${esc(e.title)}</option>`).join("")}</select>
                    <input name="due" type="date" aria-label="Due date">
                    <button class="btn small">${icon("check")} Capture</button>
                  </div>
                </form>
                ${decisions.length ? `<ul class="acts">${decisions.map((d, i) => { const ei = s.events.findIndex(e => e.id === d.event); return `<li><span class="tag ${d.type === "Decision" ? "ok" : ""}">${esc(d.type)}</span><span>${esc(d.text)}</span>
                  <span class="muted">${esc(d.owner)}${d.due ? " · due " + esc(fmtShort(d.due + "T12:00:00")) : ""}${ei >= 0 ? ` · <button class="link-in" data-act="cf-event" data-id="${d.event}">#${ei + 1} ${esc(s.events[ei].title)}</button>` : ""}</span>
                  <button class="btn small ghost" data-act="cf-del" data-i="${i}">Remove</button></li>`; }).join("")}</ul>` : '<p class="muted small">Nothing captured yet. Decisions made here are captured nowhere else today.</p>'}
              </section>
              <section class="card">
                <p class="eyebrow">${icon("people")} After the meeting <span class="src">family summary</span></p>
                ${summary ? `<p class="cf-summary">${esc(summary.text)}</p>
                  <p class="small ${summary.status === "approved" ? "ok-line" : "warn-line"}">${summary.status === "approved" ? icon("check") + " Approved by a clinician for the family" : icon("lock") + " Needs clinician review before the family sees it"}${summary.source === "ai" ? " · AI draft" : " · template"}</p>
                  <div class="q-btns">${summary.status !== "approved" ? `<button class="btn small" data-act="cf-approve">${icon("check")} Approve</button>` : ""}<button class="btn small ghost" data-act="cf-summary">Redraft</button></div>`
                  : `<p class="muted small">Turn the captured decisions into a plain-language note for the family. No ratings, no blame, no durations.</p>
                  <button class="btn small ghost" data-act="cf-summary" ${decisions.length ? "" : "disabled"}>${icon("sparkle")} Draft family summary</button>`}
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>`;
  };

  /* ---------- events ---------- */
  document.addEventListener("click", async e => {
    const el = e.target.closest("[data-act^='cf-']"); if (!el || el.tagName === "FORM") return;
    const app = A(); const c = conf();
    const s = stays().find(x => x.id === c.stay);
    switch (el.dataset.act) {
      case "cf-stay": c.stay = el.dataset.id; c.event = null; return app.commit();
      case "cf-event": c.event = c.event === el.dataset.id ? null : el.dataset.id; return app.commit();
      case "cf-link": { c.event = el.dataset.id; app.commit(); const t = document.querySelector(".cf-form input[name=text]"); if (t) { t.focus(); t.scrollIntoView({ behavior: "smooth", block: "center" }); } return; }
      case "cf-del": (c.decisions[s.stayId] || []).splice(+el.dataset.i, 1); return app.commit();
      case "cf-approve": if (c.summaries[s.stayId]) c.summaries[s.stayId].status = "approved"; app.toast("Approved for the family."); return app.commit();
      case "cf-summary": {
        const ds = c.decisions[s.stayId] || [];
        el.disabled = true;
        let text = `The care team met on ${app.fmtDate(s.conferences.length ? s.conferences[s.conferences.length - 1].date + "T12:00:00" : app.D.now, { weekday: "long" })} to review the stay. What they agreed: ${ds.map(d => d.text).join("; ")}. Your nurse can walk you through any of this.`;
        let source = "template";
        if (window.FP_AI.mode() !== "off") {
          try {
            const out = await window.FP_AI.call([
              { role: "system", content: "Turn decisions from a hospital care-team review meeting into a short, warm note for the child's family. 3-4 sentences, at most 80 words, 6th-grade reading level. Plain words only: no abbreviations, no numbers or doses, no organism names, no durations of treatments, no blame, no team ratings, no predictions. End by saying their nurse can explain more." },
              { role: "user", content: JSON.stringify({ decisions: ds.map(d => ({ type: d.type, text: d.text, owner: d.owner.split(" — ")[0] })) }) }]);
            if (out && out.trim()) { text = out.trim(); source = "ai"; }
          } catch (err) { app.toast("AI: " + err.message); }
        }
        c.summaries[s.stayId] = { text, source, status: "review" };
        return app.commit();
      }
    }
  });
  document.addEventListener("submit", e => {
    if (e.target.dataset.act !== "cf-add") return;
    e.preventDefault();
    const app = A(); const c = conf(); const s = stays().find(x => x.id === c.stay);
    const f = e.target;
    const text = f.text.value.trim();
    if (!text) { app.toast("Write the decision or action first."); return; }
    (c.decisions[s.stayId] = c.decisions[s.stayId] || []).push({ type: f.type.value, text, owner: f.owner.value, due: f.due.value || null, event: f.event.value || null, at: new Date().toISOString() });
    delete c.summaries[s.stayId];
    app.toast("Captured with an owner.");
    app.commit();
  });
  document.addEventListener("keydown", e => {
    const g = e.target.closest && e.target.closest('g[data-act="cf-event"]');
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
  });
})();
