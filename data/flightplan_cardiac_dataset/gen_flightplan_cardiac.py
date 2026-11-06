"""
FlightPlan bedside-rounds synthetic dataset — CARDIAC (Heart Institute), matching the hackathon brief.
Everything here is MADE UP. No real patients, staff, MRNs, names, or dates of birth.

Brief elements covered:
  page parts: patient info, diagnoses & interventions (date/time/weight/team), care team, timeline, notes
  timeline rows: Procedure > Intubated > Extubated > ACCU > Discharged
  location colors: OR purple, cath lab pink, CICU orange, ACCU blue (+ text, so color isn't the only cue)
  ECMO shading, expected pathway (dashed), Course Correction (dotted), milestones (inotropes off,
  chest tubes out, ...), callouts (clinical shorthand + family-friendly text), phase ratings (1-4 + dot),
  conference markers, POD counter, compressed quiet stretches, Direct Flights
  bedside: snapshot, what changed, today's priorities, rounds actions with owners, family mode
  + one teen heart-transplant patient with a medicine-taking (adherence) layer
"""
import csv, json, os, random, statistics
from datetime import datetime, timedelta, date

random.seed(11)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "flightplan_cardiac_dataset")
os.makedirs(os.path.join(OUT, "json"), exist_ok=True)
NOW = datetime(2026, 11, 6, 7, 30)

ROWS = {"Procedure": 5, "Intubated": 4, "Extubated": 3, "ACCU": 2, "Discharged": 1}
LOC_COLOR = {"OR": ("#7B4FA0", "purple"), "Cath lab": ("#D9608F", "pink"), "CICU": ("#E8833A", "orange"),
             "ACCU": ("#3B7DD8", "blue"), "Home": ("#3E9B5F", "green")}
STAFF = {
    "Cardiothoracic surgeon": ["Dr. N. Halvorsen", "Dr. G. Achebe"],
    "Anesthesia": ["Dr. I. Petrov", "Dr. C. Moss"],
    "Interventional cardiologist": ["Dr. Y. Tanaka"],
    "CICU attending": ["Dr. F. Ramos", "Dr. O. Whitfield"],
    "ACCU attending": ["Dr. L. Benoit", "Dr. S. Varga"],
    "Primary cardiologist": ["Dr. D. Castellano", "Dr. E. Nwosu"],
    "Cardiology fellow": ["Dr. T. Lindqvist", "Dr. A. Haddad"],
    "Nurse practitioner": ["K. Meyers, NP", "J. Patel, NP"],
    "Bedside nurse": ["L. Brooks, RN", "T. Nguyen, RN", "S. Ward, RN"],
    "Perfusion / ECMO specialist": ["R. Fischer, CCP"],
    "Pharmacist": ["H. Ito, PharmD"],
    "Heart transplant coordinator": ["M. Sloan, RN"],
    "Psychologist": ["Dr. V. Moreau"],
    "Social worker": ["P. Greene, MSW"],
}

def dt(d0, day, hh=8, mm=0):
    return datetime.combine(d0, datetime.min.time()) + timedelta(days=day, hours=hh, minutes=mm)

