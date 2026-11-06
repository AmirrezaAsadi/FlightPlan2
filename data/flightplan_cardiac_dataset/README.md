# FlightPlan Bedside — Synthetic CARDIAC Dataset

**Everything here is made up.** No real patients, staff, MRNs, names or dates of birth.
The MRN and DOB fields are filled with `HIDDEN-DEMO` so you can show what gets hidden at the bedside.
"Now" (rounds time) is **2026-11-06 07:30**.

It matches the FlightPlan Hackathon Brief: the Heart Institute population, the same timeline rows, colors, layers and terms.

## The 7 patients

| Patient | Age | Story | Status | Shows |
|---|---|---|---|---|
| C01 | 9 days | Arterial switch for d-TGA, smooth | Inpatient, ACCU, POD 9 | **Direct Flight**, all green |
| C02 | 5 weeks | HLHS Norwood → **ECMO** → off ECMO → extubated → **reintubated** → extubated | Inpatient, ACCU, day 30 | Long stay, setbacks, ECMO shading, compressed quiet stretches, red rating, **behind pathway** |
| C03 | 4 months | VSD patch repair; callout "sm LV → RA shunt (PG=39)" | Inpatient, ACCU, POD 4 | Direct Flight, short stay |
| C04 | 6 years | Cath lab coarctation stent (pink) | Discharged | Short cath-lab stay |
| C05 | 2 years | Glenn, then chylothorax with the chest tube still in | Inpatient, ACCU, POD 8 | Yellow deviation, **behind pathway** |
| C06 | 16 years | **Heart transplant rejection after missed evening doses once school started** | Inpatient, ACCU | Cath biopsy, steroids, and the **medicine-taking layer** (40% of doses taken, MLVI 2.6) |
| C07 | 10 years | Fontan, **unplanned return to OR** for bleeding | Discharged | Red outcome dot, climb back up the line |

## Files → the brief

| Brief element | File |
|---|---|
| Patient information (identifiers, weight, caregiver, CrossCheck flag) | `patients.csv` |
| Diagnoses | `diagnoses.csv` |
| Interventions with date, time, weight and care team | `interventions.csv` |
| Care team by role | `care_team.csv` |
| Timeline line: rows Procedure / Intubated / Extubated / ACCU / Discharged | `timeline_segments.csv` (`row`, `row_level` 5→1) |
| Location colors (purple OR, pink cath, orange CICU, blue ACCU) | `timeline_segments.csv`: `color_hex`, `color_name` and `location` text |
| ECMO shading | `timeline_segments.csv` → `shading` |
| Pathway (dashed expected course) | `expected_pathway.csv` |
| Course Correction (dotted) thresholds | `bedside_snapshot.csv` → `course_correction_threshold` |
| Milestone symbols (inotropes off, chest tubes out, extubation, off ECMO…) | `milestones.csv` |
| Callout boxes | `timeline_events_callouts.csv`: `clinical_shorthand` **and** `family_text` |
| Phase ratings (1–4 score + green/yellow/red dot) | `phase_ratings.csv` (all marked `review_only=yes`) |
| Conference markers / Direct Flights | `conference_markers.csv`, `stays.csv` → `direct_flight` |
| POD row | `post_op_day` on segments, events and daily rows |
| Zigzag compression of quiet stretches | `compressed_periods.csv` |
| Notes linked to timeline events | `notes.csv` → `linked_event_id` |
| **Bedside snapshot** | `bedside_snapshot.csv`: location, row vs expected row today, on track, POD, diagnoses, concerns, priorities |
| **What changed** | `what_changed.csv` |
| **Capture on rounds** with owners | `rounds_actions.csv` |
| **Family-present mode** | `family_mode.csv` |
| Daily support and labs (vent, VIS, lactate, SpO2, chest tube output…) | `daily_support_and_labs.csv` |
| Medicine-taking layer (C06) | `home_dose_events_90d.csv`, `outpatient_tacrolimus_levels.csv` |

`json/C0X.json` has everything for one patient, nested for a front-end.
Regenerate with `python3 gen_flightplan_cardiac.py`. The seed is fixed, so the output is the same every time.
