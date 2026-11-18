/* Reiter „Stoffwechsel“: Verstehen (Diagramm, Vorschau) und Üben (Diagramm beschriften, Fragen).
   Übungsrunden wechseln die Aufgabenart: Namen zuordnen, Strukturen zuordnen, Enzyme zuordnen, Paare. */
(function () {
  var P = window.PATHWAYS || [], root = document.getElementById('view-path');
  if (!root || !P.length) return;
  var body = document.getElementById('path-body'), sel = document.getElementById('path-sel');
  var cur = P[0], mode = 'learn', selN = null, round = null, qz = null, built = false, modeNo = {};
  var QN = 5;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pc(x, t) { return (x / t * 100).toFixed(2) + '%'; }
  function comp(id) { for (var i = 0; i < cur.comps.length; i++) if (cur.comps[i].id === id) return cur.comps[i]; return null; }
  function molObj(id) { var ms = window.MOLECULES || []; for (var i = 0; i < ms.length; i++) if (ms[i].id === id) return ms[i]; return null; }
  var svgC = {};
  function molSvg(id) { var m = molObj(id); return m ? (svgC[id] || (svgC[id] = window.Chem.renderPH(m.m, 7.4, 'Strukturformel bei pH 7,4'))) : ''; }
  function isOv() { return cur.type === 'overview'; }
  var HY = { 'Dihydroxyacetonphosphat': 'Dihydroxy&shy;aceton&shy;phosphat', '1,3-Bisphosphoglycerat': '1,3-Bis&shy;phospho&shy;glycerat', '2-Phosphoglycerat': '2-Phospho&shy;glycerat', '3-Phosphoglycerat': '3-Phospho&shy;glycerat',
    'Phosphoenolpyruvat': 'Phospho&shy;enol&shy;pyruvat', 'Glycerinaldehyd-3-phosphat': 'Glycerin&shy;aldehyd-3-&shy;phosphat', 'Fructose-1,6-bisphosphat': 'Fructose-1,6-&shy;bisphosphat', 'Glucose-6-phosphat': 'Glucose-6-&shy;phosphat',
    'Fructose-6-phosphat': 'Fructose-6-&shy;phosphat', 'α-Ketoglutarat': 'α-Keto&shy;glutarat', 'Pyruvat-Dehydrogenase': 'Pyruvat-Dehydro&shy;genase' };
  function hy(n) { return HY[n] || n; }
  function nodeName(k) { return isOv() ? cur.stages['gpca'.indexOf(k)].n : cur.mets[k].n; }

  /* ---------- Geometrie ---------- */
  function box(k) { var d = cur.dia, p = d.nodes[k]; return { x: p[0], y: p[1], w: d.node[0], h: d.node[1] }; }
  function exitPt(A, B, pad) {
    var dx = B.x - A.x, dy = B.y - A.y, tx = dx ? (A.w / 2 + pad) / Math.abs(dx) : 1e9, ty = dy ? (A.h / 2 + pad) / Math.abs(dy) : 1e9, t = Math.min(tx, ty, 1);
    return [A.x + dx * t, A.y + dy * t];
  }
  function geom() {
    var d = cur.dia, ar = [], pills = [], mid = [], tags = [];
    (cur.steps || []).forEach(function (st, i) {
      var A = box(st.a[0]);
      st.b.forEach(function (bk, j) {
        var B = box(bk), s = exitPt(A, B, 3), e = exitPt(B, A, 5);
        ar.push([s, e]);
        if (j === 0) mid[i] = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2];
      });
      if (st.a[1]) {
        var C = box(st.a[1]), m = mid[i], sC = exitPt(C, { x: m[0], y: m[1], w: 0, h: 0 }, 3);
        ar.push([sC, m]);
      }
      var off = d.pill ? (d.pill[i] || [0, 0]) : [0, 0], px, py, ox = 0, oy = 0;
      if (d.ring) { var vx = mid[i][0] - d.ring[0], vy = mid[i][1] - d.ring[1], L = Math.hypot(vx, vy) || 1; ox = vx / L * 26; oy = vy / L * 26; }
      px = mid[i][0] + (d.ring ? ox : off[0]); py = mid[i][1] + (d.ring ? oy : off[1]);
      pills.push([px, py]);
      if (st.tag) {
        var tx, ty, an;
        if (d.ring) {
          if (Math.abs(px - d.ring[0]) > 60) { an = px > d.ring[0] ? 'end' : 'start'; tx = px + (px > d.ring[0] ? -40 : 40); ty = py + 3.5; }
          else { an = px >= d.ring[0] ? 'start' : 'end'; tx = px + (px >= d.ring[0] ? 20 : -20); ty = py + 3.5; }
        } else if (off[0] > 0) { an = 'start'; tx = px + 21; ty = py + 3.5; }
        else if (off[0] < 0) { an = 'end'; tx = px - 21; ty = py + 3.5; }
        else { an = 'middle'; tx = px; ty = py + 22; }
        var ta = d.tagAt && d.tagAt[i]; if (ta) { tx = px + ta[0]; ty = py + ta[1]; an = ta[2]; }
        tags.push([tx, ty, an, st.tag]);
      }
    });
    (d.links || []).forEach(function (l) {
      var A = box(l[0]), B = box(l[1]), s = exitPt(A, B, 2), e = exitPt(B, A, 4);
      ar.push([s, e]); tags.push([s[0] + 12, (s[1] + e[1]) / 2 + 3.5, 'start', l[2]]);
    });
    return { ar: ar, pills: pills, tags: tags };
  }

  /* ---------- Diagramm (HTML + SVG) ---------- */
  function graphHtml(o) {
    var d = cur.dia, W = d.size[0], H = d.size[1], g = geom(), h, k;
    h = '<div class="gd" style="aspect-ratio:' + W + ' / ' + H + '"><svg class="gsvg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><defs><marker id="gar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--accent)"/></marker></defs>';
    if (d.ring) h += '<ellipse class="gring" cx="' + d.ring[0] + '" cy="' + d.ring[1] + '" rx="132" ry="185"/>';
    g.ar.forEach(function (a) { h += '<path class="ga" d="M' + a[0][0].toFixed(1) + ',' + a[0][1].toFixed(1) + ' L' + a[1][0].toFixed(1) + ',' + a[1][1].toFixed(1) + '" marker-end="url(#gar)"/>'; });
    g.tags.forEach(function (t) { var ls = String(t[3]).split('|'); h += '<text class="gtag" x="' + t[0].toFixed(1) + '" y="' + (t[1] - (ls.length - 1) * 5).toFixed(1) + '" text-anchor="' + t[2] + '">' + ls.map(function (l, li) { return '<tspan x="' + t[0].toFixed(1) + '" dy="' + (li ? 10 : 0) + '">' + l + '</tspan>'; }).join('') + '</text>'; });
    (d.notes || []).forEach(function (t) { h += '<text class="gtag" x="' + t[0] + '" y="' + t[1] + '" text-anchor="middle">' + t[2] + '</text>'; });
    h += '</svg>';
    Object.keys(d.nodes).forEach(function (key) { h += nodeHtml(key, o); });
    g.pills.forEach(function (p, i) { h += pillHtml(i, p, o); });
    return h + '</div>';
  }
  function slotCls(key) {
    if (!round) return '';
    var s = round.slotBy[key];
    if (!s) return '';
    var c = ' slot';
    if (round.done) return c + (isRight(s) ? ' ok' : ' bad');
    c += round.put[key] != null ? ' filled' : ' empty';
    if (round.selSlot === key) c += ' sel';
    return c;
  }
  function isRight(s) { var id = round.put[s.key]; return id != null && chipBy(id).val === s.val; }
  function chipBy(id) { for (var i = 0; i < round.chips.length; i++) if (round.chips[i].id === id) return round.chips[i]; return null; }
  function nodeHtml(k, o) {
    var d = cur.dia, p = d.nodes[k], w = d.node[0], hh = d.node[1], ov = isOv(), nm = nodeName(k), slot = o.train && round.slotBy[k] && (round.mode === 'names' || round.mode === 'structs');
    var cls = 'gn' + (ov ? ' ov' : '') + (slot && round.selSlot === k ? ' sel' : '') + (!o.train && selN && selN.t === 'n' && selN.k === k ? ' sel' : '');
    var sc = slot ? slotCls(k) : '';
    var st = 'left:' + pc(p[0], d.size[0]) + ';top:' + pc(p[1], d.size[1]) + ';width:' + pc(w, d.size[0]) + ';height:' + pc(hh, d.size[1]);
    var attr = slot ? ' data-slot="' + k + '"' : (o.train ? (ov ? ' disabled' : ' data-zoom="' + cur.mets[k].m + '"') : ' data-n="' + k + '"');
    var inner;
    if (ov) {
      var s = cur.stages['gpca'.indexOf(k)], nameHtml = nm;
      if (slot && round.mode === 'names') nameHtml = slotText(k);
      inner = '<span class="gl b' + (slot && round.mode === 'names' ? sc : '') + '">' + nameHtml + '</span><span class="gx">' + s.ort + '</span>' + (o.train ? '<span class="gx">' + s.aus + '</span>' : '');
    } else {
      var thumb = molSvg(cur.mets[k].m), lab = nm;
      if (slot && round.mode === 'structs') thumb = round.done ? molSvg(round.slotBy[k].val) : (round.put[k] != null ? molSvg(chipBy(round.put[k]).val) : '<span class="gq">?</span>');
      if (slot && round.mode === 'names') lab = slotText(k); else lab = hy(nm);
      var zA = '', zI = '';
      if (slot && round.mode === 'names') zA = ' data-zoom="' + cur.mets[k].m + '"';
      if (slot && round.mode === 'structs') { var zm = round.done ? round.slotBy[k].val : (round.put[k] != null ? chipBy(round.put[k]).val : null); if (zm) zI = '<i class="zm" data-zoom="' + zm + '">⤢</i>'; }
      inner = '<span class="gt' + (slot && round.mode === 'structs' ? sc : '') + '"' + zA + '>' + thumb + zI + '</span><span class="gl' + (slot && round.mode === 'names' ? sc : '') + '">' + lab + '</span>';
    }
    return '<button type="button" class="' + cls + '" style="' + st + '"' + attr + '>' + inner + '</button>';
  }
  function slotText(k) {
    var s = round.slotBy[k];
    if (round.done) return s.val;
    return round.put[k] != null ? chipBy(round.put[k]).label : '?';
  }
  function pillHtml(i, p, o) {
    var st = cur.steps[i], d = cur.dia, style = 'left:' + pc(p[0], d.size[0]) + ';top:' + pc(p[1], d.size[1]);
    var txt = d.pillText || String(i + 1), cls = 'gp' + (d.pillText ? ' wide' : ''), attr;
    if (o.train) {
      if (round.mode === 'enz') {
        var key = 'e' + i;
        cls += slotCls(key);
        if (round.done) txt = st.ab; else if (round.put[key] != null) txt = abOf(chipBy(round.put[key]).val);
        return '<button type="button" class="' + cls + '" style="' + style + '" data-slot="' + key + '">' + txt + '</button>';
      }
      return '<span class="' + cls + '" style="' + style + '">' + txt + '</span>';
    }
    if (selN && selN.t === 'e' && selN.k === i) cls += ' sel';
    return '<button type="button" class="' + cls + '" style="' + style + '" data-e="' + i + '" aria-label="Schritt ' + (i + 1) + ': ' + esc(st.e) + '">' + txt + '</button>';
  }
  function abOf(name) { for (var i = 0; i < cur.steps.length; i++) if (cur.steps[i].e === name) return cur.steps[i].ab || String(i + 1); return '?'; }

  /* ---------- Verstehen ---------- */
  function row(k, v) { return v && v !== '–' ? '<div class="prow"><b>' + k + '</b><span>' + v + '</span></div>' : ''; }
  function info() {
    var c = comp(selN);
    if (!c) return '<p class="hint">Tippe im Schema ein Bauteil an oder wähle unten eins aus.</p>';
    return '<h2 class="name">' + c.name + '</h2><p class="alt">' + c.alt + '</p>' +
      row('Aufgabe', c.rolle) + row('Reaktion', c.reaktion) + row('Cofaktoren', c.cof) + row('Protonen', c.h) + row('Hemmstoffe', c.hemm) +
      '<div class="where"><h3>Im Alltag</h3><p>' + c.alltag + '</p></div>';
  }
  function factsCard() { return '<div class="pcard"><h3 class="ph3">Zum Merken</h3><ul class="pfacts">' + cur.facts.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul></div>'; }
  function learnScheme() {
    body.innerHTML = '<div class="pcard"><p class="pintro">' + cur.intro + '</p><div class="pdia" id="pdia">' + cur.svg + '</div>' +
      '<div class="chips pchips" id="pchips">' + cur.comps.map(function (c) { return '<button type="button" class="pick" data-k="' + c.id + '">' + c.name + '</button>'; }).join('') + '</div>' +
      '<div class="pinfo" id="pinfo"></div></div>' + factsCard();
    mark();
  }
  function mark() {
    var els = body.querySelectorAll('[data-k]');
    for (var i = 0; i < els.length; i++) {
      var on = els[i].getAttribute('data-k') === selN;
      if (els[i].classList) els[i].classList.toggle('sel', on);
      if (els[i].tagName === 'BUTTON') els[i].setAttribute('aria-pressed', on);
    }
    var pi = document.getElementById('pinfo'); if (pi) pi.innerHTML = info();
  }
  function stepRows(k) {
    var made = [], used = [];
    cur.steps.forEach(function (st, i) {
      if (st.b.indexOf(k) >= 0) made.push((i + 1) + ' · ' + st.e);
      if (st.a.indexOf(k) >= 0) used.push((i + 1) + ' · ' + st.e);
    });
    return row('Gebildet durch', made.join('<br>')) + row('Umgesetzt durch', used.join('<br>'));
  }
  function gpreview() {
    var el = document.getElementById('gprev'); if (!el) return;
    if (!selN) { el.innerHTML = '<p class="hint">Tippe ein ' + (isOv() ? 'Feld' : 'Zwischenprodukt oder ein sechseckiges Enzym-Symbol') + ' an, um Details zu sehen.</p>'; return; }
    var h;
    if (selN.t === 'e') {
      var st = cur.steps[selN.k];
      h = '<div class="rxh"><i>' + (selN.k + 1) + '</i><span class="en">' + st.e + '</span>' + (st.key ? '<span class="keyb">Kontrollpunkt</span>' : '') + (st.irr ? '<span class="irrb">irreversibel</span>' : '') + '</div>' +
        '<div class="rxl">' + st.a.map(function (k) { return cur.mets[k].n; }).join(' + ') + ' → ' + st.b.map(function (k) { return cur.mets[k].n; }).join(' + ') + '</div>' +
        (st.co.length ? '<div class="chips">' + st.co.map(function (c) { return '<span class="chip">' + c + '</span>'; }).join('') + '</div>' : '') + '<p class="rxn">' + st.note + '</p>';
    } else if (isOv()) {
      var s = cur.stages['gpca'.indexOf(selN.k)];
      h = '<h2 class="name">' + s.n + '</h2>' + row('Ort', s.ort) + row('Eingang', s.ein) + row('Ausgang', s.aus) + row('Sauerstoff', s.o2);
    } else {
      var m = cur.mets[selN.k], c = molObj(m.m);
      h = '<div class="pvs">' + molSvg(m.m) + '</div><h2 class="name">' + m.n + '</h2>' + (c ? '<p class="alt">' + c.formula + '</p>' : '') + stepRows(selN.k) +
        '<button type="button" class="tbtn" data-open="' + m.m + '">In der Datenbank öffnen</button>';
    }
    el.innerHTML = h;
  }
  function learnGraph() {
    var h = '<div class="pcard"><p class="pintro">' + cur.intro + '</p><div id="gdia">' + graphHtml({}) + '</div><div class="pinfo" id="gprev"></div></div>';
    (cur.extra || []).forEach(function (x) {
      h += '<div class="pcard"><h3 class="ph3">' + x.title + '</h3>' + x.items.map(function (it) { return '<div class="prow"><b>' + it[0] + '</b><span>' + it[1] + '</span></div>'; }).join('') + '</div>';
    });
    body.innerHTML = h + factsCard();
    gpreview();
  }
  function learn() { if (cur.type === 'steps' || cur.type === 'overview') learnGraph(); else learnScheme(); }
  function refreshLearn() { var g = document.getElementById('gdia'); if (g) g.innerHTML = graphHtml({}); gpreview(); }

  /* ---------- Üben ---------- */
  function genQs() {
    if (cur.type !== 'steps' || cur.steps.length < 4) return [];
    var es = cur.steps.map(function (s) { return s.e; }), out = [];
    cur.steps.forEach(function (st) {
      var wrong = shuffle(es.filter(function (e) { return e !== st.e; })).slice(0, 3), opts = shuffle([st.e].concat(wrong));
      out.push({ q: 'Welches Enzym katalysiert: ' + st.a.map(function (k) { return cur.mets[k].n; }).join(' + ') + ' → ' + st.b.map(function (k) { return cur.mets[k].n; }).join(' + ') + '?', o: opts, a: opts.indexOf(st.e), why: st.e + ': ' + st.note });
    });
    return out;
  }
  function pickQs() {
    var g = shuffle(genQs()).slice(0, 2), h = shuffle(cur.qs).slice(0, QN - g.length);
    return shuffle(g.concat(h)).map(function (q) {
      var idx = shuffle(q.o.map(function (_, i) { return i; }));
      return { q: q.q, o: idx.map(function (i) { return q.o[i]; }), a: idx.indexOf(q.a), why: q.why, chosen: null };
    });
  }
  function buildTask(m) {
    var d = cur.dia, r = { mode: m, slots: [], chips: [], put: {}, slotBy: {}, selChip: null, selSlot: null, done: false, title: '', hint: '' }, base = m, n = 0;
    if (m.indexOf('pairs') === 0) { n = parseInt(m.slice(5), 10); base = 'pairs'; }
    if (base === 'names' || base === 'structs') {
      var keys = Object.keys(d.nodes);
      keys.forEach(function (k) { r.slots.push({ key: k, val: base === 'names' ? nodeName(k) : cur.mets[k].m }); });
      r.title = base === 'names' ? 'Namen zuordnen' : 'Strukturen zuordnen';
      r.hint = base === 'names' ? 'Wähle unten einen Namen und tippe dann auf das Feld im Diagramm, in das er gehört.' : 'Hier stehen nur die Namen. Wähle unten eine Struktur und tippe dann auf das Feld im Diagramm, in das sie gehört.';
      r.chips = r.slots.map(function (s) { return base === 'names' ? { val: s.val, label: s.val } : { val: s.val, mol: s.val }; });
    } else if (base === 'enz') {
      cur.steps.forEach(function (st, i) { r.slots.push({ key: 'e' + i, val: st.e }); });
      r.title = 'Enzyme zuordnen'; r.hint = 'Die Sechsecke sind die Enzyme der Schritte 1 bis ' + cur.steps.length + '. Wähle unten ein Enzym und tippe auf das passende Sechseck.';
      r.chips = r.slots.map(function (s) { return { val: s.val, label: s.val }; });
    } else if (base === 'pairs') {
      var pr = cur.pairs[n];
      pr.rows.forEach(function (rw, i) { r.slots.push({ key: 'r' + i, val: rw[1], left: rw[0] }); });
      r.title = pr.title; r.hint = pr.hint + ' Wähle unten eine Antwort und tippe auf das Feld daneben.';
      r.chips = r.slots.map(function (s) { return { val: s.val, label: s.val }; });
    } else if (base === 'comps') {
      d.comps.forEach(function (c) { r.slots.push({ key: c.key, val: c.val, short: c.short, pos: c.pos }); });
      r.title = 'Bauteile benennen'; r.hint = 'Im Schema fehlen die Beschriftungen. Wähle unten einen Namen und tippe auf das passende Bauteil.';
      r.chips = r.slots.map(function (s) { return { val: s.val, label: s.val }; });
    }
    r.slots.forEach(function (s) { r.slotBy[s.key] = s; });
    r.chips = shuffle(r.chips); r.chips.forEach(function (c, i) { c.id = 'c' + i; });
    return r;
  }
  function newRound() {
    var ms = cur.modes, no = modeNo[cur.id];
    if (no == null) no = Math.floor(Math.random() * ms.length); else no = (no + 1) % ms.length;
    modeNo[cur.id] = no;
    round = buildTask(ms[no]);
  }
  function taskHtml() {
    var r = round, h = '';
    if (r.mode === 'names' || r.mode === 'structs' || r.mode === 'enz') { h = graphHtml({ train: true }); if (!isOv()) h += '<p class="zhint">Tipp: Auf eine Struktur tippen (bzw. auf ⤢) vergrößert sie. Gezeichnet bei pH 7,4, also als Anionen (Carboxylat, Phosphat).</p>'; }
    else if (r.mode === 'comps') {
      h = '<div class="gd scheme" style="aspect-ratio:' + cur.dia.size[0] + ' / ' + cur.dia.size[1] + '">' + cur.svg;
      r.slots.forEach(function (s) {
        var t = r.done ? s.short : (r.put[s.key] != null ? shortOf(chipBy(r.put[s.key]).val) : '?');
        h += '<button type="button" class="gc' + slotCls(s.key) + '" data-slot="' + s.key + '" style="left:' + pc(s.pos[0], cur.dia.size[0]) + ';top:' + pc(s.pos[1], cur.dia.size[1]) + ';width:' + pc(s.pos[2], cur.dia.size[0]) + ';height:' + pc(s.pos[3], cur.dia.size[1]) + '">' + t + '</button>';
      });
      h += '</div>';
    } else {
      h = '<div class="prs">' + r.slots.map(function (s) {
        var t = r.done ? s.val : (r.put[s.key] != null ? chipBy(r.put[s.key]).label : '?');
        return '<div class="pr"><span class="prl">' + s.left + '</span><button type="button" class="pslot' + slotCls(s.key) + '" data-slot="' + s.key + '">' + t + '</button></div>';
      }).join('') + '</div>';
    }
    return h;
  }
  function shortOf(val) { for (var i = 0; i < round.slots.length; i++) if (round.slots[i].val === val) return round.slots[i].short; return '?'; }
  function poolHtml() {
    var r = round;
    if (round.done) return '';
    var used = {}, k; for (k in r.put) if (r.put[k] != null) used[r.put[k]] = 1;
    return r.chips.filter(function (c) { return !used[c.id]; }).map(function (c) {
      return '<button type="button" class="pick' + (c.mol ? ' st' : '') + (r.selChip === c.id ? ' on' : '') + '" data-chip="' + c.id + '">' + (c.mol ? molSvg(c.mol) + '<i class="zm" data-zoom="' + c.mol + '">⤢</i>' : c.label) + '</button>';
    }).join('');
  }
  function qHtml() {
    return qz.qs.map(function (q, qi) {
      var h = '<fieldset class="q"><legend>' + (qi + 1) + ' · ' + q.q + '</legend>';
      q.o.forEach(function (o, oi) {
        var cls = '';
        if (qz.done) cls = oi === q.a ? ' ok' : (q.chosen === oi ? ' bad' : '');
        h += '<label class="opt' + cls + '"><input type="radio" name="q' + qi + '" value="' + oi + '"' + (q.chosen === oi ? ' checked' : '') + (qz.done ? ' disabled' : '') + '><span>' + o + '</span></label>';
      });
      if (qz.done) h += '<p class="why">' + q.why + '</p>';
      return h + '</fieldset>';
    }).join('');
  }
  function score() {
    var r = round, ok = r.slots.filter(isRight).length;
    return { d: ok, dn: r.slots.length };
  }
  function qscore() {
    return { q: qz.qs.filter(function (q) { return q.chosen === q.a; }).length, qn: qz.qs.length };
  }
  function result() {
    var s = score(), all = s.d === s.dn;
    return '<div class="banner pres"><p><b>' + s.d + ' von ' + s.dn + ' richtig.</b> ' + (all ? 'Sehr gut, alles gewusst.' : 'Rot markierte Felder zeigen die richtige Lösung.') + '</p><button type="button" class="tbtn" id="p-new">Neue Runde</button></div>';
  }
  function qresult() {
    var s = qscore(), all = s.q === s.qn;
    return '<div class="banner pres"><p><b>' + s.q + ' von ' + s.qn + ' richtig.</b> ' + (all ? 'Sehr gut, alles gewusst.' : 'Unter den Fragen stehen die Erklärungen.') + '</p><button type="button" class="tbtn" id="q-new">Neue Fragen</button></div>';
  }
  function quiz() {
    if (!qz) qz = { qs: pickQs(), done: false };
    body.innerHTML = '<div id="pres"></div><div class="pcard" id="pq"></div><div class="actions"><button type="button" class="btn primary wide" id="q-check">Auswerten</button><button type="button" class="btn" id="q-new2">Neue Fragen</button></div>';
    paintQ();
  }
  function paintQ() {
    document.getElementById('pq').innerHTML = '<h3 class="ph3">Fragen: ' + esc(cur.name) + '</h3>' + qHtml();
    document.getElementById('pres').innerHTML = qz.done ? qresult() : '';
    document.getElementById('q-check').hidden = qz.done;
  }
  function train() {
    if (!round) newRound();
    body.innerHTML = '<div id="pres"></div><div class="pcard"><h3 class="ph3" id="ttl"></h3><p class="hint left" id="thint"></p><div id="gdia"></div><div class="chips pool" id="gpool"></div></div>' +
      '<div class="actions"><button type="button" class="btn primary wide" id="p-check">Auswerten</button><button type="button" class="btn" id="p-new2">Neue Runde</button></div>';
    paint(true);
  }
  function paintTask() {
    document.getElementById('gdia').innerHTML = taskHtml();
    document.getElementById('gpool').innerHTML = poolHtml();
  }
  function paint(full) {
    var r = round;
    document.getElementById('ttl').textContent = r.title;
    document.getElementById('thint').textContent = r.hint;
    paintTask();
    document.getElementById('pres').innerHTML = round.done ? result() : '';
    document.getElementById('p-check').hidden = round.done;
  }
  function assign(slot, chip) {
    var r = round;
    r.put[slot] = chip; r.selChip = null; r.selSlot = null;
    paintTask();
  }
  function onSlot(key) {
    var r = round;
    if (round.done) return;
    if (r.selChip) { assign(key, r.selChip); return; }
    if (r.put[key] != null) { r.put[key] = null; r.selSlot = null; paintTask(); return; }
    r.selSlot = r.selSlot === key ? null : key; paintTask();
  }
  function onChip(id) {
    var r = round;
    if (round.done) return;
    if (r.selSlot) { assign(r.selSlot, id); return; }
    r.selChip = r.selChip === id ? null : id; paintTask();
  }

  function render() { if (mode === 'learn') learn(); else if (mode === 'quiz') quiz(); else train(); }
  function setMode(m) {
    mode = m;
    document.getElementById('pm-learn').setAttribute('aria-pressed', m === 'learn');
    document.getElementById('pm-train').setAttribute('aria-pressed', m === 'train');
    document.getElementById('pm-quiz').setAttribute('aria-pressed', m === 'quiz');
    render();
  }

  function zoom(id) {
    var m = molObj(id); if (!m) return;
    var nm = (mode === 'learn' || (round && round.done)) ? '<p class="zn">' + (m.name || m.n || '') + '</p>' : '';
    var el = document.createElement('div'); el.className = 'pzoom';
    el.innerHTML = '<div class="zbox">' + molSvg(id) + nm + '<p class="zc">Zum Schließen tippen</p></div>';
    el.addEventListener('click', function () { el.remove(); });
    document.body.appendChild(el);
  }
  body.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-zoom],[data-k],[data-n],[data-e],[data-slot],[data-chip],[data-open],#p-check,#p-new,#p-new2,#q-check,#q-new,#q-new2') : null;
    if (!t) return;
    if (t.hasAttribute('data-zoom')) { zoom(t.getAttribute('data-zoom')); return; }
    if (t.hasAttribute('data-open')) { if (window.openMolecule) window.openMolecule(t.getAttribute('data-open')); return; }
    if (t.hasAttribute('data-k')) { selN = t.getAttribute('data-k'); mark(); var pi = document.getElementById('pinfo'); if (pi && pi.scrollIntoView && t.tagName !== 'BUTTON') pi.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (t.hasAttribute('data-n') || t.hasAttribute('data-e')) {
      selN = t.hasAttribute('data-n') ? { t: 'n', k: t.getAttribute('data-n') } : { t: 'e', k: parseInt(t.getAttribute('data-e'), 10) };
      refreshLearn();
      var pv = document.getElementById('gprev'); if (pv && pv.scrollIntoView) pv.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (t.id === 'q-check') { qz.done = true; paintQ(); document.getElementById('pres').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (t.id === 'q-new' || t.id === 'q-new2') { qz = null; quiz(); window.scrollTo(0, 0); return; }
    if (!round) return;
    if (t.hasAttribute('data-slot')) { onSlot(t.getAttribute('data-slot')); return; }
    if (t.hasAttribute('data-chip')) { onChip(t.getAttribute('data-chip')); return; }
    if (t.id === 'p-check') { round.done = true; paint(true); document.getElementById('pres').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (t.id === 'p-new' || t.id === 'p-new2') { newRound(); train(); window.scrollTo(0, 0); }
  });
  body.addEventListener('keydown', function (e) {
    var t = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && t.getAttribute && t.getAttribute('data-k') && t.tagName !== 'BUTTON') { e.preventDefault(); t.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  body.addEventListener('change', function (e) {
    var t = e.target;
    if (!qz || qz.done || !t || t.type !== 'radio') return;
    qz.qs[parseInt(t.name.slice(1), 10)].chosen = parseInt(t.value, 10);
  });
  document.getElementById('pm-learn').addEventListener('click', function () { setMode('learn'); });
  document.getElementById('pm-train').addEventListener('click', function () { setMode('train'); });
  document.getElementById('pm-quiz').addEventListener('click', function () { setMode('quiz'); });
  sel.innerHTML = P.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + '</option>'; }).join('');
  sel.addEventListener('change', function () { cur = P[parseInt(sel.value, 10)]; selN = null; round = null; qz = null; render(); });
  window.PathUI = { _r: function () { return round; }, open: function () { if (!built) { built = true; setMode('learn'); } }, count: P.length };
})();
