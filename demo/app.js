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

  const SETTINGS_DEFAULT = { aiEnabled: true, apiKey: "", model: "gpt-4o-mini", passcode: "", showName: true };
  let settings = load("fp-settings", SETTINGS_DEFAULT);
  window.FP_SETTINGS = { get: () => settings };

  const STATE_DEFAULT = { patientId: PATIENT_IDS[0], view: "family", familyPresent: false, showIds: false,
    drafts: {}, approved: {}, rejected: {}, confirmed: {}, questions: {}, chats: {}, selectedEvent: null };
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
     FAMILY ROOM SCREEN
     ================================================================ */
  function renderFamily(p) {
    const name = childName(p);
    const est = homeEstimate(p);
    const path = familyPath(p);
    const updates = familyUpdates(p);
    const crit = p.discharge.criteria;
    const doneCount = crit.filter(c => c.done).length;
    const hour = NOW.getHours();
    const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const ch = est && est.changes[0];
    const nurse = careTeamMember(p, "Bedside nurse");

    const homeCard = est ? `
        <p class="eyebrow">${icon("home")} Expected to go home</p>
        <p class="home-date">Around ${esc(dateRangeText(est.dates))}</p>
        <p class="hint">${icon("info")} This is the team’s best estimate, not a promise. It can change.</p>
        ${ch ? `<div class="change">
            <p class="change-head">${icon("calendar")} Changed ${esc(relTime(ch.changedAt).toLowerCase())}, from ${esc(fmtDate(p.discharge.pathwayDate, { weekday: "long", month: "long", day: "numeric" }))}</p>
            <p>${esc(personalize(p, ch.reasonFamily))}</p></div>` : ""}
        ${est.by === "confirmed" ? `<p class="hint">${icon("check")} Shared by your care team today.</p>` : ""}`
      : `
        <p class="eyebrow">${icon("home")} Expected to go home</p>
        <p class="home-date soft">Your team will share an expected date soon.</p>
        <p class="hint">${icon("info")} They share it once they have a good sense of it. You can ask them anytime.</p>`;

    return `
    <main class="fam" aria-label="Family room screen">
      <header class="fam-head">
        <div>
          <p class="greet">${greet}${settings.showName ? ", " + esc(name) + "’s family" : ""}</p>
          <h1 class="headline">${esc(personalize(p, p.family.roomHeadline))}</h1>
        </div>
        <div class="fam-clock"><span>${esc(fmtDate(D.now, { weekday: "long", month: "long", day: "numeric" }))}</span><span class="muted">${esc(fmtTime(D.now))}</span></div>
      </header>

      <div class="fam-grid">
        <section class="card days" aria-label="Days here">
          <p class="eyebrow">${icon("calendar")} Days here</p>
          <p class="day-big">Day ${p.dayOfStay}</p>
          ${p.pod != null ? `<p class="day-sub">Day ${p.pod} after ${esc(path[0].label.toLowerCase())}</p>` : ""}
        </section>

        <section class="card home" aria-label="Expected to go home">
          <div class="home-main">${homeCard}</div>
          <div class="home-list">
            <p class="eyebrow">Before going home <span class="count">${doneCount} of ${crit.length} done</span></p>
            <ul class="checklist">
              ${crit.map(c => `<li class="${c.done ? "done" : ""}">${c.done ? icon("check") : '<span class="todo-dot" aria-hidden="true"></span>'}<span>${esc(personalize(p, c.text))}</span><span class="sr">${c.done ? "done" : "to do"}</span></li>`).join("")}
            </ul>
          </div>
        </section>

        <section class="card path" aria-label="The path home">
          <p class="eyebrow">${icon("plane")} The path home</p>
          <ol class="stones">
            ${path.map(s => `<li class="stone ${s.status}">
                <span class="stone-dot">${s.status === "done" ? icon("check") : icon(s.icon)}</span>
                <span class="stone-label">${esc(s.label)}</span>
                ${s.status === "now" ? `<span class="here">Here now</span>` : s.sub ? `<span class="stone-sub">${esc(s.sub)}</span>` : ""}
              </li>`).join("")}
          </ol>
        </section>

        <section class="card updates" aria-label="Recent updates">
          <p class="eyebrow">${icon("sparkle")} Recent updates</p>
          ${updates.length ? `<ul class="feed">${updates.map(u => `
              <li class="${u.fresh ? "fresh" : ""}"><span class="feed-ic">${icon(u.icon)}</span>
                <span class="feed-text">${esc(personalize(p, u.text))}</span>
                <span class="feed-time">${esc(relTime(u.at))}</span></li>`).join("")}</ul>`
            : `<p class="soft">Nothing new since this morning.</p>`}
        </section>

        <section class="card today" aria-label="Today">
          <p class="eyebrow">${icon("sun")} Today</p>
          <ul class="today-list">${p.family.today.map(t => `<li>${icon(t.icon)}<span>${esc(personalize(p, t.text))}</span></li>`).join("")}</ul>
        </section>
      </div>

      <footer class="fam-foot">
        <span>${icon("clock")} Updated ${esc(fmtTime(D.now))}</span>
        <span>${icon("people")} Questions? Ask your nurse${nurse ? ", " + esc(nurse.replace(/,.*$/, "")) : ""}.</span>
        <button class="skye-btn" data-act="open-skye">${icon("plane")}<span><b>Ask Skye</b><small>your stay guide</small></span></button>
      </footer>
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

  function renderSkye(p) {
    const box = $("#skye");
    if (!state.skyeOpen || state.view !== "family") { box.hidden = true; return; }
    box.hidden = false;
    const msgs = chat(p);
    const aiOn = window.FP_AI.mode() !== "off";
    box.innerHTML = `
      <div class="skye-head">${icon("plane")}<div><b>Skye</b><span>Your guide for ${esc(childName(p))}’s stay. Not a doctor or nurse.</span></div>
        <button class="icon-btn" data-act="close-skye" aria-label="Close">${icon("x")}</button></div>
      <div class="skye-msgs" id="skye-msgs">
        <div class="msg bot">Hi, I'm Skye. I can tell you what's on the plan, explain words, and save questions for the care team. For anything urgent, press the nurse call button.</div>
        ${msgs.map((m, i) => `<div class="msg ${m.role === "user" ? "me" : "bot"} ${m.kind || ""}">${esc(m.text)}
          ${m.role === "user" && !m.saved ? `<button class="link" data-act="save-q" data-i="${i}">Save for the team</button>` : ""}
          ${m.role === "user" && m.saved ? `<span class="saved">${icon("check")} Saved for the team</span>` : ""}</div>`).join("")}
        ${state.skyeBusy ? `<div class="msg bot typing"><span></span><span></span><span></span></div>` : ""}
      </div>
      <div class="chips">${CHIPS.map(([k, t]) => `<button class="chip-q" data-act="chip" data-k="${k}">${esc(t)}</button>`).join("")}</div>
      <form class="skye-input" data-act="ask">
        <input id="skye-text" autocomplete="off" placeholder="${aiOn ? "Type a question…" : "Type a question to save for the team…"}" aria-label="Your question">
        <button class="icon-btn send" aria-label="Send">${icon("send")}</button>
      </form>
      <p class="skye-foot">${aiOn ? icon("sparkle") + " Answers come only from what's on this screen." : "AI is off: Skye answers the questions above and saves others for the team."}</p>`;
    const m = $("#skye-msgs"); m.scrollTop = m.scrollHeight;
  }

  async function ask(p, text) {
    text = text.trim(); if (!text) return;
    const msgs = chat(p);
    msgs.push({ role: "user", text });
    if (window.FP_AI.EMERGENCY.test(text)) {
      msgs.push({ role: "assistant", text: "Please press the nurse call button or tell a nurse right now. They can help you right away.", kind: "urgent" });
      commit(false); renderSkye(p); return;
    }
    if (window.FP_AI.mode() === "off") {
      msgs.push({ role: "assistant", text: "I can answer the questions below. For anything else, your nurse is the best person to ask. Tap “Save for the team” and they will see your question on rounds." });
      commit(false); renderSkye(p); return;
    }
    state.skyeBusy = true; renderSkye(p);
    try {
      const reply = await window.FP_AI.companionReply(familyFacts(p), msgs.filter(m => !m.kind));
      msgs.push({ role: "assistant", text: reply || "I'm not sure about that one. Your nurse can help, or I can save the question for the team." });
    } catch (err) {
      msgs.push({ role: "assistant", text: "I couldn't reach my notes just now. Your nurse can help, or tap “Save for the team”.", kind: "err" });
      toast("AI: " + err.message);
    }
    state.skyeBusy = false; commit(false); renderSkye(p);
  }

  /* ================================================================
     APP SHELL
     ================================================================ */
  function renderBar() {
    const p = D.patients[state.patientId];
    $("#bar").innerHTML = `
      <div class="brand">${icon("plane")}<b>FlightPlan</b><span>Journey · demo</span></div>
      <div class="rooms" role="tablist" aria-label="Demo: choose a room">
        ${PATIENT_IDS.map(id => { const q = D.patients[id]; return `<button role="tab" aria-selected="${id === p.id}" data-act="patient" data-id="${id}">${esc(q.room)} · ${esc(settings.showName ? q.firstName : q.displayLabel)}</button>`; }).join("")}
      </div>
      <div class="views" role="tablist" aria-label="Choose view">
        <button role="tab" aria-selected="${state.view === "family"}" data-act="view" data-v="family">${icon("home")} Family room screen</button>
        <button role="tab" aria-selected="${state.view === "team"}" data-act="view" data-v="team">${icon("clipboard")} Care team</button>
      </div>
      <button class="icon-btn" data-act="settings" aria-label="Settings">${icon("gear")}</button>`;
  }

  function render() {
    const p = D.patients[state.patientId];
    document.body.dataset.view = state.view;
    renderBar();
    $("#view").innerHTML = state.view === "family" ? renderFamily(p) : renderTeam(p);
    renderSkye(p);
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
    settings = { aiEnabled: f.aiEnabled.checked, apiKey: f.apiKey.value.trim(), model: f.model.value.trim() || "gpt-4o-mini", passcode: f.passcode.value, showName: f.showName.checked };
    save("fp-settings", settings);
  }

  /* ---------- events ---------- */
  document.addEventListener("click", async e => {
    const el = e.target.closest("[data-act]"); if (!el) return;
    const act = el.dataset.act;
    const p = D.patients[state.patientId];
    switch (act) {
      case "patient": state.patientId = el.dataset.id; state.selectedEvent = null; return commit();
      case "view": state.view = el.dataset.v; return commit();
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
      case "open-skye": state.skyeOpen = true; commit(false); renderSkye(p); setTimeout(() => { const i = $("#skye-text"); if (i) i.focus(); }, 50); return;
      case "close-skye": state.skyeOpen = false; commit(false); renderSkye(p); return;
      case "chip": {
        const label = CHIPS.find(c => c[0] === el.dataset.k)[1];
        chat(p).push({ role: "user", text: label, saved: true, chip: true });
        chat(p).push({ role: "assistant", text: scripted(p, el.dataset.k) });
        commit(false); renderSkye(p); return;
      }
      case "save-q": {
        const m = chat(p)[+el.dataset.i]; if (!m) return;
        m.saved = true;
        (state.questions[p.id] = state.questions[p.id] || []).push({ text: m.text, at: new Date().toISOString() });
        chat(p).push({ role: "assistant", text: "Saved. Your care team will see this question on rounds." });
        commit(false); renderSkye(p); return;
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
        state = Object.assign({}, STATE_DEFAULT, { patientId: state.patientId, view: state.view, drafts: {}, approved: {}, rejected: {}, confirmed: {}, questions: {}, chats: {} });
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

  state.skyeOpen = false; state.skyeBusy = false;
  render();
})();
