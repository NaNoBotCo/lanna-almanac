# วันเมือง — Lanna Almanac widget

One self-contained HTML file that reckons the day the Northern way: the lunar day in
the Northern months (แฮม, not แรม), the Chulasakarat year and its animal in the Lanna
forms, วันศีล, and the festivals of the North with their เป็ง names derived from the
Northern month number. No network, no build at view time — the file keeps working
wherever it is carried.

**Open it:** `~/Desktop/Lanna Almanac.html` (a copy of `out/almanac.html`).

## Where the reckoning comes from

`almanac.js` is a line-faithful port of the Coucal Clock's
`coucal/almanac/{thai,lanna}.py`: the published Thai calendar for พ.ศ. ๒๕๖๙
(Thai PBS wan-phra table) supplies ~50 anchor days; everything between is derived by
counting, and the count must land exactly on each next anchor or the build throws.
Outside the table the widget says บ่ฮู้ข้างขึ้นข้างแฮม rather than extrapolate.

**One deliberate divergence:** the animal-year offset. Coucal uses
`(year + 543 + 4) % 12`, which lands one animal early (its own docstring cross-check
says 2026 is ปีสะง้า/มะเมีย, the horse; the formula yields the snake). This port uses
`+ 5`, pinned in `test_parity.py` against fixed anchors (2020 rat, 2025 snake,
2026 horse, turning at Songkran). A fix for the clock itself is flagged separately.

The sixty-name มื้อ cycle stays deliberately absent, same as the clock — it needs a
verified epoch anchor first.

## Files

| file | role |
|---|---|
| `almanac.js` | the reckoning — anchors + counting + Northern reading; runs in browser and node |
| `template.html` | the face — UI, styling, moon rendering |
| `build.py` | inlines `almanac.js` into the template → `out/almanac.html` + Desktop copy |
| `test_parity.py` | compares every field of every day (390 days) against the Python original |
| `out/almanac.html` | the built widget (committed — it is the deliverable) |

## Working on it

```bash
/opt/homebrew/bin/python3.13 test_parity.py   # needs 3.10+; system python3 is 3.9
python3 build.py
```

Edit `template.html` or `almanac.js`, never `out/almanac.html`. If a reckoning rule
changes, change it in the Coucal Clock first and re-port — the clock is the master.
When the next year's wan-phra table is published, extend `ANCHORS` (and the clock's
`data/tables/`) and the widget's reach grows with it.
