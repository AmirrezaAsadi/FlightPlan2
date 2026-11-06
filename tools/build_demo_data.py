#!/usr/bin/env python3
"""Build demo/data.js from the synthetic dataset + the hand-curated overlay.

    python3 tools/build_demo_data.py

Reads  data/flightplan_cardiac_dataset/*.csv  and  data/demo_overlay.json
Writes demo/data.js  (a plain <script> file, so the demo opens from disk with no server)

All data is made up. No real patients.
"""
import csv
import json
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DS = ROOT / "data" / "flightplan_cardiac_dataset"
OVERLAY = json.loads((ROOT / "data" / "demo_overlay.json").read_text())
OUT = ROOT / "demo" / "data.js"

# Events of these kinds may appear on the family room screen once reviewed.
# Results, echoes, setbacks, consults and admissions are talked through in person first (§10.2, §19.4).
ROOM_SCREEN_KINDS = {"milestone", "location", "procedure", "decision", "therapy"}

EVENT_ICONS = {
    "procedure": "hands", "location": "bed", "decision": "clipboard", "therapy": "drop",
    "result": "clipboard", "echo": "heart", "setback": "clipboard", "consult": "people", "admit": "hospital",
}
MILESTONE_ICONS = [("breathing", "breath"), ("inotrope", "heart"), ("chest tube", "check"),
                   ("feed", "bottle"), ("diet", "bottle"), ("accu", "bed")]


def rows(name):
    with open(DS / name, newline="") as f:
        return list(csv.DictReader(f))


def by_stay(name, key="stay_id"):
    out = {}
    for r in rows(name):
        out.setdefault(r[key], []).append(r)
    return out


def split(s):
    return [x.strip() for x in (s or "").split("|") if x.strip()]


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def num(s):
    if s in ("", None):
        return None
    try:
        return int(s)
    except ValueError:
        return float(s)


def milestone_icon(title):
    t = title.lower()
    for k, icon in MILESTONE_ICONS:
        if k in t:
            return icon
    return "star"


