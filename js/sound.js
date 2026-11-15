/*
 * Small sound effects made with the Web Audio API (no audio files, works offline).
 * Every sound checks the "sound" setting, so turning it off in Settings silences the app.
 */
(function () {
  var ctx = null;

  function audio() {
    if (!Store.settings().sound) return null;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) { try { ctx = new AC(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(c, freq, start, dur, opts) {
    opts = opts || {};
    var o = c.createOscillator(), g = c.createGain();
    o.type = opts.type || "sine";
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, c.currentTime + start + dur);
    var vol = opts.vol || 0.18;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  }

  function noise(c, start, dur, freq, vol) {
    var len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 0.8;
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(c.currentTime + start);
  }

  var Sound = {
    /* Soft pencil tap when picking a president. */
    tap: function () { var c = audio(); if (c) noise(c, 0, 0.05, 2500, 0.25); },
    /* Paper "flip" for the next clue. */
    flip: function () { var c = audio(); if (c) noise(c, 0, 0.18, 1400, 0.35); },
    /* Rubber-stamp thunk + happy chime for a correct answer. */
    correct: function (points) {
      var c = audio(); if (!c) return;
      tone(c, 160, 0, 0.18, { to: 60, vol: 0.35 }); noise(c, 0, 0.08, 500, 0.6);
      var notes = points >= 6 ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047];
      notes.forEach(function (f, i) { tone(c, f, 0.12 + i * 0.08, 0.22, { type: "triangle", vol: 0.16 }); });
    },
    /* Gentle "womp" for a wrong answer (not harsh). */
    wrong: function () {
      var c = audio(); if (!c) return;
      tone(c, 330, 0, 0.22, { type: "triangle", to: 262, vol: 0.15 });
      tone(c, 262, 0.2, 0.32, { type: "triangle", to: 196, vol: 0.15 });
    },
    /* Fanfare for the end of a round (bigger for a new record). */
    fanfare: function (record) {
      var c = audio(); if (!c) return;
      var seq = record ? [[523, 0], [523, 0.12], [523, 0.24], [659, 0.36], [784, 0.56], [1047, 0.76]] : [[392, 0], [523, 0.15], [659, 0.3], [784, 0.45]];
      seq.forEach(function (n) { tone(c, n[0], n[1], 0.3, { type: "triangle", vol: 0.17 }); tone(c, n[0] / 2, n[1], 0.3, { type: "sine", vol: 0.08 }); });
    }
  };
  window.Sound = Sound;
})();
