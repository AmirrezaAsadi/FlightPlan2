/* FlightPlan Journey — demo app. Plain JS, no build step. All data is synthetic. */
(function () {
  const D = window.FP_DATA;
  const NOW = new Date(D.now);
  const $ = (sel, el) => (el || document).querySelector(sel);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const PATIENT_IDS = Object.keys(D.patients);

  /* ---------- persistence (demo only; per-browser) ---------- */
  function load(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ? Object.assign({}, fallback, v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode: fine */ } }

  const SETTINGS_DEFAULT = { aiEnabled: true, apiKey: "", model: "gpt-4o-mini", passcode: "", showName: true, voice: true, naturalVoice: true };
  let settings = load("fp-settings", SETTINGS_DEFAULT);
  window.FP_SETTINGS = { get: () => settings };

  const STATE_DEFAULT = { patientId: PATIENT_IDS[0], view: "family", familyPresent: false, showIds: false,
    drafts: {}, approved: {}, rejected: {}, confirmed: {}, questions: {}, chats: {}, selectedEvent: null, handoff: {}, conf: { stay: null, event: null, decisions: {}, summaries: {} } };
  let state = load("fp-state", STATE_DEFAULT);
  if (!D.patients[state.patientId]) state.patientId = PATIENT_IDS[0];
  function commit(rerender = true) { save("fp-state", state); if (rerender) render(); }

  /* ---------- time + words ---------- */
  const DAY = 86400000;
  const midnight = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const fmtDate = (iso, opts) => new Date(iso).toLocaleDateString("en-US", opts || { weekday: "long", month: "long", day: "numeric" });
  const fmtShort = iso => fmtDate(iso, { weekday: "short", month: "short", day: "numeric" });
  const fmtTime = iso => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  function relTime(iso) {
    const t = new Date(iso), diff = Math.round((midnight(NOW) - midnight(t)) / DAY);
    if (diff === 0) return t.getHours() < 12 ? "This morning" : t.getHours() < 17 ? "This afternoon" : "This evening";
    if (diff === 1) return t.getHours() < 12 ? "Yesterday morning" : "Yesterday";
    return fmtDate(iso, { weekday: "long" });
  }
  function dateRangeText(dates) {
    if (dates.length === 1) return fmtDate(dates[0]);
    const a = new Date(dates[0]), b = new Date(dates[dates.length - 1]);
    return `${fmtDate(dates[0], { weekday: "long" })} or ${fmtDate(dates[dates.length - 1], { weekday: "long" })}, ${a.toLocaleDateString("en-US", { month: "long" })} ${a.getDate()}–${b.getDate()}`;
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function childName(p) { return settings.showName ? p.firstName : cap(p.childWord); }
  function personalize(p, text) {
    if (!text || settings.showName) return text;
    return text.replace(new RegExp("(^|[.!?]\\s+)?\\b" + p.firstName + "\\b", "g"), (m, start) => (start !== undefined ? start + cap(p.childWord) : p.childWord));
  }

  /* ---------- glossary (family words) ---------- */
  const LOC = {
    OR: { label: "Operating room", short: "OR", icon: "hands" },
    "Cath lab": { label: "Cath lab", short: "Cath", icon: "heart" },
    CICU: { label: "Cardiac ICU", short: "CICU", icon: "hospital" },
    ACCU: { label: "Step-down unit (ACCU)", short: "ACCU", icon: "bed" },
    Home: { label: "Home", short: "Home", icon: "home" }
  };
  function stateWords(p, row) {
    const procLoc = (p.interventions[0] || {}).location;
    return {
      Procedure: { label: procLoc === "Cath lab" ? "Heart procedure" : "Surgery", sub: procLoc === "Cath lab" ? "In the cath lab" : "In the operating room", icon: "hands" },
      Intubated: { label: "Breathing machine", sub: "Intensive care", icon: "breath" },
      Extubated: { label: `Breathing on ${p.pronouns.poss} own`, sub: "Intensive care", icon: "breath" },
      ACCU: { label: "Step-down unit", sub: "One step below intensive care", icon: "bed" },
      Discharged: { label: "Home", sub: "", icon: "home" }
    }[row];
  }
  const GLOSSARY = {
    "step-down unit": "A hospital floor one step below intensive care. Children here need less help and are getting closer to home.",
    "intensive care": "The part of the hospital with the closest watching and the most support.",
    "chest tube": "A small soft tube that drains extra fluid from around the lungs or heart after surgery.",
    "breathing tube": "A tube connected to a breathing machine that helps with breathing after surgery.",
    "heart-support medicine": "Medicine through an IV that helps the heart pump while it recovers.",
    "heart ultrasound": "A painless picture of the heart made with sound waves. Also called an echo.",
    "low-fat formula": "A special formula that helps when a certain fluid drains from the chest.",
    "care team": "The doctors, nurses and other helpers who look after your child.",
    "nurse practitioner": "An advanced nurse who helps plan care and can answer many questions."
  };

  /* ---------- derived views of the data ---------- */
  function familyPath(p) {
    const rows = p.pathway.map(x => x.row);
    let i = rows.indexOf("Procedure"); if (i < 0) i = 0;
    const seq = [];
    rows.slice(i).forEach(r => { if (seq[seq.length - 1] !== r) seq.push(r); });
    if (!seq.includes("Discharged")) seq.push("Discharged");
    let cur = seq.lastIndexOf(p.row);
    if (cur < 0) cur = seq.length - 2;
    return seq.map((row, idx) => Object.assign({ row, status: idx < cur ? "done" : idx === cur ? "now" : "next" }, stateWords(p, row)));
  }

  function homeEstimate(p) {
    const d = p.discharge;
    if (d.teamDates) return { dates: d.teamDates, by: "team", changes: d.changes };
    if (state.confirmed[p.id]) return { dates: [d.pathwayDate], by: "confirmed", changes: [] };
    return null;
  }

  function familyUpdates(p) {
    const items = [];
    p.events.forEach(e => {
      const ap = state.approved[e.id];
      if (e.roomScreen === "published" || ap) items.push({ at: e.at, text: ap ? ap.text : e.familyText, icon: ap ? ap.icon : e.icon });
    });
    p.whatChanged.forEach(w => {
      const ap = state.approved[w.id];
      if (ap) items.push({ at: ap.at, text: ap.text, icon: ap.icon, fresh: true });
    });
    return items.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 4);
  }

  function careTeamMember(p, role) { return (p.careTeam.find(c => c.role === role) || {}).name; }

  function familyFacts(p) {
    const est = homeEstimate(p);
    const path = familyPath(p);
    const now = path.find(s => s.status === "now");
    const ch = est && est.changes[0];
    return {
      childName: childName(p),
      dayOfStay: p.dayOfStay, daysAfterProcedure: p.pod,
      whereNow: now ? `${now.label} (${now.sub})` : null,
      pathHome: path.map(s => `${s.label}: ${s.status === "done" ? "done" : s.status === "now" ? "here now" : "still to come"}`),
      expectedHome: est ? { estimate: "Around " + dateRangeText(est.dates), note: "This is the team's best estimate, not a promise. It can change.", lastChange: ch ? ch.reasonFamily : null } : "The care team has not shared an expected date yet. They will when it is clearer.",
      beforeGoingHome: p.discharge.criteria.map(c => `${c.text}: ${c.done ? "done" : "still to do"}`),
      todaysPlan: p.family.today.map(t => t.text),
      recentUpdates: familyUpdates(p).map(u => personalize(p, u.text)),
      whoToAsk: [{ role: "Bedside nurse today", name: careTeamMember(p, "Bedside nurse") }, { role: "Nurse practitioner", name: careTeamMember(p, "Nurse practitioner") }],
      glossary: GLOSSARY
    };
  }

  /* ================================================================
     FAMILY ROOM SCREEN — journey map first, widgets around it, Skye on the right
     ================================================================ */
  function bigDate(dates) {
    const a = new Date(dates[0]), b = new Date(dates[dates.length - 1]);
    const wd = d => d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const mo = a.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return `<span class="wd">${dates.length > 1 ? wd(a) + " – " + wd(b) : wd(a)}</span>${mo} ${a.getDate()}${dates.length > 1 ? "–" + b.getDate() : ""}`;
  }

  // When each step of the path home was reached (for the journey map captions).
  function stepWhen(p, step, est) {
    const day1 = midnight(p.admit).getTime();
    const dayOf = iso => Math.floor((new Date(iso).getTime() - day1) / DAY) + 1;
    const procAt = (p.interventions[0] || {}).at || p.admit;
    if (step.row === "Discharged") return est ? "Around " + fmtDate(est.dates[0], { weekday: "short", month: "short", day: "numeric" }) : "Date coming soon";
    if (step.status === "next") return "Coming up";
    if (step.row === "Procedure") return "Day " + dayOf(procAt);
    const seg = p.segments.find(s => s.row === step.row && new Date(s.start) >= new Date(procAt));
    return seg ? "Day " + dayOf(seg.start) : "";
  }

  // The journey map: a descending flight arc toward Home. Label + shape, never color alone.
  function pathArc(p, path, est) {
    const W = 1200, H = 300;
    const P = [[90, 60], [420, 22], [790, 220], [1110, 200]];
    const bz = t => { const u = 1 - t; return [0, 1].map(k => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
    const n = path.length;
    const cur = Math.max(0, path.findIndex(s => s.status === "now"));
    const tEnd = cur / (n - 1);
    let trail = "";
    for (let i = 0; i <= 64; i++) { const [x, y] = bz(tEnd * i / 64); trail += (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1); }
    let s = `<svg class="arc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Journey map: ${path.map(x => x.label + (x.status === "now" ? " (here now)" : x.status === "done" ? " (done)" : "")).join(", ")}">
      <defs><linearGradient id="trail" x1="0" x2="1"><stop offset="0" stop-color="#8be9f5" stop-opacity=".12"/><stop offset="1" stop-color="#8be9f5"/></linearGradient>
      <filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path class="arc-rest" d="M${P[0]} C${P[1]} ${P[2]} ${P[3]}"/>
      <path class="arc-trail" d="${trail}" filter="url(#glow)"/>`;
    path.forEach((st, i) => {
      const [x, y] = bz(i / (n - 1));
      s += `<g class="node ${st.status} ${st.row === "Discharged" ? "home" : ""}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">`;
      if (st.status === "now") s += `<circle class="pulse" r="16"/><circle class="halo" r="16"/><circle class="core" r="9"/><text class="here" y="-32" text-anchor="middle">YOU ARE HERE</text>`;
      else if (st.row === "Discharged") s += `<circle class="home-ring" r="18"/><g class="home-ic" transform="translate(-10,-10) scale(.84)">${window.FP_ICONS.home}</g>`;
      else s += `<circle class="dot" r="${st.status === "done" ? 6 : 5}"/>`;
      s += `<text class="nl" y="${st.status === "now" ? 50 : 44}" text-anchor="middle">${esc(st.label)}</text>`;
      s += `<text class="nw" y="${st.status === "now" ? 74 : 67}" text-anchor="middle">${esc(stepWhen(p, st, est).toUpperCase())}</text></g>`;
    });
    return s + `</svg>`;
  }

  function teamCard(p) {
    const people = [
      ["Your nurse today", careTeamMember(p, "Bedside nurse")],
      ["Your doctor", careTeamMember(p, "ACCU attending")],
      ["Nurse practitioner", careTeamMember(p, "Nurse practitioner")]
    ].filter(x => x[1]);
    const initials = n => n.replace(/^Dr\.\s*/, "").replace(/,.*$/, "").split(/[\s.]+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return people.map(([role, name]) => `<li><span class="av">${esc(initials(name))}</span><span><b>${esc(name.replace(/,.*$/, ""))}</b><small>${esc(role)}</small></span></li>`).join("");
  }

  function renderFamily(p) {
    const est = homeEstimate(p);
    const path = familyPath(p);
    const updates = familyUpdates(p).slice(0, 3);
    const crit = p.discharge.criteria;
    const done = crit.filter(c => c.done).length;
    const ch = est && est.changes[0];
    const hour = NOW.getHours();
    const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const C = 2 * Math.PI * 18;
    const name = childName(p);
    return `
    <main class="portal" aria-label="Family room screen">
      <div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="p-main">
        <header class="p-head">
          <p class="mono">${esc(greet.toUpperCase())}${settings.showName ? " · " + esc(name.toUpperCase()) + "’S FAMILY" : ""} <span class="sep">/</span> ${esc(fmtDate(D.now, { weekday: "short", month: "short", day: "numeric" }).toUpperCase())} · ${esc(fmtTime(D.now))}</p>
          <h1 class="p-headline">${esc(personalize(p, p.family.roomHeadline))}</h1>
        </header>

        <section class="w w-journey" aria-label="Journey map">
          <div class="w-days">
            <p class="mono">DAY OF STAY</p>
            <p class="p-day">${p.dayOfStay}</p>
            ${p.pod != null ? `<p class="p-sub">${p.pod} days after ${esc(path[0].label.toLowerCase())}</p>` : ""}
          </div>
          <div class="w-map">
            <p class="mono">${settings.showName ? esc(name.toUpperCase()) + "’S JOURNEY HOME" : "THE JOURNEY HOME"}</p>
            ${pathArc(p, path, est)}
            <ol class="path-list">${path.map(s => `<li class="${s.status}"><span class="pd"></span><span>${esc(s.label)}<small>${esc(stepWhen(p, s, est))}</small></span>${s.status === "now" ? " <em>you are here</em>" : ""}</li>`).join("")}</ol>
          </div>
        </section>

        <div class="w-row">
          <section class="w w-home" aria-label="Going home">
            <p class="mono">GOING HOME · ESTIMATE</p>
            <div class="home-grid">
              <div>
                ${est ? `<p class="p-date">${bigDate(est.dates)}</p><p class="p-sub">Our best estimate, not a promise.</p>`
                      : `<p class="p-date soft">Soon</p><p class="p-sub">Your team will share an expected date when it’s clearer.</p>`}
                ${ch ? `<p class="p-change"><span class="mono">MOVED FROM ${esc(fmtDate(p.discharge.pathwayDate, { weekday: "short", month: "short", day: "numeric" }).toUpperCase())}</span>${esc(personalize(p, ch.reasonFamily))}</p>` : ""}
                ${est && est.by === "confirmed" ? `<p class="p-sub">Shared by your care team today.</p>` : ""}
              </div>
              <div>
                <div class="ring-row"><svg class="ring" viewBox="0 0 44 44" aria-hidden="true"><circle class="r-bg" cx="22" cy="22" r="18"/><circle class="r-fg" cx="22" cy="22" r="18" stroke-dasharray="${(C * done / crit.length).toFixed(1)} ${C.toFixed(1)}"/></svg>
                  <p class="mono">BEFORE HOME <b>${done}/${crit.length}</b></p></div>
                <ul class="p-list steps">${crit.map(c => `<li class="${c.done ? "done" : ""}"><span class="mk ${c.done ? "ok" : "todo"}"></span>${esc(personalize(p, c.text))}<span class="sr">${c.done ? " (done)" : " (to do)"}</span></li>`).join("")}</ul>
              </div>
            </div>
          </section>

          <section class="w w-today" aria-label="Today">
            <p class="mono">TODAY</p>
            <ul class="p-list">${p.family.today.map(t => `<li><span class="mk"></span>${esc(personalize(p, t.text))}</li>`).join("")}</ul>
          </section>

          <section class="w w-team" aria-label="Your care team">
            <p class="mono">YOUR CARE TEAM</p>
            <ul class="team-list">${teamCard(p)}</ul>
          </section>
        </div>

        <section class="w w-feed" aria-label="Recent updates">
          <p class="mono">RECENT UPDATES</p>
          ${updates.length ? `<ul>${updates.map(u => `<li class="${u.fresh ? "fresh" : ""}">${icon(u.icon)}<span>${esc(personalize(p, u.text))}</span><time>${esc(relTime(u.at))}</time></li>`).join("")}</ul>` : `<p class="p-sub">Nothing new since this morning.</p>`}
        </section>

        <footer class="p-foot mono">URGENT? PRESS THE CALL BUTTON <span class="sep">/</span> UPDATED ${esc(fmtTime(D.now))}</footer>
      </div>

      <aside class="p-skye" aria-label="Skye, your stay guide">${skyeHTML(p)}</aside>
    </main>`;
  }

  /* ================================================================
     CARE-TEAM VIEW
     ================================================================ */
  function renderTeam(p) {
    const fp = state.familyPresent;
    const sn = p.snapshot;
    const loc = LOC[p.location] || { label: p.location, icon: "bed" };
    const behind = sn.onTrack === "behind";
    const est = homeEstimate(p);
    const d = p.discharge;
    const ch = est && est.changes[0];
    const qs = state.questions[p.id] || [];
    const openActions = p.actions.filter(a => !fp || a.familyVisible);

    const ids = fp ? `<span class="chip">${icon("lock")} Identifiers hidden</span>` :
      state.showIds ? `<button class="chip" data-act="toggle-ids">${icon("lock")} MRN ${esc(p.mrn)} · DOB ${esc(p.dob)} · ${esc(p.weightKg)} kg — hide</button>`
        : `<button class="chip" data-act="toggle-ids">${icon("eye")} Show identifiers</button>`;

    const changedRows = p.whatChanged.map(w => {
      const ap = state.approved[w.id];
      const status = ap ? `<span class="tag ok">${icon("check")} On room screen</span>`
        : w.rule === "talk-first" ? `<span class="tag warn">${icon("people")} Talk in person first</span>`
        : w.rule === "private" ? `<span class="tag warn">${icon("lock")} Private</span>`
        : w.rule === "numbers" ? `<span class="tag">${icon("lock")} Numbers stay here</span>`
        : state.rejected[w.id] ? `<span class="tag">Not for family</span>` : `<span class="tag">Draft for family</span>`;
      if (fp) {
        if (w.rule === "talk-first" || w.rule === "private") return "";
        const txt = ap ? ap.text : (state.drafts[w.id] || {}).text || w.draft;
        return txt ? `<li>${icon((ap || {}).icon || w.icon || "star")}<span>${esc(txt)}</span></li>` : "";
      }
      return `<li><span class="wc-cat">${esc(w.category === "overnight" ? "Overnight" : cap(w.category))}</span><span>${esc(w.item)}</span>${status}</li>`;
    }).join("");
    const heldCount = p.whatChanged.filter(w => w.rule === "talk-first" || w.rule === "private").length;

    const estCard = `
      <div class="est-grid">
        <div><p class="k">System suggestion (pathway)</p><p class="v">${d.pathwayDate ? esc(fmtShort(d.pathwayDate)) + ` <span class="muted">· day ${d.pathwayDay}</span>` : "—"}</p></div>
        <div><p class="k">Team estimate</p><p class="v">${d.teamDates ? esc(d.teamDates.map(fmtShort).join(" – ")) : '<span class="muted">Not stated</span>'}</p></div>
      </div>
      ${d.teamSource && !fp ? `<p class="src">Source: ${esc(d.teamSource)}</p>` : ""}
      ${ch && !fp ? `<div class="log"><p class="k">Change log</p><p>${esc(fmtShort(d.pathwayDate))} → ${esc(d.teamDates.map(fmtShort).join(" – "))} · <code>${esc(ch.reasonCode)}</code></p><p class="muted">${esc(ch.reasonClinical)}</p><p class="muted">Trigger: ${esc((p.events.find(e => e.id === ch.triggerEventId) || {}).title || ch.triggerEventId)} · family wording reviewed</p></div>` : ""}
      <div class="family-sees"><p class="k">${icon("home")} Family room screen shows</p>
        <p>${est ? "Around " + esc(dateRangeText(est.dates)) + (ch ? ". " + esc(personalize(p, ch.reasonFamily)) : "") : "“Your team will share an expected date soon.”"}</p></div>
      ${!d.teamDates && !fp ? (state.confirmed[p.id]
        ? `<button class="btn ghost" data-act="unconfirm">Stop sharing the suggested date</button>`
        : `<button class="btn" data-act="confirm">${icon("check")} Share ${esc(fmtShort(d.pathwayDate))} with family</button><p class="src">Nothing is shown to the family until a clinician confirms it.</p>`) : ""}`;

    const queue = p.whatChanged.map(w => queueItem(p, w)).join("");

    return `
    <main class="team ${fp ? "fp" : ""}" aria-label="Care-team view">
      ${fp ? `<div class="fp-banner">${icon("people")} Family present. Sensitive details are hidden on this screen.</div>` : ""}
      <header class="team-head">
        <div>
          <h1>${esc(p.displayLabel)} <span class="muted">· ${esc(p.age)} · ${esc(p.room)}</span></h1>
          ${fp ? "" : `<p class="muted">${esc(p.admitReason)}</p>`}
        </div>
        <div class="head-actions">${ids}
          <label class="switch"><input type="checkbox" data-act="family-present" ${fp ? "checked" : ""}><span class="track"><span class="knob"></span></span><span>Family present</span></label>
        </div>
      </header>

      <div class="team-grid">
        <section class="card snap" aria-label="Bedside snapshot">
          <p class="eyebrow">Bedside snapshot <span class="src">as of ${esc(fmtTime(D.now))} rounds</span></p>
          <div class="snap-top">
            <div class="loc" style="--loc:${esc((p.segments[p.segments.length - 1] || {}).color || "#3B7DD8")}">${icon(loc.icon)}<div><b>${esc(loc.label)}</b><span>Level: ${esc(p.row)}</span></div></div>
            <div class="stat"><b>Day ${p.dayOfStay}</b><span>${p.pod != null ? "POD " + p.pod : "No procedure"}</span></div>
            <div class="stat ${behind ? "behind" : "ontrack"}">${icon(behind ? "clock" : "check")}<div><b>${behind ? "Behind pathway" : "On track"}</b><span>${behind ? `Pathway: ${sn.expectedRowToday === "Discharged" ? "home by day " + d.pathwayDay : esc(sn.expectedRowToday)}` : "Matches expected course"}</span></div></div>
          </div>
          ${fp ? `<div class="snap-cols">
            <div><p class="k">How things are going</p><p>${esc(personalize(p, p.family.roomHeadline))}</p></div>
            <div><p class="k">Today</p><ul>${p.family.today.map(t => `<li>${esc(personalize(p, t.text))}</li>`).join("")}</ul></div>
            <div><p class="k">Before going home</p><ul>${p.discharge.criteria.map(c => `<li>${esc(personalize(p, c.text))}${c.done ? " (done)" : ""}</li>`).join("")}</ul></div>
          </div>` : `<div class="snap-cols">
            <div><p class="k">Key diagnoses</p><ul>${sn.keyDiagnoses.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
            <div><p class="k">Active concerns</p>${sn.activeConcerns.length ? `<ul>${sn.activeConcerns.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : '<p class="muted">None listed</p>'}</div>
            <div><p class="k">Today’s priorities</p><ul>${sn.priorities.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
          </div>`}
          ${fp ? "" : `<div class="snap-flags">
            ${sn.threshold ? `<p><span class="k">Course correction</span> ${esc(sn.threshold)}</p>` : ""}
            ${p.crosscheck ? `<p><span class="k">CrossCheck</span> Flagged vulnerable before major procedures</p>` : ""}
            ${sn.dosesTakenPct != null ? `<p><span class="k">Medicine-taking</span> ${sn.dosesTakenPct}% of doses taken 30 days before admission · MLVI ${esc(sn.mlvi)}</p>` : ""}
          </div>`}
        </section>

        <section class="card changed" aria-label="What changed">
          <p class="eyebrow">What changed <span class="src">overnight + last 24h</span></p>
          ${changedRows ? `<ul class="wc ${fp ? "plain" : ""}">${changedRows}</ul>` : '<p class="muted">Nothing new.</p>'}
          ${fp && heldCount ? `<p class="muted">${heldCount} item${heldCount > 1 ? "s" : ""} to discuss with the team privately.</p>` : ""}
        </section>

        <section class="card est" aria-label="Expected discharge">
          <p class="eyebrow">${icon("home")} Expected discharge</p>
          ${estCard}
        </section>

        <section class="card stay" aria-label="Compressed stay">
          <p class="eyebrow">The stay so far <span class="src">solid = actual · dashed = pathway · tap a dot</span></p>
          ${timelineSVG(p, fp)}
          ${eventDetail(p, fp)}
        </section>

        ${fp ? "" : `<section class="card queue" aria-label="Room screen review">
          <p class="eyebrow">${icon("sparkle")} Room screen updates <span class="src">AI drafts · you approve</span></p>
          <p class="muted small">Nothing reaches the family screen until it is approved here. Results and private items are never sent.</p>
          <ul class="q">${queue}</ul>
        </section>`}

        <div class="stack">
        <section class="card actions" aria-label="Open items">
          <p class="eyebrow">${icon("clipboard")} Captured on rounds <span class="src">with owners</span></p>
          ${openActions.length ? `<ul class="acts">${openActions.map(a => `<li><span class="tag ${a.status === "open" ? "" : "ok"}">${esc(cap(a.type.replace("_", " ")))}</span><span>${esc(a.text)}</span><span class="muted">${esc(a.owner)}${a.due ? " · due " + esc(fmtShort(a.due)) + " " + esc(fmtTime(a.due)) : ""}</span></li>`).join("")}</ul>` : '<p class="muted">Nothing captured yet.</p>'}
        </section>

        <section class="card qs" aria-label="Family questions">
          <p class="eyebrow">${icon("plane")} Questions the family saved with Skye</p>
          ${qs.length ? `<ul class="acts">${qs.map((q, i) => `<li class="${q.answered ? "answered" : ""}"><span>“${esc(q.text)}”</span><span class="muted">${esc(relTime(q.at))}</span><button class="btn small ghost" data-act="answer-q" data-i="${i}">${q.answered ? "Answered ✓" : "Mark answered"}</button></li>`).join("")}</ul>` : '<p class="muted">No questions yet. Families can save one from the room screen.</p>'}
        </section>
        </div>
      </div>
    </main>`;
  }

  function queueItem(p, w) {
    const ap = state.approved[w.id];
    const dr = state.drafts[w.id] || { text: w.draft, icon: w.icon, source: w.draft ? "template" : null };
    const blocked = w.rule === "talk-first" || w.rule === "private";
    const head = `<p class="q-src"><span class="muted">Source:</span> ${esc(w.item)}</p>`;
    if (blocked) return `<li class="q-item held">${head}<p class="q-why">${icon("lock")} ${esc(w.why)}</p></li>`;
    if (ap) return `<li class="q-item ok">${head}<p class="q-pub">${icon(ap.icon)} ${esc(ap.text)}</p><p class="muted small">${icon("check")} On the room screen · approved ${esc(fmtTime(ap.at))}</p><button class="btn small ghost" data-act="unapprove" data-id="${w.id}">Undo</button></li>`;
    if (state.rejected[w.id]) return `<li class="q-item">${head}<p class="muted">Marked not for family.</p><button class="btn small ghost" data-act="unreject" data-id="${w.id}">Undo</button></li>`;
    const aiOn = window.FP_AI.mode() !== "off";
    return `<li class="q-item">${head}
      ${dr.text != null ? `<div class="q-draft"><span class="q-ic">${icon(dr.icon || "star")}</span><textarea data-act="draft" data-id="${w.id}" rows="2" aria-label="Family wording">${esc(dr.text)}</textarea></div>
        <p class="muted small">${dr.source === "ai" ? icon("sparkle") + " AI draft · check it before approving" : "Template draft (works offline)"}${dr.note ? " · " + esc(dr.note) : ""}</p>`
        : `<p class="q-why">${icon("lock")} ${esc(w.why || "No family wording yet.")}${dr.note ? " " + esc(dr.note) : ""}</p>`}
      <div class="q-btns">
        ${dr.text != null ? `<button class="btn small" data-act="approve" data-id="${w.id}">${icon("check")} Approve for room screen</button>` : ""}
        <button class="btn small ghost" data-act="ai-draft" data-id="${w.id}" ${aiOn ? "" : "disabled title=\"Turn on AI in settings\""}>${icon("sparkle")} ${dr.text != null ? "Rewrite with AI" : "Try AI wording"}</button>
        ${dr.text != null ? `<button class="btn small ghost" data-act="reject" data-id="${w.id}">Not for family</button>` : ""}
      </div></li>`;
  }

  /* ---------- compressed stay timeline (SVG) ---------- */
  const ROWS = [["Procedure", 5], ["Intubated", 4], ["Extubated", 3], ["ACCU", 2], ["Home", 1]];
  function timelineSVG(p, fp) {
    const W = 1000, H = 262, L = 96, R = 24, T = 34, B = 48;
    const t0 = midnight(p.admit).getTime();
    const homeT = Math.max(...[p.discharge.pathwayDate, ...(p.discharge.teamDates || [])].filter(Boolean).map(s => new Date(s).getTime()));
    const t1 = Math.max(NOW.getTime(), homeT) + DAY;
    const x = t => L + ((new Date(t).getTime() - t0) / (t1 - t0)) * (W - L - R);
    const rowH = (H - T - B) / 4;
    const y = lvl => T + (5 - lvl) * rowH;
    const nDays = Math.round((t1 - t0) / DAY);
    let s = `<svg class="tl" viewBox="0 0 ${W} ${H}" role="img" aria-label="Timeline of the stay, actual course against the expected pathway">`;
    ROWS.forEach(([lab, lvl]) => { s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(lvl)}" y2="${y(lvl)}"/><text class="rowlab" x="${L - 10}" y="${y(lvl) + 4}" text-anchor="end">${lab}</text>`; });
    const step = nDays > 16 ? 2 : 1;
    for (let i = 0; i < nDays; i += step) { s += `<text class="tick" x="${x(t0 + i * DAY + DAY / 2)}" y="${H - 10}" text-anchor="middle">D${i + 1}</text>`; }
    // pathway (dashed)
    const admitT = new Date(p.admit).getTime();
    let dpath = "";
    p.pathway.forEach((pt, i) => {
      const tx = x(admitT + pt.dayOffset * DAY), ty = y(pt.level);
      dpath += i === 0 ? `M${tx},${ty}` : `V${ty}`;
      const next = p.pathway[i + 1];
      dpath += `H${next ? x(admitT + next.dayOffset * DAY) : W - R}`;
    });
    s += `<path class="pathway" d="${dpath}"/>`;
    // actual segments with connectors and direct labels (label + color, never color alone)
    p.segments.forEach((sg, i) => {
      const xs = x(sg.start), xe = x(Math.min(new Date(sg.end).getTime(), NOW.getTime()));
      if (i > 0) s += `<line class="conn" x1="${xs}" x2="${xs}" y1="${y(p.segments[i - 1].level)}" y2="${y(sg.level)}"/>`;
      s += `<line class="seg" x1="${xs}" x2="${Math.max(xe, xs + 4)}" y1="${y(sg.level)}" y2="${y(sg.level)}" stroke="${sg.color}"/>`;
      if (xe - xs > 46) s += `<text class="seglab" x="${(xs + xe) / 2}" y="${y(sg.level) - 10}" text-anchor="middle" fill="${sg.color}">${esc((LOC[sg.location] || {}).short || sg.location)}</text>`;
    });
    // expected-home markers
    if (p.discharge.pathwayDate) s += `<circle class="home-path" cx="${x(p.discharge.pathwayDate)}" cy="${y(1)}" r="7"/><text class="tick" x="${x(p.discharge.pathwayDate)}" y="${y(1) + 22}" text-anchor="middle">pathway</text>`;
    (p.discharge.teamDates || []).forEach(dt => { s += `<rect class="home-team" x="${x(dt) - 7}" y="${y(1) - 7}" width="14" height="14" rx="3"/>`; });
    if (p.discharge.teamDates) s += `<text class="tick strong" x="${x(p.discharge.teamDates[0])}" y="${y(1) - 13}" text-anchor="middle">team est.</text>`;
    // now
    s += `<line class="now" x1="${x(NOW)}" x2="${x(NOW)}" y1="${T - 18}" y2="${H - B}"/><text class="nowlab" x="${x(NOW)}" y="${T - 22}" text-anchor="middle">Now · Day ${p.dayOfStay}</text>`;
    // events (tap targets)
    p.events.forEach((e, i) => {
      const t = new Date(e.at).getTime();
      const sg = p.segments.find(g => t >= new Date(g.start).getTime() && t < new Date(g.end).getTime()) || p.segments[p.segments.length - 1];
      const ex = x(t), ey = y(sg.level);
      const sel = state.selectedEvent === e.id;
      s += `<g class="ev ${sel ? "sel" : ""}" data-act="event" data-id="${e.id}" tabindex="0" role="button" aria-label="${esc(e.title)}"><circle class="hit" cx="${ex}" cy="${ey}" r="16"/><circle class="dot" cx="${ex}" cy="${ey}" r="${sel ? 8 : 6}"/></g>`;
    });
    return s + "</svg>";
  }
  function eventDetail(p, fp) {
    const e = p.events.find(x => x.id === state.selectedEvent);
    if (!e) return `<p class="muted small ev-hint">Tap a dot to see what happened. ${fp ? "Plain-language wording shown." : "Clinical shorthand shown."}</p>`;
    return `<div class="ev-detail"><p><b>${esc(e.title)}</b> <span class="muted">· ${esc(fmtShort(e.at))} ${esc(fmtTime(e.at))} · Day ${e.day}${e.pod != null ? " · POD " + e.pod : ""}</span></p>
      <p>${esc(fp ? e.familyText : e.shorthand)}</p>${fp ? "" : `<p class="muted small">Family wording: ${esc(e.familyText)}</p>`}</div>`;
  }

  /* ================================================================
     SKYE — the stay guide (family companion)
     ================================================================ */
  function chat(p) { if (!state.chats[p.id]) state.chats[p.id] = []; return state.chats[p.id]; }
  function scripted(p, key) {
    const f = familyFacts(p);
    const est = homeEstimate(p);
    const left = p.discharge.criteria.filter(c => !c.done).map(c => personalize(p, c.text).toLowerCase());
    const n = childName(p);
    switch (key) {
      case "home":
        return est
          ? `The team's best estimate right now is around ${dateRangeText(est.dates)}. It's an estimate, not a promise, and it can move.${f.expectedHome.lastChange ? " It changed because: " + f.expectedHome.lastChange.charAt(0).toLowerCase() + f.expectedHome.lastChange.slice(1) : ""} Still to do before home: ${left.join(", ")}.`
          : `The team hasn't shared an expected date yet. They will once they have a good sense of it. What needs to happen first: ${left.join(", ")}.`;
      case "today": return `Here's the plan for today: ${f.todaysPlan.map(t => t.toLowerCase()).join("; ")}. Your nurse can tell you more about timing.`;
      case "who": return `Your nurse today is ${f.whoToAsk[0].name}. ${f.whoToAsk[1].name} is the nurse practitioner on the team. You can ask either of them anything, anytime. No question is too small.`;
      case "where": {
        const now = familyPath(p).find(s => s.status === "now");
        return now && now.row === "ACCU" ? `${n} is on the step-down unit. ${GLOSSARY["step-down unit"]}` : `${n} is here: ${now ? now.label : "in the hospital"}. Your nurse can explain more.`;
      }
      case "worried": return `It makes sense to feel worried. This is a lot, and you're doing a good job being here. Your nurse is close by, and you can ask them anything. Would you like me to save a question for the team?`;
    }
  }
  const CHIPS = [["home", "When can we go home?"], ["today", "What's happening today?"], ["who", "Who can I ask?"], ["where", "Where are we now?"], ["worried", "I'm feeling worried"]];

  // Transient conversation state (not saved): what Skye is doing right now.
  const skye = { phase: "idle", q: "", a: "", interim: "", qSaved: false, chip: false, urgent: false, typing: false, fresh: false };
  let rec = null;

  function skyeHTML(p) {
    return `<div class="skye">
      <button class="holo" data-act="talk" aria-label="Talk to Skye"><canvas id="holo"></canvas></button>
      <p class="skye-id mono">SKYE <span>your stay guide · not a doctor or nurse</span></p>
      <div id="skye-controls">${controlsHTML()}</div>
      <div id="skye-live" class="caption" aria-live="polite">${captionHTML(p)}</div>
    </div>`;
  }
  function words(text, fresh) {
    if (!fresh) return esc(text);
    let n = 0;
    return text.split(/(\s+)/).map(w => w.trim() ? `<span style="animation-delay:${(n++ * 0.07).toFixed(2)}s">${esc(w)}</span>` : w).join("");
  }
  function captionHTML(p) {
    const k = skye;
    if (k.phase === "listening") return `<p class="cap-q mono">LISTENING</p><p class="cap-a interim">${esc(k.interim || "Go ahead, I’m listening…")}</p>`;
    if (k.phase === "thinking") return `<p class="cap-q mono">YOU ASKED</p><p class="cap-a dim">${esc(k.q)}</p>`;
    if (!k.a) return `<p class="cap-a">Hi, I’m Skye. I can walk you through ${esc(childName(p))}’s stay. Tap me and ask, or pick a question below.</p>`;
    return `${k.q ? `<p class="cap-q mono">YOU ASKED <span>${esc(k.q)}</span></p>` : ""}
      <p class="cap-a ${k.urgent ? "urgent" : ""} ${k.fresh ? "reveal" : ""}">${words(k.a, k.fresh)}</p>
      ${k.q && !k.qSaved && !k.urgent ? `<button class="save" data-act="save-q">${icon("check")} Save this question for the team</button>` : ""}
      ${k.qSaved && !k.chip ? `<p class="saved mono">✓ SAVED FOR THE TEAM</p>` : ""}`;
  }
  function controlsHTML() {
    const k = skye, aiOn = window.FP_AI.mode() !== "off";
    const label = k.phase === "listening" ? "Listening · tap to stop" : k.phase === "speaking" ? "Speaking · tap to stop" : k.phase === "thinking" ? "Thinking…" : "Tap to talk";
    return `<div class="ctl">
        <button class="mic ${k.phase}" data-act="talk">${icon(k.phase === "speaking" ? "x" : "mic")}<span>${label}</span></button>
        <button class="ghost-ic ${k.typing ? "on" : ""}" data-act="type" aria-label="Type a question">${icon("keyboard")}</button>
        <button class="ghost-ic" data-act="mute" aria-label="${settings.voice ? "Mute Skye" : "Let Skye speak"}">${icon(settings.voice ? "speaker" : "speakerOff")}</button>
      </div>
      ${k.typing ? `<form class="ask-line" data-act="ask"><input id="skye-text" autocomplete="off" placeholder="${aiOn ? "Ask anything about the stay…" : "Type a question to save for the team…"}" aria-label="Your question"><button aria-label="Send">${icon("send")}</button></form>` : ""}
      <div class="orbs">${CHIPS.map(([key, t]) => `<button class="orb" data-act="chip" data-k="${key}">${esc(t)}</button>`).join("")}</div>`;
  }
  function updateCaption() { const el = $("#skye-live"); if (el) { el.innerHTML = captionHTML(D.patients[state.patientId]); skye.fresh = false; } }
  function updateControls() { const el = $("#skye-controls"); if (el) el.innerHTML = controlsHTML(); }
  function setPhase(ph, caption = true) { skye.phase = ph; window.SkyeFace.setState(ph); if (caption) updateCaption(); updateControls(); }
  function focusAsk() { setTimeout(() => { const i = $("#skye-text"); if (i) i.focus(); }, 30); }
  function resetSkye() {
    window.FP_VOICE.stop();
    if (rec) { try { rec.abort(); } catch (e) { /* already stopped */ } rec = null; }
    Object.assign(skye, { phase: "idle", q: "", a: "", interim: "", qSaved: false, chip: false, urgent: false, typing: false, fresh: false });
    window.SkyeFace.setState("idle");
  }
  function say(text) {
    window.FP_VOICE.speak(text, {
      onStart: () => setPhase("speaking", false),
      onLevel: v => window.SkyeFace.setLevel(v),
      onEnd: () => { if (skye.phase === "speaking") setPhase("idle", false); }
    });
  }

  async function ask(p, text, chipKey) {
    text = (text || "").trim(); if (!text) return;
    window.FP_VOICE.stop();
    const msgs = chat(p);
    Object.assign(skye, { q: text, a: "", qSaved: !!chipKey, chip: !!chipKey, urgent: false, interim: "" });
    msgs.push({ role: "user", text });
    let answer, kind;
    if (chipKey) answer = scripted(p, chipKey);
    else if (window.FP_AI.EMERGENCY.test(text)) { answer = "Please press the nurse call button or tell a nurse right now. They can help you right away."; kind = "urgent"; }
    else if (window.FP_AI.mode() === "off") answer = "That’s a good one for your nurse. Right now I can only answer the questions below, but I can save yours for the team to see on rounds.";
    else {
      setPhase("thinking");
      try { answer = (await window.FP_AI.companionReply(familyFacts(p), msgs.filter(m => !m.kind))) || "I’m not sure about that one. Your nurse can help, or I can save the question for the team."; }
      catch (err) { answer = "I couldn’t reach my notes just now. Your nurse can help, or I can save your question for the team."; kind = "err"; toast("AI: " + err.message); }
    }
    if (state.patientId !== p.id || state.view !== "family") return;
    msgs.push({ role: "assistant", text: answer, kind });
    Object.assign(skye, { a: answer, urgent: kind === "urgent", fresh: true });
    commit(false);
    setPhase("idle");
    say(answer);
  }

  /* ================================================================
     APP SHELL
     ================================================================ */
  function renderBar() {
    const p = D.patients[state.patientId];
    $("#bar").innerHTML = `
      <div class="brand">${icon("plane")}<b>FlightPlan</b><span>Journey · demo</span></div>
      <div class="rooms" role="tablist" aria-label="Demo: choose a room" ${state.view === "conference" ? "hidden" : ""}>
        ${PATIENT_IDS.map(id => { const q = D.patients[id]; return `<button role="tab" aria-selected="${id === p.id}" data-act="patient" data-id="${id}">${esc(q.room)} · ${esc(settings.showName ? q.firstName : q.displayLabel)}</button>`; }).join("")}
      </div>
      <div class="views" role="tablist" aria-label="Choose view">
        <button role="tab" aria-selected="${state.view === "family"}" data-act="view" data-v="family">${icon("home")} Family room screen</button>
        <button role="tab" aria-selected="${state.view === "team"}" data-act="view" data-v="team">${icon("clipboard")} Care team</button>
        <button role="tab" aria-selected="${state.view === "handoff"}" data-act="view" data-v="handoff">${icon("people")} Handoff</button>
        <button role="tab" aria-selected="${state.view === "conference"}" data-act="view" data-v="conference">${icon("calendar")} Conference</button>
      </div>
      <button class="icon-btn" data-act="settings" aria-label="Settings">${icon("gear")}</button>`;
  }

  function render() {
    const p = D.patients[state.patientId];
    document.body.dataset.view = state.view;
    renderBar();
    const extra = (window.FP_VIEWS || {})[state.view];
    $("#view").innerHTML = state.view === "family" ? renderFamily(p) : state.view === "team" ? renderTeam(p) : extra ? extra(p) : renderFamily(p);
    if (state.view === "family") { skye.fresh = false; window.SkyeFace.attach($("#holo")); window.SkyeFace.setState(skye.phase); }
  }

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 5000);
  }

  /* ---------- settings dialog ---------- */
  function openSettings() {
    const dlg = $("#settings");
    const m = window.FP_AI.mode();
    dlg.innerHTML = `<form method="dialog" class="set">
      <h2>${icon("gear")} Demo settings</h2>
      <label class="row"><input type="checkbox" name="aiEnabled" ${settings.aiEnabled ? "checked" : ""}> Use AI (OpenAI)</label>
      <label>OpenAI API key <small>Stays in this browser only. Leave empty when deployed on Vercel with OPENAI_API_KEY set.</small>
        <input name="apiKey" type="password" value="${esc(settings.apiKey)}" placeholder="sk-…" autocomplete="off"></label>
      <label>Model <input name="model" value="${esc(settings.model)}"></label>
      <label>Vercel demo passcode <small>Only if DEMO_PASSCODE is set on the server.</small><input name="passcode" type="password" value="${esc(settings.passcode)}"></label>
      <p class="muted small">AI mode now: <b>${m === "direct" ? "direct from this browser" : m === "proxy" ? "via /api/ai (server key)" : "off — templates and scripted answers"}</b></p>
      <label class="row"><input type="checkbox" name="voice" ${settings.voice ? "checked" : ""}> Skye speaks her answers</label>
      <label class="row"><input type="checkbox" name="naturalVoice" ${settings.naturalVoice ? "checked" : ""}> Natural OpenAI voice <small>(when AI is on; otherwise the browser voice)</small></label>
      <label class="row"><input type="checkbox" name="showName" ${settings.showName ? "checked" : ""}> Show first name on the room screen <small>(off = “your baby”, for the hallway test)</small></label>
      <div class="set-btns">
        <button class="btn ghost" value="test" data-act="test-ai">Test AI</button>
        <button class="btn ghost" value="reset" data-act="reset">Reset demo</button>
        <span class="grow"></span>
        <button class="btn ghost" value="cancel">Cancel</button>
        <button class="btn" value="save">Save</button>
      </div>
      <p class="muted small">All patient data is made up. ${D.dataFixes.length} small dataset fixes applied (see README).</p>
    </form>`;
    dlg.showModal();
  }
  function readSettingsForm() {
    const f = $("#settings form");
    settings = { aiEnabled: f.aiEnabled.checked, apiKey: f.apiKey.value.trim(), model: f.model.value.trim() || "gpt-4o-mini", passcode: f.passcode.value, showName: f.showName.checked, voice: f.voice.checked, naturalVoice: f.naturalVoice.checked };
    save("fp-settings", settings);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", async e => {
    const el = e.target.closest("[data-act]"); if (!el) return;
    const act = el.dataset.act;
    const p = D.patients[state.patientId];
    switch (act) {
      case "patient": resetSkye(); state.patientId = el.dataset.id; state.selectedEvent = null; return commit();
      case "view": resetSkye(); state.view = el.dataset.v; return commit();
      case "toggle-ids": state.showIds = !state.showIds; return commit();
      case "confirm": state.confirmed[p.id] = true; toast("Shared with the family room screen."); return commit();
      case "unconfirm": delete state.confirmed[p.id]; return commit();
      case "event": state.selectedEvent = state.selectedEvent === el.dataset.id ? null : el.dataset.id; return commit();
      case "approve": {
        const w = p.whatChanged.find(x => x.id === el.dataset.id);
        const dr = state.drafts[w.id] || { text: w.draft, icon: w.icon };
        const ta = document.querySelector(`textarea[data-id="${w.id}"]`);
        const text = (ta ? ta.value : dr.text || "").trim();
        const problem = window.FP_AI.checkFamilySentence(text);
        if (problem) { toast("Can't publish: " + problem + ". Edit the wording first."); return; }
        state.approved[w.id] = { text, icon: dr.icon || "star", at: D.now };
        toast("Approved. It now shows on the room screen.");
        return commit();
      }
      case "unapprove": delete state.approved[el.dataset.id]; return commit();
      case "reject": state.rejected[el.dataset.id] = true; return commit();
      case "unreject": delete state.rejected[el.dataset.id]; return commit();
      case "ai-draft": {
        const w = p.whatChanged.find(x => x.id === el.dataset.id);
        el.disabled = true; el.innerHTML = icon("sparkle") + " Writing…";
        try {
          const r = await window.FP_AI.translateUpdate(p, w.item);
          const prev = state.drafts[w.id] || { text: w.draft, icon: w.icon };
          if (r.skip || r.blocked) state.drafts[w.id] = Object.assign({}, prev, { note: r.why });
          else state.drafts[w.id] = { text: r.text, icon: r.icon, source: "ai" };
        } catch (err) { toast("AI: " + err.message); }
        return commit();
      }
      case "answer-q": { const q = (state.questions[p.id] || [])[+el.dataset.i]; if (q) q.answered = !q.answered; return commit(); }
      case "talk": {
        if (skye.phase === "listening") { if (rec) rec.stop(); return; }
        if (skye.phase === "speaking") { window.FP_VOICE.stop(); setPhase("idle", false); return; }
        if (skye.phase === "thinking") return;
        if (!window.FP_VOICE.canListen()) { skye.typing = true; updateControls(); focusAsk(); toast("Voice input works in Chrome or Edge. You can type your question instead."); return; }
        skye.interim = "";
        rec = window.FP_VOICE.listen({
          onStart: () => setPhase("listening"),
          onInterim: t => { skye.interim = t; updateCaption(); },
          onFinal: t => ask(p, t),
          onError: msg => { toast("Voice: " + msg + ". You can type instead."); skye.typing = true; },
          onEnd: () => { rec = null; if (skye.phase === "listening") setPhase("idle"); }
        });
        return;
      }
      case "type": skye.typing = !skye.typing; updateControls(); if (skye.typing) focusAsk(); return;
      case "mute": {
        settings.voice = !settings.voice; save("fp-settings", settings);
        if (!settings.voice) { window.FP_VOICE.stop(); if (skye.phase === "speaking") skye.phase = "idle"; window.SkyeFace.setState(skye.phase); }
        updateControls(); return;
      }
      case "chip": { const c = CHIPS.find(x => x[0] === el.dataset.k); ask(p, c[1], c[0]); return; }
      case "save-q": {
        if (!skye.q) return;
        (state.questions[p.id] = state.questions[p.id] || []).push({ text: skye.q, at: new Date().toISOString() });
        Object.assign(skye, { qSaved: true, a: "Saved. Your care team will see your question on rounds.", fresh: true });
        commit(false); setPhase("idle"); say(skye.a); return;
      }
      case "settings": openSettings(); return;
      case "test-ai": {
        e.preventDefault(); readSettingsForm();
        try { const r = await window.FP_AI.call([{ role: "user", content: "Reply with the single word: ready" }]); toast("AI connected: " + r.slice(0, 40)); }
        catch (err) { toast("AI test failed: " + err.message); }
        return;
      }
      case "reset": {
        e.preventDefault();
        state = Object.assign({}, STATE_DEFAULT, { patientId: state.patientId, view: state.view, drafts: {}, approved: {}, rejected: {}, confirmed: {}, questions: {}, chats: {}, handoff: {}, conf: { stay: null, event: null, decisions: {}, summaries: {} } });
        commit(); $("#settings").close(); toast("Demo reset."); return;
      }
    }
  });
  document.addEventListener("change", e => {
    if (e.target.dataset.act === "family-present") { state.familyPresent = e.target.checked; state.showIds = false; commit(); }
  });
  document.addEventListener("input", e => {
    if (e.target.dataset.act === "draft") {
      const id = e.target.dataset.id, p = D.patients[state.patientId];
      const w = p.whatChanged.find(x => x.id === id);
      const prev = state.drafts[id] || { text: w.draft, icon: w.icon, source: "template" };
      state.drafts[id] = Object.assign({}, prev, { text: e.target.value, source: prev.source === "ai" ? "ai" : "edited", note: null });
      commit(false);
    }
  });
  document.addEventListener("submit", e => {
    const f = e.target;
    if (f.dataset.act === "ask") { e.preventDefault(); const i = $("#skye-text"); const v = i.value; i.value = ""; ask(D.patients[state.patientId], v); }
  });
  document.addEventListener("keydown", e => {
    const g = e.target.closest && e.target.closest('g[data-act="event"]');
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
  });
  $("#settings").addEventListener("close", () => {
    if ($("#settings").returnValue === "save") { readSettingsForm(); render(); }
  });

  // Shared helpers for the handoff and conference views (handoff.js, conference.js).
  window.FP_APP = {
    D, NOW, DAY, LOC, esc, icon: window.icon, fmtDate, fmtShort, fmtTime, relTime, cap, midnight, toast, commit, render,
    childName, personalize, careTeamMember, homeEstimate,
    get state() { return state; }
  };
  render();
})();
