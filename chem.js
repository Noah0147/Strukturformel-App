(function () {
  var L = 46;
  var EXT = { 'O': [7, 7], 'N': [7, 7], 'S': [7, 7], 'C': [7, 7], 'H': [7, 7], 'P': [7, 7], 'OH': [7, 21], 'HO': [21, 7], 'NH': [7, 21], 'HN': [21, 7], 'SH': [7, 21], 'NH₂': [7, 31], 'H₂N': [31, 7], 'CH₂OH': [7, 54], 'HOH₂C': [54, 7], 'Cl': [10, 10], 'O⁻': [7, 19], 'N⁺': [7, 19] };

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
    fn({ add: add, at: at, bd: bd, st: st, m: m });
    if (m.alpha != null) {
      m.bonds.forEach(function (b) {
        if (b.i === m.alpha && b.j !== m.an && b.j !== m.ac && b.o === 1 && !m.alphaDone) {
          m.alphaDone = true; b.o = 'd';
          st(m.alpha, m.acys ? [m.an, b.j, m.ac] : [m.an, m.ac, b.j], m.acys ? 'R' : 'S');
        }
      });
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
    var n = h.add(0, 0, 'H₂N'), c1 = h.at(n, -30), c2 = h.at(c1, 30), o1 = h.at(c2, 90, 'O'), o2 = h.at(c2, -30, 'OH');
    h.bd(n, c1); h.bd(c1, c2); h.bd(c2, o1, 2); h.bd(c2, o2);
    h.m.alpha = c1; h.m.an = n; h.m.ac = c2;
    return { n: n, c1: c1, c2: c2 };
  }

  function render(m, label) {
    var lines = '', texts = '';
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
        var o2 = 3.4;
        lines += seg(x1 + nx * o2, y1 + ny * o2, x2 + nx * o2, y2 + ny * o2);
        lines += seg(x1 - nx * o2, y1 - ny * o2, x2 - nx * o2, y2 - ny * o2);
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
        lines += seg(x1, y1, x2, y2);
      }
    });
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    m.atoms.forEach(function (a) {
      var e = a.l ? EXT[a.l] : [0, 0], v = a.l ? 11 : 0;
      minX = Math.min(minX, a.x - e[0]); maxX = Math.max(maxX, a.x + e[1]);
      minY = Math.min(minY, a.y - v); maxY = Math.max(maxY, a.y + v);
      if (a.l) {
        var cls = (a.l === 'C' || a.l === 'H' || a.l === 'Cl') ? 'k' : (a.l === 'P' ? 's' : (a.l.indexOf('N') >= 0 ? 'n' : (a.l.indexOf('S') >= 0 ? 's' : 'o')));
        texts += '<text x="' + (a.x - e[0]).toFixed(1) + '" y="' + (a.y + 6.5).toFixed(1) + '" class="' + cls + '">' + a.l + '</text>';
      }
    });
    var W = 420, H = 300, bw = maxX - minX, bh = maxY - minY;
    var sc = Math.min(1.4, (W - 32) / bw, (H - 32) / bh);
    var tx2 = W / 2 - sc * (minX + maxX) / 2, ty2 = H / 2 - sc * (minY + maxY) / 2;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + label + '"><g transform="translate(' + tx2.toFixed(1) + ' ' + ty2.toFixed(1) + ') scale(' + sc.toFixed(3) + ')">' + lines + texts + '</g></svg>';
  }

  window.Chem = { L: L, EXT: EXT, mol: mol, ring: ring, KEK: KEK, SAT: SAT, AP: AP, RP: RP, fusedPent: fusedPent, aaBase: aaBase, render: render };
})();