# steps: (day, hour, location, row, therapy)
# events: (day, hour, kind, title, clinical_shorthand, family_text, milestone_symbol_or_None)
SCEN = [
 dict(pid="C01", label="Patient C01", age="9 days", age_group="Neonate", sex="M", weight=3.4,
      admit=date(2026,10,26), status="inpatient", reason="Transposition of the great arteries - planned repair",
      dx=["d-Transposition of the great arteries (d-TGA)", "Atrial septal defect"],
      crosscheck=False, direct_flight=True, persona=None,
      steps=[(0,6,"CICU","Extubated",None),(2,7,"OR","Procedure",None),(2,14,"CICU","Intubated",None),
             (4,10,"CICU","Extubated",None),(7,13,"ACCU","ACCU",None)],
      expected=[(0,"Extubated"),(2,"Procedure"),(2.3,"Intubated"),(4,"Extubated"),(7,"ACCU"),(13,"Discharged")],
      proc=[(2,7,"Arterial switch operation + ASD closure","OR",["Cardiothoracic surgeon","Anesthesia"])],
      events=[
        (0,9,"result","Pre-op echo","d-TGA, IVS, restrictive PFO s/p BAS, nl coronaries","Heart ultrasound before surgery confirmed the plan.",None),
        (2,7,"procedure","Arterial switch operation","ASO + ASD closure, CPB 186/XC 112, DHCA 0","Heart surgery to switch the two main arteries.","diamond"),
        (2,15,"echo","Post-op echo","Nl biV fxn, no neo-AI, coronaries flow nl","Heart ultrasound after surgery looks good.",None),
        (3,10,"milestone","Inotropes stopped","Milrinone off, VIS 0","Heart-support medicine stopped.","triangle"),
        (4,10,"milestone","Breathing tube removed","Extubated to 1L NC","Breathing tube taken out.","circle"),
        (5,9,"milestone","Chest tubes removed","CT x2 out, CXR no PTX","Chest drainage tubes removed.","square"),
        (7,13,"location","To ACCU","Transfer to step-down","Moved to the step-down heart unit.","flag"),
        (9,8,"milestone","Full oral feeds","PO ad lib 150 mL/kg/d, gaining wt","Taking full feeds by bottle.","circle"),
      ],
      overnight=["Fed every 3h by bottle, all volumes taken", "Weight up 20 g", "No arrhythmia on monitor"],
      priorities=["Car-seat test", "Parent CPR class today", "Discharge on day 13 if weight gain continues"],
      concerns=["Feeding volume / weight gain"],
      cc="Escalate if lactate > 3 or new ST changes"),
 dict(pid="C02", label="Patient C02", age="5 weeks", age_group="Infant", sex="F", weight=3.1,
      admit=date(2026,10,8), status="inpatient", reason="Hypoplastic left heart - stage 1 surgery",
      dx=["Hypoplastic left heart syndrome (HLHS)", "s/p Norwood with Sano shunt"],
      crosscheck=True, direct_flight=False, persona=None,
      steps=[(0,8,"CICU","Extubated",None),(3,7,"OR","Procedure",None),(3,16,"CICU","Intubated","ECMO"),
             (8,10,"CICU","Intubated",None),(14,9,"CICU","Extubated",None),(16,3,"CICU","Intubated",None),
             (20,10,"CICU","Extubated",None),(26,11,"ACCU","ACCU",None)],
      expected=[(0,"Extubated"),(3,"Procedure"),(3.3,"Intubated"),(6,"Extubated"),(12,"ACCU"),(24,"Discharged")],
      proc=[(3,7,"Norwood procedure with RV-PA (Sano) shunt","OR",["Cardiothoracic surgeon","Anesthesia"]),
            (3,16,"ECMO cannulation (chest)","CICU",["Cardiothoracic surgeon","Perfusion / ECMO specialist"]),
            (8,9,"ECMO decannulation, chest closure","OR",["Cardiothoracic surgeon","Anesthesia"])],
      events=[
        (3,7,"procedure","Norwood operation","Norwood/Sano 5mm, CPB 306/XC 68, open chest","Major heart surgery, first of three stages.","diamond"),
        (3,16,"setback","Placed on ECMO","Low CO, lactate 9.2, unable to wean CPB","Put on a heart-lung machine to let the heart rest.","diamond"),
        (6,10,"echo","Echo on ECMO","Mod RV dysfn, mild TR, Sano flow nl","Heart ultrasound shows the heart is recovering.",None),
        (8,9,"milestone","Off ECMO","Decannulated, chest closed POD5","Off the heart-lung machine.","triangle"),
        (14,9,"milestone","Breathing tube removed","Extubated to HFNC 6L","Breathing tube taken out.","circle"),
        (16,3,"setback","Breathing tube put back in","Reintubated - resp failure, ?VAP, RSV neg","Needed the breathing tube again for extra support.",None),
        (20,10,"milestone","Breathing tube removed again","Extubated to 2L NC","Breathing tube out again.","circle"),
        (22,9,"milestone","Inotropes stopped","Epi off, milrinone off","Heart-support medicines stopped.","triangle"),
        (26,11,"location","To ACCU","Transfer to step-down","Moved to the step-down heart unit.","flag"),
        (29,8,"result","Home-monitoring program enrollment","Sats 76-82%, wt check daily","Started training on the home monitoring program.",None),
      ],
      overnight=["Sats 78-81%", "NG feeds advanced to 120 mL/kg/d", "1 episode of emesis"],
      priorities=["G-tube vs NG decision", "Home-monitoring teaching day 2", "Plan interstage cardiology follow-up"],
      concerns=["Feeding intolerance", "Interstage risk at home"],
      cc="Escalate if sats < 70% or > 90%, or lactate > 2.5"),
 dict(pid="C03", label="Patient C03", age="4 months", age_group="Infant", sex="F", weight=5.6,
      admit=date(2026,11,2), status="inpatient", reason="Ventricular septal defect repair",
      dx=["Large perimembranous VSD", "Failure to thrive"],
      crosscheck=False, direct_flight=True, persona=None,
      steps=[(0,6,"OR","Procedure",None),(0,13,"CICU","Intubated",None),(0,21,"CICU","Extubated",None),(2,11,"ACCU","ACCU",None)],
      expected=[(0,"Procedure"),(0.5,"Intubated"),(0.9,"Extubated"),(2,"ACCU"),(5,"Discharged")],
      proc=[(0,6,"VSD patch closure","OR",["Cardiothoracic surgeon","Anesthesia"])],
      events=[
        (0,7,"procedure","VSD repair","Patch closure pmVSD, CPB 92/XC 54","Heart surgery to close the hole between pumping chambers.","diamond"),
        (0,15,"echo","Post-op echo","sm residual LV -> RA shunt (PG=39), nl fxn","Heart ultrasound: the patch is working, tiny leak is expected.",None),
        (0,21,"milestone","Breathing tube removed","Extubated POD0 to RA","Breathing tube taken out the same day.","circle"),
        (1,10,"milestone","Inotropes stopped","Milrinone off","Heart-support medicine stopped.","triangle"),
        (2,9,"milestone","Chest tube removed","CT out, CXR clear","Chest drainage tube removed.","square"),
        (2,11,"location","To ACCU","Transfer to step-down","Moved to the step-down heart unit.","flag"),
      ],
      overnight=["Bottle feeding well", "On oral diuretic, urine output good", "Rhythm normal"],
      priorities=["Pre-discharge echo", "Diuretic plan for home", "Discharge tomorrow"],
      concerns=[], cc="Escalate if junctional rhythm or HR < 90"),
 dict(pid="C04", label="Patient C04", age="6 years", age_group="Child", sex="M", weight=21.0,
      admit=date(2026,10,28), status="discharged", reason="Coarctation of the aorta - catheter treatment",
      dx=["Recurrent coarctation of the aorta"], crosscheck=False, direct_flight=True, persona=None,
      steps=[(0,7,"Cath lab","Procedure",None),(0,11,"ACCU","ACCU",None),(1,14,"Home","Discharged",None)],
      expected=[(0,"Procedure"),(0.2,"ACCU"),(1,"Discharged")],
      proc=[(0,7,"Balloon angioplasty + stent of aortic arch","Cath lab",["Interventional cardiologist","Anesthesia"])],
      events=[
        (0,7,"procedure","Cardiac catheterization","CoA stent 10x26, gradient 32 -> 4 mmHg","Opened a narrow part of the main artery with a small tube (stent).","diamond"),
        (0,11,"location","To ACCU","Post-cath, groin site ok","Moved to the step-down heart unit to rest.","flag"),
        (1,14,"location","Discharged home","BP 104/62 arm/leg equal","Went home the next day.","flag"),
      ],
      overnight=[], priorities=[], concerns=[], cc="Escalate if groin bleeding or absent pedal pulse"),
 dict(pid="C05", label="Patient C05", age="2 years", age_group="Toddler", sex="M", weight=11.8,
      admit=date(2026,10,29), status="inpatient", reason="Single ventricle - stage 2 (Glenn) surgery",
      dx=["Tricuspid atresia", "s/p bidirectional Glenn", "Chylothorax"],
      crosscheck=True, direct_flight=False, persona=None,
      steps=[(0,6,"OR","Procedure",None),(0,13,"CICU","Intubated",None),(1,9,"CICU","Extubated",None),(4,12,"ACCU","ACCU",None)],
      expected=[(0,"Procedure"),(0.5,"Intubated"),(1,"Extubated"),(3,"ACCU"),(7,"Discharged")],
      proc=[(0,6,"Bidirectional Glenn","OR",["Cardiothoracic surgeon","Anesthesia"])],
      events=[
        (0,6,"procedure","Glenn operation","BDG, CPB 98, no XC","Second-stage heart surgery to reroute blood flow.","diamond"),
        (1,9,"milestone","Breathing tube removed","Extubated to 1L NC, sats 82%","Breathing tube taken out.","circle"),
        (2,10,"milestone","Inotropes stopped","Milrinone off","Heart-support medicine stopped.","triangle"),
        (3,8,"setback","Chest tube drainage high (chylothorax)","CT out 25 mL/kg/d milky, TG 340","Fluid from the chest tube is a special type that needs a diet change.",None),
        (3,12,"decision","Started low-fat (MCT) diet","Enfaport, octreotide if no improvement 72h","Switched to a special low-fat formula.","square"),
        (4,12,"location","To ACCU","Transfer with CT in place","Moved to the step-down heart unit with the chest tube still in.","flag"),
        (7,6,"result","Chest tube output falling","CT 8 mL/kg/d","Chest tube drainage is going down.",None),
      ],
      overnight=["Chest tube output 6 mL/kg overnight", "Sats 80-84%", "Tolerating low-fat formula"],
      priorities=["Remove chest tube if < 5 mL/kg/d?", "Diet plan for 6 weeks at home", "Updated discharge date (day 10-11)"],
      concerns=["Chylothorax / chest tube still in"], cc="Escalate if CT output > 20 mL/kg/d or sats < 75%"),
 dict(pid="C06", label="Patient C06", age="16 years", age_group="Adolescent", sex="F", weight=54.0,
      admit=date(2026,11,3), status="inpatient", reason="Heart transplant rejection - missed doses",
      dx=["Acute cellular rejection (ISHLT 2R)", "Heart transplant 3 years ago (dilated cardiomyopathy)"],
      crosscheck=True, direct_flight=False, persona="school_start",
      steps=[(0,14,"CICU","Extubated",None),(1,8,"Cath lab","Procedure",None),(1,11,"CICU","Extubated",None),(3,15,"ACCU","ACCU",None)],
      expected=[(0,"Extubated"),(1,"Procedure"),(1.1,"Extubated"),(2,"ACCU"),(6,"Discharged")],
      proc=[(1,8,"Right heart cath + endomyocardial biopsy","Cath lab",["Interventional cardiologist","Anesthesia"])],
      events=[
        (0,14,"admit","Admitted to CICU","Tachycardia 140, BNP 1,450, tac trough 1.9 (goal 6-8)","Came in with a fast heartbeat. The anti-rejection medicine level was low.",None),
        (0,18,"echo","Echo","LVEF 42% (prior 60%), new pericardial effusion sm","Heart ultrasound shows the heart is pumping weaker than usual.",None),
        (1,8,"procedure","Heart biopsy (cath)","EMBx x5, RA 9, PCWP 16, CI 2.6","Took tiny samples of the heart through a vein.","diamond"),
        (1,16,"therapy","IV steroid pulse + milrinone","Methylpred 10 mg/kg x3, milrinone 0.5","Strong IV medicine to calm the immune reaction, plus heart support.","triangle"),
        (2,10,"result","Biopsy result: rejection","ACR 2R, AMR 0","The immune system is reacting to the heart. This is treatable.",None),
        (2,15,"consult","Psychology consult","Missed PM doses since school started; no one at home at 8pm","Met with the team psychologist about routines.",None),
        (3,10,"milestone","Inotropes stopped","Milrinone off, EF 50% on echo","Heart-support medicine stopped; heart is pumping better.","triangle"),
        (3,15,"location","To ACCU","Transfer to step-down","Moved to the step-down heart unit.","flag"),
      ],
      overnight=["Steroid dose 3 of 3 given", "HR 98, BP normal", "Slept well"],
      priorities=["Switch to once-daily tacrolimus?", "Pill-bottle reminders + school plan", "Repeat echo before discharge"],
      concerns=["Missed doses since school started", "Lower heart function"],
      cc="Escalate if EF < 35%, HR > 150, or new arrhythmia"),
 dict(pid="C07", label="Patient C07", age="10 years", age_group="Child", sex="F", weight=29.5,
      admit=date(2026,10,14), status="discharged", reason="Single ventricle - stage 3 (Fontan) surgery",
      dx=["Double inlet left ventricle", "s/p extracardiac Fontan"],
      crosscheck=True, direct_flight=False, persona=None,
      steps=[(0,6,"OR","Procedure",None),(0,14,"CICU","Intubated",None),(0,20,"CICU","Extubated",None),
             (1,2,"OR","Procedure",None),(1,6,"CICU","Intubated",None),(2,10,"CICU","Extubated",None),
             (4,9,"ACCU","ACCU",None),(12,13,"Home","Discharged",None)],
      expected=[(0,"Procedure"),(0.5,"Intubated"),(0.8,"Extubated"),(3,"ACCU"),(9,"Discharged")],
      proc=[(0,6,"Extracardiac Fontan with fenestration","OR",["Cardiothoracic surgeon","Anesthesia"]),
            (1,2,"Re-exploration for bleeding","OR",["Cardiothoracic surgeon","Anesthesia"])],
      events=[
        (0,6,"procedure","Fontan operation","ECF 20mm, 4mm fen, CPB 142","Third-stage heart surgery.","diamond"),
        (0,20,"milestone","Breathing tube removed","Extubated POD0","Breathing tube taken out.","circle"),
        (1,2,"setback","Unplanned return to OR (bleeding)","CT 12 mL/kg/h x2h, re-explored, suture line bleed","Went back to surgery to stop bleeding.","diamond"),
        (2,10,"milestone","Breathing tube removed","Extubated","Breathing tube taken out again.","circle"),
        (3,10,"milestone","Inotropes stopped","Milrinone off","Heart-support medicine stopped.","triangle"),
        (9,9,"milestone","Chest tubes removed","Pleural drainage resolved","Chest drainage tubes removed.","square"),
        (12,13,"location","Discharged home","Sats 90%, on aspirin + enalapril","Went home.","flag"),
      ],
      overnight=[], priorities=[], concerns=[], cc="Escalate if CT output > 10 mL/kg/h or CVP > 18"),
]

