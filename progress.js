/* Lernfortschritt: Wiederholungssystem (Leitner-Boxen), Tages- und Gesamtstatistik, Erfolge.
   Alles liegt nur im Browser (localStorage), nichts wird gesendet. */
(function () {
  'use strict';
  var KEY = 'strukturformel-app-progress-v1';
  var GAPS = [0, 1, 3, 7, 16]; // Tage bis zur nächsten Wiederholung je Box 1..5 (nur für „Gut“)
  var MIN = { again: 5, hard: 20, mid: 60 }; // Minuten bis zur nächsten Abfrage
  var D = { cards: {}, days: {}, groups: {}, paths: {}, run: 0, bestRun: 0, ach: {} };
  var meta = {}; // id -> {cat}

  try {
    var s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s === 'object') {
      ['cards', 'days', 'groups', 'paths', 'ach'].forEach(function (k) { if (s[k] && typeof s[k] === 'object') D[k] = s[k]; });
      D.run = +s.run || 0; D.bestRun = +s.bestRun || 0;
    }
  } catch (e) {}
  function midnight(dn) { var d = new Date(dn * 864e5); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime(); }
  Object.keys(D.cards).forEach(function (id) { var c = D.cards[id]; if (c.dt == null) c.dt = midnight(c.due || 0); });
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

  /* Eine Karte wurde bewertet (grade: again, hard, mid, good). Gibt neu erreichte Erfolge zurück.
     Nochmal 5 Min, Schwer 20 Min, Mittel 1 Std, Gut je nach Box 1 / 3 / 7 / 16 Tage. */
  function record(id, grade, cat) {
    var c = D.cards[id], first = !c, ok = grade === 'good' || grade === 'mid';
    if (!c) c = D.cards[id] = { b: 1, dt: 0, n: 0, ok: 0, ts: 0 };
    var now = Date.now(), wasDue = first || c.dt <= now;
    c.n++; if (ok) c.ok++;
    c.ts = now;
    if (grade === 'good') {
      if (wasDue) { c.b = Math.min(5, (first ? 1 : c.b) + 1); c.dt = midnight(todayNum() + GAPS[c.b - 1]); }
    } else {
      if (grade === 'again') c.b = 1; else if (grade === 'hard') c.b = Math.max(1, first ? 1 : c.b - 1);
      var target = now + MIN[grade] * 6e4;
      c.dt = (wasDue || grade === 'again') ? target : Math.min(c.dt, target);
    }
    if (cat) { meta[id] = cat; bump(D.groups, cat, ok ? 1 : 0, 1); bumpDay(cat, 1, ok ? 1 : 0); }
    if (ok) { D.run++; if (D.run > D.bestRun) D.bestRun = D.run; } else D.run = 0;
    var fresh = checkAch();
    save();
    return fresh;
  }
  function fmtGap(ms) {
    var m = Math.max(1, Math.round(ms / 6e4));
    if (m < 60) return m + ' Min';
    if (m < 60 * 24) return Math.round(m / 60) + ' Std';
    var d = Math.round(m / 1440); return d + (d === 1 ? ' Tag' : ' Tage');
  }
  /* Vorschau der Zeiten für die Bewertungs-Knöpfe. */
  function preview(id) {
    var c = D.cards[id], b = c ? c.b : 1, nb = Math.min(5, (c ? b : 1) + 1);
    return { again: '5 Min', hard: '20 Min', mid: '1 Std', good: (c && c.dt > Date.now()) ? 'unverändert' : GAPS[nb - 1] + (GAPS[nb - 1] === 1 ? ' Tag' : ' Tage') };
  }
  /* Wann wird die nächste noch nicht fällige Karte fällig? (ms, oder null) */
  function nextIn(ids) {
    var now = Date.now(), m = null;
    ids.forEach(function (id) { var c = D.cards[id]; if (c && c.dt > now && (m === null || c.dt < m)) m = c.dt; });
    return m === null ? null : fmtGap(m - now);
  }
  /* Stoffwechsel-Runden zählen als Gruppe, ohne einzelne Karte. */
  function recordGroup(group, n, ok) {
    if (!n) return [];
    bump(D.groups, group, ok, n); bumpDay(group, n, ok);
    var fresh = checkAch(); save(); return fresh;
  }

  /* Eine Stoffwechsel-Runde (kind: 't' = Zuordnen, 'q' = Fragen) wurde ausgewertet. */
  function recordPath(pid, kind, n, ok) {
    if (!n) return [];
    var q = D.paths[pid] || (D.paths[pid] = { t: 0, q: 0, r: 0 });
    q.r++; if (ok === n) q[kind]++;
    return recordGroup('Stoffwechsel', n, ok);
  }
  function pathPerfect(pid) { var q = D.paths[pid]; return q ? q.t + q.q : 0; }
  function pathSum(f) { var s = 0; Object.keys(D.paths).forEach(function (k) { s += f(D.paths[k]); }); return s; }
  function pathAll() { return ['glykolyse', 'pdh', 'citratzyklus', 'atmungskette', 'ueberblick'].filter(function (k) { return pathPerfect(k) > 0; }).length; }

  function dueIds(ids) {
    var now = Date.now();
    return ids.filter(function (id) { var c = D.cards[id]; return c && c.dt <= now; })
      .sort(function (a, b) { var x = D.cards[a], y = D.cards[b]; return (x.dt - y.dt) || (x.b - y.b) || (x.ts - y.ts); });
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
    { k: 'sr1', t: 'Erste Reaktion', d: 'Die erste Stoffwechsel-Runde ausgewertet.', v: function () { return pathSum(function (q) { return q.r; }); }, g: 1 },
    { k: 'sp1', t: 'Volltreffer', d: 'Eine Stoffwechsel-Runde komplett richtig.', v: function () { return pathSum(function (q) { return q.t + q.q; }); }, g: 1, nogoal: true },
    { k: 'sp5', t: 'Stoffwechsel-Profi', d: '5 Stoffwechsel-Runden komplett richtig.', v: function () { return pathSum(function (q) { return q.t + q.q; }); }, g: 5 },
    { k: 'sz', t: 'Zuordnungs-Ass', d: 'Eine „Zuordnen“-Runde komplett richtig.', v: function () { return pathSum(function (q) { return q.t; }); }, g: 1, nogoal: true },
    { k: 'sq', t: 'Quizmeister', d: 'Eine „Fragen“-Runde komplett richtig.', v: function () { return pathSum(function (q) { return q.q; }); }, g: 1, nogoal: true },
    { k: 'sgly', t: 'Zuckerbrecher', d: 'Eine Glykolyse-Runde komplett richtig.', v: function () { return pathPerfect('glykolyse'); }, g: 1, nogoal: true },
    { k: 'spdh', t: 'Brückenbauer', d: 'Eine Runde zur Pyruvat-Dehydrogenase komplett richtig.', v: function () { return pathPerfect('pdh'); }, g: 1, nogoal: true },
    { k: 'stca', t: 'Kreislauf', d: 'Eine Citratzyklus-Runde komplett richtig.', v: function () { return pathPerfect('citratzyklus'); }, g: 1, nogoal: true },
    { k: 'satm', t: 'Kraftwerk', d: 'Eine Runde zur Atmungskette komplett richtig.', v: function () { return pathPerfect('atmungskette'); }, g: 1, nogoal: true },
    { k: 'sall', t: 'Zellatmungs-Meister', d: 'In allen fünf Stoffwechselwegen eine Runde komplett richtig.', v: pathAll, g: 5 },
    { k: 'cat', t: 'Gruppe gemeistert', d: 'Alle Karten einer Kategorie mindestens in Box 3.', v: function () { return catDone().length; }, g: 1 }
  ];
  function checkAch() {
    var fresh = [];
    ACH.forEach(function (a) {
      if (!D.ach[a.k] && a.v() >= a.g) { D.ach[a.k] = key(); fresh.push(a.t); }
    });
    return fresh;
  }

  function reset() { D = { cards: {}, days: {}, groups: {}, paths: {}, run: 0, bestRun: 0, ach: {} }; save(); }

  window.Progress = {
    record: record, preview: preview, nextIn: nextIn, recordGroup: recordGroup, recordPath: recordPath, dueIds: dueIds, box: box, totals: totals, today: today, streak: streak,
    mastered: mastered, ach: ACH, got: function (k) { return D.ach[k] || null; }, reset: reset,
    data: function () { return D; }, key: key, dayAdd: dayAdd, catDone: catDone, bestRun: function () { return D.bestRun; }
  };
})();
