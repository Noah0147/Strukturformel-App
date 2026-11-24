/* Statistik-Tab: Tages- und Gesamtquote, Wochenverlauf, Problemgruppen, schwierigste Moleküle, Erfolge. */
(function () {
  'use strict';
  var P = window.Progress, root = document.getElementById('view-stats');
  if (!P || !root) return;
  var resetAsk = false;
  function pct(ok, n) { return n ? Math.round(100 * ok / n) : null; }
  function cls(p) { return p == null ? '' : p >= 80 ? ' good' : p >= 55 ? ' mid' : ' low'; }
  function fmt(d) { var p = d.split('-'); return +p[2] + '.' + +p[1] + '.'; }
  var IC = {
    first: 'M6 21V4M6 4h11l-2 4 2 4H6',
    d10: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
    d30: 'M13 3L5 13h6l-1 8 8-10h-6z',
    d100: 'M12 5a8 8 0 1 0 .01 0M12 9v4l3 2M9 2h6',
    perf: 'M6 3h12l3 6-9 12L3 9zM3 9h18',
    t100: 'M4 8h13v12H4zM7 5h13v12',
    t500: 'M3 8l9-4 9 4-9 4zM3 12l9 4 9-4M3 16l9 4 9-4',
    run10: 'M12 3a9 9 0 1 0 .01 0M12 8a4 4 0 1 0 .01 0M12 11.2a.8.8 0 1 0 .01 0',
    run25: 'M12 3c4 2 6 6 5 11l-3 2h-4l-3-2c-1-5 1-9 5-11zM9 18l-2 3M15 18l2 3M12 8.5a1.5 1.5 0 1 0 .01 0',
    st3: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4',
    st7: 'M12 4a5 5 0 1 0 .01 0M9 13l-2 8 5-3 5 3-2-8',
    m10: 'M6 3h12v18l-6-4-6 4z',
    m50: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3',
    cat: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
    sr1: 'M9 3h6M10 3v6l-5 10a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3M8 15h8',
    sp1: 'M12 3a9 9 0 1 0 .01 0M8 12l3 3 5-6',
    sp5: 'M12 10.4a1.6 1.6 0 1 0 .01 0M2 12c0-2 4-4 10-4s10 2 10 4-4 4-10 4S2 14 2 12zM7 3.5c3-1.5 7 3 9 9s1 9-1.5 8.5M17 3.5c-3-1.5-7 3-9 9s-1 9 1.5 8.5',
    sz: 'M3 3h8v8H3zM13 13h8v8h-8zM11 7h4a2 2 0 0 1 2 2v4',
    sq: 'M12 3a9 9 0 1 0 .01 0M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17.2v.01',
    sgly: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 9.5a2.5 2.5 0 1 0 .01 0',
    spdh: 'M3 18h18M4 18c0-6 4-9 8-9s8 3 8 9M8 18v-4M12 18V9M16 18v-4',
    stca: 'M20 12a8 8 0 1 1-3-6.2M20 4v4h-4',
    satm: 'M3 8h16v9H3zM21 11v3M11 10l-2 3h3l-2 3',
    sall: 'M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M10 18h4'
  };
  function icon(k) { return '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (IC[k] || IC.first) + '"/></svg>'; }
  var WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  function render() {
    var D = P.data(), T = P.totals(), td = P.today(), M = window.MOLECULES || [], CATS = window.CATEGORIES || [];
    var tp = pct(td.ok, td.n), gp = pct(T.ok, T.n);
    var due = P.dueIds(M.map(function (m) { return m.id; })).length;
    var h = '';

    h += '<div class="stiles">' +
      '<div class="stile' + cls(tp) + '"><span class="sl">Heute</span><b>' + (tp == null ? '–' : tp + ' %') + '</b><span class="ss">' + td.n + (td.n === 1 ? ' Antwort' : ' Antworten') + '</span></div>' +
      '<div class="stile' + cls(gp) + '"><span class="sl">Insgesamt</span><b>' + (gp == null ? '–' : gp + ' %') + '</b><span class="ss">' + T.n + ' Antworten</span></div>' +
      '<div class="stile"><span class="sl">Serie</span><b>' + P.streak() + '</b><span class="ss">' + (P.streak() === 1 ? 'Tag' : 'Tage') + ' in Folge</span></div>' +
      '<div class="stile"><span class="sl">Sicher gelernt</span><b>' + P.mastered() + '</b><span class="ss">von ' + M.length + ' Karten</span></div>' +
      '</div>';

    h += '<div class="banner"><p>' + (due ? '<b>' + due + '</b> ' + (due === 1 ? 'Karte ist' : 'Karten sind') + ' heute zur Wiederholung fällig.' : 'Heute ist nichts zur Wiederholung fällig.') + '</p>' +
      (due ? '<button type="button" class="tbtn" id="st-due">Jetzt wiederholen</button>' : '') + '</div>';

    // Letzte 7 Tage
    var days = [], mx = 1, i;
    for (i = 6; i >= 0; i--) { var k = P.dayAdd(-i), d = D.days[k] || { n: 0, ok: 0 }; days.push({ k: k, n: d.n, ok: d.ok }); if (d.n > mx) mx = d.n; }
    h += '<div class="scard"><h3>Letzte 7 Tage</h3><div class="wk">' + days.map(function (x) {
      var p = pct(x.ok, x.n), dt = new Date(x.k + 'T12:00:00');
      return '<div class="wkc"><span class="wkn">' + (x.n || '') + '</span><div class="wkb"><i class="' + cls(p).trim() + '" style="height:' + (x.n ? Math.max(8, Math.round(100 * x.n / mx)) : 0) + '%"></i></div><span class="wkp">' + (p == null ? '' : p + '%') + '</span><span class="wkd">' + WD[dt.getDay()] + '</span></div>';
    }).join('') + '</div><p class="sfoot">Balkenhöhe = Anzahl der Antworten, Farbe = Quote.</p></div>';

    // Gruppen
    var rows = [], unused = 0;
    CATS.concat(Object.keys(D.groups).filter(function (g) { return CATS.indexOf(g) < 0; })).forEach(function (c) {
      var g = D.groups[c], tot = M.filter(function (m) { return m.cat === c; }).length;
      if (!g || !g[0]) { unused++; return; }
      var done = M.filter(function (m) { return m.cat === c && P.box(m.id) >= 4; }).length;
      rows.push({ c: c, n: g[0], ok: g[1], p: pct(g[1], g[0]), tot: tot, done: done });
    });
    rows.sort(function (a, b) { return (a.p - b.p) || (b.n - a.n); });
    h += '<div class="scard"><h3>Nach Gruppe</h3>' + (rows.length ? rows.map(function (r, ix) {
      var prob = r.n >= 5 && r.p < 70 && ix < 3;
      return '<div class="grow"><div class="gh"><span class="sgn">' + r.c + (prob ? ' <em>Hier hakt es</em>' : '') + '</span><span class="sgp' + cls(r.p) + '">' + r.p + ' %</span></div>' +
        '<div class="gbar"><i class="' + cls(r.p).trim() + '" style="width:' + r.p + '%"></i></div>' +
        '<span class="gs">' + r.n + ' Antworten' + (r.tot ? ' · ' + r.done + ' von ' + r.tot + ' Karten sicher' : '') + '</span></div>';
    }).join('') + (unused ? '<p class="sfoot">' + unused + ' Gruppen noch nicht geübt.</p>' : '') : '<p class="sfoot">Noch keine Daten. Bewerte ein paar Karten im Tab „Lernen“.</p>') + '</div>';

    // Schwierigste Moleküle
    var hard = M.map(function (m) { var c = D.cards[m.id]; return c && c.n >= 2 && c.ok < c.n ? { m: m, n: c.n, ok: c.ok, p: c.ok / c.n } : null; })
      .filter(Boolean).sort(function (a, b) { return (a.p - b.p) || (b.n - a.n); }).slice(0, 6);
    if (hard.length) {
      h += '<div class="scard"><h3>Schwierigste Moleküle</h3>' + hard.map(function (x) {
        return '<button type="button" class="hrow" data-id="' + x.m.id + '"><span class="hn">' + x.m.name + '<small>' + x.m.cat + '</small></span><span class="sgp' + cls(Math.round(100 * x.p)) + '">' + x.ok + ' von ' + x.n + '</span></button>';
      }).join('') + '<p class="sfoot">Tippen öffnet die Karte in der Datenbank.</p></div>';
    }

    // Erfolge
    var got = P.ach.filter(function (a) { return P.got(a.k); }).length;
    h += '<div class="scard"><h3>Erfolge <span class="sn">' + got + ' von ' + P.ach.length + '</span></h3><div class="achs">' + P.ach.map(function (a) {
      var dt = P.got(a.k), v = Math.min(a.v(), a.g);
      return '<div class="ach' + (dt ? ' on' : '') + '"><span class="ai">' + icon(a.k) + '</span><b>' + a.t + '</b><span class="ad">' + a.d + '</span><span class="af">' + (dt ? 'erreicht am ' + fmt(dt) : (a.nogoal ? 'noch offen' : v + ' / ' + a.g)) + '</span></div>';
    }).join('') + '</div></div>';

    h += '<div class="scard sreset">' + (resetAsk ? '<p>Wirklich alle Statistiken, Erfolge und Wiederholungstermine löschen? Die „Gewusst“/„Nochmal“-Markierungen im Lernen-Tab bleiben.</p><div class="tools"><button type="button" class="tbtn" id="st-yes">Ja, löschen</button><button type="button" class="tbtn" id="st-no">Abbrechen</button></div>'
      : '<button type="button" class="tbtn" id="st-reset">Statistik zurücksetzen</button>') + '</div>';
    h += '<p class="sfoot">Wiederholung: Eine Karte, die du weißt, kommt nach 1, 3, 7 und 16 Tagen wieder. Eine, die du nicht wusstest, sofort. Die Daten bleiben nur auf diesem Gerät.</p>';
    root.innerHTML = h;
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
    if (t.id === 'st-due') { if (window.startDue) window.startDue(); }
    else if (t.id === 'st-reset') { resetAsk = true; render(); }
    else if (t.id === 'st-no') { resetAsk = false; render(); }
    else if (t.id === 'st-yes') { P.reset(); resetAsk = false; render(); }
    else if (t.classList.contains('hrow') && window.openMolecule) window.openMolecule(t.getAttribute('data-id'));
  });
  window.StatsUI = { open: render };
})();
