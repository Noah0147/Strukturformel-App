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

  var showH = false; /* true: Valenzstrichformel, aber nur für einfache, kettenförmige Moleküle (siehe valence) */
  var VAL = { C: 4, N: 3, O: 2, S: 2, F: 1, Cl: 1, I: 1 }, DIRS = { E: [1, 0], S: [0, 1], W: [-1, 0], N: [0, -1] };
  /* Valenzstrichformel: lineare Kette, alle Atome einzeln; gibt null zurück, wenn die Struktur dafür nicht geeignet ist (Ringe, Phosphat, CoA ...) */
  function buildValence(m) {
    if (m.haworth) return null;
    var nodes = [], map = {}, edges = [], i, STEP = 44;
    for (i = 0; i < m.atoms.length; i++) {
      var a = m.atoms[i], l = a.l || '', q = a.chg === '+' ? 1 : (a.chg ? -1 : 0), f = l.charAt(0), z = l.charAt(l.length - 1), el = null, sub = false;
      if (f === '⁻' || f === '⁺') { q = f === '⁺' ? 1 : -1; l = l.slice(1); } else if (z === '⁻' || z === '⁺') { q = z === '⁺' ? 1 : -1; l = l.slice(0, -1); }
      if (!l || l === 'C') el = 'C';
      else if (l === 'H') continue;
      else if (/^(O|N|S|F|Cl|I)$/.test(l)) el = l;
      else if (l === 'OH' || l === 'HO') el = 'O';
      else if (l === 'SH' || l === 'HS') el = 'S';
      else if (/^(NH₂|H₂N|NH₃|H₃N|NH|HN)$/.test(l)) el = 'N';
      else if (l === 'CH₂OH' || l === 'HOH₂C') { el = 'C'; sub = true; }
      else return null;
      if (el === 'C' && q) return null;
      map[i] = nodes.length; nodes.push({ el: el, q: q, adj: [], h: 0 });
      if (sub) { nodes.push({ el: 'O', q: 0, adj: [], h: 0 }); edges.push([nodes.length - 2, nodes.length - 1, 1]); }
    }
    if (nodes.length > 18) return null;
    var wedgeAt = {};
    for (i = 0; i < m.bonds.length; i++) {
      var b = m.bonds[i], o = b.o;
      if (b.ctr) return null;
      if (o === 'w' || o === 'd') { wedgeAt[b.i] = true; o = 1; }
      else if (o !== 1 && o !== 2 && o !== 3) return null;
      if (map[b.i] == null || map[b.j] == null) continue; /* Bindung zu einem H-Atom */
      edges.push([map[b.i], map[b.j], o]);
    }
    if (edges.length !== nodes.length - 1) return null;
    edges.forEach(function (e) { nodes[e[0]].adj.push({ n: e[1], o: e[2] }); nodes[e[1]].adj.push({ n: e[0], o: e[2] }); });
    var seen = {}, queue = [0]; seen[0] = true;
    while (queue.length) { var u = queue.shift(); nodes[u].adj.forEach(function (e) { if (!seen[e.n]) { seen[e.n] = true; queue.push(e.n); } }); }
    if (Object.keys(seen).length !== nodes.length) return null;
    for (i = 0; i < nodes.length; i++) {
      var nd = nodes[i], sum = 0;
      nd.adj.forEach(function (e) { sum += e.o; });
      nd.h = VAL[nd.el] + (nd.el === 'C' ? 0 : nd.q) - sum;
      if (nd.h < 0) return null;
    }
    for (i = 0; i < edges.length; i++) { /* E/Z-Isomerie geht in der linearen Zeichnung verloren */
      var e2 = edges[i];
      if (e2[2] === 2 && nodes[e2[0]].el === 'C' && nodes[e2[1]].el === 'C' && nodes[e2[0]].adj.length > 1 && nodes[e2[1]].adj.length > 1) return null;
    }
    var cen = {};
    (m.st || []).forEach(function (s) {
      var cn = map[s.c];
      if (cn == null || !s.p || s.p.length !== 3 || nodes[cn].adj.length !== 3 || nodes[cn].h !== 1) { cen.bad = true; return; }
      var pp = s.p.map(function (x) { return map[x]; });
      if (pp.some(function (x) { return x == null || nodes[cn].adj.every(function (e) { return e.n !== x; }); })) { cen.bad = true; return; }
      cen[cn] = { p: pp, cfg: s.cfg };
    });
    if (cen.bad) return null;
    for (var wa in wedgeAt) if (map[wa] == null || !cen[map[wa]]) return null;
    /* längste Kette */
    function bfs(s) {
      var par = {}, dist = {}, qq = [s], far = s; par[s] = -1; dist[s] = 0;
      while (qq.length) { var u2 = qq.shift(); if (dist[u2] > dist[far]) far = u2; nodes[u2].adj.forEach(function (e) { if (dist[e.n] == null) { dist[e.n] = dist[u2] + 1; par[e.n] = u2; qq.push(e.n); } }); }
      return { far: far, par: par };
    }
    var r1 = bfs(0), r2 = bfs(r1.far), path = [], p = r2.far;
    while (p !== -1) { path.push(p); p = r2.par[p]; }
    function oScore(k) { var nd = nodes[k]; if (nd.el === 'O') return 2; var s = 0; nd.adj.forEach(function (e) { if (nodes[e.n].el === 'O') s++; }); return s; }
    if (oScore(path[0]) > oScore(path[path.length - 1])) path.reverse();
    var onPath = {}; path.forEach(function (k, ix) { onPath[k] = ix; });
    function size(k, from) { var s = 1; nodes[k].adj.forEach(function (e) { if (e.n !== from) s += size(e.n, k); }); return s; }
    /* Abstände entlang der Kette: Seitenzweige mit Nebenbesetzung brauchen Platz */
    var wide = path.map(function (k) {
      var w = 0;
      nodes[k].adj.forEach(function (e) { if (onPath[e.n] == null && (nodes[e.n].adj.length - 1 + nodes[e.n].h) >= 2) w = 1; });
      return w;
    });
    var X = [0];
    for (i = 1; i < path.length; i++) X.push(X[i - 1] + STEP * (1 + wide[i - 1] + wide[i]));
    if (X[X.length - 1] > STEP * 9) return null; /* zu lang: würde winzig */
    var out = { atoms: [], bonds: [] }, nid = {};
    function lab(k) { var nd = nodes[k]; return nd.el + (nd.q > 0 ? '⁺' : nd.q < 0 ? '⁻' : ''); }
    function addAt(k, x, y) { nid[k] = out.atoms.length; out.atoms.push({ x: x, y: y, l: lab(k) }); }
    function addHat(k, x, y, kind) { out.atoms.push({ x: x, y: y, l: 'H' }); out.bonds.push({ i: nid[k], j: out.atoms.length - 1, o: kind || 1, ctr: null }); }
    function order(k, from) { return nodes[k].adj.filter(function (e) { return e.n !== from; }).sort(function (a2, b2) { return size(b2.n, k) - size(a2.n, k); }); }
    function branch(k, from, d, ox, oy, bo) { /* k sitzt bei (ox,oy), kam aus Richtung d */
      addAt(k, ox, oy);
      out.bonds.push({ i: nid[from], j: nid[k], o: bo, ctr: null });
      var ch = order(k, from), slots = [d, [d[1], -d[0]], [-d[1], d[0]]], used = 0;
      ch.forEach(function (e) { var s = slots[used++]; branch(e.n, k, s, ox + s[0] * STEP, oy + s[1] * STEP, e.o); });
      for (var h = 0; h < nodes[k].h; h++) { var s2 = slots[used++]; addHat(k, ox + s2[0] * STEP, oy + s2[1] * STEP); }
    }
    path.forEach(function (k, ix) {
      addAt(k, X[ix], 0);
      if (ix > 0) out.bonds.push({ i: nid[path[ix - 1]], j: nid[k], o: nodes[k].adj.filter(function (e) { return e.n === path[ix - 1]; })[0].o, ctr: null });
    });
    path.forEach(function (k, ix) {
      var free = [DIRS.N, DIRS.S];
      if (ix === 0) free.push(DIRS.W);
      if (ix === path.length - 1) free.push(DIRS.E);
      var ch = nodes[k].adj.filter(function (e) { return onPath[e.n] == null; }).sort(function (a2, b2) { return size(b2.n, k) - size(a2.n, k); });
      var stereoH = null;
      if (cen[k]) {
        if (ix === 0 || ix === path.length - 1 || ch.length !== 1) { out.fail = true; return; }
        var P = path[ix - 1], Q = path[ix + 1], pr = cen[k].p, Xn = ch[0].n;
        function cyc(seq) { var s0 = pr.indexOf(seq[0]); return pr[(s0 + 1) % 3] === seq[1] && pr[(s0 + 2) % 3] === seq[2]; }
        var seqA = [Q, P, Xn], seqB = [Q, Xn, P], wantClock = cen[k].cfg === 'R'; /* A: X oben, H unten; B: X unten, H oben */
        var useA = cyc(seqA) === wantClock;
        free = useA ? [DIRS.N, DIRS.S] : [DIRS.S, DIRS.N];
        stereoH = free[1];
      }
      var used = 0;
      ch.forEach(function (e) { var s = free[used++]; branch(e.n, k, s, X[ix] + s[0] * STEP, s[1] * STEP, e.o); });
      for (var h = 0; h < nodes[k].h; h++) {
        var s3 = free[used++];
        if (!s3) { out.fail = true; return; }
        addHat(k, X[ix] + s3[0] * STEP, s3[1] * STEP, stereoH && s3 === stereoH ? 'd' : 1);
      }
    });
    if (out.fail) return null;
    for (i = 0; i < out.atoms.length; i++) for (var j2 = i + 1; j2 < out.atoms.length; j2++) if (Math.hypot(out.atoms[i].x - out.atoms[j2].x, out.atoms[i].y - out.atoms[j2].y) < 30) return null;
    return { atoms: out.atoms, bonds: out.bonds, st: [], _v: true };
  }
  function valence(m) { if (m._vs === undefined) { var r = null; try { r = buildValence(m); } catch (e) { r = null; } m._vs = r; } return m._vs; }
  function render(m, label, skel) {
    if (showH && !skel && !m._v) { var vv = valence(m); if (vv) m = vv; }
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
  function renderPH(m, pH, label, skel) {
    var st = {};
    ionize(m).forEach(function (e) { st[e.i] = e; });
    var atoms = m.atoms.map(function (a, k) {
      var e = st[k], l = fullLabel(a);
      if (e) {
        if (e.kind === 'acid') l = ionState(e, pH) ? ACID[e.nf] : e.nf;
        else l = ionState(e, pH) ? BASE[e.nf] : e.nf;
      }
      return Object.assign({}, a, { l: l, pp: false, chg: undefined, cs: undefined });
    });
    return render(Object.assign({}, m, { atoms: atoms, _vs: undefined }), label, skel);
  }

  window.Chem = { L: L, EXT: EXT, mol: mol, ring: ring, KEK: KEK, SAT: SAT, AP: AP, RP: RP, fusedPent: fusedPent, aaBase: aaBase, render: render, ionize: ionize, phInfo: phInfo, renderPH: renderPH, setH: function (v) { showH = !!v; }, getH: function () { return showH; }, valenzOK: function (m) { return !!valence(m); } };
})();
