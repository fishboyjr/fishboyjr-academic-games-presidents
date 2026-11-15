/*
 * Question logic: answer checking, worksheet drills, and building 12-question
 * tournament-style rounds (6-, 4-, 2-point clues) from AGLOA material.
 */
(function () {
  var P = window.PRESIDENTS, SHEETS = window.SHEETS;
  var byNum = {}; P.forEach(function (p) { byNum[p.n] = p; });

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function fill(tpl, t) {
    var s = tpl.replace("{t}", t);
    // Avoid doubled punctuation like 'Act..' or '?."'
    return s.replace(/([.!?])\.$/, "$1").replace(/([.!?])"\.$/, '$1"').replace(/\."\.$/, '."');
  }

  /* Expand an answer list to concrete numbers in [lo, hi]. "C" -> 22 and 24. */
  function concrete(ans) {
    var out = [];
    ans.forEach(function (a) { if (a === "C") out.push(22, 24); else out.push(a); });
    return out;
  }
  function inRange(n, r) { return n >= r.lo && n <= r.hi; }

  /* Answers of an item limited to a range. Returns null when none are in range. */
  function answersIn(ans, r) {
    var kept = ans.filter(function (a) {
      return a === "C" ? (inRange(22, r) || inRange(24, r)) : inRange(a, r);
    });
    return kept.length ? kept : null;
  }

  /* Compare a set of tapped tile numbers with the expected answers. */
  function isCorrect(expected, picked) {
    var want = {}; expected.forEach(function (a) { want[a] = 1; });
    var got = {};
    picked.forEach(function (n) {
      if ((n === 22 || n === 24) && want.C && !want[n]) got.C = 1; else got[n] = 1;
    });
    var wk = Object.keys(want).sort().join(","), gk = Object.keys(got).sort().join(",");
    return wk === gk;
  }

  function label(a) {
    if (a === "C") return "#22/24 Grover Cleveland";
    var p = byNum[a]; return "#" + a + " " + (p ? p.name : "");
  }

  /* ---------- Worksheet drills ---------- */
  function allItems() {
    var list = [];
    SHEETS.forEach(function (s) {
      s.items.forEach(function (it, i) {
        list.push({ id: s.id + ":" + i, sheet: s, text: it[0], answers: it[1], note: it[2] || "" });
      });
    });
    return list;
  }
  var ITEMS = allItems();

  function drillItems(opts) {
    var r = opts.range;
    return ITEMS.filter(function (it) {
      if (opts.sheets && opts.sheets.indexOf(it.sheet.id) < 0) return false;
      return !!answersIn(it.answers, r);
    }).map(function (it) {
      return Object.assign({}, it, { expected: answersIn(it.answers, r) });
    });
  }

  /* Missed worksheet facts in a range, optionally limited to one worksheet. */
  function missedItems(range, sheetId) {
    var facts = Store.allFacts();
    return drillItems({ range: range, sheets: sheetId ? [sheetId] : null }).filter(function (it) {
      return Store.isMiss(facts[it.id]);
    });
  }

  /* ---------- Tournament-style rounds ---------- */
  // Clue pools per president: { 6: [...], 4: [...], 2: [...] }, each clue { text, acc: [numbers], src, sos }
  function cluePools(range) {
    var pools = {};
    function add(n, tier, clue) {
      if (!inRange(n, range)) return;
      pools[n] = pools[n] || { 6: [], 4: [], 2: [] };
      pools[n][tier].push(clue);
    }
    SHEETS.forEach(function (s) {
      s.items.forEach(function (it, i) {
        if (it[1].length !== 1) return;              // only facts that point to exactly one president
        var a = it[1][0];
        var targets = a === "C" ? [22, 24] : [a];
        var acc = concrete([a]);
        targets.forEach(function (n) {
          add(n, s.tier, { text: fill(s.clue, it[0]), acc: acc, src: "Worksheet " + s.id + " (" + s.title + ")", sos: s.id === "B14", id: s.id + ":" + i });
        });
      });
    });
    (window.QUIZ_CLUES || []).forEach(function (q, i) {
      var targets = q.a === "C" ? [22, 24] : [q.a];
      var tier = q.t.length >= 80 ? 6 : 4;
      var text = /^(I|My|When|While|As|At|In|During|After|Before|Four|Six|Nine|Both|From|The)\b/.test(q.t) ? q.t : "Clue: " + q.t + ".";
      text = text.replace(/\.\.$/, ".");
      targets.forEach(function (n) {
        add(n, tier, { text: text, acc: concrete([q.a]), src: q.src, url: q.url, id: "Q:" + i });
      });
    });
    // 2-point chart clue: "something unique from the Presidents Chart" (rule PZ6)
    P.forEach(function (p) {
      if (!inRange(p.n, range)) return;
      var term = p.n === 22 ? "my first term was " + p.term : p.n === 24 ? "my second term was " + p.term : "I was president " + p.term;
      add(p.n, 2, { text: "I was born in " + p.born + " and died in " + p.died + ". " + term.charAt(0).toUpperCase() + term.slice(1) + ".", acc: [p.n], src: "AGLOA Presidents Chart" });
    });
    return pools;
  }

  function takeClue(pool, tiers, used, preferSos) {
    for (var t = 0; t < tiers.length; t++) {
      var list = (pool[tiers[t]] || []).filter(function (c) { return !used[c.text]; });
      if (preferSos) {
        var sos = list.filter(function (c) { return c.sos; });
        if (sos.length) list = sos;
      }
      if (list.length) { var c = pick(list); used[c.text] = 1; return c; }
    }
    return null;
  }

  function buildQuestion(n, pools, used, themeOn) {
    var pool = pools[n]; if (!pool) return null;
    var c6 = takeClue(pool, [6, 4], used, false);
    var sosAt4 = themeOn && Math.random() < 0.65;
    var c4 = takeClue(pool, [4, 6], used, sosAt4);
    var c2 = takeClue(pool, [2, 4], used, themeOn && !sosAt4 && Math.random() < 0.4);
    if (!c6 || !c4 || !c2) return null;
    return { answer: n, clues: [c6, c4, c2], official: false };
  }

  function buildRound(range, themeOn, count) {
    count = count || 12;
    var pools = cluePools(range), used = {};
    var nums = P.map(function (p) { return p.n; }).filter(function (n) { return inRange(n, range) && pools[n]; });
    var qs = [];
    // Mix in official AGLOA sample questions that fit the range (at most 2 per round).
    var samples = shuffle((window.SAMPLE_QUESTIONS || []).filter(function (q) { return inRange(q.answer, range); })).slice(0, 2);
    samples.forEach(function (q) {
      qs.push({
        answer: q.answer, official: true, note: q.note || "",
        clues: q.clues.map(function (t) { used[t] = 1; return { text: t, acc: q.answer === 24 ? [24] : [q.answer], src: "AGLOA practice question" }; })
      });
    });
    var order = [];
    while (order.length < count * 2) order = order.concat(shuffle(nums));
    for (var i = 0; i < order.length && qs.length < count; i++) {
      var n = order[i];
      var last = qs.length ? qs[qs.length - 1].answer : null;
      if (n === last) continue;
      var q = buildQuestion(n, pools, used, themeOn);
      if (q) qs.push(q);
    }
    return shuffle(qs).slice(0, count);
  }

  /* Accepted answers after the k-th clue (0-based): clues seen so far narrow the answer. */
  function acceptedAfter(q, k) {
    var acc = q.clues[0].acc.slice();
    for (var i = 1; i <= k; i++) {
      var next = q.clues[i].acc;
      var narrowed = acc.filter(function (n) { return next.indexOf(n) >= 0; });
      if (narrowed.length) acc = narrowed;
    }
    return acc;
  }

  window.Engine = {
    byNum: byNum, label: label, shuffle: shuffle,
    items: ITEMS, drillItems: drillItems, missedItems: missedItems,
    isCorrect: isCorrect, answersIn: answersIn, concrete: concrete,
    buildRound: buildRound, acceptedAfter: acceptedAfter, cluePools: cluePools
  };
})();