def main():
    patients = {r["patient_id"]: r for r in rows("patients.csv")}
    stays = {r["patient_id"]: r for r in rows("stays.csv")}
    snaps = {r["stay_id"]: r for r in rows("bedside_snapshot.csv")}
    fam = {r["stay_id"]: r for r in rows("family_mode.csv")}
    segs, path, events = by_stay("timeline_segments.csv"), by_stay("expected_pathway.csv"), by_stay("timeline_events_callouts.csv")
    team, dx, interv = by_stay("care_team.csv"), by_stay("diagnoses.csv"), by_stay("interventions.csv")
    changed, actions, ratings = by_stay("what_changed.csv"), by_stay("rounds_actions.csv"), by_stay("phase_ratings.csv")
    fixes = OVERLAY.get("dataFixes", [])

    out = {"now": OVERLAY["now"], "patients": {}, "dataFixes": fixes}
    for pid, ov in OVERLAY["patients"].items():
        p, st = patients[pid], stays[pid]
        sid = st["stay_id"]
        sn = snaps.get(sid, {})
        admit = datetime.fromisoformat(st["admit_datetime"])
        day1 = admit.replace(hour=0, minute=0, second=0)

        segments = []
        for s in segs.get(sid, []):
            s = dict(s)
            for fx in fixes:
                if fx["stay"] == sid and int(fx["seq"]) == int(s["seq"]) and s[fx["field"]] == fx["from"]:
                    s[fx["field"]] = fx["to"]
            segments.append({"seq": int(s["seq"]), "start": s["start"], "end": s["end"], "location": s["location"],
                             "color": s["color_hex"], "row": s["row"], "level": int(s["row_level"]),
                             "shading": s["shading"] or None})

        pathway = [{"dayOffset": float(r["day_offset"]), "row": r["expected_row"], "level": int(r["expected_level"])}
                   for r in path.get(sid, [])]
        home_offset = next((x["dayOffset"] for x in pathway if x["row"] == "Discharged"), None)

        evs = []
        for e in events.get(sid, []):
            kind = e["kind"]
            new = e["new_in_last_24h"] == "yes"
            evs.append({
                "id": e["event_id"], "at": e["datetime"], "day": num(e["day_of_stay"]), "pod": num(e["post_op_day"]),
                "kind": kind, "title": e["title"], "shorthand": e["clinical_shorthand"], "familyText": e["family_text"],
                "new24h": new,
                "icon": milestone_icon(e["title"]) if kind == "milestone" else EVENT_ICONS.get(kind, "star"),
                # Older events were reviewed already; new ones go through the care-team review queue.
                "roomScreen": ("published" if not new else "pending") if kind in ROOM_SCREEN_KINDS else "talk-first",
            })

        drafts = ov.get("overnightDrafts", [])
        wc = []
        for i, w in enumerate(changed.get(sid, [])):
            d = next((d for d in drafts if w["item"].startswith(d["match"])), None) or {}
            wc.append({"id": f"{sid}-W{i+1}", "window": w["window"], "category": w["category"], "item": w["item"],
                       "draft": d.get("text"), "icon": d.get("icon"), "rule": d.get("rule", "review"), "why": d.get("why")})

        dis = ov["discharge"]
        ts = dis.get("teamStated")
        team_dates = None
        if ts:
            days = ts.get("dayRange") or [ts["day"]]
            team_dates = [iso(day1 + timedelta(days=d - 1)) for d in days]
        out["patients"][pid] = {
            "id": pid, "stayId": sid, "room": ov["room"], "firstName": ov["firstName"], "pronouns": ov["pronouns"],
            "childWord": ov["childWord"], "displayLabel": p["display_label"], "age": p["age"], "ageGroup": p["age_group"],
            "sex": p["sex"], "weightKg": float(p["current_weight_kg"]), "crosscheck": p["crosscheck_flag"] == "yes",
            "mrn": p["mrn"], "dob": p["dob"], "caregiver": p["caregiver_contact"],
            "admit": st["admit_datetime"], "admitReason": st["admit_reason"], "status": st["status"],
            "dayOfStay": num(st["day_of_stay"]), "pod": num(st["post_op_day"]),
            "location": st["current_location"], "row": st["current_row"], "directFlight": st["direct_flight"] == "yes",
            "snapshot": {
                "expectedRowToday": sn.get("expected_row_today"), "onTrack": sn.get("on_track"),
                "keyDiagnoses": split(sn.get("key_diagnoses")), "activeConcerns": split(sn.get("active_concerns")),
                "priorities": split(sn.get("todays_priorities")), "threshold": sn.get("course_correction_threshold"),
                "dosesTakenPct": num(sn.get("doses_taken_30d_before_admit_pct")), "mlvi": num(sn.get("tac_variability_MLVI")),
            },
            "diagnoses": [d["diagnosis"] for d in sorted(dx.get(sid, []), key=lambda r: int(r["rank"]))],
            "interventions": [{"at": r["datetime"], "procedure": r["procedure"], "location": r["location"]} for r in interv.get(sid, [])],
            "careTeam": [{"role": r["role"], "name": r["name"]} for r in team.get(sid, [])],
            "segments": segments, "pathway": pathway, "events": evs, "whatChanged": wc,
            "actions": [{"id": a["action_id"], "type": a["type"], "text": a["text"], "owner": a["owner_role"],
                         "due": a["due"] or None, "status": a["status"], "familyVisible": a["family_visible"] == "yes"}
                        for a in actions.get(sid, [])],
            "ratings": [{"phase": r["phase"], "score": int(r["team_score"]), "dot": r["outcome_dot"]} for r in ratings.get(sid, [])],
            "family": {"datasetHeadline": fam.get(sid, {}).get("headline"), "roomHeadline": ov["roomHeadline"],
                       "today": ov["todayFamily"], "hide": split(fam.get(sid, {}).get("hide_in_family_mode"))},
            "discharge": {
                # System suggestion from the expected pathway (rule-based, explainable).
                "pathwayDate": iso(day1 + timedelta(days=home_offset)) if home_offset is not None else None,
                "pathwayDay": int(home_offset) + 1 if home_offset is not None else None,
                # What the team has actually stated in today's data. null = nothing stated -> family sees "soon".
                "teamDates": team_dates, "teamSource": ts["source"] if ts else None,
                "changes": dis.get("changes", []), "criteria": dis["criteria"],
            },
        }

    OUT.write_text("// GENERATED by tools/build_demo_data.py from data/ — do not edit by hand.\n"
                   "// All data is synthetic (made up).\n"
                   "window.FP_DATA = " + json.dumps(out, indent=1) + ";\n")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB, {len(out['patients'])} patients)")


if __name__ == "__main__":
    main()
