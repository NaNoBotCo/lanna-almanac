/* The Lanna (ล้านนา) reckoning, ported from coucal-clock/src/coucal/almanac/{thai,lanna}.py.
 *
 * Same shape as the Python: a published authority table supplies ~50 anchor days;
 * every day between them is derived by counting, and the count must land exactly on
 * the next anchor or the build throws. The widget never guesses — outside the table
 * it says บ่ฮู้ข้างขึ้นข้างแฮม (the lunar day is not known) instead of extrapolating.
 *
 * Parity with the Python original is enforced by test_parity.py (every day of the span,
 * every field). If you change a rule here, change it in the clock too — or better,
 * change it there first and re-port.
 */
"use strict";

var Almanac = (function () {
  // ------------------------------------------------------------------ anchors
  // SOURCE: Thai PBS, "ปฏิทินวันพระ 2569 วันธรรมสวนะ ครบทั้ง 12 เดือน"
  // https://www.thaipbs.or.th/now/content/3498  (retrieved 2026-07-20, via coucal-clock
  // data/tables/thai_lunar_2569.csv). 2569 is adhikamasa: the eighth month doubles ("8b").
  var ANCHORS = [
    ["2026-01-03", "waxing", 15, "2"],
    ["2026-01-11", "waning", 8, "2"],
    ["2026-01-18", "waning", 15, "2"],
    ["2026-01-26", "waxing", 8, "3"],
    ["2026-02-02", "waxing", 15, "3"],
    ["2026-02-10", "waning", 8, "3"],
    ["2026-02-16", "waning", 14, "3"],
    ["2026-02-24", "waxing", 8, "4"],
    ["2026-03-03", "waxing", 15, "4"],
    ["2026-03-11", "waning", 8, "4"],
    ["2026-03-18", "waning", 15, "4"],
    ["2026-03-26", "waxing", 8, "5"],
    ["2026-04-02", "waxing", 15, "5"],
    ["2026-04-10", "waning", 8, "5"],
    ["2026-04-16", "waning", 14, "5"],
    ["2026-04-24", "waxing", 8, "6"],
    ["2026-05-01", "waxing", 15, "6"],
    ["2026-05-09", "waning", 8, "6"],
    ["2026-05-16", "waning", 15, "6"],
    ["2026-05-24", "waxing", 8, "7"],
    ["2026-05-31", "waxing", 15, "7"],
    ["2026-06-08", "waning", 8, "7"],
    ["2026-06-14", "waning", 14, "7"],
    ["2026-06-22", "waxing", 8, "8"],
    ["2026-06-29", "waxing", 15, "8"],
    ["2026-07-07", "waning", 8, "8"],
    ["2026-07-14", "waning", 15, "8"],
    ["2026-07-22", "waxing", 8, "8b"],
    ["2026-07-29", "waxing", 15, "8b"],
    ["2026-07-30", "waning", 1, "8b"],
    ["2026-08-06", "waning", 8, "8b"],
    ["2026-08-13", "waning", 15, "8b"],
    ["2026-08-21", "waxing", 8, "9"],
    ["2026-08-28", "waxing", 15, "9"],
    ["2026-09-05", "waning", 8, "9"],
    ["2026-09-11", "waning", 14, "9"],
    ["2026-09-19", "waxing", 8, "10"],
    ["2026-09-26", "waxing", 15, "10"],
    ["2026-10-04", "waning", 8, "10"],
    ["2026-10-11", "waning", 15, "10"],
    ["2026-10-19", "waxing", 8, "11"],
    ["2026-10-26", "waxing", 15, "11"],
    ["2026-11-03", "waning", 8, "11"],
    ["2026-11-09", "waning", 14, "11"],
    ["2026-11-17", "waxing", 8, "12"],
    ["2026-11-24", "waxing", 15, "12"],
    ["2026-12-02", "waning", 8, "12"],
    ["2026-12-09", "waning", 15, "12"],
    ["2026-12-17", "waxing", 8, "1"],
    ["2026-12-24", "waxing", 15, "1"],
    // -- พ.ศ. 2570 (2027) --
    // SOURCE: myhora.com "ปฏิทินวันพระ พ.ศ.2570/2027" (retrieved 2026-07-26),
    // cross-checked against calendar.kapook.com/2570 on five independent dates
    // (Makha 21 Feb, Visakha 20 May, Asalha 18 Jul, Khao Phansa 19 Jul,
    // Loy Krathong 13 Nov — all agree). 2570 is ปกติมาส ปกติวาร: no doubled month,
    // odd months waning 14 days, even months 15. myhora states it re-verifies each
    // year against the กรมการศาสนา announcement (~Sep 2026 for this table) — these
    // rows are the published-ahead calendar, to be reconfirmed then.
    // NOTE for the next year-appender: waningLengths() is keyed by month across ALL
    // years. 2569 and 2570 share the odd-14/even-15 pattern so this is safe; an
    // อธิกวาร year (month 7 waning 15) would conflict — the drift check will throw
    // loudly at build time, and lengths must then become per-year.
    ["2027-01-01", "waning", 8, "1"],
    ["2027-01-07", "waning", 14, "1"],
    ["2027-01-15", "waxing", 8, "2"],
    ["2027-01-22", "waxing", 15, "2"],
    ["2027-01-30", "waning", 8, "2"],
    ["2027-02-06", "waning", 15, "2"],
    ["2027-02-14", "waxing", 8, "3"],
    ["2027-02-21", "waxing", 15, "3"],
    ["2027-03-01", "waning", 8, "3"],
    ["2027-03-07", "waning", 14, "3"],
    ["2027-03-15", "waxing", 8, "4"],
    ["2027-03-22", "waxing", 15, "4"],
    ["2027-03-30", "waning", 8, "4"],
    ["2027-04-06", "waning", 15, "4"],
    ["2027-04-14", "waxing", 8, "5"],
    ["2027-04-21", "waxing", 15, "5"],
    ["2027-04-29", "waning", 8, "5"],
    ["2027-05-05", "waning", 14, "5"],
    ["2027-05-13", "waxing", 8, "6"],
    ["2027-05-20", "waxing", 15, "6"],
    ["2027-05-28", "waning", 8, "6"],
    ["2027-06-04", "waning", 15, "6"],
    ["2027-06-12", "waxing", 8, "7"],
    ["2027-06-19", "waxing", 15, "7"],
    ["2027-06-27", "waning", 8, "7"],
    ["2027-07-03", "waning", 14, "7"],
    ["2027-07-11", "waxing", 8, "8"],
    ["2027-07-18", "waxing", 15, "8"],
    ["2027-07-19", "waning", 1, "8"],
    ["2027-07-26", "waning", 8, "8"],
    ["2027-08-02", "waning", 15, "8"],
    ["2027-08-10", "waxing", 8, "9"],
    ["2027-08-17", "waxing", 15, "9"],
    ["2027-08-25", "waning", 8, "9"],
    ["2027-08-31", "waning", 14, "9"],
    ["2027-09-08", "waxing", 8, "10"],
    ["2027-09-15", "waxing", 15, "10"],
    ["2027-09-23", "waning", 8, "10"],
    ["2027-09-30", "waning", 15, "10"],
    ["2027-10-08", "waxing", 8, "11"],
    ["2027-10-15", "waxing", 15, "11"],
    ["2027-10-23", "waning", 8, "11"],
    ["2027-10-29", "waning", 14, "11"],
    ["2027-11-06", "waxing", 8, "12"],
    ["2027-11-13", "waxing", 15, "12"],
    ["2027-11-21", "waning", 8, "12"],
    ["2027-11-28", "waning", 15, "12"],
    ["2027-12-06", "waxing", 8, "1"],
    ["2027-12-13", "waxing", 15, "1"],
    ["2027-12-21", "waning", 8, "1"],
    ["2027-12-27", "waning", 14, "1"],
  ];

  var WAXING = "waxing", WANING = "waning";
  var BE_OFFSET = 543;
  var CS_OFFSET = 638; // Chulasakarat: CS = CE - 638, turning at Songkran.
  var SONGKRAN_MONTH = 4, SONGKRAN_DAY = 16; // approximated, as in the clock
  var LANNA_MONTH_OFFSET = 2; // Lan Na numbers its lunar months two ahead of central Thai

  var THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";

  var THAI_MONTH_NAMES = {
    "1": "เดือนอ้าย", "2": "เดือนยี่", "3": "เดือนสาม", "4": "เดือนสี่",
    "5": "เดือนห้า", "6": "เดือนหก", "7": "เดือนเจ็ด", "8": "เดือนแปด",
    "8b": "เดือนแปดสอง", "9": "เดือนเก้า", "10": "เดือนสิบ",
    "11": "เดือนสิบเอ็ด", "12": "เดือนสิบสอง",
  };

  var LANNA_MONTH_NAMES = {
    1: "เดือนเจียง", 2: "เดือนยี่", 3: "เดือนสาม", 4: "เดือนสี่",
    5: "เดือนห้า", 6: "เดือนหก", 7: "เดือนเจ็ด", 8: "เดือนแปด",
    9: "เดือนเก้า", 10: "เดือนสิบ", 11: "เดือนสิบเอ็ด", 12: "เดือนสิบสอง",
  };

  // Python's weekday(): Monday = 0.
  var THAI_WEEKDAYS = [
    "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์", "วันอาทิตย์",
  ];
  var EN_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  var THAI_SOLAR_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  // The twelve-year cycle in its Lanna forms: (Lanna, central Thai, English).
  var LANNA_ANIMALS = [
    ["ไจ้", "ชวด", "rat"], ["เป้า", "ฉลู", "ox"], ["ยี", "ขาล", "tiger"],
    ["เหม้า", "เถาะ", "rabbit"], ["สี", "มะโรง", "dragon"], ["ไส้", "มะเส็ง", "snake"],
    ["สะง้า", "มะเมีย", "horse"], ["เม็ด", "มะแม", "goat"], ["สัน", "วอก", "monkey"],
    ["เร้า", "ระกา", "rooster"], ["เส็ด", "จอ", "dog"], ["ไก๊", "กุน", "pig"],
  ];

  // ------------------------------------------------------------------ date helpers
  // Dates are ISO strings ("2026-07-26") keyed into a plain object; stepping uses
  // Date.UTC so local DST can never bend the count.
  function isoToUTC(iso) {
    var p = iso.split("-");
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function utcToISO(ms) {
    var d = new Date(ms);
    var m = String(d.getUTCMonth() + 1).padStart(2, "0");
    var day = String(d.getUTCDate()).padStart(2, "0");
    return d.getUTCFullYear() + "-" + m + "-" + day;
  }
  function addDays(iso, n) {
    return utcToISO(isoToUTC(iso) + n * 86400000);
  }
  function isoParts(iso) {
    var p = iso.split("-");
    return { y: +p[0], m: +p[1], d: +p[2] };
  }
  function weekdayIndex(iso) {
    // Python weekday(): Monday = 0. JS getUTCDay(): Sunday = 0.
    return (new Date(isoToUTC(iso)).getUTCDay() + 6) % 7;
  }

  function thaiNumerals(value) {
    return String(value).replace(/\d/g, function (ch) { return THAI_DIGITS[+ch]; });
  }

  // ------------------------------------------------------------------ the calendar
  function waningLengths() {
    var lengths = {};
    ANCHORS.forEach(function (a) {
      if (a[1] === WANING && (a[2] === 14 || a[2] === 15)) lengths[a[3]] = a[2];
    });
    return lengths;
  }

  function step(phase, day, month, waningLength, nextMonth) {
    day += 1;
    if (phase === WAXING && day > 15) return [WANING, 1, month];
    if (phase === WANING && day > waningLength) return [WAXING, 1, nextMonth];
    return [phase, day, month];
  }

  var CALENDAR = null;
  function buildCalendar() {
    if (CALENDAR) return CALENDAR;
    var lengths = waningLengths();
    var waningLen = function (m) { return lengths[m] || 15; };
    var cal = {};

    for (var i = 0; i + 1 < ANCHORS.length; i++) {
      var a = ANCHORS[i], b = ANCHORS[i + 1];
      var cursor = a[0], phase = a[1], day = a[2], month = a[3];
      while (cursor < b[0]) {
        cal[cursor] = [phase, day, month, waningLen(month)];
        var s = step(phase, day, month, waningLen(month), b[3]);
        phase = s[0]; day = s[1]; month = s[2];
        cursor = addDays(cursor, 1);
      }
      if (phase !== b[1] || day !== b[2] || month !== b[3]) {
        throw new Error(
          "Thai calendar derivation drifted: counting from " + a[0] + " reached " +
          phase + " " + day + " month " + month + " at " + b[0] + ", but the " +
          "published calendar says " + b[1] + " " + b[2] + " month " + b[3] + "."
        );
      }
    }

    var last = ANCHORS[ANCHORS.length - 1];
    cal[last[0]] = [last[1], last[2], last[3], waningLen(last[3])];

    var first = ANCHORS[0];
    for (var back = 1; back < first[2]; back++) {
      cal[addDays(first[0], -back)] = [first[1], first[2] - back, first[3], waningLen(first[3])];
    }

    CALENDAR = cal;
    return cal;
  }

  function tableSpan() {
    var days = Object.keys(buildCalendar()).sort();
    return [days[0], days[days.length - 1]];
  }

  function isWanPhra(phase, day, waningLength) {
    if (phase === WAXING) return day === 8 || day === 15;
    return day === 8 || day === waningLength;
  }

  // ------------------------------------------------------------------ central Thai day
  function thaiDay(iso) {
    var entry = buildCalendar()[iso];
    var be = isoParts(iso).y + BE_OFFSET;
    if (!entry) return { gregorian: iso, buddhistYear: be, known: false };
    return {
      gregorian: iso,
      buddhistYear: be,
      known: true,
      phase: entry[0],
      day: entry[1],
      month: entry[2],
      isWanPhra: isWanPhra(entry[0], entry[1], entry[3]),
      waningLength: entry[3],
    };
  }

  // ------------------------------------------------------------------ the Northern reckoning
  function chulasakaratYear(iso) {
    var p = isoParts(iso);
    var cs = p.y - CS_OFFSET;
    if (p.m < SONGKRAN_MONTH || (p.m === SONGKRAN_MONTH && p.d < SONGKRAN_DAY)) cs -= 1;
    return cs;
  }

  function animalIndex(iso) {
    var p = isoParts(iso);
    var year = (p.m > SONGKRAN_MONTH || (p.m === SONGKRAN_MONTH && p.d >= SONGKRAN_DAY))
      ? p.y : p.y - 1;
    // Anchored on 2020=rat, 2025=snake, 2026=horse (ปีสะง้า/มะเมีย); coucal now
    // uses the same +5 (its old +4 landed one animal early, fixed 2026-07-26).
    // test_parity.py pins these anchors.
    return (((year + 543 + 5) % 12) + 12) % 12;
  }

  function lannaAnimal(iso) {
    return LANNA_ANIMALS[animalIndex(iso)];
  }

  function lannaMonth(thaiMonth) {
    if (thaiMonth === "8b") return ["10b", "เดือนสิบ (สอง)"];
    var n = ((+thaiMonth - 1 + LANNA_MONTH_OFFSET) % 12) + 1;
    return [String(n), LANNA_MONTH_NAMES[n]];
  }

  function lannaDay(iso) {
    var t = thaiDay(iso);
    var animal = lannaAnimal(iso);
    var out = {
      gregorian: iso,
      csYear: chulasakaratYear(iso),
      buddhistYear: t.buddhistYear,
      animalLanna: animal[0],
      animalThai: animal[1],
      animalEnglish: animal[2],
      known: t.known,
      phase: null, day: null, month: null, monthName: "", isWanSin: false,
    };
    if (!t.known) {
      out.lunarText = "บ่ฮู้ข้างขึ้นข้างแฮม";
      out.yearText = "ปี" + out.animalLanna + " จ.ศ. " + thaiNumerals(out.csYear);
      return out;
    }
    var lm = lannaMonth(t.month);
    out.phase = t.phase;
    out.day = t.day;
    out.month = lm[0];
    out.monthName = lm[1];
    out.isWanSin = t.isWanPhra; // the sabbath is the same day; the North calls it วันศีล
    var word = t.phase === WAXING ? "ขึ้น" : "แฮม"; // Northern แฮม for แรม
    out.lunarText = word + " " + thaiNumerals(t.day) + " ค่ำ " + lm[1];
    out.yearText = "ปี" + out.animalLanna + " จ.ศ. " + thaiNumerals(out.csYear);
    return out;
  }

  function weekdayText(iso) { return THAI_WEEKDAYS[weekdayIndex(iso)]; }
  function weekdayEnglish(iso) { return EN_WEEKDAYS[weekdayIndex(iso)]; }

  function solarText(iso) {
    var p = isoParts(iso);
    return thaiNumerals(p.d) + " " + THAI_SOLAR_MONTHS[p.m - 1] + " " + thaiNumerals(p.y + BE_OFFSET);
  }

  // ------------------------------------------------------------------ festivals
  var SOLAR_FESTIVALS = {
    "4-13": ["ปี๋ใหม่เมือง", "สงกรานต์", "Northern New Year — the water festival"],
  };

  var FULL_MOON_FESTIVALS = {
    "3": ["มาฆบูชา", "Makha Bucha"],
    "6": ["วิสาขบูชา", "Visakha Bucha"],
    "8": ["อาสาฬหบูชา", "Asalha Bucha — eve of Vassa"],
    "8b": ["อาสาฬหบูชา", "Asalha Bucha — eve of Vassa"],
    "12": ["ลอยกระทง", "Yi Peng — the lantern festival"],
  };

  function pengName(lanna_month) {
    var n = lanna_month === "10b" ? 10 : +lanna_month;
    if (n === 2) return "ยี่เป็ง";
    return LANNA_MONTH_NAMES[n] + "เป็ง";
  }

  function yearHasSecondEighth(year) {
    return ANCHORS.some(function (a) {
      return a[3] === "8b" && isoParts(a[0]).y === year;
    });
  }

  function festivalOn(iso) {
    var p = isoParts(iso);
    var solar = SOLAR_FESTIVALS[p.m + "-" + p.d];
    if (solar) return { nameLanna: solar[0], nameThai: solar[1], gregorian: iso, note: solar[2] };

    var t = thaiDay(iso);
    if (!(t.known && t.phase === WAXING && t.day === 15)) return null;
    if (!(t.month in FULL_MOON_FESTIVALS)) return null;
    // Adhikamasa: Asalha (and so Vassa) is kept on the SECOND eighth month's full moon.
    if (t.month === "8" && yearHasSecondEighth(p.y)) return null;

    var f = FULL_MOON_FESTIVALS[t.month];
    return { nameLanna: pengName(lannaMonth(t.month)[0]), nameThai: f[0], gregorian: iso, note: f[1] };
  }

  function nextFestival(afterISO, limitDays) {
    limitDays = limitDays || 200;
    for (var i = 1; i <= limitDays; i++) {
      var f = festivalOn(addDays(afterISO, i));
      if (f) return f;
    }
    return null;
  }

  function nextWanSin(afterISO, limitDays) {
    limitDays = limitDays || 40;
    for (var i = 1; i <= limitDays; i++) {
      var iso = addDays(afterISO, i);
      var t = thaiDay(iso);
      if (t.known && t.isWanPhra) return lannaDay(iso);
    }
    return null;
  }

  return {
    lannaDay: lannaDay,
    thaiDay: thaiDay,
    festivalOn: festivalOn,
    nextFestival: nextFestival,
    nextWanSin: nextWanSin,
    tableSpan: tableSpan,
    weekdayText: weekdayText,
    weekdayEnglish: weekdayEnglish,
    solarText: solarText,
    thaiNumerals: thaiNumerals,
    addDays: addDays,
    pengName: pengName,
    LANNA_MONTH_NAMES: LANNA_MONTH_NAMES,
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Almanac;
