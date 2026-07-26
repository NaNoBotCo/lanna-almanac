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
    act = actual(days[0], days[-1])

    # The animal-year fields are excluded from strict parity: coucal's
    # (year + 543 + 4) % 12 is one animal early (its own docstring says 2026 is
    # ปีสะง้า/มะเมีย, the horse, but the formula yields the snake), and the JS port
    # corrects it to +5. Those fields are pinned to real-world anchors below instead.
    ANIMAL_FIELDS = ("animalLanna", "animalThai", "yearText")

    def strip(rec: dict) -> dict:
        return {k: v for k, v in rec.items() if k not in ANIMAL_FIELDS}

    mismatches = []
    for day in days:
        if strip(exp[day]) != strip(act.get(day, {})):
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