def persona_rate(p, d, n):
    if p == "school_start": return 0.96 - (0.33 if d > n - 70 else 0)
    return 0.97

T = {k: [] for k in ["patients","stays","diagnoses","interventions","care_team","timeline_segments","expected_pathway",
     "milestones","timeline_events_callouts","phase_ratings","conference_markers","notes","daily_support_and_labs",
     "compressed_periods","home_dose_events_90d","outpatient_tacrolimus_levels","bedside_snapshot","what_changed",
     "rounds_actions","family_mode"]}

for s in SCEN:
    pid, a0 = s["pid"], s["admit"]; sid = "S" + pid
    end_dt = NOW if s["status"] == "inpatient" else dt(a0, s["steps"][-1][0], s["steps"][-1][1])
    surg = next((p for p in s["proc"] if p[3] in ("OR", "Cath lab")), None)
    surg_dt = dt(a0, surg[0], surg[1]) if surg else None
    pod = (NOW.date() - surg_dt.date()).days if (surg_dt and s["status"] == "inpatient") else ""
    dos = (NOW.date() - a0).days + 1 if s["status"] == "inpatient" else ""

    T["patients"].append(dict(patient_id=pid, display_label=s["label"], age=s["age"], age_group=s["age_group"], sex=s["sex"],
        current_weight_kg=s["weight"], crosscheck_flag="yes" if s["crosscheck"] else "no",
        mrn="HIDDEN-DEMO", dob="HIDDEN-DEMO", caregiver_contact="Parent/guardian on file (hidden at bedside)"))
    T["stays"].append(dict(stay_id=sid, patient_id=pid, admit_datetime=dt(a0,0,s["steps"][0][1]).isoformat(),
        discharge_datetime=end_dt.isoformat() if s["status"]=="discharged" else "", status=s["status"],
        admit_reason=s["reason"], current_location=s["steps"][-1][2], current_row=s["steps"][-1][3],
        day_of_stay=dos, post_op_day=pod, direct_flight="yes" if s["direct_flight"] else "no"))
    for i, d in enumerate(s["dx"]):
        T["diagnoses"].append(dict(stay_id=sid, rank=i+1, diagnosis=d))
    roles = {"CICU attending","ACCU attending","Primary cardiologist","Cardiology fellow","Nurse practitioner","Bedside nurse","Pharmacist"}
    for (d,h,name,loc,proles) in s["proc"]:
        team = {r: random.choice(STAFF[r]) for r in proles}; roles |= set(proles)
        T["interventions"].append(dict(stay_id=sid, datetime=dt(a0,d,h).isoformat(), procedure=name, location=loc,
            weight_kg=s["weight"], team=" | ".join(f"{r}: {n}" for r,n in team.items())))
    if any(st[4]=="ECMO" for st in s["steps"]): roles.add("Perfusion / ECMO specialist")
    if s["persona"]: roles |= {"Heart transplant coordinator","Psychologist","Social worker"}
    for r in sorted(roles):
        T["care_team"].append(dict(stay_id=sid, role=r, name=random.choice(STAFF[r])))

    for i,(d,h,loc,row,ther) in enumerate(s["steps"]):
        st = dt(a0,d,h)
        en = dt(a0, s["steps"][i+1][0], s["steps"][i+1][1]) if i+1 < len(s["steps"]) else end_dt
        if loc == "Home": en = st
        T["timeline_segments"].append(dict(stay_id=sid, seq=i+1, start=st.isoformat(), end=en.isoformat(),
            location=loc, color_hex=LOC_COLOR[loc][0], color_name=LOC_COLOR[loc][1], row=row, row_level=ROWS[row],
            shading="ECMO" if ther=="ECMO" else "", day_of_stay=d+1,
            post_op_day=(st.date()-surg_dt.date()).days if surg_dt and st >= surg_dt else ""))
    for d,row in s["expected"]:
        T["expected_pathway"].append(dict(stay_id=sid, day_offset=d, expected_row=row, expected_level=ROWS[row]))

    for j,(d,h,kind,title,clin,fam,sym) in enumerate(s["events"]):
        t = dt(a0,d,h)
        if t > NOW: continue
        eid = f"{sid}-E{j+1:02d}"
        T["timeline_events_callouts"].append(dict(event_id=eid, stay_id=sid, datetime=t.isoformat(), day_of_stay=d+1,
            post_op_day=(t.date()-surg_dt.date()).days if surg_dt and t >= surg_dt else "", kind=kind, title=title,
            clinical_shorthand=clin, family_text=fam,
            new_in_last_24h="yes" if NOW - t <= timedelta(hours=24) else "no"))
        if sym:
            T["milestones"].append(dict(stay_id=sid, event_id=eid, datetime=t.isoformat(), milestone=title, symbol=sym))
        T["notes"].append(dict(note_id=f"N{len(T['notes'])+1:03d}", stay_id=sid, linked_event_id=eid,
            datetime=(t+timedelta(minutes=random.randint(20,150))).isoformat(),
            note_type={"procedure":"Operative / procedure note","echo":"Echo report","consult":"Consult note",
                       "setback":"Event note"}.get(kind,"Progress note"),
            author_role=random.choice(["Cardiology fellow","Nurse practitioner","CICU attending"]),
            text=f"{title}. {clin}. (Placeholder note text - made up.)"))

    # phase ratings - review only
    phases = []
    for st in s["steps"]:
        ph = {"OR":"Operating room","Cath lab":"Cath lab","CICU":"CICU","ACCU":"ACCU","Home":None}[st[2]]
        if ph and ph not in phases: phases.append(ph)
    for ph in phases:
        dot, score = "green", random.choice([3,4])
        if pid=="C02" and ph=="CICU": dot, score = "red", 2      # ECMO + reintubation
        if pid=="C07" and ph=="Operating room": dot, score = "red", 2  # unplanned return to OR
        if pid=="C05" and ph=="CICU": dot = "yellow"
        if pid=="C06" and ph=="CICU": dot = "yellow"
        T["phase_ratings"].append(dict(stay_id=sid, phase=ph, team_score=score,
            score_meaning={4:"outstanding",3:"good",2:"sub-optimal",1:"poor"}[score], outcome_dot=dot, review_only="yes"))

    # weekly Performance Rounds (Thursdays) during or after stay
    d = a0
    while d <= min(end_dt.date() + timedelta(days=7), NOW.date()):
        if d.weekday() == 3 and d > a0:
            T["conference_markers"].append(dict(stay_id=sid, date=d.isoformat(), conference="FlightPlan conference (Performance Rounds)",
                grouped_as="Direct Flight" if s["direct_flight"] else "Discussed case"))
        d += timedelta(days=1)

    # daily support & labs
    n = (end_dt.date() - a0).days + 1
    for k in range(n):
        tday = dt(a0,k,6)
        seg = [x for x in T["timeline_segments"] if x["stay_id"]==sid and x["start"] <= tday.isoformat() <= x["end"]]
        row = seg[-1]["row"] if seg else s["steps"][0][3]
        ecmo = bool(seg and seg[-1]["shading"]=="ECMO")
        post = surg_dt is not None and tday > surg_dt
        days_post = (tday - surg_dt).days if post else -1
        vis = 0 if not post else max(0, round((14 if ecmo else 10) - 3*days_post + random.uniform(-1,1)))
        if pid=="C02" and 3<=k<=21: vis = max(vis, 8 if k<15 else 4)
        if pid=="C06": vis = 5 if k in (1,2) else 0
        T["daily_support_and_labs"].append(dict(stay_id=sid, datetime=tday.isoformat(), day_of_stay=k+1,
            post_op_day=days_post if post else "", respiratory_support={"Intubated":"Ventilator","Extubated":"Nasal cannula / HFNC",
            "ACCU":"Room air / low-flow","Procedure":"Ventilator","Discharged":"Room air"}[row] + (" + ECMO" if ecmo else ""),
            vasoactive_inotropic_score=vis, lactate=round(max(0.8, (6 if ecmo else 1.2) + random.uniform(-0.4,0.6)),1),
            spo2_pct=random.randint(76,84) if pid in ("C02","C05") else random.randint(94,100),
            hemoglobin=round(random.uniform(10,15),1), creatinine=round(random.uniform(0.2,0.6) if s["weight"]<15 else random.uniform(0.4,0.8),2),
            chest_tube_output_ml_kg=(25 if (pid=="C05" and k==3) else max(0, 25-4*(k-3)) if pid=="C05" and k>3 else (round(random.uniform(1,6),1) if post and days_post<3 else 0)),
            tacrolimus_trough=({0:1.9,1:3.5,2:5.6,3:6.8}.get(k,"") if pid=="C06" else "")))

    # compressed quiet stretches (zigzag) - >=3 days with no events
    evdays = sorted({e[0] for e in s["events"]} | {st[0] for st in s["steps"]})
    for a,b in zip(evdays, evdays[1:]):
        if b - a >= 4:
            T["compressed_periods"].append(dict(stay_id=sid, from_day=a+2, to_day=b, reason="No events - compress with zigzag"))

    # adherence layer (teen heart transplant only)
    if s["persona"]:
        N, taken = 90, []
        for d in range(N):
            day = a0 - timedelta(days=N-d); cnt = 0
            for slot,hr in (("AM",8),("PM",20)):
                r = persona_rate(s["persona"], d, N) - (0.25 if slot=="PM" and day.weekday()<5 and d>N-70 else 0)
                if random.random() < r:
                    late = random.random() < 0.12; cnt += 1
                    T["home_dose_events_90d"].append(dict(patient_id=pid, date=day.isoformat(), slot=slot, scheduled=f"{hr:02d}:00",
                        status="late" if late else "on_time", source="Smart pill bottle"))
                else:
                    T["home_dose_events_90d"].append(dict(patient_id=pid, date=day.isoformat(), slot=slot, scheduled=f"{hr:02d}:00",
                        status="missed", source="Smart pill bottle"))
            taken.append(cnt/2)
        for d,v in zip(range(5,N,21), [7.2,6.8,3.1,8.4,2.6]):
            T["outpatient_tacrolimus_levels"].append(dict(patient_id=pid, date=(a0-timedelta(days=N-d)).isoformat(),
                tacrolimus_trough=v, target_low=6, target_high=8))

    if s["status"] == "inpatient":
        pd = [x for x in T["home_dose_events_90d"] if x["patient_id"]==pid][-60:]
        lv = [x["tacrolimus_trough"] for x in T["outpatient_tacrolimus_levels"] if x["patient_id"]==pid]
        exp_row_now = [r for d,r in s["expected"] if d <= (NOW.date()-a0).days][-1]
        T["bedside_snapshot"].append(dict(stay_id=sid, patient_id=pid, as_of=NOW.isoformat(), age=s["age"],
            location=s["steps"][-1][2], row=s["steps"][-1][3], expected_row_today=exp_row_now,
            on_track="yes" if ROWS[s["steps"][-1][3]] <= ROWS[exp_row_now] else "behind",
            day_of_stay=dos, post_op_day=pod, key_diagnoses=" | ".join(s["dx"]),
            active_concerns=" | ".join(s["concerns"]), todays_priorities=" | ".join(s["priorities"]),
            course_correction_threshold=s["cc"],
            doses_taken_30d_before_admit_pct=round(100*sum(x["status"]!="missed" for x in pd)/len(pd)) if pd else "",
            tac_variability_MLVI=round(statistics.stdev(lv),2) if len(lv)>=3 else ""))
        for c in s["overnight"]:
            T["what_changed"].append(dict(stay_id=sid, window="overnight", category="overnight", item=c))
        for e in T["timeline_events_callouts"]:
            if e["stay_id"]==sid and e["new_in_last_24h"]=="yes":
                T["what_changed"].append(dict(stay_id=sid, window="last 24h", category=e["kind"], item=f"{e['title']} - {e['clinical_shorthand']}"))
        T["family_mode"].append(dict(stay_id=sid, headline={
            "C01":"Surgery went well and he is feeding by bottle. We're getting ready for home.",
            "C02":"It's been a long road, with a heart-lung machine and a breathing tube twice. She is now on the step-down unit, learning to feed.",
            "C03":"The hole is closed and she's eating well. Home is likely tomorrow.",
            "C05":"Surgery went well. A chest tube is still draining a special fluid, so he is on a low-fat formula.",
            "C06":"The heart had a rejection episode. Treatment is working. Today we plan how medicines fit school days."}[pid],
            todays_plan=" | ".join(p for p in s["priorities"] if "?" not in p),
            hide_in_family_mode="phase ratings | MRN/DOB/contact | weight | conference markers | clinical shorthand | adherence %"))

