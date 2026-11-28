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
    if (t <= kf[0][0]) return kf[0].slice(1);
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
  function put(g, p) {
    g.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')');
    g.setAttribute('opacity', Math.max(0, Math.min(1, p[2])).toFixed(2));
  }
  function text(parent, x, y, s, size, fill, weight, anchor) {
    return el('text', { x: x, y: y, 'font-size': size, fill: fill, 'font-weight': weight || 500, 'text-anchor': anchor || 'start', 'font-family': FONT }, parent, s);
  }
  function ball(parent, r, fill, label, lsz) {
    var g = el('g', { opacity: 0 }, parent);
    el('circle', { r: r, fill: fill }, g);
    if (label) text(g, 0, lsz * 0.36, label, lsz, '#fff', 700, 'middle');
    return g;
  }
  function pill(parent, w, h, fill, label, lsz) {
    var g = el('g', { opacity: 0 }, parent);
    g._r = el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: fill }, g);
    g._t = text(g, 0, lsz * 0.36, label, lsz, '#fff', 700, 'middle');
    return g;
  }

  var WAVE = [[0.4, 1.7, 30, 78, 92, 246], [1.2, 2.5, 30, 78, 92, 246], [14.6, 15.8, 505, 78, 452, 246], [19.0, 20.2, 505, 78, 452, 246]];
  var SLOT = [[60, 150], [130, 168], [235, 150], [330, 128], [285, 178], [375, 160]];
  var HSPAWN = [[84, 205, 5.0], [108, 205, 5.0], [282, 238, 12.2], [296, 238, 12.5], [310, 238, 12.8], [324, 238, 13.1]];
  var HFLOW = [26.8, 27.5, 28.2, 28.9, 29.6, 30.3];

  /* Schritte: [Start, Ende, Titel, Text, Hervorhebung x, y, w, h] (Zeiten in Animationszeit, nicht Echtzeit) */
  var STEPS = [
    [0, 3.4, 'Licht trifft Photosystem II', 'Jedes <b>Photon</b> regt <b>P680</b> an. Das angeregte P680* gibt je ein Elektron ab: zwei Photonen, zwei Elektronen.', 34, 224, 122, 102],
    [3.4, 7.6, 'Wasserspaltung im Lumen', '<b>H₂O → ½ O₂ + 2 H⁺ + 2 e⁻</b> (pro Elektronenpaar). Die Elektronen füllen P680⁺ wieder auf, die H⁺ bleiben im Lumen.', 34, 224, 122, 102],
    [7.6, 11.6, 'Plastochinon (PQ) lädt auf', 'PQ nimmt <b>2 e⁻</b> und <b>2 H⁺ aus dem Stroma</b> auf (→ PQH₂) und diffundiert in der Membran zum Cytochrom b₆f.', 108, 262, 172, 56],
    [11.6, 15.0, 'Cytochrom b₆f: Q-Zyklus', 'Netto gelangen pro Elektronenpaar <b>4 H⁺ ins Lumen</b>. Die Elektronen gehen auf <b>Plastocyanin</b> (PC) über.', 239, 224, 102, 102],
    [15.0, 20.4, 'Plastocyanin zu Photosystem I', 'PC bringt die Elektronen <b>einzeln</b> zu P700⁺. Ein <b>Photon</b> regt P700 an, das Elektron geht auf Ferredoxin.', 394, 224, 117, 102],
    [20.4, 26.4, 'NADPH-Bildung im Stroma', 'Ferredoxin (Fd) trägt je <b>1 e⁻</b> zur FNR. <b>NADP⁺ + 2 e⁻ + H⁺ → NADPH</b>.', 432, 330, 126, 90],
    [26.4, 34.0, 'ATP-Synthese', 'Die H⁺ strömen durch F₀ ins Stroma und drehen den Rotor. F₁ bildet <b>ADP + Pᵢ → ATP</b> (ca. 4,7 H⁺ pro ATP).', 572, 226, 106, 190],
    [34.0, 41, 'Bilanz pro Elektronenpaar', '<b>4 Photonen</b> → <b>½ O₂</b>, <b>1 NADPH</b>, ca. <b>1,3 ATP</b>. Im Lumen sammeln sich 6 H⁺ pro Elektronenpaar.', 0, 0, 0, 0]
  ];

  function stepOf(t) { for (var i = STEPS.length - 1; i >= 0; i--) if (t >= STEPS[i][0]) return i; return 0; }

  function Anim(box) {
    var S = {}, svg, dyn, t = 0, play = true, speed = 0.6, lastTs = null, lastStep = -1, alive = true, drag = false;
    box.innerHTML =
      '<div class="pa">' +
      '<div class="pa-cap" aria-live="polite"><span class="pa-n" id="pa-n">1</span><div><p class="pa-t" id="pa-t"></p><p class="pa-d" id="pa-d"></p></div></div>' +
      '<div class="pa-stage"><svg id="pa-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animation der Lichtreaktion: Elektronentransportkette in der Thylakoidmembran"></svg></div>' +
      '<div class="pa-steps" id="pa-steps" role="group" aria-label="Schritte">' + STEPS.map(function (s, i) { return '<button type="button" data-s="' + i + '" aria-label="Schritt ' + (i + 1) + ': ' + s[2] + '">' + (i === 7 ? '✓' : i + 1) + '</button>'; }).join('') + '</div>' +
      '<div class="pa-ctl"><button type="button" class="tbtn" id="pa-prev" aria-label="Voriger Schritt">‹</button><button type="button" class="tbtn pa-play" id="pa-play">Pause</button><button type="button" class="tbtn" id="pa-next" aria-label="Nächster Schritt">›</button>' +
      '<select class="sel" id="pa-speed" aria-label="Tempo (Geschwindigkeit)"><option value="0.35">0,35×</option><option value="0.6" selected>0,6×</option><option value="0.85">0,85×</option><option value="1.2">1,2×</option></select></div>' +
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
      text(svg, W - 10, 76, 'Lumen (innen)', 15, C.mute, 700, 'end');
      text(svg, 330, 76, 'viele H⁺ → rötlich, pH ↓', 13.5, C.mute, 600, 'middle');
      text(svg, 10, 476, 'Stroma (außen)', 15, C.mute, 700);

      S.hl = el('rect', { rx: 16, fill: 'none', stroke: '#F2B600', 'stroke-width': 5, opacity: 0 }, svg);
      function cplx(x, w, fill, l1, l2) {
        el('rect', { x: x, y: 230, width: w, height: 90, rx: 18, fill: fill, stroke: 'rgba(0,0,0,.2)', 'stroke-width': 1.5 }, svg);
        text(svg, x + w / 2, l2 ? 266 : 282, l1, 23, '#fff', 800, 'middle');
        return l2 ? text(svg, x + w / 2, 292, l2, 17, '#fff', 700, 'middle') : null;
      }
      S.p680 = cplx(40, 110, C.ps, 'PS II', 'P680');
      cplx(245, 90, C.b6f, 'Cyt b₆f');
      S.p700 = cplx(400, 105, C.ps, 'PS I', 'P700');
      el('rect', { x: 590, y: 236, width: 62, height: 78, rx: 12, fill: C.atp, stroke: 'rgba(0,0,0,.2)', 'stroke-width': 1.5 }, svg);
      text(svg, 621, 283, 'F₀', 19, '#fff', 800, 'middle');
      el('rect', { x: 614, y: 314, width: 14, height: 14, fill: '#C97420' }, svg);
      el('circle', { cx: 621, cy: 346, r: 32, fill: '#F0A650', stroke: 'rgba(0,0,0,.2)', 'stroke-width': 1.5 }, svg);
      text(svg, 621, 353, 'F₁', 19, '#fff', 800, 'middle');
      text(svg, 621, 400, 'ATP-Synthase', 14.5, '#7A400A', 800, 'middle');
      S.rot = el('g', {}, svg);
      el('line', { x1: 0, y1: 0, x2: 0, y2: -24, stroke: '#7A3E08', 'stroke-width': 4, 'stroke-linecap': 'round' }, S.rot);
      el('circle', { r: 5, fill: '#7A3E08' }, S.rot);
      el('rect', { x: 490, y: 380, width: 60, height: 32, rx: 8, fill: C.fnr }, svg);
      text(svg, 520, 402, 'FNR', 16, '#fff', 800, 'middle');
      text(svg, 168, 342, 'Plastochinon-Pool', 14, '#7A5E1F', 700, 'middle');
      text(svg, 372, 178, 'Plastocyanin (Lumen)', 14, C.pc, 800, 'middle');
      text(svg, 425, 384, 'Ferredoxin', 14, C.fd, 800, 'middle');

      /* Legende */
      el('rect', { x: 0, y: 488, width: W, height: 52, fill: '#FFFFFF' }, svg);
      el('line', { x1: 0, y1: 488, x2: W, y2: 488, stroke: '#DDE3E0' }, svg);
      el('circle', { cx: 20, cy: 514, r: 9, fill: C.e }, svg); text(svg, 20, 518, 'e⁻', 10, '#fff', 700, 'middle'); text(svg, 35, 519, 'Elektron', 14.5, C.ink, 600);
      el('circle', { cx: 124, cy: 514, r: 6.5, fill: C.h }, svg); text(svg, 135, 519, 'H⁺', 14.5, C.ink, 600);
      el('circle', { cx: 190, cy: 514, r: 7, fill: C.ph }, svg); text(svg, 202, 519, 'Photon', 14.5, C.ink, 600);

      el('circle', { cx: 24, cy: 80, r: 9, fill: C.ph, opacity: .9 }, svg);
      el('circle', { cx: 505, cy: 80, r: 9, fill: C.ph, opacity: .9 }, svg);

      dyn = el('g', {}, svg);
      S.flash = el('circle', { r: 10, fill: 'none', stroke: C.ph, 'stroke-width': 5, opacity: 0 }, dyn);
      S.ph = WAVE.map(function () { var q = el('g', { opacity: 0 }, dyn); el('circle', { r: 14, fill: C.ph, opacity: .3 }, q); el('circle', { r: 7.5, fill: C.ph }, q); return q; });
      S.hp = SLOT.map(function () { return ball(dyn, 7, C.h, '', 0); });
      S.sp = [0, 1, 2, 3, 4].map(function () { return ball(dyn, 6.5, C.h, '', 0); });
      S.water = pill(dyn, 46, 24, C.water, 'H₂O', 14);
      S.o2 = ball(dyn, 13, '#D65A4A', '½O₂', 9.5);
      S.we = [0, 1].map(function () { return ball(dyn, 9, C.e, 'e⁻', 10); });
      S.pq = pill(dyn, 48, 24, C.pq, 'PQ', 14);
      S.pc = ball(dyn, 14, C.pc, 'PC', 11);
      S.fd = ball(dyn, 14, C.fd, 'Fd', 11);
      S.e = [0, 1].map(function () { return ball(dyn, 9.5, C.e, 'e⁻', 10.5); });
      S.nadp = pill(dyn, 62, 24, C.nadp, 'NADP⁺', 13);
      S.adp = pill(dyn, 76, 24, '#7F8E95', 'ADP+Pᵢ', 13);
      S.atpP = pill(dyn, 54, 24, '#C0561F', 'ATP', 14);
      S.chips = [[330, '½ O₂', C.water], [430, '1 NADPH', C.nadph], [548, 'ca. 1,3 ATP', C.atp]].map(function (c) {
        var q = el('g', { opacity: 0 }, dyn), w = c[1].length * 9.5 + 26;
        el('rect', { x: c[0], y: 496, width: w, height: 32, rx: 16, fill: c[2] }, q);
        text(q, c[0] + w / 2, 518, c[1], 16, '#fff', 800, 'middle'); return q;
      });
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
        if (tt >= w[1] && tt < w[1] + 0.8) fl = [w[4], 262, (tt - w[1]) / 0.8];
      });
      if (fl) { S.flash.setAttribute('cx', fl[0]); S.flash.setAttribute('cy', fl[1]); S.flash.setAttribute('r', 12 + 34 * fl[2]); S.flash.setAttribute('opacity', (0.85 * (1 - fl[2])).toFixed(2)); } else S.flash.setAttribute('opacity', 0);
      S.p680.textContent = (tt >= 1.7 && tt < 1.95) || (tt >= 2.5 && tt < 2.75) ? 'P680*' : (tt >= 1.95 && tt < 6.9 ? 'P680⁺' : 'P680');
      S.p700.textContent = (tt >= 15.8 && tt < 16.3) || (tt >= 20.2 && tt < 20.7) ? 'P700*' : 'P700';

      put(S.water, track(tt, [[3.4, 60, 108, 0], [3.7, 60, 108, 1], [4.7, 95, 196, 1], [5.0, 95, 206, 1], [5.2, 95, 206, 0]]));
      put(S.o2, track(tt, [[5.0, 95, 206, 0], [5.3, 95, 206, 1], [7.0, 28, 118, 0.9], [7.6, 20, 100, 0]]));
      put(S.we[0], track(tt, [[5.2, 95, 208, 0], [5.3, 95, 208, 1], [6.2, 95, 256, 1], [6.3, 95, 256, 0]]));
      put(S.we[1], track(tt, [[5.8, 95, 208, 0], [5.9, 95, 208, 1], [6.8, 95, 256, 1], [6.9, 95, 256, 0]]));

      var PQ = track(tt, [[0, 168, 285, 1], [8.4, 168, 285, 1], [11.4, 262, 285, 1], [11.9, 262, 285, 1], [14.6, 168, 285, 1]]), red = tt >= 8.2 && tt < 12.0;
      put(S.pq, PQ);
      S.pq._t.textContent = red ? 'PQH₂' : 'PQ';
      S.pq.setAttribute('opacity', 1);
      S.pq._r.setAttribute('width', red ? 60 : 48); S.pq._r.setAttribute('x', red ? -30 : -24);

      var PC = track(tt, [[0, 305, 210, 1], [13.0, 305, 210, 1], [15.0, 432, 210, 1], [16.8, 305, 210, 1], [17.2, 305, 210, 1], [19.4, 432, 210, 1], [21.2, 305, 210, 1]]);
      var FD = track(tt, [[0, 452, 350, 1], [17.0, 452, 350, 1], [18.4, 520, 395, 1], [19.8, 452, 350, 1], [21.4, 452, 350, 1], [22.8, 520, 395, 1], [24.2, 520, 395, 1], [25.4, 452, 350, 1]]);
      put(S.pc, PC); put(S.fd, FD);

      var e0, e1;
      if (tt < 8.4) e0 = track(tt, [[1.6, 95, 262, 0], [1.7, 95, 262, 1], [1.8, 95, 262, 1], [3.0, 152, 278, 1], [8.4, 152, 278, 1]]);
      else if (tt < 11.9) e0 = [PQ[0] - 11, PQ[1] - 16, 1];
      else if (tt < 13.0) e0 = track(tt, [[11.9, 253, 271, 1], [12.7, 292, 266, 1], [13.0, 292, 266, 1]]);
      else if (tt < 15.0) e0 = [PC[0], PC[1], 1];
      else if (tt < 17.0) e0 = track(tt, [[15.0, 432, 210, 1], [15.8, 447, 262, 1], [17.0, 447, 262, 1]]);
      else if (tt < 18.4) e0 = [FD[0], FD[1], 1];
      else e0 = track(tt, [[18.4, 520, 395, 1], [23.8, 512, 390, 1], [24.0, 512, 390, 0]]);
      if (tt < 8.4) e1 = track(tt, [[2.4, 95, 262, 0], [2.5, 95, 262, 1], [2.6, 95, 262, 1], [3.8, 152, 292, 1], [8.4, 152, 292, 1]]);
      else if (tt < 11.9) e1 = [PQ[0] + 11, PQ[1] - 16, 1];
      else if (tt < 16.8) e1 = track(tt, [[11.9, 253, 271, 1], [12.7, 292, 278, 1], [16.8, 292, 278, 1]]);
      else if (tt < 17.3) e1 = track(tt, [[16.8, 292, 278, 1], [17.3, 305, 210, 1]]);
      else if (tt < 19.4) e1 = [PC[0], PC[1], 1];
      else if (tt < 21.4) e1 = track(tt, [[19.4, 432, 210, 1], [20.2, 447, 268, 1], [21.4, 452, 350, 1]]);
      else if (tt < 22.8) e1 = [FD[0], FD[1], 1];
      else e1 = track(tt, [[22.8, 520, 395, 1], [23.8, 530, 390, 1], [24.0, 530, 390, 0]]);
      if (tt >= 20.2 && tt < 21.4) e1 = track(tt, [[20.2, 447, 268, 1], [21.4, 452, 350, 1]]);
      put(S.e[0], e0); put(S.e[1], e1);

      /* Protonen aus dem Stroma: 2 am PQ (QB-Stelle), 2 am b6f (Qn-Stelle), 1 bei der NADPH-Bildung */
      put(S.sp[0], track(tt, [[7.0, 128, 395, 0], [7.2, 128, 390, 1], [8.2, 150, 298, 1], [8.4, 156, 290, 0]]));
      put(S.sp[1], track(tt, [[7.0, 182, 395, 0], [7.2, 182, 390, 1], [8.2, 176, 298, 1], [8.4, 172, 290, 0]]));
      put(S.sp[2], track(tt, [[22.8, 570, 368, 0], [23.0, 570, 368, 1], [23.8, 530, 400, 1], [24.0, 528, 402, 0]]));
      put(S.sp[3], track(tt, [[11.6, 262, 395, 0], [11.8, 262, 390, 1], [12.6, 272, 324, 1], [12.8, 276, 318, 0]]));
      put(S.sp[4], track(tt, [[11.9, 318, 395, 0], [12.1, 318, 390, 1], [12.9, 306, 324, 1], [13.1, 302, 318, 0]]));

      SLOT.forEach(function (s0, j) {
        var sp = HSPAWN[j], t0 = sp[2], bx = s0[0] + 3 * Math.sin(tt * 1.9 + j * 2), by = s0[1] + 3 * Math.cos(tt * 1.6 + j), pp, f0 = HFLOW[j];
        if (tt < t0) pp = [sp[0], sp[1], 0];
        else if (tt < f0) {
          var u = ez(seg(tt, t0, t0 + 1.6));
          pp = [sp[0] + (bx - sp[0]) * u, sp[1] + (by - sp[1]) * u, tt < t0 + 0.2 ? (tt - t0) / 0.2 : 1];
          if (u >= 1) n++;
        } else {
          pp = track(tt, [[f0, bx, by, 1], [f0 + 1.3, 620, 236, 1], [f0 + 2.0, 621, 330, 1], [f0 + 2.4, 621, 372, 0]]);
          if (tt < f0 + 1.3) n += 0.5;
        }
        put(S.hp[j], pp);
      });
      S.grad.setAttribute('opacity', (0.42 * Math.min(1, n / 6)).toFixed(2));
      S.rot.setAttribute('transform', 'translate(621 346) rotate(' + (360 * seg(tt, 27.0, 33.0)).toFixed(1) + ')');
      put(S.adp, track(tt, [[31.0, 575, 440, 0], [31.3, 575, 440, 1], [32.6, 621, 350, 1], [32.8, 621, 350, 0]]));
      put(S.atpP, track(tt, [[32.6, 621, 350, 0], [32.9, 621, 350, 1], [34.4, 672, 440, 1]]));
      q = track(tt, [[20.8, 612, 440, 0], [21.0, 612, 440, 1], [22.4, 532, 428, 1], [24.0, 532, 428, 1], [25.8, 470, 462, 1]]);
      put(S.nadp, q);
      var done = tt >= 24.0;
      S.nadp._t.textContent = done ? 'NADPH' : 'NADP⁺';
      S.nadp._r.setAttribute('fill', done ? C.nadph : C.nadp);
      S.nadp._r.setAttribute('width', done ? 70 : 62); S.nadp._r.setAttribute('x', done ? -35 : -31);
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
      if (!box.isConnected) { alive = false; return; }
      var vis = box.offsetParent !== null && !document.hidden;
      if (play && vis && lastTs != null) setT(t + Math.min(0.1, (ts - lastTs) / 1000) * speed * 1);
      lastTs = vis ? ts : null;
      requestAnimationFrame(frame);
    }
    build(); setT(0);
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
