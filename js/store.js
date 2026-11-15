/* Saves settings and progress in this browser (localStorage). Nothing leaves the device. */
(function () {
  var KEY = "agp-presidents-v1";
  var defaults = {
    settings: { range: "all", timer: true, theme: true, sound: true },
    facts: {},      // factId -> { r: rightCount, w: wrongCount, last: 1|0, t: timestamp }
    rounds: []      // { t, range, score, max, by: {6:n,4:n,2:n,0:n} }
  };
  var mem = null;

  function load() {
    if (mem) return mem;
    try {
      var raw = localStorage.getItem(KEY);
      mem = raw ? JSON.parse(raw) : {};
    } catch (e) { mem = {}; }
    mem.settings = Object.assign({}, defaults.settings, mem.settings || {});
    // v2: the 30-second timer is now on by default (it used to be off for everyone).
    if (!mem.settings.v) { mem.settings.timer = true; mem.settings.v = 2; }
    mem.facts = mem.facts || {};
    mem.rounds = mem.rounds || [];
    return mem;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* private mode: keep in memory */ }
  }

  /* A fact counts as "missed" if the last try was wrong or it has been missed more often than gotten right. */
  function isMiss(f) { return !!f && (f.last === 0 || f.w > f.r); }

  window.Store = {
    isMiss: isMiss,
    /* Clear miss status only: keeps right-answer counts and rounds, so drill progress is unchanged. */
    clearMisses: function () {
      var facts = load().facts, n = 0;
      Object.keys(facts).forEach(function (k) {
        var f = facts[k];
        if (isMiss(f)) { f.w = 0; f.last = null; n++; }
      });
      save(); return n;
    },
    settings: function () { return load().settings; },
    set: function (k, v) { load().settings[k] = v; save(); },
    record: function (factId, ok) {
      var f = load().facts[factId] || { r: 0, w: 0 };
      if (ok) f.r++; else f.w++;
      f.last = ok ? 1 : 0; f.t = Date.now();
      mem.facts[factId] = f; save();
    },
    fact: function (factId) { return load().facts[factId]; },
    allFacts: function () { return load().facts; },
    addRound: function (r) { var d = load(); d.rounds.push(r); if (d.rounds.length > 100) d.rounds.shift(); save(); },
    rounds: function () { return load().rounds; },
    /* Erase progress and round scores; keep the player's settings. */
    reset: function () { var keep = load().settings; mem = JSON.parse(JSON.stringify(defaults)); mem.settings = keep; save(); }
  };
})();