ACTIONS = [
 ("SC01","task","Car-seat test before discharge","Bedside nurse",8),
 ("SC01","family_update","Reviewed discharge timeline with parents","Nurse practitioner",None),
 ("SC02","decision","Place G-tube before discharge","CICU attending",None),
 ("SC02","consult","Surgery consult for G-tube timing","Cardiothoracic surgeon",24),
 ("SC02","follow_up","Interstage clinic visit within 1 week of discharge","Primary cardiologist",240),
 ("SC03","task","Pre-discharge echo","Cardiology fellow",6),
 ("SC05","contingency","If CT output > 10 mL/kg tonight -> start octreotide, call fellow","Cardiology fellow",None),
 ("SC05","question","Can chest tube come out tomorrow?","Cardiothoracic surgeon",24),
 ("SC06","decision","Switch to once-daily extended-release tacrolimus","Primary cardiologist",None),
 ("SC06","task","Set up smart pill-bottle reminders + school nurse letter","Heart transplant coordinator",30),
 ("SC06","follow_up","Repeat tacrolimus level 5 days after switch","Nurse practitioner",144),
 ("SC06","family_update","Explained biopsy result in plain words; asked about returning to dance","Cardiology fellow",None),
]
for i,(sid,typ,txt,owner,due_h) in enumerate(ACTIONS):
    T["rounds_actions"].append(dict(action_id=f"A{i+1:03d}", stay_id=sid, captured_at=NOW.isoformat(), type=typ, text=txt,
        owner_role=owner, due=(NOW+timedelta(hours=due_h)).isoformat() if due_h else "",
        status="done" if typ=="family_update" else ("recorded" if typ=="decision" else "open"),
        family_visible="yes" if typ in ("family_update","follow_up") else "no"))

