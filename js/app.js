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
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function range() { return RANGES[Store.settings().range] || RANGES.all; }
  function presidentsIn(r) { return P.filter(function (p) { return p.n >= r.lo && p.n <= r.hi; }); }
  function sheetById(id) { for (var i = 0; i < SHEETS.length; i++) if (SHEETS[i].id === id) return SHEETS[i]; return null; }
  function sortedSheets(list) { return list.slice().sort(function (a, b) { return parseInt(a.id.slice(1), 10) - parseInt(b.id.slice(1), 10); }); }
  function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }
  function render(html, keepScroll) {
    stopTimer();
    Array.prototype.forEach.call(document.querySelectorAll(".confetti"), function (c) { c.remove(); });
    app.innerHTML = '<div class="wrap">' + html + "</div>";
    if (!keepScroll) window.scrollTo(0, 0);
  }
  function on(sel, ev, fn) { Array.prototype.forEach.call(app.querySelectorAll(sel), function (el) { el.addEventListener(ev, fn); }); }
  function bestFor(rangeId) { return Store.rounds().filter(function (x) { return x.range === rangeId; }).reduce(function (m, x) { return Math.max(m, x.score); }, -1); }

  /* Pat the eagle ("Pat" is short for Patriot) */
  var PAT = {
    hello: ["Let's go!", "Ready, explorer?", "Let's learn some presidents!", "I believe in you!"],
    six: ["On the FIRST clue? Wow!", "Six points! Eagle eyes!", "That's presidential!"],
    right: ["Great detective work!", "You nailed it!", "Way to go!", "Nice thinking!", "Correct-a-mundo!"],
    wrong: ["So close! You'll get the next one.", "Good try! Now you know.", "Shake it off, explorer!", "Every miss makes you smarter!"],
    none: ["No worries. Now you know!", "Next time, take a guess!"]
  };
  function pat(text) { return '<div class="pat"><span class="bird" aria-hidden="true">🦅</span><span class="say"><span class="sr-only">Pat says: </span>' + text + "</span></div>"; }

  /* Ranks for a 12-question round (out of 72) */
  var RANKS = [["Voter", 0, "🗳️"], ["Mayor", 24, "🏙️"], ["Governor", 36, "🏛️"], ["Senator", 48, "📜"], ["President", 60, "🦅"]];
  function rankIndex(score) { var k = 0; RANKS.forEach(function (r, i) { if (score >= r[1]) k = i; }); return k; }

  function confetti(n) {
    var colors = ["#e63946", "#1f3a93", "#ffd166", "#ffffff", "#2a9d8f"];
    var box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
    for (var i = 0; i < (n || 60); i++) {
      var c = document.createElement("i");
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = pick(colors);
      c.style.animationDuration = 1.4 + Math.random() * 1.4 + "s";
      c.style.animationDelay = Math.random() * 0.4 + "s";
      c.style.setProperty("--spin", (Math.random() * 720 - 360) + "deg");
      box.appendChild(c);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 3500);
  }
  function shake(sel) { var el = app.querySelector(sel); if (el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); } }

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
    on("[data-range]", "click", function (e) { Sound.tap(); Store.set("range", e.currentTarget.getAttribute("data-range")); rerender(); });
  }

  function tiles(r, opts) {
    opts = opts || {};
    return '<div class="grid" id="tiles" role="group" aria-label="Choose a president">' + presidentsIn(r).map(function (p) {
      var cls = "tile";
      if (opts.right && opts.right.indexOf(p.n) >= 0) cls += " right";
      else if (opts.wrong && opts.wrong.indexOf(p.n) >= 0) cls += " wrong";
      else if (opts.dimOthers) cls += " dim";
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
    var r = range(), missed = E.missedItems(r).length, best = bestFor(r.id);
    render(
      '<div class="hello"><div><h1>Hi, explorer!</h1>' +
        '<p class="muted" style="margin:0">Presidents #16&ndash;33 &middot; Theme: <b>Secretaries of State</b></p></div></div>' +
      pat(pick(PAT.hello)) +
      (best >= 0 ? '<p><span class="chip">🔥 Best round (' + esc(r.id === "all" ? "all" : "#" + r.lo + "-" + r.hi) + "): " + best + "</span></p>" : "") +
      rangePicker() +
      '<p class="small muted" style="margin:6px 0 0">Tournaments use #16&ndash;24 in round 1 and #25&ndash;33 in round 2.</p>' +
      '<div class="menu">' +
        '<a class="mi" href="#/round"><span class="ic">🏆</span><span><strong>Tournament Round</strong><span class="d">12 questions &middot; 6, 4 or 2 points</span></span></a>' +
        '<a class="mi blue theme" href="#/drill/B14"><span class="ic">🎩</span><span><strong>Sec. of State <span class="stamp">THEME</span></strong><span class="d">Match each one to his president</span></span></a>' +
        '<a class="mi gold" href="#/drills"><span class="ic">📚</span><span><strong>Worksheet Drills</strong><span class="d">All 25 AGLOA Group B worksheets</span></span></a>' +
        '<a class="mi" href="#/drill/mix"><span class="ic">🎲</span><span><strong>Quick Mix</strong><span class="d">10 random facts</span></span></a>' +
        '<a class="mi blue" href="#/review"><span class="ic">🔁</span><span><strong>Review My Misses</strong><span class="d">' + (missed ? missed + " to practice" : "Nothing missed yet. Nice!") + "</span></span></a>" +
        '<a class="mi gold" href="#/study"><span class="ic">🔍</span><span><strong>Study a President</strong><span class="d">Every fact for each president</span></span></a>' +
      "</div>"
    );
    bindRangePicker(home);
  }

  /* ---------- Drills ---------- */
  function drillsMenu() {
    var r = range();
    render(
      '<h1>Worksheet Drills</h1>' + rangePicker() + '<div style="height:14px"></div>' +
      '<div class="sheetlist">' + sortedSheets(SHEETS).map(function (s) {
        var pr = sheetProgress(s, r);
        if (!pr.total) return "";
        var pct = Math.round(100 * pr.known / pr.total);
        return '<a href="#/drill/' + s.id + '"><span><span class="id">' + s.id + "</span>" + esc(s.title) +
          (s.theme ? '<span class="stamp">THEME</span>' : "") + '<br><span class="small muted">' + pr.known + " / " + pr.total + " known</span></span>" +
          '<span class="meter" aria-hidden="true"><i style="width:' + pct + '%"></i></span></a>';
      }).join("") + "</div>" +
      '<p class="small muted" style="margin-top:14px">"Known" means you got it right the last time. Worksheets B9-B11 cover only part of the range.</p>'
    );
    bindRangePicker(drillsMenu);
  }

  function drill(which) {
    var r = range(), items, title;
    if (which === "mix") { items = E.shuffle(E.drillItems({ range: r })).slice(0, 10); title = "Quick Mix"; }
    else if (which === "review") { items = E.shuffle(E.missedItems(r)); title = "All My Misses"; }
    else if (which.indexOf("review-") === 0) {
      var rs = sheetById(which.slice(7));
      if (!rs) return notFound();
      items = E.shuffle(E.missedItems(r, rs.id));
      title = "Misses: " + rs.title;
    } else {
      var s = sheetById(which);
      if (!s) return notFound();
      items = E.shuffle(E.drillItems({ range: r, sheets: [s.id] }));
      title = s.id + ": " + s.title;
    }
    var isReview = which === "review" || which.indexOf("review-") === 0;
    if (!items.length) {
      render('<h1>' + esc(title) + "</h1>" + pat(isReview ? "No misses here for this range. Nice work!" : "Nothing in this range. Pick another one!") +
        rangePicker() + '<p style="margin-top:14px"><a class="btn" href="' + (isReview ? "#/review" : "#/") + '">' + (isReview ? "Back to my misses" : "Home") + "</a></p>");
      return bindRangePicker(function () { drill(which); });
    }
    var st = { i: 0, right: 0, selected: [], checked: false };

    function show() {
      var it = items[st.i], need = E.concrete(it.expected).filter(function (n) { return n >= r.lo && n <= r.hi; });
      var multi = it.expected.length > 1;
      var head = '<div class="qhead"><h2>' + esc(title) + '</h2><span class="score">' + (st.i + 1) + " / " + items.length + "</span></div>";
      var body = '<div class="card"><div class="prompt">' + esc(it.sheet.prompt) +
        (multi ? " <b>(" + it.expected.length + " answers)</b>" : "") + '</div><div class="fact">' + esc(it.text) + "</div>";
      if (!st.checked) {
        body += tiles(r, { selected: st.selected }) + "</div>" +
          '<div class="sticky-actions"><button class="btn" id="check"' + (st.selected.length ? "" : " disabled") + ">Check ✓</button></div>";
      } else {
        var ok = E.isCorrect(it.expected, st.selected);
        var wrong = st.selected.filter(function (n) { return need.indexOf(n) < 0; });
        body += '<div class="feedback ' + (ok ? "ok" : "no") + '"><div class="head">' + (ok ? "Correct! ✓" : "Not quite.") + "</div>" +
          esc(it.expected.map(E.label).join(", ")) +
          (it.note ? '<span class="note">' + esc(it.note) + "</span>" : "") + "</div>" +
          tiles(r, { right: need, wrong: wrong, disabled: true, dimOthers: true }) + "</div>" +
          pat(pick(ok ? PAT.right : PAT.wrong)) +
          '<div class="sticky-actions"><button class="btn" id="next">' + (st.i + 1 < items.length ? "Next &rarr;" : "Finish") + "</button></div>";
      }
      render(head + body, st.checked || st.selected.length > 0);
      on(".tile", "click", function (e) {
        Sound.tap();
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
        if (ok) Sound.correct(4); else { Sound.wrong(); shake("#tiles"); }
      });
      on("#next", "click", function () {
        st.i++; st.selected = []; st.checked = false;
        if (st.i < items.length) show(); else done();
      });
    }
    function done() {
      var perfect = st.right === items.length;
      render('<h1>' + esc(title) + '</h1><div class="card scorecard"><div class="big">' + st.right + '</div><div class="of">out of ' + items.length + " correct</div></div>" +
        pat(perfect ? "Perfect! You're a <b>superstar</b>!" : st.right >= items.length * .7 ? "Great job, explorer!" : "Keep practicing. You're getting smarter!") +
        '<div class="row"><button class="btn" id="again">' + (isReview ? "Practice misses again" : "Try again") + "</button>" +
        (isReview ? '<a class="btn secondary" href="#/review">My misses</a>' : '<a class="btn secondary" href="#/drills">All drills</a>') +
        '<a class="btn ghost" href="#/">Home</a></div>');
      on("#again", "click", function () { drill(which); });
      Sound.fanfare(perfect);
      if (perfect) confetti(70);
    }
    show();
  }

  /* ---------- Review my misses ---------- */
  function reviewMenu() {
    var r = range(), all = E.missedItems(r), counts = {};
    all.forEach(function (it) { counts[it.sheet.id] = (counts[it.sheet.id] || 0) + 1; });
    var list = sortedSheets(SHEETS.filter(function (s) { return counts[s.id]; }));
    render(
      '<h1>Review My Misses</h1>' + rangePicker() + '<div style="height:14px"></div>' +
      (all.length
        ? '<a class="btn block" href="#/review/all" style="margin-bottom:16px">Review all misses (' + all.length + ")</a>" +
          '<p class="prompt">Or practice one category:</p><div class="sheetlist">' + list.map(function (s) {
            return '<a href="#/review/' + s.id + '"><span><span class="id">' + s.id + "</span>" + esc(s.title) +
              (s.theme ? '<span class="stamp">THEME</span>' : "") + "</span>" +
              '<span class="score">' + counts[s.id] + "</span></a>";
          }).join("") + "</div>" +
          '<p class="small muted" style="margin-top:14px">A fact leaves this list once your latest answer is right and you have gotten it right at least as many times as you have missed it.</p>'
        : pat("No misses for this range. Try a drill or a tournament round!") + '<a class="btn" href="#/drills">Worksheet drills</a>')
    );
    bindRangePicker(reviewMenu);
  }

  /* ---------- Tournament round ---------- */
  function roundIntro() {
    var s = Store.settings(), best = bestFor(range().id);
    render(
      '<h1>Tournament Round</h1>' + rangePicker() +
      '<div class="card" style="margin-top:14px"><span class="tape"></span>' +
        '<p>You get <b>12 questions</b>. Each one has 3 clues.</p>' +
        '<p style="margin:0">Answer after clue 1 for <b style="color:var(--red)">6 points</b>, clue 2 for <b style="color:var(--navy)">4</b>, or clue 3 for <b style="color:var(--gold-dk)">2</b>. A wrong answer gets 0, and you can\'t change your answer!</p></div>' +
      pat(best >= 0 ? "Your best here is <b>" + best + "</b>. Can you beat it?" : "Answer early for more points. You can do it!") +
      '<p class="small muted">Timer: <b>' + (s.timer ? "on" : "off") + "</b> &middot; Sound: <b>" + (s.sound ? "on" : "off") + '</b> &middot; <a href="#/settings">change in Settings</a></p>' +
      '<button class="btn block" id="start">Start round &rarr;</button>'
    );
    bindRangePicker(roundIntro);
    on("#start", "click", function () { Sound.flip(); playRound(); });
  }

  function playRound() {
    var r = range(), s = Store.settings();
    var qs = E.buildRound(r, s.theme, 12);
    if (!qs.length) return render("<p>Could not build a round.</p>");
    var prevBest = bestFor(r.id);
    var st = { qi: 0, clue: 0, answer: null, at: null, revealed: false, total: 0, log: [], animated: -1 };

    function pts(k) { return [6, 4, 2][k]; }
    function dots() {
      return '<div class="dots" aria-hidden="true">' + qs.map(function (q, i) {
        var cls = i < st.log.length ? (st.log[i].got ? "ok" : "miss") : i === st.qi ? "now" : "";
        return '<i class="' + cls + '"></i>';
      }).join("") + "</div>";
    }
    function result() {
      var q = qs[st.qi];
      var acc = st.at == null ? [q.answer] : E.acceptedAfter(q, st.at);
      var ok = st.answer != null && acc.indexOf(st.answer) >= 0;
      return { ok: ok, got: ok ? pts(st.at) : 0, acc: acc };
    }
    function show() {
      var q = qs[st.qi];
      var head = '<div class="qhead"><h2>Question ' + (st.qi + 1) + " of " + qs.length + '</h2><span class="score">⭐ ' + st.total + " pts</span></div>" + dots();
      if (q.official) head += '<p class="official"><span class="badge">OFFICIAL AGLOA PRACTICE QUESTION</span></p>';
      var answeredEarly = st.answer != null && !st.revealed;
      var cl = '<ol class="clues">' + q.clues.map(function (c, k) {
        var shown = st.revealed || k <= st.clue;
        if (!shown) {
          return '<li class="clue wait p' + pts(k) + '"><span class="pts">' + pts(k) + "</span><span>" +
            (answeredEarly ? "Answer locked in!" : "Clue " + (k + 1) + " is coming&hellip;") + "</span></li>";
        }
        return '<li class="clue p' + pts(k) + (k === st.clue && !st.revealed && st.animated !== st.clue ? " now" : "") + '"><span class="pts">' + pts(k) + "</span><span>" +
          (st.revealed ? '<span class="tag">' + esc(c.src) + "</span>" : "") + esc(c.text) + "</span></li>";
      }).join("") + "</ol>";
      var body;
      if (!st.revealed) {
        var timer = s.timer ? '<div class="timer" aria-hidden="true"><i id="bar"></i></div>' : "";
        body = cl + timer + '<div class="prompt">' + (st.answer == null ? "Tap a president now for <b>" + pts(st.clue) + " points</b>, or wait for the next clue." :
          "Locked in for <b>" + pts(st.at) + " points</b>. Check it, or keep reading the clues.") + "</div>" +
          tiles(r, { selected: st.answer != null ? [st.answer] : [], disabled: st.answer != null }) +
          '<div class="sticky-actions">' + (st.answer != null
            ? '<button class="btn" id="reveal">Check it ✓</button>' + (st.clue < 2 ? '<button class="btn secondary" id="nextclue">Next clue</button>' : "")
            : '<button class="btn secondary" id="nextclue">' + (st.clue < 2 ? "Next clue &rarr;" : "Show answer") + "</button>") + "</div>";
      } else {
        var res = result();
        var stamp = res.ok ? '<div class="bigstamp">+' + res.got + ' ✓<small>CORRECT</small></div>'
          : '<div class="bigstamp no">' + (st.answer == null ? "0" : "✗") + "<small>" + (st.answer == null ? "NO ANSWER" : "NOT THIS TIME") + "</small></div>";
        var feedback = '<div class="feedback ' + (res.ok ? "ok" : "no") + '"><div class="head">' +
          (res.ok ? "Correct! +" + res.got + " points" : st.answer == null ? "No answer: 0 points" : "Not this time: 0 points") + "</div>" +
          "The answer is <b>" + esc(E.label(q.answer)) + "</b>." +
          (q.note ? '<span class="note">' + esc(q.note) + "</span>" : "") +
          (res.ok && res.acc.length > 1 ? '<span class="note">Cleveland was president twice: #22 (1885-1889) and #24 (1893-1897). At a tournament, circle the right term.</span>' : "") +
          "</div>";
        var say = pat(pick(res.ok ? (res.got === 6 ? PAT.six : PAT.right) : st.answer == null ? PAT.none : PAT.wrong));
        body = '<div style="position:relative">' + stamp + feedback + cl + "</div>" + say +
          tiles(r, { right: [q.answer], wrong: st.answer != null && !res.ok ? [st.answer] : [], disabled: true, dimOthers: true }) +
          '<div class="sticky-actions"><button class="btn" id="nextq">' + (st.qi + 1 < qs.length ? "Next question &rarr;" : "See my score!") + "</button></div>";
      }
      // Stay in place while reading clues and answering; jump to the top for a new question or the result.
      render(head + body, !st.revealed && !(st.clue === 0 && st.answer == null));
      st.animated = st.clue;   // a clue slides in only the first time it appears
      if (!st.revealed && s.timer && st.answer == null) startTimer();
      on(".tile", "click", function (e) {
        if (st.answer != null) return;
        Sound.tap();
        st.answer = +e.currentTarget.getAttribute("data-n"); st.at = st.clue; show();
      });
      on("#nextclue", "click", function () { advance(); });
      on("#reveal", "click", reveal);
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
      if (st.clue < 2) { st.clue++; Sound.flip(); show(); return; }
      reveal();
    }
    function reveal() {
      var q = qs[st.qi], res = result();
      st.total += res.got;
      st.log.push({ q: q, answer: st.answer, got: res.got, at: st.at });
      q.clues.forEach(function (c) { if (c.id) Store.record(c.id, res.ok); });
      st.revealed = true; show();
      if (res.ok) { Sound.correct(res.got); confetti(res.got === 6 ? 80 : 45); }
      else { Sound.wrong(); shake("#tiles"); }
    }
    function nextQuestion() {
      st.qi++; st.clue = 0; st.answer = null; st.at = null; st.revealed = false; st.animated = -1;
      if (st.qi < qs.length) { Sound.flip(); show(); } else results();
    }
    function results() {
      var by = { 6: 0, 4: 0, 2: 0, 0: 0 }, max = qs.length * 6;
      st.log.forEach(function (x) { by[x.got]++; });
      Store.addRound({ t: Date.now(), range: r.id, score: st.total, max: max, by: by });
      var record = prevBest >= 0 && st.total > prevBest;
      var k = rankIndex(st.total), next = RANKS[k + 1];
      var missed = st.log.filter(function (x) { return !x.got; });
      var msg = next ? "<b>" + (next[1] - st.total) + " more point" + (next[1] - st.total === 1 ? "" : "s") + "</b> to " + next[0] + "!" : "You reached <b>President</b>! Hail to the Chief!";
      render(
        '<h1>Round complete!</h1>' +
        '<div class="card scorecard">' + (record ? '<div class="record">New record!</div>' : "") +
          '<div class="big">' + st.total + '</div><div class="of">out of ' + max + (prevBest >= 0 ? " &middot; best was " + prevBest : "") + "</div>" +
          '<div class="rank">Rank: ' + RANKS[k][0] + " " + RANKS[k][2] + "</div>" +
          '<div class="ladder">' + RANKS.map(function (x, i) { return '<span class="' + (i < k ? "done" : i === k ? "cur" : "") + '">' + x[0] + "</span>"; }).join("") + "</div></div>" +
        '<div class="tally">' +
          '<div><b style="color:var(--red)">' + by[6] + "</b><span>6-pointers</span></div>" +
          '<div><b style="color:var(--navy)">' + by[4] + "</b><span>4-pointers</span></div>" +
          '<div><b style="color:var(--gold-dk)">' + by[2] + "</b><span>2-pointers</span></div>" +
          "<div><b>" + by[0] + "</b><span>missed</span></div></div>" +
        pat(msg) +
        '<div class="row" style="margin-bottom:14px"><button class="btn" id="again">Play again</button>' +
          (missed.length ? '<button class="btn secondary" id="missed">Review the ' + (missed.length === 1 ? "one" : missed.length) + " I missed</button>" : "") +
          '<a class="btn ghost" href="#/">Home</a></div>' +
        '<details class="card"><summary>See all 12 answers</summary><table class="results"><thead><tr><th>#</th><th>Answer</th><th>You</th><th>Pts</th></tr></thead><tbody>' +
          st.log.map(function (x, i) {
            return "<tr><td>" + (i + 1) + '</td><td><a href="#/study/' + x.q.answer + '">' + esc(E.label(x.q.answer)) + "</a></td><td>" +
              (x.answer == null ? "&mdash;" : "#" + x.answer) + "</td><td>" + x.got + "</td></tr>";
          }).join("") + "</tbody></table></details>"
      );
      on("#again", "click", function () { Sound.flip(); playRound(); });
      on("#missed", "click", function () { missedList(missed); });
      Sound.fanfare(record);
      if (record || k >= 3) confetti(record ? 120 : 70);
    }
    function missedList(missed) {
      render('<h1>Questions I missed</h1>' + pat("Read all 3 clues again. Next time you'll know!") +
        missed.map(function (x) {
          return '<div class="card"><h3><a href="#/study/' + x.q.answer + '">' + esc(E.label(x.q.answer)) + "</a></h3>" +
            (x.answer != null ? '<p class="small muted">You answered #' + x.answer + ".</p>" : '<p class="small muted">You didn\'t answer.</p>') +
            '<ol class="clues">' + x.q.clues.map(function (c, k) {
              return '<li class="clue p' + pts(k) + '"><span class="pts">' + pts(k) + "</span><span>" + esc(c.text) + "</span></li>";
            }).join("") + "</ol></div>";
        }).join("") +
        '<div class="row"><button class="btn" id="again">Play another round</button><a class="btn ghost" href="#/">Home</a></div>');
      on("#again", "click", function () { Sound.flip(); playRound(); });
    }
    show();
  }

  /* ---------- Study ---------- */
  function studyList() {
    var r = range();
    render('<h1>Study a President</h1>' + rangePicker() + '<div style="height:14px"></div>' +
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
    var tapes = ["40%", "18%", "64%"];
    var ti = 0;
    function tape() { return '<span class="tape" style="left:' + tapes[ti++ % 3] + '"></span>'; }
    render(
      '<div class="study-head">' +
        (prev ? '<a class="btn ghost" href="#/study/' + prev + '" aria-label="Previous: #' + prev + '">&larr; ' + prev + "</a>" : '<span class="navpad"></span>') +
        '<h1><span class="pnum">#' + p.n + "</span> " + esc(p.name) + "</h1>" +
        (next ? '<a class="btn ghost" href="#/study/' + next + '" aria-label="Next: #' + next + '">' + next + " &rarr;</a>" : '<span class="navpad"></span>') +
      "</div>" +
      (n === 22 || n === 24 ? pat("Grover Cleveland served two terms that were not back to back, so he is both <b>#22</b> and <b>#24</b>!") : "") +
      '<div class="card">' + tape() + '<h3>From the Presidents Chart</h3><dl class="chart">' +
        "<dt>Lived</dt><dd>" + esc(p.lived) + "</dd><dt>Born in</dt><dd>" + esc(p.born) + "</dd><dt>Died in</dt><dd>" + esc(p.died) +
        "</dd><dt>President</dt><dd>" + esc(p.term) + "</dd><dt>Party</dt><dd>" + esc(p.party) + "</dd></dl></div>" +
      '<div class="card">' + tape() + '<h3>Secretaries of State <span class="stamp">THEME</span></h3><p>' + names("B14") + "</p>" +
        '<h3>Vice Presidents</h3><p>' + names("B4") + "</p><h3>Wives</h3><p>" + names("B2") + "</p><h3>Nicknames</h3><p style=\"margin:0\">" + names("B22") + "</p></div>" +
      Object.keys(groups).map(function (id) {
        var s = sheetById(id);
        return '<div class="card">' + tape() + "<h3>" + esc(s.title) + ' <span class="small muted">' + id + '</span></h3><ul class="facts">' +
          groups[id].map(function (x) {
            return "<li>" + esc(x.text) + (x.note ? ' <span class="src">' + esc(x.note) + "</span>" : "") +
              (x.shared ? ' <span class="src">(also: ' + esc(x.shared.filter(function (a) { return a !== n && !(a === "C" && (n === 22 || n === 24)); }).map(function (a) { return a === "C" ? "22/24" : "#" + a; }).join(", ")) + ")</span>" : "") + "</li>";
          }).join("") + "</ul></div>";
      }).join("") +
      (quiz.length ? '<div class="card">' + tape() + '<h3>Clues from the AGLOA Quiz Archive</h3><ul class="facts">' +
        quiz.map(function (q) { return "<li>" + esc(q.t) + ' <a class="src" href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(q.src) + "</a></li>"; }).join("") + "</ul></div>" : "")
    );
  }

  /* ---------- Settings ---------- */
  function settings() {
    var s = Store.settings();
    function sw(id, on, title, help) {
      return '<label class="switch"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + "><span><b>" + title + "</b><small>" + help + "</small></span></label>";
    }
    render(
      '<h1>Settings</h1>' +
      '<div class="card">' +
        sw("sound", s.sound, "🔊 Sound effects", "Stamps, cheers and page flips.") +
        sw("timer", s.timer, "⏱️ 30-second timer", "Each clue in a tournament round gets 30 seconds, like a real round.") +
        sw("theme", s.theme, "🎩 Theme clues", "Put Secretaries of State in the 4- and 2-point clues (2026-27 theme).") +
      "</div>" +
      '<button class="btn secondary" id="test">Test the sound</button><p class="small" id="soundNote" role="status" style="color:var(--red);margin-top:8px"></p>' +
      '<p class="small muted" style="margin-top:14px">Reset buttons are on the <a href="#/about">About</a> page.</p>'
    );
    on("#sound", "change", function (e) { Store.set("sound", e.target.checked); if (e.target.checked) Sound.correct(6); });
    on("#timer", "change", function (e) { Store.set("timer", e.target.checked); Sound.tap(); });
    on("#theme", "change", function (e) { Store.set("theme", e.target.checked); Sound.tap(); });
    on("#test", "click", function () {
      Sound.correct(6);
      // No pop-up dialogs: some app previews and home-screen apps block them.
      var n = app.querySelector("#soundNote");
      if (n) n.textContent = Store.settings().sound ? "" : "Sound is off. Turn on Sound effects first.";
    });
  }

  /* ---------- About ---------- */
  function about(notice) {
    var rounds = Store.rounds().length, facts = Object.keys(Store.allFacts()).length;
    var misses = E.missedItems(RANGES.all).length;
    render(
      '<h1>About</h1>' +
      '<div class="card"><span class="tape"></span><h3>How PRESIDENTS is played</h3><p>A reader gives three clues about one president, each read twice with 30 seconds to think. Answer after the first clue for 6 points, the second for 4, or the third for 2. A wrong answer scores 0, and answers can\'t be changed. A round has 12 questions. You may use only the official Presidents Chart.</p>' +
      '<p style="margin:0">In 2026-27, Elementary and Middle Divisions play Group B: #16&ndash;24 in the first round and #25&ndash;33 in the second. The theme for all divisions is Secretaries of State. The 4- or 2-point clues may mention a Secretary of State.</p></div>' +
      '<div class="card"><span class="tape" style="left:20%"></span><h3>Where the questions come from</h3><p>All content comes from the Academic Games Leagues of America (AGLOA):</p><ul class="facts">' +
        '<li><a href="https://agloa.org/pres-docs/" target="_blank" rel="noopener">Presidents Rules and Documents</a>: the 2026-27 rules, the Presidents Chart, the 25 Group B worksheets, and the official practice questions.</li>' +
        '<li><a href="https://agloa.org/category/pres-quiz/" target="_blank" rel="noopener">AGLOA Presidents Quiz archive</a> (2015-2021).</li></ul>' +
        '<p class="small muted" style="margin:8px 0 0">Tournament-round questions mix AGLOA clues from different worksheets, so they are practice, not official questions (except the ones marked official). This app is not made by AGLOA.</p></div>' +
      '<div class="card"><span class="tape" style="left:64%"></span><h3>Your progress</h3><p>' + facts + " facts practiced, " + rounds + ' rounds played. Progress is saved only in this browser.</p>' +
        '<div id="resetArea"><div class="row"><button class="btn secondary" id="resetMisses"' + (misses ? "" : " disabled") + ">Reset my misses" + (misses ? " (" + misses + ")" : "") + "</button>" +
        '<button class="btn secondary" id="reset">Reset my progress</button></div></div>' +
        (notice ? '<p class="small" role="status" style="color:var(--green);font-weight:800;margin:10px 0 0">' + notice + "</p>" : "") +
        '<p class="small muted" style="margin:10px 0 0">Reset my misses empties the Review My Misses list but keeps everything else. Reset my progress erases all progress and round scores.</p></div>' +
      pat("Hi! I'm <b>Pat</b>, short for Patriot. Happy studying!"), notice !== undefined   // stay in place after a reset or Cancel
    );
    /* Ask "Are you sure?" inside the page instead of a browser pop-up, which some
       app previews and home-screen apps block (they silently answer "no"). */
    function ask(question, yesLabel, action, done) {
      var area = app.querySelector("#resetArea");
      area.innerHTML = '<div class="feedback no" role="alertdialog" aria-label="Are you sure?"><div class="head">Are you sure?</div>' + question +
        '<div class="row" style="margin-top:10px"><button class="btn" id="confirmYes">' + yesLabel + '</button>' +
        '<button class="btn secondary" id="confirmNo">Cancel</button></div></div>';
      area.querySelector("#confirmNo").addEventListener("click", function () { about(""); });
      area.querySelector("#confirmYes").addEventListener("click", function () { action(); Sound.tap(); about(done); });
      area.querySelector("#confirmNo").focus();
    }
    on("#resetMisses", "click", function () {
      ask("This clears your Review My Misses list. Everything else stays.", "Yes, reset my misses",
        function () { Store.clearMisses(); }, "Done! Your misses list is empty.");
    });
    on("#reset", "click", function () {
      ask("This erases all your progress and round scores on this device. It can't be undone.", "Yes, erase everything",
        function () { Store.reset(); }, "Done! All progress was erased.");
    });
  }

  function notFound() { render('<h1>Page not found</h1>' + pat("Oops! Let's head home.") + '<a class="btn" href="#/">Home</a>'); }

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
      case "review": return !h[1] ? reviewMenu() : drill(h[1] === "all" ? "review" : "review-" + h[1]);
      case "study": return h[1] ? study(+h[1]) : studyList();
      case "settings": return settings();
      case "about": return about();
      default: return notFound();
    }
  }
  /* Let pinned headers sit right under the top bar, whatever its height. */
  function measureTopbar() {
    var bar = document.querySelector(".topbar");
    if (bar) document.documentElement.style.setProperty("--topbar-h", bar.offsetHeight + "px");
  }
  window.addEventListener("resize", measureTopbar);
  measureTopbar();

  window.addEventListener("hashchange", route);
  route();
})();
