/* Lernfortschritt: Wiederholungssystem (Leitner-Boxen), Tages- und Gesamtstatistik, Erfolge.
   Alles liegt nur im Browser (localStorage), nichts wird gesendet. */
(function () {
  'use strict';
  var KEY = 'strukturformel-app-progress-v1';
  var GAPS = [0, 1, 3, 7, 16]; // Tage bis zur nächsten Wiederholung je Box 1..5
  var D = { cards: {}, days: {}, groups: {}, run: 0, bestRun: 0, ach: {} };
  var meta = {}; // id -> {cat}

  try {
    var s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object') {
      ['cards', 'days', 'groups', 'ach'].forEach(function (k) { if (s[k] && typeof s[k] === 'object') D[k] = s[k]; });
      D.run = +s.run || 0; D.bestRun = +s.bestRun || 0;
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function key(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayNum(k) { var p = k.split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); }
  function todayNum() { return dayNum(key()); }
  function dayAdd(n) { var d = new Date(); d.setDate(d.getDate() + n); return key(d); }

  function bump(map, k, ok, n) { var g = map[k] || (map[k] = [0, 0]); g[0] += n; g[1] += ok; }
  function bumpDay(group, n, ok) {
    var t = key(), d = D.days[t] || (D.days[t] = { n: 0, ok: 0, g: {} });
    d.n += n; d.ok += ok; bump(d.g, group, ok, n);
  }

  /* Eine Karte wurde bewertet. Gibt neu erreichte Erfolge zurück. */
  function record(id, ok, cat) {
    var c = D.cards[id], first = !c;
    if (!c) c = D.cards[id] = { b: 1, due: 0, n: 0, ok: 0, ts: 0 };
    var tn = todayNum(), wasDue = first || c.due <= tn;
    c.n++; if (ok) c.ok++;
    c.ts = Date.now();
    if (!ok) { c.b = 1; c.due = tn; }
    else if (wasDue) { c.b = Math.min(5, (first ? 1 : c.b) + 1); c.due = tn + GAPS[c.b - 1]; }
    if (cat) { meta[id] = cat; bump(D.groups, cat, ok ? 1 : 0, 1); bumpDay(cat, 1, ok ? 1 : 0); }
    if (ok) { D.run++; if (D.run > D.bestRun) D.bestRun = D.run; } else D.run = 0;
    var fresh = checkAch();
    save();
    return fresh;
  }
  /* Stoffwechsel-Runden zählen als Gruppe, ohne einzelne Karte. */
  function recordGroup(group, n, ok) {
    if (!n) return [];
    bump(D.groups, group, ok, n); bumpDay(group, n, ok);
    var fresh = checkAch(); save(); return fresh;
  }

  function dueIds(ids) {
    var tn = todayNum();
    return ids.filter(function (id) { var c = D.cards[id]; return c && c.due <= tn; })
      .sort(function (a, b) { var x = D.cards[a], y = D.cards[b]; return (x.due - y.due) || (x.b - y.b) || (x.ts - y.ts); });
  }
  function box(id) { return D.cards[id] ? D.cards[id].b : 0; }

  function totals() {
    var n = 0, ok = 0; Object.keys(D.groups).forEach(function (g) { n += D.groups[g][0]; ok += D.groups[g][1]; });
    return { n: n, ok: ok };
  }
  function today() { var d = D.days[key()]; return d ? { n: d.n, ok: d.ok } : { n: 0, ok: 0 }; }
  function streak() {
    var i = D.days[key()] ? 0 : -1, c = 0;
    while (D.days[dayAdd(i)]) { c++; i--; }
    return c;
  }
  function mastered() { return Object.keys(D.cards).filter(function (id) { return D.cards[id].b >= 4; }).length; }
  function catDone() { // Kategorien, in denen alle Karten mindestens in Box 3 sind
    var by = {}, all = {};
    Object.keys(meta).forEach(function () {});
    (window.MOLECULES || []).forEach(function (m) { all[m.cat] = (all[m.cat] || 0) + 1; if (D.cards[m.id] && D.cards[m.id].b >= 3) by[m.cat] = (by[m.cat] || 0) + 1; });
    return Object.keys(all).filter(function (c) { return by[c] === all[c] && all[c] >= 3; });
  }
  function bestDay(f) { var m = 0; Object.keys(D.days).forEach(function (k) { var v = f(D.days[k]); if (v > m) m = v; }); return m; }

  var ACH = [
    { k: 'first', t: 'Erster Schritt', d: 'Die erste Karte bewertet.', v: function () { return totals().n; }, g: 1 },
    { k: 'd10', t: 'Warmgelernt', d: '10 Antworten an einem Tag.', v: function () { return bestDay(function (d) { return d.n; }); }, g: 10 },
    { k: 'd30', t: 'Fleißig', d: '30 Antworten an einem Tag.', v: function () { return bestDay(function (d) { return d.n; }); }, g: 30 },
    { k: 'd100', t: 'Marathon', d: '100 Antworten an einem Tag.', v: function () { return bestDay(function (d) { return d.n; }); }, g: 100 },
    { k: 'perf', t: 'Perfekter Tag', d: 'Mindestens 10 Antworten an einem Tag, alle richtig.', v: function () { return bestDay(function (d) { return d.n >= 10 && d.ok === d.n ? 1 : 0; }); }, g: 1, nogoal: true },
    { k: 't100', t: 'Hundert', d: '100 Antworten insgesamt.', v: function () { return totals().n; }, g: 100 },
    { k: 't500', t: 'Fünfhundert', d: '500 Antworten insgesamt.', v: function () { return totals().n; }, g: 500 },
    { k: 'run10', t: 'Treffsicher', d: '10 Mal in Folge gewusst.', v: function () { return D.bestRun; }, g: 10 },
    { k: 'run25', t: 'Serienläufer', d: '25 Mal in Folge gewusst.', v: function () { return D.bestRun; }, g: 25 },
    { k: 'st3', t: 'Dranbleiber', d: '3 Tage in Folge gelernt.', v: streak, g: 3 },
    { k: 'st7', t: 'Wochenstreber', d: '7 Tage in Folge gelernt.', v: streak, g: 7 },
    { k: 'm10', t: 'Sitzt', d: '10 Karten sicher gelernt (Box 4 oder höher).', v: mastered, g: 10 },
    { k: 'm50', t: 'Fest im Kopf', d: '50 Karten sicher gelernt.', v: mastered, g: 50 },
    { k: 'cat', t: 'Gruppe gemeistert', d: 'Alle Karten einer Kategorie mindestens in Box 3.', v: function () { return catDone().length; }, g: 1 }
  ];
  function checkAch() {
    var fresh = [];
    ACH.forEach(function (a) {
      if (!D.ach[a.k] && a.v() >= a.g) { D.ach[a.k] = key(); fresh.push(a.t); }
    });
    return fresh;
  }

  function reset() { D = { cards: {}, days: {}, groups: {}, run: 0, bestRun: 0, ach: {} }; save(); }

  window.Progress = {
    record: record, recordGroup: recordGroup, dueIds: dueIds, box: box, totals: totals, today: today, streak: streak,
    mastered: mastered, ach: ACH, got: function (k) { return D.ach[k] || null; }, reset: reset,
    data: function () { return D; }, key: key, dayAdd: dayAdd, catDone: catDone, bestRun: function () { return D.bestRun; }
  };
})();
