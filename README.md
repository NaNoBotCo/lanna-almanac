# วันเมือง — Lanna Almanac widget

One self-contained HTML file that reckons the day the Northern way: the lunar day in
the Northern months (แฮม, not แรม), the Chulasakarat year and its animal in the Lanna
forms, วันศีล, and the festivals of the North with their เป็ง names derived from the
Northern month number. No network, no build at view time — the file keeps working
wherever it is carried.

**Open it:** `~/Desktop/Lanna Almanac.html` (a copy of `out/almanac.html`).

## Where the reckoning comes from

`almanac.js` is a line-faithful port of the Coucal Clock's
`coucal/almanac/{thai,lanna}.py`: the published Thai calendar supplies anchor days
(~50 per year); everything between is derived by counting, and the count must land
exactly on each next anchor or the build throws. Outside the table the widget says
บ่ฮู้ข้างขึ้นข้างแฮม rather than extrapolate.

The table covers **พ.ศ. ๒๕๖๙–๒๕๗๐** (through 27 Dec 2027): 2569 from the Thai PBS
wan-phra table (via coucal), 2570 from myhora's published-ahead calendar,
cross-checked against kapook on five festival dates and validated by the counting
bridge from the 2569 anchors. myhora reconfirms its table against the กรมการศาสนา
announcement ~Sep 2026 — worth a recheck then. `data/thai_lunar_2570.csv` holds the
2570 rows in coucal's exact table format, ready to drop into the clock's
`data/tables/` whenever wanted (left out of coucal for now on purpose).

The animal-year offset is `(year + 543 + 5) % 12`, pinned in `test_parity.py`
against fixed anchors (2020 rat, 2025 snake, 2026 horse, turning at Songkran).
Coucal originally used `+ 4`, which landed one animal early; it was fixed to the
same `+ 5` on 2026-07-26, so the two now agree everywhere.

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


## Licence

Records, prose and pages: CC BY-SA 4.0. Code: AGPL-3.0-or-later. Anything
carried in from elsewhere keeps its own terms — see [LICENSE](LICENSE).

**Commercial licence.** If share-alike doesn't fit your use — a corpus, a
product, a model — a commercial licence is available.
[Open an issue](https://github.com/NaNoBotCo/lanna-almanac/issues) and say what you need.

---

Contact: Nan · nan@motdang.net · Sponsor: [Ko-fi](https://ko-fi.com/defiantchiangmai) · [Patreon](https://www.patreon.com/nanobotco)
