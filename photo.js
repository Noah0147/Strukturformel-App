/* Stoffwechsel-Eintrag „Lichtreaktion der Fotosynthese“: Animation der linearen Elektronentransportkette.
   Der Zustand der Zeichnung ist eine reine Funktion der Zeit t (0..T), dadurch funktionieren Regler und Schrittsprünge. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', T = 40, W = 720, Y0 = 56, H = 484;
  var C = { lumen: '#E6F0FB', lumenH: '#F3B7AE', stroma: '#E7F3E1', mem: '#E9D6A4', memLine: '#C9AE6A', ps: '#3F8A4E', b6f: '#8A5FB5', atp: '#E08A2C',
    e: '#1B3A8A', h: '#D0402F', ph: '#F2B600', water: '#4E9AD6', ink: '#1E2B33', mute: '#4D5B63', pq: '#B97B2E', pc: '#3D7BD6', fd: '#C75B7A', fnr: '#7A6A3A', nadp: '#8E989E', nadph: '#2E9E5B' };
  var FONT = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';

  function el(tag, a, parent, txt) {
    var n = document.createElementNS(NS, tag), k;
    for (k in a) n.setAttribute(k, a[k]);
    if (txt != null) n.textContent = txt;
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function ez(x) { return x * x * (3 - 2 * x); }
  function track(t, kf) {
    var i, a, b, u, o0, o1;
    if (t <= kf[0][0]) return [kf[0][1], kf[0][2], kf[0][3] == null ? 1 : kf[0][3]];
    for (i = 0; i < kf.length - 1; i++) {
      a = kf[i]; b = kf[i + 1];
      if (t <= b[0]) {
        u = b[0] === a[0] ? 1 : ez((t - a[0]) / (b[0] - a[0]));
        o0 = a[3] == null ? 1 : a[3]; o1 = b[3] == null ? 1 : b[3];
        return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, o0 + (o1 - o0) * u];
      }
    }
    var l = kf[kf.length - 1]; return [l[1], l[2], l[3] == null ? 1 : l[3]];
  }
  function put(g, p, sc) {
    g.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')' + (sc != null && sc !== 1 ? ' scale(' + sc.toFixed(3) + ')' : ''));
    g.setAttribute('opacity', Math.max(0, Math.min(1, p[2])).toFixed(2));
  }
  function pop(tt, t0) { var u = seg(tt, t0, t0 + 0.35); return 0.25 + 0.75 * u + 0.2 * Math.sin(Math.PI * u); }
  /* Mini-Markup: ^x hochgestellt, _x tiefgestellt (je ein Zeichen) */
  function rich(t, s, size) {
    var parts = [], re = /([\^_])(.)|([^\^_]+)/g, m, shift = 0, tg, k;
    while ((m = re.exec(s))) parts.push(m[3] != null ? { t: m[3], k: 0 } : { t: m[2], k: m[1] === '^' ? 1 : -1 });
    t.textContent = '';
    parts.forEach(function (p) {
      tg = p.k === 1 ? -0.3 : p.k === -1 ? 0.18 : 0;
      k = el('tspan', { dy: ((tg - shift) * size).toFixed(2) }, t, p.t);
      if (p.k) k.setAttribute('font-size', (size * 0.84).toFixed(1));
      shift = tg;
    });
  }
  function text(parent, x, y, s, size, fill, weight, anchor) {
    var t = el('text', { x: x, y: y, 'font-size': size, fill: fill, 'font-weight': weight || 500, 'text-anchor': anchor || 'start', 'font-family': FONT }, parent);
    rich(t, s, size); return t;
  }
  function ball(parent, r, fill, label, lsz) {
    var g = el('g', { opacity: 0 }, parent);
    el('circle', { r: r, fill: fill }, g);
    if (label) g._t = text(g, 0, lsz * 0.34, label, lsz, '#fff', 700, 'middle');
    g._rad = r; g._reg = 'ball'; return g;
  }
  function pill(parent, w, h, fill, label, lsz) {
    var g = el('g', { opacity: 0 }, parent);
    g._r = el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: fill }, g);
    g._t = text(g, 0, lsz * 0.34, label, lsz, '#fff', 700, 'middle');
    g._reg = 'pill'; g._lsz = lsz; return g;
  }

  var WAVE = [[0.4, 1.7, 30, 78, 92, 236], [1.2, 2.5, 30, 78, 92, 236], [14.6, 15.8, 505, 78, 452, 234], [19.0, 20.2, 505, 78, 452, 234]];
  var SLOT = [[128, 138], [168, 176], [235, 146], [360, 110], [205, 200], [400, 112]];
  var HSPAWN = [[95, 192, 5.0], [95, 192, 5.3], [232, 244, 12.6], [346, 244, 12.5], [232, 244, 13.4], [346, 244, 13.6]];
  var HFLOW = [26.8, 27.5, 28.2, 28.9, 29.6, 30.3];
  var OFF = [0, -31];
  var PQK = [[0, 182, 302], [8.4, 182, 302], [11.4, 218, 302], [12.6, 218, 302], [14.8, 182, 302]];
  var PCK = [[0, 305, 210], [13.8, 305, 210], [15.4, 432, 210], [16.0, 432, 210], [17.2, 305, 210], [17.6, 305, 210], [19.2, 432, 210], [19.9, 432, 210], [21.4, 305, 210]];
  var FDK = [[0, 452, 356], [18.6, 452, 356], [19.8, 468, 396], [20.3, 468, 396], [21.3, 452, 356], [21.8, 452, 356], [23.0, 468, 396], [24.6, 468, 396], [25.6, 452, 356]];

  /* Schritte: [Start, Ende, Titel, Text, Hervorhebung x, y, w, h] (Zeiten in Animationszeit, nicht Echtzeit) */
  var STEPS = [
    [0, 3.4, 'Licht trifft Photosystem II', 'Jedes <b>Photon</b> regt <b>P680</b> an. Das angeregte P680* gibt je ein Elektron ab: zwei Photonen, zwei Elektronen.', 34, 224, 122, 102],
    [3.4, 7.6, 'Wasserspaltung im Lumen', '<b>H₂O → ½ O₂ + 2 H⁺ + 2 e⁻</b> (pro Elektronenpaar). Die Elektronen füllen P680⁺ wieder auf, die H⁺ bleiben im Lumen.', 34, 224, 122, 102],
    [7.6, 11.6, 'Plastochinon (PQ) lädt auf', 'PQ nimmt <b>2 e⁻</b> und <b>2 H⁺ aus dem Stroma</b> auf (→ PQH₂) und diffundiert in der Membran zum Cytochrom b₆f.', 150, 256, 112, 66],
    [11.6, 15.0, 'Cytochrom b₆f: Q-Zyklus', 'Netto gelangen pro Elektronenpaar <b>4 H⁺ ins Lumen</b>. Die Elektronen gehen auf <b>Plastocyanin</b> (PC) über.', 239, 224, 102, 102],
    [15.0, 20.4, 'Plastocyanin zu Photosystem I', 'PC bringt die Elektronen <b>einzeln</b> zu P700⁺. Ein <b>Photon</b> regt P700 an, das Elektron geht auf Ferredoxin.', 394, 224, 117, 102],
    [20.4, 26.4, 'NADPH-Bildung im Stroma', 'Ferredoxin (Fd) trägt je <b>1 e⁻</b> zur FNR. <b>NADP⁺ + 2 e⁻ + H⁺ → NADPH</b>.', 428, 326, 142, 122],
    [26.4, 34.0, 'ATP-Synthese', 'Die H⁺ strömen durch F₀ ins Stroma und drehen den Rotor. F₁ bildet <b>ADP + Pᵢ → ATP</b> (ca. 4,7 H⁺ pro ATP).', 574, 226, 142, 202],
    [34.0, 41, 'Bilanz pro Elektronenpaar', '<b>4 Photonen</b> → <b>½ O₂</b>, <b>1 NADPH</b>, ca. <b>1,3 ATP</b>. Im Lumen sammeln sich 6 H⁺ pro Elektronenpaar.', 0, 0, 0, 0]
  ];

  function stepOf(t) { for (var i = STEPS.length - 1; i >= 0; i--) if (t >= STEPS[i][0]) return i; return 0; }

  function Anim(box) {
    var S = {}, svg, dyn, t = 0, play = true, speed = 0.35, lastTs = null, lastStep = -1, drag = false;
    box.innerHTML =
      '<div class="pa">' +
      '<div class="pa-cap" aria-live="polite"><span class="pa-n" id="pa-n">1</span><div><p class="pa-t" id="pa-t"></p><p class="pa-d" id="pa-d"></p></div></div>' +
      '<div class="pa-stage"><svg id="pa-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animation der Lichtreaktion: Elektronentransportkette in der Thylakoidmembran"></svg></div>' +
      '<div class="pa-steps" id="pa-steps" role="group" aria-label="Schritte">' + STEPS.map(function (s, i) { return '<button type="button" data-s="' + i + '" aria-label="Schritt ' + (i + 1) + ': ' + s[2] + '">' + (i === 7 ? '✓' : i + 1) + '</button>'; }).join('') + '</div>' +
      '<div class="pa-ctl"><button type="button" class="tbtn" id="pa-prev" aria-label="Voriger Schritt">‹</button><button type="button" class="tbtn pa-play" id="pa-play">Pause</button><button type="button" class="tbtn" id="pa-next" aria-label="Nächster Schritt">›</button>' +
      '<select class="sel" id="pa-speed" aria-label="Tempo (Geschwindigkeit)"><option value="0.35" selected>1×</option><option value="0.525">1,5×</option><option value="0.7">2×</option><option value="1.05">3×</option></select></div>' +
      '<input type="range" id="pa-r" min="0" max="' + T + '" step="0.01" value="0" aria-label="Zeitleiste">' +
      '<p class="pa-tip">Tipp: Handy quer halten, dann sind die Beschriftungen in der Zeichnung größer. Vereinfacht: PS II und PS I liegen nicht nebeneinander (PS II überwiegend in den Grana, PS I und ATP-Synthase in den Stromalamellen), und Elektronenpaare laufen gemeinsam durch die Kette.</p>' +
      '</div>';
    svg = box.querySelector('#pa-svg');
    var $ = function (id) { return box.querySelector('#' + id); };

    function build() {
      svg.setAttribute('viewBox', '0 ' + Y0 + ' ' + W + ' ' + H);
      el('rect', { y: Y0, width: W, height: H, fill: '#FBFCFB' }, svg);
      el('rect', { x: 0, y: Y0, width: W, height: 194, fill: C.lumen }, svg);
      S.grad = el('rect', { x: 0, y: Y0, width: W, height: 194, fill: C.lumenH, opacity: 0 }, svg);
      el('rect', { x: 0, y: 300, width: W, height: 188, fill: C.stroma }, svg);
      el('rect', { x: 0, y: 250, width: W, height: 50, fill: C.mem }, svg);
      el('line', { x1: 0, y1: 250, x2: W, y2: 250, stroke: C.memLine, 'stroke-width': 2 }, svg);
      el('line', { x1: 0, y1: 300, x2: W, y2: 300, stroke: C.memLine, 'stroke-width': 2 }, svg);
      S.labels = [];
      function lab(x, y, s, size, fill, w, anc) { var q = text(svg, x, y, s, size, fill, w, anc); S.labels.push(q); return q; }
      lab(W - 10, 76, 'Lumen (innen)', 15, C.mute, 700, 'end');
      lab(330, 76, 'viele H^+ → rötlich, pH ↓', 13.5, C.mute, 600, 'middle');
      lab(10, 476, 'Stroma (außen)', 15, C.mute, 700);

      S.hl = el('rect', { rx: 16, fill: 'none', stroke: '#F2B600', 'stroke-width': 5, opacity: 0 }, svg);
      function cplx(x, w, fill, l1, l2) {
        el('rect', { x: x, y: 230, width: w, height: 90, rx: 18, fill: fill, stroke: 'rgba(0,0,0,.2)', 'stroke-width': 1.5 }, svg);
        var a = lab(x + w / 2, l2 ? 268 : 282, l1, 23, '#fff', 800, 'middle');
        var b = l2 ? lab(x + w / 2, 292, l2, 17, '#fff', 700, 'middle') : null;
        return b || a;
      }
      S.p680 = cplx(40, 110, C.ps, 'PS II', 'P680');
      cplx(245, 90, C.b6f, 'Cyt b_6f');
      S.p700 = cplx(400, 105, C.ps, 'PS I', 'P700');
      el('rect', { x: 590, y: 236, width: 62, height: 78, rx: 12, fill: C.atp, stroke: 'rgba(0,0,0,.2)', 'stroke-width': 1.5 }, svg);
      lab(631, 283, 'F_0', 19, '#fff', 800, 'middle');
      el('rect', { x: 614, y: 314, width: 14, height: 14, fill: '#C97420' }, svg);
      el('circle', { cx: 621, cy: 346, r: 32, fill: '#F0A650', stroke: 'rgba(0,0,0,.2)', 'stroke-width': 1.5 }, svg);
      lab(621, 353, 'F_1', 19, '#fff', 800, 'middle');
      lab(640, 397, 'ATP-', 12.5, '#7A400A', 800, 'middle');
      lab(640, 412, 'Synthase', 12.5, '#7A400A', 800, 'middle');
      S.rot = el('g', { opacity: 0 }, svg);
      el('line', { x1: 0, y1: -16, x2: 0, y2: -28, stroke: '#FFFFFF', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, S.rot);
      el('rect', { x: 490, y: 380, width: 60, height: 32, rx: 8, fill: C.fnr }, svg);
      lab(520, 402, 'FNR', 16, '#fff', 800, 'middle');
      lab(154, 342, 'Plastochinon', 14, '#7A5E1F', 700, 'end');
      lab(372, 156, 'Plastocyanin (Lumen)', 14, C.pc, 800, 'middle');
      lab(428, 362, 'Ferredoxin', 14, C.fd, 800, 'end');

      /* Legende */
      el('rect', { x: 0, y: 488, width: W, height: 52, fill: '#FFFFFF' }, svg);
      el('line', { x1: 0, y1: 488, x2: W, y2: 488, stroke: '#DDE3E0' }, svg);
      S.leg = [];
      function legBall(cx, r, fill, l, lsz) {
        var g = el('g', { transform: 'translate(' + cx + ' 514)' }, svg);
        el('circle', { r: r, fill: fill }, g); if (l) g._t = text(g, 0, lsz * 0.34, l, lsz, '#fff', 700, 'middle');
        g._rad = r; g._reg = 'ball'; S.leg.push(g);
      }
      legBall(22, 14, C.e, 'e^−', 11); text(svg, 42, 519, 'Elektron', 14.5, C.ink, 600);
      legBall(138, 14, C.h, 'H^+', 10); text(svg, 158, 519, 'Proton', 14.5, C.ink, 600);
      el('circle', { cx: 246, cy: 514, r: 8, fill: C.ph }, svg); text(svg, 260, 519, 'Photon', 14.5, C.ink, 600);

      el('circle', { cx: 24, cy: 80, r: 9, fill: C.ph, opacity: .9 }, svg);
      el('circle', { cx: 505, cy: 80, r: 9, fill: C.ph, opacity: .9 }, svg);

      dyn = el('g', {}, svg);
      S.flash = el('circle', { r: 10, fill: 'none', stroke: C.ph, 'stroke-width': 5, opacity: 0 }, dyn);
      S.ph = WAVE.map(function () { var q = el('g', { opacity: 0 }, dyn); el('circle', { r: 14, fill: C.ph, opacity: .3 }, q); el('circle', { r: 7.5, fill: C.ph }, q); return q; });
      S.hp = SLOT.map(function () { return ball(dyn, 14, C.h, 'H^+', 10); });
      S.sp = [0, 1, 2, 3, 4].map(function () { return ball(dyn, 14, C.h, 'H^+', 10); });
      S.water = pill(dyn, 54, 26, C.water, 'H_2O', 14);
      S.o2 = ball(dyn, 25, '#D65A4A', '½O_2', 10.5);
      S.we = [0, 1].map(function () { return ball(dyn, 14, C.e, 'e^−', 11); });
      S.pq = pill(dyn, 52, 26, C.pq, 'PQ', 14);
      S.pc = ball(dyn, 19, C.pc, 'PC', 12);
      S.fd = ball(dyn, 19, C.fd, 'Fd', 12);
      S.e = [0, 1].map(function () { return ball(dyn, 14, C.e, 'e^−', 11); });
      S.nadp = pill(dyn, 78, 26, C.nadp, 'NADP^+', 13);
      S.adp = pill(dyn, 84, 26, '#7F8E95', 'ADP+P_i', 13);
      S.atpP = pill(dyn, 56, 26, '#C0561F', 'ATP', 14);
      S.chips = [[330, '½ O_2', C.water], [430, '1 NADPH', C.nadph], [548, 'ca. 1,3 ATP', C.atp]].map(function (c) {
        var q = el('g', { opacity: 0 }, dyn), w = c[1].replace(/[_^]/g, '').length * 9.5 + 26;
        el('rect', { x: c[0], y: 496, width: w, height: 32, rx: 16, fill: c[2] }, q);
        text(q, c[0] + w / 2, 518, c[1], 16, '#fff', 800, 'middle'); return q;
      });
    }

    function riding(tt, kf, off) { var p = track(tt, kf); return [p[0] + off[0], p[1] + off[1], 1]; }
    function setLabel(g, s, w) {
      if (g._cur === s) return; g._cur = s; rich(g._t, s, g._lsz || 13);
      if (w) { g._r.setAttribute('width', w); g._r.setAttribute('x', -w / 2); }
    }

    function setT(tt) {
      tt = ((tt % T) + T) % T; t = tt;
      var i, n = 0, q, fl = null, s = stepOf(tt);
      if (s !== lastStep) {
        lastStep = s;
        $('pa-n').textContent = s === 7 ? '✓' : s + 1;
        $('pa-t').textContent = STEPS[s][2];
        $('pa-d').innerHTML = STEPS[s][3];
        var bs = box.querySelectorAll('#pa-steps button');
        for (i = 0; i < bs.length; i++) bs[i].setAttribute('aria-current', i === s ? 'step' : 'false');
        var h = STEPS[s];
        if (h[6]) { S.hl.setAttribute('x', h[4]); S.hl.setAttribute('y', h[5]); S.hl.setAttribute('width', h[6]); S.hl.setAttribute('height', h[7]); }
      }
      S.hl.setAttribute('opacity', STEPS[s][6] ? (0.55 + 0.45 * Math.sin(tt * 4)).toFixed(2) : 0);
      dyn.setAttribute('opacity', (1 - seg(tt, 39.3, 40)).toFixed(2));

      WAVE.forEach(function (w, j) {
        var u = seg(tt, w[0], w[1]), x = w[2] + (w[4] - w[2]) * u + 5 * Math.sin(tt * 15 + j), y = w[3] + (w[5] - w[3]) * u;
        put(S.ph[j], [x, y, tt >= w[0] && tt < w[1] + 0.1 ? (u < 0.05 ? u * 20 : (tt > w[1] ? 0 : 1)) : 0]);
        if (tt >= w[1] && tt < w[1] + 0.8) fl = [w[4], w[5], (tt - w[1]) / 0.8];
      });
      if (fl) { S.flash.setAttribute('cx', fl[0]); S.flash.setAttribute('cy', fl[1]); S.flash.setAttribute('r', 12 + 34 * fl[2]); S.flash.setAttribute('opacity', (0.85 * (1 - fl[2])).toFixed(2)); } else S.flash.setAttribute('opacity', 0);
      rich(S.p680, (tt >= 1.7 && tt < 1.95) || (tt >= 2.5 && tt < 2.75) ? 'P680*' : (tt >= 1.95 && tt < 6.9 ? 'P680^+' : 'P680'), 17);
      rich(S.p700, (tt >= 15.8 && tt < 16.3) || (tt >= 20.2 && tt < 20.7) ? 'P700*' : 'P700', 17);

      /* Wasserspaltung: H2O wackelt kurz, zerplatzt, die Produkte poppen in verschiedene Richtungen heraus */
      var wob = tt >= 4.7 && tt < 5.0 ? 2.5 * Math.sin(tt * 60) : 0;
      put(S.water, track(tt, [[3.4, 60, 108, 0], [3.7, 60, 108, 1], [4.7, 95, 192, 1], [5.0, 95, 192, 1], [5.06, 95, 192, 0]]).map(function (v, k) { return k === 0 ? v + wob : v; }));
      put(S.o2, track(tt, [[5.0, 95, 192, 0], [5.05, 95, 192, 1], [5.3, 72, 170, 1], [5.8, 42, 150, 1], [6.6, 42, 150, 1], [7.4, 26, 104, 0]]), pop(tt, 5.0));
      put(S.we[0], track(tt, [[5.0, 95, 192, 0], [5.05, 95, 192, 1], [5.35, 88, 220, 1], [5.9, 74, 238, 1], [6.2, 74, 238, 1], [6.35, 74, 238, 0]]), pop(tt, 5.0));
      put(S.we[1], track(tt, [[5.3, 95, 192, 0], [5.35, 95, 192, 1], [5.65, 106, 220, 1], [6.2, 118, 238, 1], [6.8, 118, 238, 1], [6.95, 118, 238, 0]]), pop(tt, 5.3));

      /* Träger */
      var PQ = track(tt, PQK), red = tt >= 8.2 && tt < 12.5;
      put(S.pq, [PQ[0], PQ[1], 1]);
      setLabel(S.pq, red ? 'PQH_2' : 'PQ', red ? 64 : 52);
      var PC = track(tt, PCK), FD = track(tt, FDK);
      put(S.pc, [PC[0], PC[1], 1]); put(S.fd, [FD[0], FD[1], 1]);

      /* Elektronen (Mitfahrt auf einem Träger oder eigener Weg) */
      var e0, e1, K = function (a) { return track(tt, a); };
      if (tt < 8.4) e0 = K([[1.6, 132, 240, 0], [1.75, 132, 240, 1], [2.9, 167, 275, 1], [8.4, 167, 275, 1]]);
      else if (tt < 11.9) e0 = riding(tt, PQK, [-15, -27]);
      else if (tt < 13.5) e0 = K([[11.9, 203, 275, 1], [12.7, 206, 274, 1], [13.3, 252, 250, 1], [13.5, 262, 242, 1]]);
      else if (tt < 13.8) e0 = K([[13.5, 262, 242, 1], [13.65, 262, 200, 1], [13.8, 305, 179, 1]]);
      else if (tt < 15.4) e0 = riding(tt, PCK, OFF);
      else if (tt < 17.0) e0 = K([[15.4, 432, 179, 1], [15.6, 470, 190, 1], [15.75, 470, 225, 1], [15.9, 447, 236, 1], [17.0, 447, 236, 1]]);
      else if (tt < 18.4) e0 = K([[17.0, 447, 236, 1], [17.3, 500, 230, 1], [17.6, 520, 262, 1], [18.0, 520, 326, 1], [18.4, 452, 325, 1]]);
      else if (tt < 19.8) e0 = riding(tt, FDK, OFF);
      else if (tt < 24.0) e0 = K([[19.8, 468, 365, 1], [20.3, 540, 368, 1], [23.4, 540, 368, 1], [24.0, 540, 372, 1]]);
      else e0 = [540, 372, 1 - seg(tt, 24.0, 24.2)];
      if (tt < 8.4) e1 = K([[2.4, 132, 240, 0], [2.55, 132, 240, 1], [3.2, 190, 244, 1], [3.8, 197, 275, 1], [8.4, 197, 275, 1]]);
      else if (tt < 11.9) e1 = riding(tt, PQK, [15, -27]);
      else if (tt < 17.2) e1 = K([[11.9, 233, 275, 1], [12.4, 240, 246, 1], [13.0, 302, 242, 1], [13.3, 302, 242, 1], [17.2, 302, 242, 1]]);
      else if (tt < 17.6) e1 = K([[17.2, 302, 242, 1], [17.4, 350, 210, 1], [17.6, 305, 179, 1]]);
      else if (tt < 19.2) e1 = riding(tt, PCK, OFF);
      else if (tt < 20.4) e1 = K([[19.2, 432, 179, 1], [19.4, 470, 190, 1], [19.6, 470, 225, 1], [19.9, 447, 236, 1], [20.4, 447, 236, 1]]);
      else if (tt < 21.6) e1 = K([[20.4, 447, 236, 1], [20.7, 500, 230, 1], [21.0, 520, 262, 1], [21.3, 520, 326, 1], [21.6, 452, 325, 1]]);
      else if (tt < 23.0) e1 = riding(tt, FDK, OFF);
      else if (tt < 24.0) e1 = K([[23.0, 468, 365, 1], [23.3, 505, 368, 1], [23.4, 505, 368, 1], [24.0, 505, 372, 1]]);
      else e1 = [505, 372, 1 - seg(tt, 24.0, 24.2)];
      put(S.e[0], e0); put(S.e[1], e1);

      /* Protonen aus dem Stroma: 2 am PQ, 2 am b6f (Qn-Stelle), 1 bei der NADPH-Bildung */
      put(S.sp[0], K([[7.0, 178, 400, 0], [7.2, 178, 395, 1], [8.2, 176, 318, 1], [8.4, 176, 312, 0]]));
      put(S.sp[1], K([[7.0, 214, 400, 0], [7.2, 214, 395, 1], [8.2, 202, 318, 1], [8.4, 200, 312, 0]]));
      put(S.sp[2], K([[22.9, 572, 380, 0], [23.1, 572, 380, 1], [23.8, 560, 408, 1], [24.0, 556, 410, 0]]));
      put(S.sp[3], K([[11.6, 266, 400, 0], [11.8, 266, 395, 1], [12.6, 274, 336, 1], [12.8, 276, 330, 0]]));
      put(S.sp[4], K([[11.9, 316, 400, 0], [12.1, 316, 395, 1], [12.9, 308, 336, 1], [13.1, 306, 330, 0]]));

      /* Protonen im Lumen; später durch F0 */
      SLOT.forEach(function (s0, j) {
        var sp = HSPAWN[j], t0 = sp[2], bx = s0[0] + 3 * Math.sin(tt * 1.9 + j * 2), by = s0[1] + 3 * Math.cos(tt * 1.6 + j), pp, f0 = HFLOW[j], sc = 1;
        if (tt < t0) pp = [sp[0], sp[1], 0];
        else if (tt < f0) {
          var u = ez(seg(tt, t0, t0 + (j < 2 ? 0.7 : 1.6)));
          pp = [sp[0] + (bx - sp[0]) * u, sp[1] + (by - sp[1]) * u, tt < t0 + 0.1 ? (tt - t0) / 0.1 : 1];
          sc = pop(tt, t0);
          if (u >= 1) n++;
        } else {
          pp = track(tt, [[f0, bx, by, 1], [f0 + 1.5, 600, 252, 1], [f0 + 2.1, 600, 308, 1], [f0 + 2.7, 574, 354, 0]]);
          if (tt < f0 + 1.5) n += 0.5;
        }
        put(S.hp[j], pp, sc);
      });
      S.grad.setAttribute('opacity', (0.42 * Math.min(1, n / 6)).toFixed(2));
      S.rot.setAttribute('transform', 'translate(621 346) rotate(' + (360 * seg(tt, 27.0, 33.0)).toFixed(1) + ')');
      S.rot.setAttribute('opacity', (seg(tt, 26.8, 27.2) * (1 - seg(tt, 33.0, 33.4))).toFixed(2));
      put(S.adp, K([[31.0, 500, 332, 0], [31.3, 500, 332, 1], [32.4, 543, 360, 1], [32.7, 543, 360, 0]]));
      put(S.atpP, K([[32.7, 686, 356, 0], [32.8, 686, 356, 1], [34.4, 686, 450, 1]]), pop(tt, 32.7));

      q = K([[20.8, 612, 440, 0], [21.0, 612, 440, 1], [22.4, 532, 428, 1], [25.8, 532, 428, 1], [27.0, 470, 462, 1]]);
      put(S.nadp, q);
      var done = tt >= 24.1;
      setLabel(S.nadp, done ? 'NADPH' : 'NADP^+', done ? 84 : 78);
      S.nadp._r.setAttribute('fill', done ? C.nadph : C.nadp);
      var starts = [7.0, 25.8, 34.4];
      S.chips.forEach(function (c, j) { var o = seg(tt, starts[j], starts[j] + 0.5); if (tt >= 34.6) o = 1; c.setAttribute('opacity', o.toFixed(2)); });
      if (!drag) $('pa-r').value = tt;
    }

    function setPlay(p) { play = p; $('pa-play').textContent = p ? 'Pause' : 'Weiter'; lastTs = null; }
    function jump(i) { i = Math.max(0, Math.min(STEPS.length - 1, i)); setT(STEPS[i][0] + 0.01); }
    box.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
      if (b.id === 'pa-play') setPlay(!play);
      else if (b.id === 'pa-next') jump(stepOf(t) + 1 >= STEPS.length ? 0 : stepOf(t) + 1);
      else if (b.id === 'pa-prev') { var s = stepOf(t); jump(t - STEPS[s][0] > 1.5 ? s : s - 1); }
      else if (b.hasAttribute('data-s')) jump(parseInt(b.getAttribute('data-s'), 10));
    });
    $('pa-speed').addEventListener('change', function () { speed = parseFloat(this.value); });
    var r = $('pa-r');
    r.addEventListener('input', function () { drag = true; setT(parseFloat(r.value)); });
    r.addEventListener('change', function () { drag = false; });
    r.addEventListener('pointerup', function () { drag = false; });

    function frame(ts) {
      if (!box.isConnected) return;
      var vis = box.offsetParent !== null && !document.hidden;
      if (play && vis && lastTs != null) setT(t + Math.min(0.1, (ts - lastTs) / 1000) * speed);
      lastTs = vis ? ts : null;
      requestAnimationFrame(frame);
    }
    build(); setT(0);
    box._pa = { S: S, setT: setT, svg: svg };
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlay(false);
    requestAnimationFrame(frame);
  }

  function mc(q, opts, a, why) { return { q: q, o: opts, a: a, why: why }; }
  var ps = {
    id: 'photosynthese', type: 'anim', name: 'Lichtreaktion der Fotosynthese', sub: 'Elektronentransportkette in der Thylakoidmembran',
    intro: 'Die Lichtreaktion wandelt Lichtenergie in chemische Energie um. Die Zahlen gelten pro Elektronenpaar.',
    bil: { basis: 'pro Elektronenpaar (lineare Elektronentransportkette)', rein: ['4 Photonen', '1 H₂O|1', '1 NADP⁺|2', '1 H⁺', 'ca. 1,3 ADP|3', 'ca. 1,3 Pᵢ|3'], raus: ['½ O₂|1', '1 NADPH|2', 'ca. 1,3 ATP|3'], note: 'Pro O₂ sind es 4 Elektronen und damit 8 Photonen, 2 NADPH und ca. 2,7 ATP.' },
    facts: [
      'Pro Elektron arbeiten zwei Photosysteme nacheinander (Z-Schema): PS II (P680) und PS I (P700). Jedes absorbiert pro Elektron ein Photon, für ein Elektronenpaar sind es also 4 Photonen.',
      'Der Mn₄CaO₅-Cluster von PS II spaltet Wasser auf der Lumenseite. Ein O₂ entsteht erst nach 4 Photonen (Kok-Zyklus): 2 H₂O → O₂ + 4 H⁺ + 4 e⁻.',
      'Plastochinon (PQ) ist ein beweglicher Träger in der Membran und nimmt 2 e⁻ und 2 H⁺ auf. Plastocyanin (Lumen) und Ferredoxin (Stroma) tragen nur je 1 Elektron.',
      'Der Q-Zyklus des Cytochrom b₆f bringt pro Elektronenpaar netto 4 H⁺ ins Lumen. Zusammen mit der Wasserspaltung sind es 6 H⁺ pro Elektronenpaar.',
      'Die ATP-Synthase des Chloroplasten hat 14 c-Untereinheiten: 14 H⁺ pro Umdrehung für 3 ATP, also ca. 4,7 H⁺ pro ATP. Daraus folgt ca. 1,3 ATP pro Elektronenpaar.',
      'Im Licht beträgt der pH im Lumen ca. 5 bis 6, im Stroma ca. 8. Beim Chloroplasten besteht die protonenmotorische Kraft fast nur aus dem pH-Gradienten.',
      'Der Calvin-Zyklus braucht ATP : NADPH = 3 : 2 (1,5). Die lineare Kette liefert nur ca. 1,3. Den Rest gleicht der zyklische Elektronenfluss um PS I aus, der ATP ohne NADPH und ohne O₂ bildet.'
    ],
    qs: [
      mc('Wo entsteht der Sauerstoff der Fotosynthese?', ['Bei der Wasserspaltung an Photosystem II', 'An Photosystem I', 'Im Calvin-Zyklus', 'An der ATP-Synthase'], 0, 'Der Mn₄CaO₅-Cluster von PS II oxidiert Wasser auf der Lumenseite.'),
      mc('Wie viele Photonen sind für ein O₂-Molekül nötig?', ['2', '4', '8', '12'], 2, 'Vier Elektronen, jedes durchläuft zwei Photosysteme: 4 × 2 = 8 Photonen.'),
      mc('Welcher Träger bringt die Elektronen vom Cytochrom b₆f zu Photosystem I?', ['Plastochinon', 'Plastocyanin', 'Ferredoxin', 'Cytochrom c'], 1, 'Plastocyanin ist ein kupferhaltiges Protein im Lumen und trägt je 1 Elektron.'),
      mc('Wohin gibt Photosystem I seine Elektronen zuerst ab?', ['An Plastochinon', 'An Plastocyanin', 'An Ferredoxin', 'An Wasser'], 2, 'Ferredoxin (Stroma) übergibt sie dann an die Ferredoxin-NADP⁺-Reduktase (FNR).'),
      mc('Welches Enzym bildet NADPH?', ['ATP-Synthase', 'Ferredoxin-NADP⁺-Reduktase (FNR)', 'Cytochrom b₆f', 'RubisCO'], 1, 'FNR überträgt 2 e⁻ von Ferredoxin und 1 H⁺ auf NADP⁺.'),
      mc('Was nimmt Plastochinon bei der Reduktion zu PQH₂ auf?', ['1 e⁻ und 1 H⁺', '2 e⁻ und 2 H⁺ aus dem Stroma', '2 e⁻ und 2 H⁺ aus dem Lumen', '4 e⁻'], 1, 'PQ + 2 e⁻ + 2 H⁺ (Stroma) → PQH₂.'),
      mc('Wo sammeln sich die Protonen an?', ['Im Stroma', 'Im Thylakoidlumen', 'Im Intermembranraum', 'Im Cytosol'], 1, 'Wasserspaltung und Cytochrom b₆f geben H⁺ ins Lumen ab, das dadurch sauer wird.'),
      mc('Auf welcher Seite der Membran sitzt F₁ der ATP-Synthase?', ['Lumenseite', 'Stromaseite', 'Mitten in der Membran', 'Im Zellkern'], 1, 'F₁ ragt ins Stroma und bildet dort ATP.'),
      mc('Wie viele H⁺ gelangen pro Elektronenpaar insgesamt ins Lumen?', ['2', '4', '6', '12'], 2, '2 H⁺ aus der Wasserspaltung und 4 H⁺ vom Q-Zyklus des Cytochrom b₆f.'),
      mc('Warum reicht die lineare Elektronentransportkette allein nicht für den Calvin-Zyklus?', ['Es entsteht kein NADPH', 'Das ATP : NADPH-Verhältnis ist mit ca. 1,3 zu niedrig', 'Es entsteht zu viel O₂', 'Photosystem II fehlt'], 1, 'Der Calvin-Zyklus braucht 3 ATP pro 2 NADPH (1,5). Der zyklische Elektronenfluss um PS I liefert zusätzliches ATP.'),
      mc('Was geschieht mit P680, nachdem es durch ein Photon angeregt wurde und ein Elektron abgegeben hat?', ['Es wird durch Elektronen aus der Wasserspaltung wieder reduziert', 'Es bleibt als P680⁺ dauerhaft oxidiert', 'Es nimmt Elektronen von Plastocyanin auf', 'Es wird zu P700'], 0, 'P680⁺ ist stark oxidierend und entzieht dem Wasserspaltungskomplex Elektronen.')
    ],
    pairs: [
      { title: 'Bauteile und Aufgaben', hint: 'Welche Aufgabe hat das Bauteil?', rows: [['Photosystem II', 'spaltet Wasser'], ['Cytochrom b₆f', 'bringt H⁺ ins Lumen'], ['Photosystem I', 'reduziert Ferredoxin'], ['FNR', 'bildet NADPH'], ['ATP-Synthase', 'bildet ATP']] },
      { title: 'Elektronenträger', hint: 'Zwischen welchen Bauteilen pendelt der Träger?', rows: [['Plastochinon', 'PS II → Cyt b₆f'], ['Plastocyanin', 'Cyt b₆f → PS I'], ['Ferredoxin', 'PS I → FNR']] },
      { title: 'Zahlen', hint: 'Welcher Wert passt?', rows: [['Photonen pro Elektronenpaar', '4'], ['H⁺ ins Lumen pro Elektronenpaar', '6 H⁺'], ['H⁺ pro ATP (Chloroplast)', 'ca. 4,7 H⁺'], ['ATP pro Elektronenpaar', 'ca. 1,3 ATP'], ['Photonen pro O₂', '8']] }
    ],
    modes: ['pairs0', 'pairs1', 'pairs2']
  };
  window.PATHWAYS = (window.PATHWAYS || []).concat([ps]);
  window.PhotoAnim = { mount: function (box) { new Anim(box); } };
})();