for name, rows in T.items():
    if not rows: continue
    with open(os.path.join(OUT, f"{name}.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

for p in T["patients"]:
    pid = p["patient_id"]; sid = "S"+pid
    by = lambda k, key="stay_id", v=sid: [r for r in T[k] if r.get(key)==v]
    json.dump(dict(patient=p, stay=by("stays")[0], snapshot=(by("bedside_snapshot") or [None])[0],
        diagnoses=by("diagnoses"), interventions=by("interventions"), care_team=by("care_team"),
        timeline=dict(segments=by("timeline_segments"), expected_pathway=by("expected_pathway"), milestones=by("milestones"),
            events=by("timeline_events_callouts"), compressed=by("compressed_periods"),
            ratings_review_only=by("phase_ratings"), conferences=by("conference_markers")),
        what_changed=by("what_changed"), daily=by("daily_support_and_labs"), notes=by("notes"),
        rounds_actions=by("rounds_actions"), family_mode=(by("family_mode") or [None])[0],
        adherence=dict(home_doses_90d=by("home_dose_events_90d","patient_id",pid),
            outpatient_tac_levels=by("outpatient_tacrolimus_levels","patient_id",pid))),
        open(os.path.join(OUT,"json",f"{pid}.json"),"w"), indent=1)

for k,v in T.items(): print(f"{k:32s}{len(v)}")
