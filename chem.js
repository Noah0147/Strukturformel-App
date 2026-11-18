(function () {
  var L = 46;
  var EXT = { 'O': [7, 7], 'N': [7, 7], 'S': [7, 7], 'C': [7, 7], 'H': [7, 7], 'P': [7, 7], 'OH': [7, 21], 'HO': [21, 7], 'NH': [7, 21], 'HN': [21, 7], 'SH': [7, 21], 'HS': [21, 7], 'NH₂': [7, 31], 'H₂N': [31, 7], 'CH₂OH': [7, 54], 'HOH₂C': [54, 7], 'Cl': [10, 10], 'O⁻': [7, 19], 'N⁺': [7, 19], 'O⁺': [7, 19], 'C⁻': [7, 19], '⁻O': [19, 7], 'F': [6, 6], 'I': [3, 3], 'Co': [11, 11], 'R': [7, 7], 'CN': [7, 21], 'NH₃': [7, 31], 'H₃N': [31, 7], 'CoA': [7, 30] };

  function mol(fn) {
    var m = { atoms: [], bonds: [], st: [] };
    function add(x, y, l) { m.atoms.push({ x: x, y: y, l: l || '' }); return m.atoms.length - 1; }
    function at(i, deg, l) {
      var a = m.atoms[i], r = deg * Math.PI / 180;
      return add(a.x + L * Math.cos(r), a.y - L * Math.sin(r), l);
    }
    function bd(i, j, o, ctr) { m.bonds.push({ i: i, j: j, o: o || 1, ctr: ctr || null }); }
    /* st(zentrum, [Prioritäten 1..3 (4)], 'R'|'S'): Sollwert für die Prüfung der Keil-/Strichbindungen */
    function st(c, p, cfg) { m.st.push({ c: c, p: p, cfg: cfg }); }
    function ion(i, kind, pka) { (m.manIons = m.manIons || []).push({ i: i, kind: kind, pka: pka }); }
    fn({ add: add, at: at, bd: bd, st: st, ion: ion, m: m });
    if (m.alpha != null) {
      /* L-Aminosäure im üblichen Schema: Aminogruppe am Keil (nach unten), Carboxygruppe rechts, Seitenkette links in der Ebene */
      var side = null;
      m.bonds.forEach(function (b) { if (!side && b.i === m.alpha && b.j !== m.an && b.j !== m.ac && b.o === 1) side = b; });
      if (side) {
        m.bonds.forEach(function (b) { if ((b.i === m.an && b.j === m.alpha) || (b.i === m.alpha && b.j === m.an)) { b.i = m.alpha; b.j = m.an; b.o = 'w'; } });
        st(m.alpha, m.acys ? [m.an, side.j, m.ac] : [m.an, m.ac, side.j], m.acys ? 'R' : 'S');
      }
    }
    return m;
  }

  function ring(h, cx, cy, start, orders, labels) {
    labels = labels || {};
    var idx = [], k, a;
    for (k = 0; k < 6; k++) {
      a = (start + 60 * k) * Math.PI / 180;
      idx.push(h.add(cx + L * Math.cos(a), cy - L * Math.sin(a), labels[k]));
    }
    for (k = 0; k < 6; k++) {
      var o = orders[k];
      if (o === 0) continue;
      h.bd(idx[k], idx[(k + 1) % 6], o, o === 2 ? [cx, cy] : null);
    }
    return idx;
  }
  var KEK = [2, 1, 2, 1, 2, 1], SAT = [1, 1, 1, 1, 1, 1];
  var AP = L / (2 * Math.tan(Math.PI / 5)), RP = L / (2 * Math.sin(Math.PI / 5));

  function fusedPent(h, r, l7, l9, dbl) {
    var a = h.m.atoms, p4 = a[r[4]], p5 = a[r[5]];
    var pcx = (p4.x + p5.x) / 2 + AP, pcy = (p4.y + p5.y) / 2, ctr = [pcx, pcy];
    function pv(deg, l) { var q = deg * Math.PI / 180; return h.add(pcx + RP * Math.cos(q), pcy - RP * Math.sin(q), l); }
    var n7 = pv(72, l7), c8 = pv(0), n9 = pv(-72, l9);
    h.bd(r[4], r[5], 2, ctr);
    h.bd(r[5], n7);
    h.bd(n7, c8, dbl === '78' ? 2 : 1, dbl === '78' ? ctr : null);
    h.bd(c8, n9, dbl === '89' ? 2 : 1, dbl === '89' ? ctr : null);
    h.bd(n9, r[4]);
    return { n7: n7, c8: c8, n9: n9 };
  }

  function aaBase(h) {
    var c1 = h.add(0, 0), n = h.at(c1, 270, 'NH₂'), c2 = h.at(c1, 30), o1 = h.at(c2, 90, 'O'), o2 = h.at(c2, -30, 'OH');
    h.bd(c1, n); h.bd(c1, c2); h.bd(c2, o1, 2); h.bd(c2, o2);
    h.m.alpha = c1; h.m.an = n; h.m.ac = c2;
    return { n: n, c1: c1, c2: c2 };
  }

  var showH = false; /* true: Valenzstrichformel (alle Atome, auch C und H, einzeln gezeichnet) */
  function withH(m) {
    var atoms = m.atoms.map(function (a) { return Object.assign({}, a); }), bonds = m.bonds.map(function (b) { return b; }), n0 = atoms.length, i;
    function addH(i, ang, len, l) { atoms.push({ x: atoms[i].x + (len || 30) * Math.cos(ang), y: atoms[i].y + (len || 30) * Math.sin(ang), l: l || 'H' }); bonds.push({ i: i, j: atoms.length - 1, o: 1, ctr: null }); return atoms.length - 1; }
    function angles(i) {
      var angs = [];
      bonds.forEach(function (b) { if (b.i === i || b.j === i) { var Q = atoms[b.i === i ? b.j : b.i]; angs.push(Math.atan2(Q.y - atoms[i].y, Q.x - atoms[i].x)); } });
      return angs.sort(function (p, q) { return p - q; });
    }
    function spread(i, k, len) { /* k H-Atome gleichmäßig in die größte Lücke */
      var angs = angles(i), start, gap, k2;
      if (!angs.length) { start = -Math.PI / 2; gap = 2 * Math.PI; }
      else { gap = -1; start = 0; angs.forEach(function (t, q) { var nx = q + 1 < angs.length ? angs[q + 1] : angs[0] + 2 * Math.PI, g = nx - t; if (g > gap) { gap = g; start = t; } }); }
      for (k2 = 1; k2 <= k; k2++) addH(i, start + gap * k2 / (k + 1), len);
    }
    for (i = 0; i < n0; i++) {
      var A = atoms[i];
      if (A.l) continue;
      var val = 0;
      m.bonds.forEach(function (b) { if (b.i === i || b.j === i) val += (b.o === 2 || b.o === 3) ? b.o : 1; });
      var nh = 4 - val;
      if (!A.rc) A.l = 'C'; /* Haworth-Ring: Ringkohlenstoffe bleiben unbeschriftet (Konvention) */
      if (nh <= 0) continue;
      if (A.rc) { /* Haworth-Ring: H senkrecht, gegenüber der Gruppe */
        var vb = null;
        m.bonds.forEach(function (b) { if ((b.i === i || b.j === i) && b.v) vb = b; });
        (vb ? [-vb.v] : (nh >= 2 ? [1, -1] : [1])).forEach(function (dv) { addH(i, dv > 0 ? -Math.PI / 2 : Math.PI / 2, 26); });
        continue;
      }
      spread(i, nh, 30);
    }
    /* beschriftete Gruppen in einzelne Atome auflösen */
    for (i = 0; i < n0; i++) {
      var B = atoms[i], L = B.l, chg = '', f, z;
      if (!L) continue;
      f = L.charAt(0); z = L.charAt(L.length - 1);
      if (f === '⁻' || f === '⁺') { chg = f; L = L.slice(1); } else if (z === '⁻' || z === '⁺') { chg = z; L = L.slice(0, -1); }
      var nbs = [];
      bonds.forEach(function (b) { if (b.i === i || b.j === i) nbs.push(atoms[b.i === i ? b.j : b.i]); });
      if (nbs.length === 1 && nbs[0].rc) continue; /* Gruppen am Haworth-Ring bleiben als OH, CH₂OH stehen */
      if (L === 'OH' || L === 'HO' || L === 'SH' || L === 'HS') {
        B.l = L.replace('H', '') + chg;
        if (nbs.length === 1) {
          var th = Math.atan2(nbs[0].y - B.y, nbs[0].x - B.x) + Math.PI, c1 = th + 0.95, c2 = th - 0.95;
          addH(i, Math.sin(c1) < Math.sin(c2) ? c1 : c2, 28);
        } else spread(i, 1, 28);
      } else if (L === 'NH₂' || L === 'H₂N' || L === 'NH₃' || L === 'H₃N') {
        B.l = 'N' + chg; spread(i, L.indexOf('₃') >= 0 ? 3 : 2, 28);
      } else if (L === 'NH' || L === 'HN') {
        B.l = 'N' + chg; spread(i, 1, 28);
      } else if ((L === 'CH₂OH' || L === 'HOH₂C') && nbs.length === 1) {
        var out = Math.atan2(B.y - nbs[0].y, B.x - nbs[0].x), oi = atoms.length;
        B.l = 'C';
        atoms.push({ x: B.x + 38 * Math.cos(out), y: B.y + 38 * Math.sin(out), l: 'O' }); bonds.push({ i: i, j: oi, o: 1, ctr: null });
        spread(i, 2, 28);
        var th2 = out, cc1 = th2 + 0.95, cc2 = th2 - 0.95;
        addH(oi, Math.sin(cc1) < Math.sin(cc2) ? cc1 : cc2, 28);
      }
    }
    return Object.assign({}, m, { atoms: atoms, bonds: bonds, _h: true });
  }
  function render(m, label) {
    if (showH && !m._h) m = withH(m);
    var lines = '', texts = '';
    m.atoms.forEach(function (a, ix) { a.idx = ix; /* Ladung vom Elementsymbol trennen: Bindungen enden am Buchstaben, die Ladung steht als Hochzeichen daneben */
      if (a.pp || !a.l) return;
      a.pp = true;
      var f = a.l.charAt(0), z = a.l.charAt(a.l.length - 1);
      if (f === '⁻' || f === '⁺') { a.chg = f === '⁻' ? '\u2212' : '+'; a.cs = -1; a.l = a.l.slice(1); }
      else if (z === '⁻' || z === '⁺') { a.chg = z === '⁻' ? '\u2212' : '+'; a.cs = 1; a.l = a.l.slice(0, -1); }
    });
    function gapOf(a, ux, uy) {
      if (!a.l) return 0;
      var e = EXT[a.l];
      var tx = Math.abs(ux) < 0.01 ? Infinity : (ux > 0 ? e[1] : e[0]) / Math.abs(ux);
      var ty = Math.abs(uy) < 0.01 ? Infinity : 10 / Math.abs(uy);
      return Math.min(tx, ty) + 3;
    }
    function seg(a, b, c, d) {
      return '<line x1="' + a.toFixed(1) + '" y1="' + b.toFixed(1) + '" x2="' + c.toFixed(1) + '" y2="' + d.toFixed(1) + '"/>';
    }
    function sideOf(b, A, B, nx, ny) { /* +1/-1: Seite, auf der die übrigen Nachbarn liegen; 0: symmetrisch (Nachbarn auf beiden Seiten oder keine) */
      var sum = 0, cnt = 0;
      m.bonds.forEach(function (c) {
        if (c === b) return;
        var P = null, Q = null;
        if (c.i === b.i || c.i === b.j) { P = m.atoms[c.i]; Q = m.atoms[c.j]; } else if (c.j === b.i || c.j === b.j) { P = m.atoms[c.j]; Q = m.atoms[c.i]; }
        if (!P) return;
        var vx = Q.x - P.x, vy = Q.y - P.y, vl = Math.hypot(vx, vy) || 1;
        sum += (vx / vl) * nx + (vy / vl) * ny; cnt++;
      });
      if (!cnt) return 0;
      var avg = sum / cnt;
      return Math.abs(sum) > 0.45 ? (sum > 0 ? 1 : -1) : 0;
    }
    m.bonds.forEach(function (b) {
      var A = m.atoms[b.i], B = m.atoms[b.j];
      var dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      var g1 = gapOf(A, ux, uy), g2 = gapOf(B, -ux, -uy);
      var x1 = A.x + ux * g1, y1 = A.y + uy * g1, x2 = B.x - ux * g2, y2 = B.y - uy * g2;
      var nx = -uy, ny = ux;
      if (b.o === 2 && b.ctr) {
        lines += seg(x1, y1, x2, y2);
        var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        var s = ((b.ctr[0] - mx) * nx + (b.ctr[1] - my) * ny) > 0 ? 1 : -1;
        var off = 6, t = 0.17 * len;
        var ta = g1 ? g1 + 4 : t, tb = g2 ? g2 + 4 : t;
        lines += seg(A.x + ux * ta + s * nx * off, A.y + uy * ta + s * ny * off,
                     B.x - ux * tb + s * nx * off, B.y - uy * tb + s * ny * off);
      } else if (b.o === 2) {
        /* symmetrisch; an einem unbeschrifteten Kettenatom mit genau einem weiteren Nachbarn werden die Linien so verkürzt, dass sie sauber in die Einzelbindung übergehen */
        var o2 = 3.4;
        function endT(P, ux2, uy2, nx2, ny2, sg) { /* Startversatz entlang der Achse für die Linie auf Seite sg */
          if (P.l) return 0;
          var nbs = [];
          m.bonds.forEach(function (c) { if (c === b) return; var Q = c.i === P.idx ? m.atoms[c.j] : (c.j === P.idx ? m.atoms[c.i] : null); if (Q) nbs.push(Q); });
          if (nbs.length !== 1) return 0;
          var wx = nbs[0].x - P.x, wy = nbs[0].y - P.y, wl = Math.hypot(wx, wy) || 1; wx /= wl; wy /= wl;
          var wn = wx * nx2 + wy * ny2, wu = wx * ux2 + wy * uy2;
          if (Math.abs(wn) < 0.2) return 0;
          var tin = (o2 / wn) * wu * (wn > 0 ? 1 : -1) * 1; /* Schnitt der Innenlinie mit der Nachbarbindung */
          tin = (o2 * Math.abs(1 / wn)) * wu;
          return (sg * wn > 0) ? tin : -tin;
        }
        [1, -1].forEach(function (sg) {
          var tA = endT(A, ux, uy, nx, ny, sg), tB = endT(B, -ux, -uy, -nx, -ny, -sg);
          var sx = (g1 ? x1 : A.x + ux * tA) , sy = (g1 ? y1 : A.y + uy * tA), ex = (g2 ? x2 : B.x - ux * tB), ey = (g2 ? y2 : B.y - uy * tB);
          lines += seg(sx + sg * nx * o2, sy + sg * ny * o2, ex + sg * nx * o2, ey + sg * ny * o2);
        });
      } else if (b.o === 'b' || b.o === 'mi' || b.o === 'mj') {
        var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), px = -dy / L, py = dx / L, wi = (b.o === 'b' || b.o === 'mi') ? 4 : 0.8, wj = (b.o === 'b' || b.o === 'mj') ? 4 : 0.8;
        lines += '<polygon class="w" points="' + [x1 + px * wi, y1 + py * wi, x2 + px * wj, y2 + py * wj, x2 - px * wj, y2 - py * wj, x1 - px * wi, y1 - py * wi].map(function (v) { return v.toFixed(1); }).join(' ') + '"/>';
      } else if (b.o === 'w') {
        var hw = 4.8;
        lines += '<polygon class="w" points="' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' ' + (x2 + nx * hw).toFixed(1) + ',' + (y2 + ny * hw).toFixed(1) + ' ' + (x2 - nx * hw).toFixed(1) + ',' + (y2 - ny * hw).toFixed(1) + '"/>';
      } else if (b.o === 'd') {
        var nd = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 4.6)), kd, td, w2;
        for (kd = 1; kd <= nd; kd++) {
          td = kd / nd; w2 = 0.8 + 4.4 * td;
          lines += seg(x1 + (x2 - x1) * td - nx * w2, y1 + (y2 - y1) * td - ny * w2, x1 + (x2 - x1) * td + nx * w2, y1 + (y2 - y1) * td + ny * w2);
        }
      } else if (b.o === 3) {
        var o3 = 5.2;
        lines += seg(x1, y1, x2, y2);
        lines += seg(x1 + nx * o3, y1 + ny * o3, x2 + nx * o3, y2 + ny * o3);
        lines += seg(x1 - nx * o3, y1 - ny * o3, x2 - nx * o3, y2 - ny * o3);
      } else {
        /* Einzelbindung endet an einem Kettenatom mit Doppelbindung (z. B. Aldehyd): um den Winkelversatz verlängern, damit sie die äußere Linie trifft */
        function extFor(P, Q) {
          if (P.l) return 0;
          var dbl = null, n = 0;
          m.bonds.forEach(function (c) { if (c.i === P.idx || c.j === P.idx) { n++; if (c !== b && c.o === 2 && !c.ctr) dbl = c; } });
          if (n !== 2 || !dbl) return 0;
          var R = m.atoms[dbl.i === P.idx ? dbl.j : dbl.i];
          var ax = R.x - P.x, ay = R.y - P.y, al = Math.hypot(ax, ay) || 1, wx = Q.x - P.x, wy = Q.y - P.y, wl = Math.hypot(wx, wy) || 1;
          var wn = Math.abs((ax * wy - ay * wx) / (al * wl));
          return wn < 0.2 ? 0 : 3.4 / wn;
        }
        var eA = extFor(A, B), eB = extFor(B, A);
        lines += seg(x1 - ux * eA, y1 - uy * eA, x2 + ux * eB, y2 + uy * eB);
      }
    });
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    m.atoms.forEach(function (a) {
      var e = a.l ? EXT[a.l] : [0, 0], v = a.l ? 11 : 0;
      minX = Math.min(minX, a.x - e[0]); maxX = Math.max(maxX, a.x + e[1]);
      minY = Math.min(minY, a.y - v); maxY = Math.max(maxY, a.y + v);
      if (a.l) {
        var cls = (a.l === 'C' || a.l === 'H' || a.l === 'Cl' || a.l === 'F' || a.l === 'I' || a.l === 'C⁻' || a.l === 'R' || a.l === 'Co' || a.l === 'CoA') ? 'k' : (a.l === 'P' ? 's' : (a.l.indexOf('N') >= 0 ? 'n' : (a.l.indexOf('S') >= 0 ? 's' : 'o')));
        var ty = (a.y + 6.5).toFixed(1), ax = a.x.toFixed(1), n = a.l.length;
        function tx(x, anchor, s) { return '<text x="' + x.toFixed(1) + '" y="' + ty + '" text-anchor="' + anchor + '" class="' + cls + '">' + s + '</text>'; }
        if (n === 1 || e[0] === e[1]) texts += tx(a.x, 'middle', a.l);
        else if (e[0] < e[1]) texts += tx(a.x, 'middle', a.l.charAt(0)) + tx(a.x + 7.2, 'start', a.l.slice(1)); /* OH, NH, NH₂: Bindungsatom vorn */
        else texts += tx(a.x, 'middle', a.l.charAt(n - 1)) + tx(a.x - 7.2, 'end', a.l.slice(0, -1)); /* HO, H₂N, HOH₂C: Bindungsatom hinten */
        if (a.chg) { /* Ladung dorthin, wo am wenigsten Bindungen liegen (bevorzugt rechts oben) */
          var dirs = [], best = 45, bestS = -1, d, s2, k2, diff;
          m.bonds.forEach(function (b) {
            var o = b.i === a.idx ? m.atoms[b.j] : (b.j === a.idx ? m.atoms[b.i] : null);
            if (o) dirs.push(Math.atan2(-(o.y - a.y), o.x - a.x) * 180 / Math.PI);
          });
          for (d = 0; d < 360; d += 15) {
            s2 = 360;
            for (k2 = 0; k2 < dirs.length; k2++) { diff = Math.abs(((d - dirs[k2]) % 360 + 540) % 360 - 180); if (diff < s2) s2 = diff; }
            s2 -= Math.min(Math.abs(d - 45), 360 - Math.abs(d - 45)) / 40; /* leichte Vorliebe für oben rechts */
            if (s2 > bestS) { bestS = s2; best = d; }
          }
          var cxx = a.x + 13 * Math.cos(best * Math.PI / 180), cyy = a.y - 13 * Math.sin(best * Math.PI / 180);
          texts += '<text x="' + cxx.toFixed(1) + '" y="' + (cyy + 5).toFixed(1) + '" text-anchor="middle" class="' + cls + '" style="font-size:15px">' + a.chg + '</text>';
          minX = Math.min(minX, cxx - 6); maxX = Math.max(maxX, cxx + 6); minY = Math.min(minY, cyy - 8); maxY = Math.max(maxY, cyy + 8);
        }
      }
    });
    var W = 420, H = 300, bw = maxX - minX, bh = maxY - minY;
    var sc = Math.min(1.4, (W - 32) / bw, (H - 32) / bh);
    var tx2 = W / 2 - sc * (minX + maxX) / 2, ty2 = H / 2 - sc * (minY + maxY) / 2;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + label + '"><g transform="translate(' + tx2.toFixed(1) + ' ' + ty2.toFixed(1) + ') scale(' + sc.toFixed(3) + ')">' + lines + texts + '</g></svg>';
  }


  /* ---------- pH-Regler: ionisierbare Gruppen erkennen und Lehrbuch-pKa-Werte zuordnen ---------- */
  var ACID = { 'OH': 'O⁻', 'HO': '⁻O', 'SH': 'S⁻', 'HS': '⁻S' };
  var BASE = { 'NH₂': 'NH₃⁺', 'H₂N': '⁺H₃N', 'NH': 'NH₂⁺', 'HN': '⁺H₂N', 'N': 'NH⁺' };
  function inv(o) { var r = {}, k; for (k in o) r[o[k]] = k; return r; }
  var ACIDI = inv(ACID), BASEI = inv(BASE);
  function fullLabel(a) {
    var l = a.l || '';
    if (a.cs === -1) return (a.chg === '+' ? '⁺' : '⁻') + l;
    if (a.cs === 1) return l + (a.chg === '+' ? '⁺' : '⁻');
    return l;
  }
  function ionize(m) {
    if (m.ions) return m.ions;
    var n = m.atoms.length, nb = [], i, lab = m.atoms.map(fullLabel), ions = [], taken = {};
    for (i = 0; i < n; i++) nb.push([]);
    m.bonds.forEach(function (b) {
      var o = (b.o === 2 || b.o === 3) ? b.o : 1;
      nb[b.i].push({ j: b.j, o: o }); nb[b.j].push({ j: b.i, o: o });
    });
    function isC(k) { return lab[k] === '' || lab[k] === 'C'; }
    function hasDbl(k) { return nb[k].some(function (x) { return x.o >= 2; }); }
    function sp3(k) { return isC(k) && !hasDbl(k); }
    function freeN(k) { var f = BASE[lab[k]] ? lab[k] : BASEI[lab[k]]; return !!f && f !== 'N' && !nbrs(k).some(function (y) { return isC(y) && termO(y); }); }
    function nbrs(k) { return nb[k].map(function (x) { return x.j; }); }
    function termO(k) { return nb[k].some(function (x) { return x.o === 2 && lab[x.j] === 'O' && nb[x.j].length === 1; }); }
    function isAmideC(k) { return termO(k); }
    function ringOf(s) {
      var path = [s], res = null;
      function dfs(u, d) {
        if (res) return;
        if (d === 6) { if (nb[u].some(function (x) { return x.j === s; })) res = path.slice(); return; }
        nb[u].forEach(function (x) { if (res || path.indexOf(x.j) >= 0) return; path.push(x.j); dfs(x.j, d + 1); path.pop(); });
      }
      dfs(s, 1); return res;
    }
    function aromatic(r) {
      var c = 0, k, j, a, b;
      for (k = 0; k < 6; k++) { a = r[k]; b = r[(k + 1) % 6]; for (j = 0; j < nb[a].length; j++) if (nb[a][j].j === b && nb[a][j].o === 2) c++; }
      return c >= 2;
    }
    function add(k, kind, pka, nf) { if (taken[k]) return; taken[k] = true; ions.push({ i: k, kind: kind, pka: pka, nf: nf }); }
    (m.manIons || []).forEach(function (e) {
      var l = lab[e.i], nf = e.kind === 'acid' ? (ACID[l] ? l : ACIDI[l]) : (BASE[l] ? l : BASEI[l]);
      if (nf) add(e.i, e.kind, e.pka, nf);
    });
    var phos = {}, guan = false;
    for (i = 0; i < n; i++) {
      if (taken[i]) continue;
      var l = lab[i], nfA = ACID[l] ? l : ACIDI[l], nfB = BASE[l] ? l : BASEI[l], p, q, k, ok;
      if (nfA && nb[i].length === 1 && nb[i][0].o === 1) {
        p = nb[i][0].j;
        if (nfA === 'OH' || nfA === 'HO') {
          if (lab[p] === 'P') { (phos[p] = phos[p] || []).push(i); continue; }
          if (lab[p] === 'S' && nb[p].filter(function (x) { return x.o === 2 && lab[x.j] === 'O'; }).length >= 2) { add(i, 'acid', -1.5, nfA); continue; }
          if (!isC(p)) continue;
          if (termO(p)) {
            var al = nbrs(p).filter(function (x) { return isC(x); })[0], pk = 4.5;
            if (al != null) {
              if (sp3(al) && nbrs(al).some(function (x) { return freeN(x); })) pk = 2.2;
              else if (nbrs(al).some(function (x) { return x !== p && sp3(x) && nbrs(x).some(function (y) { return freeN(y); }); })) pk = 3.9;
              else if (nbrs(al).some(function (x) { return x !== p && sp3(x) && nbrs(x).some(function (y) { return y !== al && sp3(y) && nbrs(y).some(function (z) { return freeN(z); }); }); })) pk = 4.3;
              else if (nbrs(al).some(function (x) { return x !== p && (lab[x] === 'OH' || lab[x] === 'HO' || lab[x] === 'O⁻' || lab[x] === '⁻O' || (lab[x] === 'O' && nb[x].length === 1)); })) pk = 3.5;
              else if (hasDbl(al)) pk = 4.2;
            }
            add(i, 'acid', pk, nfA);
          } else if (nb[p].some(function (x) { return x.o === 2 && isC(x.j); })) {
            q = ringOf(p);
            if (q && aromatic(q) && q.every(isC)) add(i, 'acid', 10, nfA);
          }
        } else if (sp3(p)) add(i, 'acid', 8.3, nfA);
        continue;
      }
      if (!nfB) continue;
      if ((nfB === 'NH₂' || nfB === 'H₂N') && nb[i].length === 1 && nb[i][0].o === 1) {
        p = nb[i][0].j;
        if (!isC(p) || isAmideC(p)) continue;
        if (sp3(p)) { add(i, 'base', nbrs(p).some(function (x) { return isC(x) && termO(x); }) ? 9.5 : 10.4, nfB); }
        else if (nb[p].every(function (x) { return lab[x.j] !== 'N' && lab[x.j] !== 'NH' && lab[x.j] !== 'HN' && lab[x.j] !== 'O'; })) {
          q = ringOf(p); if (q && aromatic(q) && q.every(isC)) add(i, 'base', 4.6, nfB);
        }
      } else if ((nfB === 'NH' || nfB === 'HN') && nb[i].length === 2 && nb[i].every(function (x) { return x.o === 1 && sp3(x.j); })) {
        add(i, 'base', 10.5, nfB);
      } else if ((nfB === 'NH' || nfB === 'HN') && nb[i].length === 1 && nb[i][0].o === 2) {
        p = nb[i][0].j;
        if (isC(p)) {
          var nn = nbrs(p).filter(function (x) { return x !== i && /^[NH]/.test(lab[x]) && lab[x] !== 'H'; }).length, oo = nbrs(p).some(function (x) { return lab[x] === 'O' || lab[x] === 'OH' || lab[x] === 'HO'; });
          if (nn >= 2 && !oo && !guan) { guan = true; add(i, 'base', 12.5, nfB); }
        }
      } else if (nfB === 'N') {
        if (nb[i].length === 3 && nb[i].every(function (x) { return x.o === 1 && sp3(x.j); }) && nb[i].every(function (x) { return !isAmideC(x.j); })) add(i, 'base', 9.5, nfB);
        else if (nb[i].length === 2 && nb[i].every(function (x) { return isC(x.j); })) {
          q = ringOf(i);
          if (q && aromatic(q) && q.every(function (x) { return x === i || isC(x); })) add(i, 'base', 5.2, nfB);
        }
      }
    }
    Object.keys(phos).forEach(function (P) {
      var list = phos[P], pk = list.length === 1 ? [1.5] : (list.length === 2 ? [1.5, 6.5] : [2.1, 7.2, 12.3]);
      list.forEach(function (k, z) { add(k, 'acid', pk[Math.min(z, pk.length - 1)], lab[k] === '⁻O' || lab[k] === 'HO' ? 'HO' : 'OH'); });
    });
    m.ions = ions; m.fixedChg = 0; m.fixPos = 0;
    m.atoms.forEach(function (a, k) {
      if (taken[k] || !a.chg) return;
      m.fixedChg += a.chg === '+' ? 1 : -1;
      if (a.chg === '+' && !nbrs(k).some(function (y) { return m.atoms[y].chg === '\u2212'; })) m.fixPos++;
    });
    return ions;
  }
  function ionState(e, pH) { return e.kind === 'acid' ? pH > e.pka : pH < e.pka; } /* Säure: deprotoniert / Base: protoniert */
  function chargeAt(m, pH) {
    var net = m.fixedChg, pos = 0, neg = 0;
    ionize(m).forEach(function (e) { if (ionState(e, pH)) { if (e.kind === 'acid') { net--; neg++; } else { net++; pos++; } } });
    return { net: net, zw: (pos > 0 || m.fixPos > 0) && neg > 0 && net === 0 };
  }
  function phInfo(m, pH) {
    var r = chargeAt(m, pH), ions = ionize(m), hasA = false, hasB = false;
    ions.forEach(function (e) { if (e.kind === 'acid') hasA = true; else hasB = true; });
    function f(x) {
      var q = m.fixedChg;
      ions.forEach(function (e) { q += e.kind === 'acid' ? -1 / (1 + Math.pow(10, e.pka - x)) : 1 / (1 + Math.pow(10, x - e.pka)); });
      return q;
    }
    var pi = null;
    if (hasA && hasB && f(-2) > 0 && f(16) < 0) {
      var lo = -2, hi = 16, k, mid;
      for (k = 0; k < 40; k++) { mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; }
      pi = (lo + hi) / 2;
    }
    return { net: r.net, zw: r.zw, pi: pi };
  }
  function renderPH(m, pH, label) {
    var st = {};
    ionize(m).forEach(function (e) { st[e.i] = e; });
    var atoms = m.atoms.map(function (a, k) {
      var e = st[k], l = fullLabel(a);
      if (e) {
        if (e.kind === 'acid') l = ionState(e, pH) ? ACID[e.nf] : e.nf;
        else l = ionState(e, pH) ? BASE[e.nf] : e.nf;
      }
      return Object.assign({}, a, { l: l });
    });
    return render(Object.assign({}, m, { atoms: atoms }), label);
  }

  window.Chem = { L: L, EXT: EXT, mol: mol, ring: ring, KEK: KEK, SAT: SAT, AP: AP, RP: RP, fusedPent: fusedPent, aaBase: aaBase, render: render, ionize: ionize, phInfo: phInfo, renderPH: renderPH, setH: function (v) { showH = !!v; }, getH: function () { return showH; } };
})();
