#!/usr/bin/env python3
"""Parity: the JS port must agree with the Coucal Clock's Python reckoning on every day.

Walks the whole authority-table span (plus a margin of unknown days on each side) and
compares every field the widget shows — lunar text, month, วันศีล, festival, CS year,
animal — between coucal.almanac (the original) and almanac.js run under node.

Run:  python3 test_parity.py
"""
from __future__ import annotations

import json
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
COUCAL_SRC = Path.home() / "Developer" / "claude code projects" / "coucal-clock" / "src"
sys.path.insert(0, str(COUCAL_SRC))

from coucal.almanac import lanna, thai  # noqa: E402

MARGIN = 10  # days of known=False territory to check on each side of the table


def expected() -> dict[str, dict]:
    span = thai.table_span()
    assert span, "coucal authority table missing"
    start, end = span[0] - timedelta(days=MARGIN), span[1] + timedelta(days=MARGIN)
    out: dict[str, dict] = {}
    cursor = start
    while cursor <= end:
        ld = lanna.lanna_day(cursor)
        fest = lanna.festival_on(cursor)
        out[cursor.isoformat()] = {
            "known": ld.known,
            "csYear": ld.cs_year,
            "animalLanna": ld.animal_lanna,
            "animalThai": ld.animal_thai,
            "phase": ld.phase,
            "day": ld.day,
            "month": str(ld.month) if ld.month is not None else None,
            "monthName": ld.month_name,
            "isWanSin": ld.is_wan_sin,
            "lunarText": ld.lunar_text,
            "yearText": ld.year_text,
            "festival": fest.name_lanna if fest else None,
        }
        cursor += timedelta(days=1)
    return out


def actual(start: str, end: str) -> dict[str, dict]:
    js = f"""
    const A = require({json.dumps(str(HERE / "almanac.js"))});
    const out = {{}};
    let cursor = {json.dumps(start)};
    while (cursor <= {json.dumps(end)}) {{
      const ld = A.lannaDay(cursor);
      const fest = A.festivalOn(cursor);
      out[cursor] = {{
        known: ld.known, csYear: ld.csYear, animalLanna: ld.animalLanna,
        animalThai: ld.animalThai, phase: ld.phase, day: ld.day,
        month: ld.month, monthName: ld.monthName, isWanSin: ld.isWanSin,
        lunarText: ld.lunarText, yearText: ld.yearText,
        festival: fest ? fest.nameLanna : null,
      }};
      cursor = A.addDays(cursor, 1);
    }}
    process.stdout.write(JSON.stringify(out));
    """
    res = subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def main() -> int:
    exp = expected()
    days = sorted(exp)
    # The JS table extends into พ.ศ. 2570 (2027), which coucal does not know yet, so
    # strict parity runs only through coucal's last known day; the extension is
    # validated separately below. Python's span end = last day before the MARGIN.
    coucal_end = days[-1 - MARGIN]
    act = actual(days[0], "2028-01-15")

    # Animal-year fields are compared strictly too: coucal's old (year + 543 + 4) % 12
    # was one animal early and was fixed to the same +5 as this port on 2026-07-26.
    # The real-world anchors below still pin the cycle independently of parity.
    mismatches = []
    for day in days:
        if day > coucal_end:
            continue
        if exp[day] != act.get(day, {}):
            mismatches.append((day, exp[day], act.get(day)))

    # Independent spot-checks of the tradition's own anchor facts.
    span_known = [d for d in days if exp[d]["known"]]
    checks = [
        # Yi Peng: central month 12 full moon reads as ยี่เป็ง in the North.
        (exp["2026-11-24"]["festival"] == "ยี่เป็ง", "Yi Peng on 2026-11-24"),
        # Adhikamasa: Asalha only on the SECOND eighth month (29 Jul, not 29 Jun).
        (exp["2026-06-29"]["festival"] is None, "no Asalha on first 8th month"),
        (exp["2026-07-29"]["festival"] == "เดือนสิบเป็ง", "Asalha on 8b full moon"),
        # ปี๋ใหม่เมือง fixed solar.
        (exp["2026-04-13"]["festival"] == "ปี๋ใหม่เมือง", "Pi Mai Mueang on 13 Apr"),
        # Wan sin density sanity: ~4 per lunar month.
        (40 < sum(exp[d]["isWanSin"] for d in span_known) < 60, "wan sin count plausible"),
        # Animal-year anchors (JS side): 2025 = snake, 2026 = horse, turning at
        # Songkran — so Jan 2026 still reads snake. Fixed real-world facts.
        (act["2026-01-10"]["animalThai"] == "มะเส็ง", "Jan 2026 still snake"),
        (act["2026-07-26"]["animalThai"] == "มะเมีย", "post-Songkran 2026 is horse"),
        (act["2026-07-26"]["animalLanna"] == "สะง้า", "Lanna form is สะง้า"),
        # ---- พ.ศ. 2570 extension (JS only; coucal has no 2570 table yet). ----
        # The year bridge itself is proven by the drift check: counting from the last
        # 2569 anchor (2026-12-24, ขึ้น ๑๕ เดือนอ้าย) must land exactly on every 2570
        # anchor, or buildCalendar throws and `actual` fails outright.
        # Festival dates below come from calendar.kapook.com/2570 — an independent
        # source from the myhora anchor table.
        (act["2027-02-21"]["festival"] == "เดือนห้าเป็ง", "Makha 2027 on 21 Feb (kapook)"),
        (act["2027-05-20"]["festival"] == "เดือนแปดเป็ง", "Visakha 2027 on 20 May (kapook)"),
        (act["2027-07-18"]["festival"] == "เดือนสิบเป็ง", "Asalha 2027 on 18 Jul (kapook)"),
        (act["2027-11-13"]["festival"] == "ยี่เป็ง", "Yi Peng 2027 on 13 Nov (kapook)"),
        (act["2027-06-29"]["festival"] is None, "no phantom Asalha in 2027 (not adhikamasa)"),
        # CS year turns 16 Apr; myhora computes เถลิงศก 2570 = 16 Apr 2027 — same day.
        (act["2027-04-15"]["csYear"] == 1388, "CS still 1388 on 15 Apr 2027"),
        (act["2027-04-16"]["csYear"] == 1389, "CS 1389 from 16 Apr 2027"),
        # 2027 post-Songkran is the goat year (มะแม/เม็ด).
        (act["2027-07-26"]["animalThai"] == "มะแม", "post-Songkran 2027 is goat"),
        (act["2027-07-26"]["animalLanna"] == "เม็ด", "Lanna form is เม็ด"),
        # Vassa eve reads correctly and the day after is แรม ๑ (Khao Phansa).
        (act["2027-07-19"]["lunarText"].startswith("แฮม ๑ ค่ำ"), "Khao Phansa 2027 = แฮม ๑ ค่ำ"),
        # The table's new edge: known through 2027-12-27, unknown after it.
        (act["2027-12-27"]["known"] is True, "known through 27 Dec 2027"),
        (act["2027-12-28"]["known"] is False, "unknown after the 2570 table"),
    ]
    failed_checks = [label for ok, label in checks if not ok]

    print(f"days compared: {len(days)} ({days[0]} → {days[-1]}), known: {len(span_known)}")
    if mismatches:
        for day, e, a in mismatches[:10]:
            print(f"MISMATCH {day}\n  py: {e}\n  js: {a}")
        print(f"FAIL: {len(mismatches)} mismatching day(s)")
        return 1
    if failed_checks:
        print("FAIL: " + ", ".join(failed_checks))
        return 1
    print("PASS: JS port agrees with coucal.almanac on every field of every day")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
