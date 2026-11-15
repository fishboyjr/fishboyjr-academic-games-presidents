(function () {
  var E = window.Engine, P = window.PRESIDENTS, SHEETS = window.SHEETS, RANGES = window.RANGES;
  var app = document.getElementById("app");
  var timerHandle = null;

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function range() { return RANGES[Store.settings().range] || RANGES.all; }
  function presidentsIn(r) { return P.filter(function (p) { return p.n >= r.lo && p.n <= r.hi; }); }
  function sheetById(id) { for (var i = 0; i < SHEETS.length; i++) if (SHEETS[i].id === id) return SHEETS[i]; return null; }
  function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }
  function render(html) { stopTimer(); app.innerHTML = '<div class="wrap">' + html + "</div>"; window.scrollTo(0, 0); }
  function on(sel, ev, fn) { Array.prototype.forEach.call(app.querySelectorAll(sel), function (el) { el.addEventListener(ev, fn); }); }

  function rangePicker() {
    var cur = Store.settings().range;
    return '<div class="seg" role="group" aria-label="Presidents range">' +
      ["r1", "r2", "all"].map(function (k) {
        var R = RANGES[k];
        return '<button type="button" data-range="' + k + '" aria-pressed="' + (k === cur) + '" aria-label="' + esc(R.label) + '">#' + R.lo + "&ndash;" + R.hi +
          "<small>" + (k === "r1" ? "Round 1" : k === "r2" ? "Round 2" : "All") + "</small></button>";
      }).join("") + "</div>";
  }
  function bindRangePicker(rerender) {
    on("[data-range]", "click", function (e) { Store.set("range", e.currentTarget.getAttribute("data-range")); rerender(); });
  }

  function tiles(r, opts) {
    opts = opts || {};
    return '<div class="grid" role="group" aria-label="Choose a president">' + presidentsIn(r).map(function (p) {
      var cls = "tile";
      if (opts.right && opts.right.indexOf(p.n) >= 0) cls += " right";
      else if (opts.wrong && opts.wrong.indexOf(p.n) >= 0) cls += " wrong";
      var pressed = opts.selected && opts.selected.indexOf(p.n) >= 0;
      return '<button type="button" class="' + cls + '" data-n="' + p.n + '" aria-pressed="' + !!pressed + '"' + (opts.disabled ? " disabled" : "") + ">" +
        '<span class="num">' + p.n + '</span><span class="nm">' + esc(p.short) + "</span></button>";
    }).join("") + "</div>";
  }

  function sheetProgress(sheet, r) {
    var facts = Store.allFacts(), total = 0, known = 0;
    sheet.items.forEach(function (it, i) {
      if (!E.answersIn(it[1], r)) return;
      total++;
      var f = facts[sheet.id + ":" + i];
      if (f && f.last === 1) known++;
    });
    return { total: total, known: known };
  }

  /* ---------- Home ---------- */
  function home() {
    var r = range(), missed = E.missedItems(r).length;
    var rounds = Store.rounds().filter(function (x) { return x.range === r.id; });
    var best = rounds.reduce(function (m, x) { return Math.max(m, x.score); }, 0);
    render(
      '<h1>Practice for PRESIDENTS</h1>' +
      '<p class="muted">2026-27 Elementary &amp; Middle: Presidents #16&ndash;33. Theme: <strong>Secretaries of State</strong>.</p>' +
      '<div class="card"><div class="prompt">Which presidents are you studying?</div>' + rangePicker() +
      '<p class="small muted" style="margin:8px 0 0">At tournaments, round 1 uses #16&ndash;24 and round 2 uses #25&ndash;33.</p></div>' +
      '<div class="menu">' +
        '<a href="#/round"><strong>Tournament Round</strong>12 questions, 3 clues each. Answer early for 6 points, wait for 4 or 2.' +
          (rounds.length ? '<br><span class="small muted">Best: ' + best + " / 72</span>" : "") + "</a>" +
        '<a class="theme" href="#/drill/B14"><strong>Secretaries of State <span class="badge">THEME</span></strong>Match each Secretary of State to his president.</a>' +
        '<a href="#/drills"><strong>Worksheet Drills</strong>All 25 AGLOA Group B worksheets: wives, VPs, scandals, wars, slogans, and more.</a>' +
        '<a href="#/drill/mix"><strong>Quick Mix</strong>10 random facts from every worksheet.</a>' +
        '<a class="review" href="#/review"><strong>Review My Misses</strong>' + (missed ? missed + " fact" + (missed === 1 ? "" : "s") + " to practice again." : "Nothing missed yet. Nice!") + "</a>" +
        '<a href="#/study"><strong>Study a President</strong>Chart facts, Secretaries of State, VPs, wives, and every worksheet fact.</a>' +
      "</div>"
    );
    bindRangePicker(home);
  }

  /* ---------- Drills ---------- */
  function drillsMenu() {
    var r = range();
    var list = SHEETS.slice().sort(function (a, b) { return parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10); });
    render(
      '<h1>Worksheet Drills</h1><div class="card">' + rangePicker() + "</div>" +
      '<div class="sheetlist">' + list.map(function (s) {
        var pr = sheetProgress(s, r);
        if (!pr.total) return "";
        var pct = Math.round(100 * pr.known / pr.total);
        return '<a href="#/drill/' + s.id + '"><span><span class="id">' + s.id + "</span>" + esc(s.title) +
          (s.theme ? ' <span class="badge">THEME</span>' : "") + '<br><span class="small muted">' + pr.known + " / " + pr.total + " known</span></span>" +
          '<span class="meter" aria-hidden="true"><i style="width:' + pct + '%"></i></span></a>';
      }).join("") + "</div>" +
      '<p class="small muted" style="margin-top:14px">Worksheets B9-B11 cover only part of the range. "Known" means you got it right the last time.</p>'
    );
    bindRangePicker(drillsMenu);
  }

  function drill(which) {
    var r = range(), items, title;
    if (which === "mix") { items = E.shuffle(E.drillItems({ range: r })).slice(0, 10); title = "Quick Mix"; }
    else if (which === "review") { items = E.shuffle(E.missedItems(r)); title = "Review My Misses"; }
    else {
      var s = sheetById(which);
      if (!s) return notFound();
      items = E.shuffle(E.drillItems({ range: r, sheets: [s.id] }));
      title = s.id + ": " + s.title;
    }
    if (!items.length) {
      return render('<h1>' + esc(title) + '</h1><div class="card"><p>' +
        (which === "review" ? "No missed facts for this range. Try a drill or a tournament round!" : "No items in this range. Pick another range.") +
        '</p>' + rangePicker() + '</div><a class="btn" href="#/">Home</a>'), bindRangePicker(function () { drill(which); });
    }
    var st = { i: 0, right: 0, selected: [], checked: false };

    function show() {
      var it = items[st.i], need = E.concrete(it.expected).filter(function (n) { return n >= r.lo && n <= r.hi; });
      var multi = it.expected.length > 1;
      var head = '<div class="qhead"><h2 style="margin:0">' + esc(title) + '</h2><span class="score">' + (st.i + 1) + " / " + items.length + "</span></div>";
      var body = '<div class="card"><div class="prompt">' + esc(it.sheet.prompt) +
        (multi ? " <strong>(" + it.expected.length + " answers)</strong>" : "") + '</div><div class="fact">' + esc(it.text) + "</div>";
      if (!st.checked) {
        body += tiles(r, { selected: st.selected }) + "</div>" +
          '<div class="sticky-actions"><button class="btn" id="check"' + (st.selected.length ? "" : " disabled") + ">Check</button></div>";
      } else {
        var ok = E.isCorrect(it.expected, st.selected);
        var wrong = st.selected.filter(function (n) { return need.indexOf(n) < 0; });
        body += '<div class="feedback ' + (ok ? "ok" : "no") + '">' + (ok ? "Correct!" : "Not quite.") + " " +
          esc(it.expected.map(E.label).join(", ")) +
          (it.note ? '<span class="note">' + esc(it.note) + "</span>" : "") + "</div>" +
          tiles(r, { selected: [], right: need, wrong: wrong, disabled: true }) + "</div>" +
          '<div class="sticky-actions"><button class="btn" id="next">' + (st.i + 1 < items.length ? "Next" : "Finish") + "</button></div>";
      }
      render(head + body);
      on(".tile", "click", function (e) {
        var n = +e.currentTarget.getAttribute("data-n");
        var k = st.selected.indexOf(n);
        if (multi) { if (k >= 0) st.selected.splice(k, 1); else st.selected.push(n); }
        else st.selected = k >= 0 ? [] : [n];
        show();
      });
      on("#check", "click", function () {
        var ok = E.isCorrect(it.expected, st.selected);
        Store.record(it.id, ok); if (ok) st.right++;
        st.checked = true; show();
      });
      on("#next", "click", function () {
        st.i++; st.selected = []; st.checked = false;
        if (st.i < items.length) show(); else done();
      });
    }
    function done() {
      render('<h1>' + esc(title) + '</h1><div class="card center"><div class="big">' + st.right + " / " + items.length +
        '</div><p class="muted">correct</p></div><div class="row">' +
        '<a class="btn" href="#/drill/' + esc(which) + '" id="again">Try again</a>' +
        '<a class="btn secondary" href="#/drills">All drills</a><a class="btn ghost" href="#/">Home</a></div>');
      on("#again", "click", function (e) { e.preventDefault(); drill(which); });
    }
    show();
  }

  /* ---------- Tournament round ---------- */
  function roundIntro() {
    var s = Store.settings();
    render(
      '<h1>Tournament Round</h1><div class="card">' + rangePicker() +
      '<p style="margin-top:12px">You get <strong>12 questions</strong>. Each has three clues. Answer after the first clue for <strong>6 points</strong>, after the second for <strong>4</strong>, or after the third for <strong>2</strong>. A wrong answer scores 0, and you can\'t change an answer.</p>' +
      '<label class="switch"><input type="checkbox" id="timer"' + (s.timer ? " checked" : "") + '> 30-second timer for each clue (like a real round)</label>' +
      '<label class="switch"><input type="checkbox" id="theme"' + (s.theme ? " checked" : "") + '> Put Secretaries of State in the 4- and 2-point clues (2026-27 theme)</label>' +
      '<p class="small muted">Clues are built from AGLOA worksheets, the AGLOA quiz archive, and AGLOA\'s official practice questions. Official questions are marked.</p></div>' +
      '<button class="btn block" id="start">Start round</button>'
    );
    bindRangePicker(roundIntro);
    on("#timer", "change", function (e) { Store.set("timer", e.target.checked); });
    on("#theme", "change", function (e) { Store.set("theme", e.target.checked); });
    on("#start", "click", function () { playRound(); });
  }

  function playRound() {
    var r = range(), s = Store.settings();
    var qs = E.buildRound(r, s.theme, 12);
    if (!qs.length) return render("<p>Could not build a round.</p>");
    var st = { qi: 0, clue: 0, answer: null, at: null, revealed: false, total: 0, log: [] };

    function pts(k) { return [6, 4, 2][k]; }
    function show() {
      var q = qs[st.qi];
      var head = '<div class="qhead"><h2 style="margin:0">Question ' + (st.qi + 1) + " of " + qs.length + "</h2>" +
        '<span class="score">' + st.total + " pts</span></div>";
      if (q.official) head += '<p class="small"><span class="badge">OFFICIAL AGLOA PRACTICE QUESTION</span></p>';
      var cl = '<ol class="clues">' + q.clues.map(function (c, k) {
        var shown = st.revealed || k <= st.clue;
        return '<li class="clue p' + pts(k) + (shown ? "" : " hidden") + '"><span class="pts">' + pts(k) + '</span><span class="txt">' +
          (shown ? (st.revealed ? '<span class="tag">' + esc(c.src) + "</span>" : "") + esc(c.text) : "Clue " + (k + 1) + " is coming...") + "</span></li>";
      }).join("") + "</ol>";
      var timer = (!st.revealed && s.timer) ? '<div class="timer" aria-hidden="true"><i id="bar"></i></div>' : "";
      var body;
      if (!st.revealed) {
        body = '<div class="prompt">' + (st.answer == null ? "Tap a president to lock in your answer for <strong>" + pts(st.clue) + " points</strong>, or wait for the next clue." :
          "Your answer is locked in. Keep reading the clues.") + "</div>" +
          tiles(r, { selected: st.answer != null ? [st.answer] : [], disabled: st.answer != null }) +
          '<div class="sticky-actions"><button class="btn secondary" id="nextclue">' +
          (st.clue < 2 ? "Next clue" : "Reveal answer") + "</button></div>";
      } else {
        var acc = st.at == null ? [q.answer] : E.acceptedAfter(q, st.at);
        var ok = st.answer != null && acc.indexOf(st.answer) >= 0;
        var got = ok ? pts(st.at) : 0;
        var msg = st.answer == null ? "No answer. 0 points." : ok ? "Correct! +" + got + " points." : "Not this time. 0 points.";
        var feedback = '<div class="feedback ' + (ok ? "ok" : "no") + '">' + msg + " The answer is " + esc(E.label(q.answer)) + "." +
          (q.note ? '<span class="note">' + esc(q.note) + "</span>" : "") +
          (ok && acc.length > 1 ? '<span class="note">Cleveland was president twice: #22 (1885-1889) and #24 (1893-1897). At a tournament, circle the right term.</span>' : "") +
          "</div>";
        var grid = tiles(r, { right: [q.answer], wrong: st.answer != null && !ok ? [st.answer] : [], disabled: true });
        var actions = '<div class="sticky-actions"><button class="btn" id="nextq">' + (st.qi + 1 < qs.length ? "Next question" : "See results") + "</button></div>";
        // Result first, then the clues (with where each came from), then the chart.
        body = feedback + cl + grid + actions;
      }
      render(st.revealed ? head + body : head + cl + timer + body);
      if (!st.revealed && s.timer) startTimer();
      on(".tile", "click", function (e) {
        if (st.answer != null) return;
        st.answer = +e.currentTarget.getAttribute("data-n"); st.at = st.clue; show();
      });
      on("#nextclue", "click", advance);
      on("#nextq", "click", nextQuestion);
    }
    function startTimer() {
      var left = 30, bar = document.getElementById("bar");
      timerHandle = setInterval(function () {
        left--;
        if (bar) bar.style.width = Math.max(0, left / 30 * 100) + "%";
        if (left <= 0) { stopTimer(); advance(); }
      }, 1000);
    }
    function advance() {
      if (st.clue < 2) { st.clue++; show(); return; }
      var q = qs[st.qi];
      var acc = st.at == null ? [q.answer] : E.acceptedAfter(q, st.at);
      var ok = st.answer != null && acc.indexOf(st.answer) >= 0;
      var got = ok ? pts(st.at) : 0;
      st.total += got;
      st.log.push({ q: q, answer: st.answer, got: got });
      q.clues.forEach(function (c) { if (c.id) Store.record(c.id, ok); });
      st.revealed = true; show();
    }
    function nextQuestion() {
      st.qi++; st.clue = 0; st.answer = null; st.at = null; st.revealed = false;
      if (st.qi < qs.length) show(); else results();
    }
    function results() {
      var by = { 6: 0, 4: 0, 2: 0, 0: 0 };
      st.log.forEach(function (x) { by[x.got]++; });
      Store.addRound({ t: Date.now(), range: r.id, score: st.total, max: qs.length * 6, by: by });
      render(
        '<h1>Round complete</h1><div class="card center"><div class="big">' + st.total + " / " + qs.length * 6 + '</div>' +
        '<p class="muted">6-pointers: ' + by[6] + " &middot; 4-pointers: " + by[4] + " &middot; 2-pointers: " + by[2] + " &middot; missed: " + by[0] + "</p></div>" +
        '<div class="card"><table class="results"><thead><tr><th>#</th><th>Answer</th><th>You</th><th>Pts</th></tr></thead><tbody>' +
        st.log.map(function (x, i) {
          return "<tr><td>" + (i + 1) + '</td><td><a href="#/study/' + x.q.answer + '">' + esc(E.label(x.q.answer)) + "</a></td><td>" +
            (x.answer == null ? "&mdash;" : "#" + x.answer) + "</td><td>" + x.got + "</td></tr>";
        }).join("") + "</tbody></table></div>" +
        '<div class="row"><button class="btn" id="again">Play another round</button><a class="btn ghost" href="#/">Home</a></div>'
      );
      on("#again", "click", playRound);
    }
    show();
  }

  /* ---------- Study ---------- */
  function studyList() {
    var r = range();
    render('<h1>Study a President</h1><div class="card">' + rangePicker() + "</div>" +
      '<div class="plist">' + presidentsIn(r).map(function (p) {
        return '<a href="#/study/' + p.n + '"><b>' + p.n + "</b>" + esc(p.name) + "</a>";
      }).join("") + "</div>");
    bindRangePicker(studyList);
  }

  function factsFor(n, ids) {
    var out = [];
    SHEETS.forEach(function (s) {
      if (ids && ids.indexOf(s.id) < 0) return;
      s.items.forEach(function (it) {
        var nums = E.concrete(it[1]);
        if (nums.indexOf(n) >= 0) out.push({ sheet: s, text: it[0], note: it[2] || "", shared: it[1].length > 1 ? it[1] : null });
      });
    });
    return out;
  }

  function study(n) {
    var p = E.byNum[n]; if (!p) return notFound();
    function names(id) {
      var f = factsFor(n, [id]);
      return f.length ? f.map(function (x) { return esc(x.text) + (x.note ? ' <span class="small muted">(' + esc(x.note) + ")</span>" : ""); }).join("<br>") : '<span class="muted">&mdash;</span>';
    }
    var rest = factsFor(n).filter(function (x) { return ["B14", "B4", "B2", "B22"].indexOf(x.sheet.id) < 0; });
    var groups = {};
    rest.forEach(function (x) { (groups[x.sheet.id] = groups[x.sheet.id] || []).push(x); });
    var quiz = (window.QUIZ_CLUES || []).filter(function (q) { return E.concrete([q.a]).indexOf(n) >= 0; });
    var prev = E.byNum[n - 1] ? n - 1 : null, next = E.byNum[n + 1] ? n + 1 : null;
    render(
      '<div class="row" style="margin-bottom:8px">' + (prev ? '<a class="btn ghost" href="#/study/' + prev + '">&larr; #' + prev + "</a>" : "") +
      '<span class="spacer"></span>' + (next ? '<a class="btn ghost" href="#/study/' + next + '">#' + next + " &rarr;</a>" : "") + "</div>" +
      "<h1>#" + p.n + " " + esc(p.name) + "</h1>" +
      (n === 22 || n === 24 ? '<p class="muted">Grover Cleveland served two terms that were not back to back, so he is both #22 and #24.</p>' : "") +
      '<div class="card"><h3>From the Presidents Chart</h3><dl class="chart">' +
        "<dt>Lived</dt><dd>" + esc(p.lived) + "</dd><dt>Born in</dt><dd>" + esc(p.born) + "</dd><dt>Died in</dt><dd>" + esc(p.died) +
        "</dd><dt>President</dt><dd>" + esc(p.term) + "</dd><dt>Party</dt><dd>" + esc(p.party) + "</dd></dl></div>" +
      '<div class="card"><h3>Secretaries of State <span class="badge">THEME</span></h3><p>' + names("B14") + "</p>" +
        '<h3>Vice Presidents</h3><p>' + names("B4") + "</p><h3>Wives</h3><p>" + names("B2") + "</p><h3>Nicknames</h3><p style=\"margin:0\">" + names("B22") + "</p></div>" +
      Object.keys(groups).map(function (id) {
        var s = sheetById(id);
        return '<div class="card"><h3>' + esc(s.title) + ' <span class="small muted">' + id + '</span></h3><ul class="facts">' +
          groups[id].map(function (x) {
            return "<li>" + esc(x.text) + (x.note ? ' <span class="src">' + esc(x.note) + "</span>" : "") +
              (x.shared ? ' <span class="src">(also: ' + esc(x.shared.filter(function (a) { return a !== n && !(a === "C" && (n === 22 || n === 24)); }).map(function (a) { return a === "C" ? "22/24" : "#" + a; }).join(", ")) + ")</span>" : "") + "</li>";
          }).join("") + "</ul></div>";
      }).join("") +
      (quiz.length ? '<div class="card"><h3>Clues from the AGLOA Quiz Archive</h3><ul class="facts">' +
        quiz.map(function (q) { return "<li>" + esc(q.t) + ' <a class="src" href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(q.src) + "</a></li>"; }).join("") + "</ul></div>" : "")
    );
  }

  /* ---------- About ---------- */
  function about() {
    var rounds = Store.rounds().length, facts = Object.keys(Store.allFacts()).length;
    render(
      '<h1>About</h1>' +
      '<div class="card"><h3>How PRESIDENTS is played</h3><p>A reader gives three clues about one president, each read twice with 30 seconds to think. Answer after the first clue for 6 points, the second for 4, or the third for 2. A wrong answer scores 0, and answers can\'t be changed. A round has 12 questions. You may use only the official Presidents Chart.</p>' +
      '<p>In 2026-27, Elementary and Middle Divisions play Group B: #16&ndash;24 in the first round and #25&ndash;33 in the second. The theme for all divisions is Secretaries of State. The 4- or 2-point clues may mention a Secretary of State.</p></div>' +
      '<div class="card"><h3>Where the questions come from</h3><p>All content comes from the Academic Games Leagues of America (AGLOA):</p><ul class="facts">' +
        '<li><a href="https://agloa.org/pres-docs/" target="_blank" rel="noopener">Presidents Rules and Documents</a>: the 2026-27 rules, the Presidents Chart, the 25 Group B worksheets, their answer key, and the official practice questions.</li>' +
        '<li><a href="https://agloa.org/category/pres-quiz/" target="_blank" rel="noopener">AGLOA Presidents Quiz archive</a> (2015-2021).</li></ul>' +
        '<p class="small muted">A few answer-key mistakes were corrected. Those facts say "Corrected" in their note. Tournament-round questions mix AGLOA clues from different worksheets, so they are practice, not official questions (except the ones marked official). This app is not made by AGLOA.</p></div>' +
      '<div class="card"><h3>Your progress</h3><p>' + facts + " facts practiced, " + rounds + ' rounds played. Progress is saved only in this browser.</p>' +
        '<button class="btn secondary" id="reset">Reset my progress</button></div>'
    );
    on("#reset", "click", function () {
      if (confirm("Erase all progress on this device?")) { Store.reset(); about(); }
    });
  }

  function notFound() { render('<h1>Page not found</h1><a class="btn" href="#/">Home</a>'); }

  /* ---------- router ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, "").split("/");
    Array.prototype.forEach.call(document.querySelectorAll(".topnav a"), function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#/" + (h[0] || ""));
    });
    switch (h[0]) {
      case "": return home();
      case "round": return roundIntro();
      case "drills": return drillsMenu();
      case "drill": return drill(h[1] || "mix");
      case "review": return drill("review");
      case "study": return h[1] ? study(+h[1]) : studyList();
      case "about": return about();
      default: return notFound();
    }
  }
  window.addEventListener("hashchange", route);
  route();
})();
