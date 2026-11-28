(function () {
  'use strict';
  var CARDS = window.MOLECULES.slice();
  var Chem = window.Chem;
  var CATS = (window.CATEGORIES || []).slice();
  CARDS.forEach(function (c) {
    if (CATS.indexOf(c.cat) < 0) CATS.push(c.cat);
    c.svg = Chem.render(c.m, 'Strukturformel eines Moleküls'); c.svgH = Chem.getH();
  });

  var HKEY = 'strukturformel-app-vs-v1';
  function renderAll() { CARDS.forEach(function (c) { c.svg = Chem.render(c.m, 'Strukturformel eines Moleküls'); c.svgH = Chem.getH(); }); }
  function setH(v, initial) {
    Chem.setH(v);
    var b = document.getElementById('h-toggle');
    var hp = document.getElementById('vs-help'); if (hp) hp.hidden = !v;
    if (b) { b.setAttribute('aria-pressed', v ? 'true' : 'false'); b.innerHTML = '<span class="hsw"></span><span>Valenzstrich</span>'; }
    try { localStorage.setItem(HKEY, v ? '1' : '0'); } catch (e) {}
    if (initial) return;
    renderAll(); phCache = {};
    window.dispatchEvent(new Event('hchange'));
    if (typeof refreshViews === 'function') refreshViews();
  }
  try { if (localStorage.getItem(HKEY) === '1') { Chem.setH(true); renderAll(); } } catch (e) {}
  var KEY = 'strukturformel-app-v1';
  var SEEN_KEY = 'strukturformel-app-seen-v1';
  var DISMISS_KEY = 'strukturformel-app-install-dismissed';
  var byId = {}; CARDS.forEach(function (c) { byId[c.id] = c; });
  function svgOf(c) { if (c.svgH !== Chem.getH()) { c.svg = Chem.render(c.m, 'Strukturformel eines Moleküls'); c.svgH = Chem.getH(); } return c.svg; }
  var ids = CARDS.map(function (c) { return c.id; });
  var st = { status: {}, rts: {}, mode: 'struct', order: ids.slice(), pos: 0, retryOnly: false, dueOnly: false, cat: 'all' };

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) {
      if (saved.status) st.status = saved.status;
      if (saved.rts && typeof saved.rts === 'object') st.rts = saved.rts;
      if (saved.mode === 'name' || saved.mode === 'struct') st.mode = saved.mode;
      if (saved.cat === 'new' || CATS.indexOf(saved.cat) >= 0) st.cat = saved.cat;
      if (Array.isArray(saved.order)) {
        var seenO = {}, o = [];
        saved.order.forEach(function (id) { if (byId[id] && !seenO[id]) { seenO[id] = 1; o.push(id); } });
        ids.forEach(function (id) { if (!seenO[id]) o.push(id); });
        st.order = o;
      }
    }
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  /* Karten, die seit dem letzten Besuch dazugekommen sind, bekommen „Neu“, bis man sie bewertet hat. */
  var seen = null;
  try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || 'null'); } catch (e) {}
  if (!Array.isArray(seen)) { seen = ids.slice(); saveSeen(); }
  function saveSeen() { try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {} }
  function isNew(id) { return seen.indexOf(id) < 0; }
  function markSeen(id) { if (isNew(id)) { seen.push(id); saveSeen(); } }
  var newAtLoad = ids.filter(isNew);

  var $ = function (id) { return document.getElementById(id); };
  var card = $('card'), front = $('front'), back = $('back');
  var flipped = false, timer = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('sub').textContent = CARDS.length + ' Moleküle aus Alltag und Biochemie. Erst raten, dann umdrehen.';
  var ver = (window.DATA_VERSION || '').split('-');
  $('foot').textContent = CARDS.length + ' Karten' + (ver.length === 3 ? ' · Stand ' + parseInt(ver[2], 10) + '.' + ver[1] + '.' + ver[0] : '') + ' · Version 57';

  function buildCatOptions() {
    var html = '<option value="all">Alle Kategorien (' + CARDS.length + ')</option>';
    if (newAtLoad.length) html += '<option value="new">Neu hinzugekommen (' + newAtLoad.length + ')</option>';
    CATS.forEach(function (c) {
      var n = CARDS.filter(function (x) { return x.cat === c; }).length;
      html += '<option value="' + c.replace(/"/g, '&quot;') + '">' + c + ' (' + n + ')</option>';
    });
    $('cat').innerHTML = html;
  }
  buildCatOptions();
  if (st.cat === 'new' && !newAtLoad.length) st.cat = 'all';

  function inCat(id) {
    if (st.cat === 'all') return true;
    if (st.cat === 'new') return newAtLoad.indexOf(id) >= 0;
    return byId[id].cat === st.cat;
  }
  function base() { return st.order.filter(inCat); }
  function deck() {
    var b = base();
    if (st.dueOnly) return window.Progress.dueIds(b);
    if (!st.retryOnly) return b;
    /* „Nochmal“-Stapel: zuletzt markierte Karte steht ganz hinten. */
    return b.filter(function (id) { return st.status[id] === 'retry'; })
      .sort(function (x, y) { return (st.rts[x] || 0) - (st.rts[y] || 0); });
  }
  function clampPos() { var d = deck(); if (!d.length) { st.pos = 0; } else if (st.pos >= d.length || st.pos < 0) { st.pos = ((st.pos % d.length) + d.length) % d.length; } }

  /* ---------- pH-Regler ---------- */
  var phVal = null, phCache = {};
  function vsNote(c) { return (Chem.getH() && !Chem.valenzOK(c.m)) ? '<p class="vsnote">Skelettformel: Für diese Struktur gibt es keine Valenzstrichformel.</p>' : ''; }
  function hasIons(c) { return window.Chem.ionize(c.m).length > 0; }
  function phBox(c) {
    if (!hasIons(c)) return '';
    return '<div class="ph" data-id="' + c.id + '"><div class="phrow"><span class="phl">pH</span><input type="range" min="1" max="14" step="1" value="7" aria-label="pH-Wert"><output class="pho">–</output><button type="button" class="phoff">Original</button></div><p class="phcap"></p></div>';
  }
  function phSvg(c) {
    if (phVal == null) return svgOf(c);
    var k = c.id + '|' + phVal;
    return phCache[k] || (phCache[k] = window.Chem.renderPH(c.m, phVal, 'Strukturformel bei pH ' + phVal));
  }
  function de(x) { return x.toFixed(1).replace('.', ','); }
  function phApply(root) {
    var boxes = root.querySelectorAll('.ph');
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i], c = byId[b.getAttribute('data-id')], t = b.previousElementSibling;
      if (t && t.querySelector) { t.innerHTML = phSvg(c); }
      b.querySelector('input').value = phVal == null ? 7 : phVal;
      b.querySelector('.pho').textContent = phVal == null ? '–' : phVal;
      b.querySelector('.phoff').hidden = phVal == null;
      var cap = b.querySelector('.phcap');
      if (phVal == null) { cap.textContent = 'Regler bewegen: Struktur bei diesem pH (ungefähre Lehrbuch-pKa-Werte). Im Körper: pH ≈ 7,4.'; }
      else {
        var r = window.Chem.phInfo(c.m, phVal), q = r.net === 0 ? '0' : (r.net > 0 ? '+' + r.net : '\u2212' + (-r.net));
        cap.textContent = 'pH ' + phVal + (phVal === 7 ? ' (≈ physiologisch)' : '') + ' · Nettoladung ' + q + (r.zw ? ' · Zwitterion' : '') + (r.pi != null ? ' · pI ≈ ' + de(r.pi) : '');
      }
    }
  }
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t && t.closest && t.closest('.ph') && t.type === 'range') { phVal = parseInt(t.value, 10); phApply(document); }
  });
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains('phoff')) { phVal = null; phApply(document); }
  });

  function faces(c, n) {
    var p = '<span>Karte ' + (st.pos + 1) + ' von ' + n + '</span>';
    var nw = isNew(c.id) ? '<span class="newchip">Neu</span>' : '';
    var alt = (c.alt ? '<p class="alt">auch: ' + c.alt + '</p>' : '') + (c.ster ? '<p class="alt">Stereochemie: ' + c.ster + '</p>' : '');
    var info = '<div class="chips">' + c.groups.map(function (g) { return '<span class="chip">' + g + '</span>'; }).join('') + '</div>' +
               '<div class="where"><h3>Im Alltag</h3><p>' + c.where + '</p></div>';
    if (st.mode === 'struct') {
      return {
        f: '<div class="eyebrow"><span>Struktur' + nw + '</span>' + p + '</div><div class="struct">' + svgOf(c) + '</div>' + phBox(c) + vsNote(c) + '<p class="hint">Wie heißt dieses Molekül? Tippen zum Umdrehen.</p>',
        b: '<div class="eyebrow"><span>Name</span>' + p + '</div><div><h2 class="name">' + c.name + '</h2>' + alt + '<p class="formula">' + c.formula + '</p></div>' + info
      };
    }
    return {
      f: '<div class="eyebrow"><span>Name' + nw + '</span>' + p + '</div><div class="struct"><h2 class="name center">' + c.name + '</h2></div><p class="hint">Wie sieht die Struktur aus? Tippen zum Umdrehen.</p>',
      b: '<div class="eyebrow"><span>Struktur</span>' + p + '</div><div class="struct small">' + svgOf(c) + '</div>' + phBox(c) + vsNote(c) + '<p class="formula">' + c.formula + '</p>' + info
    };
  }

  /* Zeigt unter jedem Bewertungs-Knopf, wann die Karte wiederkommt. */
  function rateLabels() {
    var d = deck(); if (!d.length) return;
    var pv = window.Progress.preview(d[st.pos]);
    ['again', 'hard', 'mid', 'good'].forEach(function (k) { $('l-' + k).textContent = pv[k]; });
  }
  function setFlip(v) {
    flipped = v;
    card.classList.toggle('flipped', v);
    front.setAttribute('aria-hidden', v ? 'true' : 'false');
    back.setAttribute('aria-hidden', v ? 'false' : 'true');
    $('flip').hidden = v;
    $('rates').hidden = !v;
    if (v) rateLabels();
  }

  function fill() {
    var d = deck(), has = d.length > 0;
    $('stage').hidden = !has;
    if (!has) return;
    var c = byId[d[st.pos]], f = faces(c, d.length);
    front.innerHTML = f.f; back.innerHTML = f.b;
    phApply(front); phApply(back);
    $('pos').textContent = 'Karte ' + (st.pos + 1) + ' von ' + d.length;
  }

  function show() {
    clearTimeout(timer);
    var was = flipped;
    setFlip(false);
    if (was && !reduce) { timer = setTimeout(fill, 300); } else { fill(); }
  }

  function chrome() {
    var b = base(), known = 0, retry = 0;
    b.forEach(function (id) { var s = st.status[id]; if (s === 'known') known++; else if (s === 'retry') retry++; });
    $('stats').innerHTML = '<span><b>' + known + '</b> gewusst</span><span><b>' + retry + '</b> nochmal</span><span><b>' + (b.length - known - retry) + '</b> offen</span><span>von ' + b.length + '</span>';
    var d = deck(), curId = d.length ? d[st.pos] : null;
    $('dots').innerHTML = b.map(function (id, i) {
      var s = st.status[id] || '';
      return '<button type="button" class="dot ' + s + (id === curId ? ' current' : '') + '" data-id="' + id + '" aria-label="Karte ' + (i + 1) + (s === 'known' ? ', gewusst' : s === 'retry' ? ', nochmal' : '') + '">' + (i + 1) + '</button>';
    }).join('');
    $('bar').innerHTML = b.map(function (id) {
      var s = st.status[id] || '';
      return '<i class="' + s + (id === curId ? ' current' : '') + '"></i>';
    }).join('');
    $('mode-struct').setAttribute('aria-pressed', st.mode === 'struct');
    $('mode-name').setAttribute('aria-pressed', st.mode === 'name');
    $('retry-only').setAttribute('aria-pressed', st.retryOnly);
    var nDue = window.Progress.dueIds(b).length;
    $('due-only').setAttribute('aria-pressed', st.dueOnly);
    $('due-only').textContent = 'Fällig (' + nDue + ')';
    var nxt = st.dueOnly && nDue === 0 ? window.Progress.nextIn(b) : null;
    $('empty-text').textContent = st.dueOnly ? 'Nichts mehr zur Wiederholung fällig. Gut gemacht.' + (nxt ? ' Die nächste Karte kommt in ' + nxt + '.' : '') : 'Keine Karte ist mit „Nochmal“ markiert.';
    $('cat').value = st.cat;
    $('done').hidden = !(known === b.length && b.length > 0 && !st.retryOnly && !st.dueOnly);
    $('empty').hidden = !((st.retryOnly || st.dueOnly) && d.length === 0);
  }

  /* Wird eine Karte im Fälligkeits-Modus inzwischen fällig, erscheint sie von selbst. */
  setInterval(function () {
    if (document.hidden || !st.dueOnly) return;
    var n = deck().length;
    if (n !== lastDue && !(flipped && n > lastDue)) update();
    lastDue = n;
  }, 20000);
  var lastDue = -1;
  function update() { clampPos(); chrome(); show(); save(); }

  function go(delta) {
    var d = deck(); if (!d.length) return;
    st.pos = (st.pos + delta + d.length) % d.length;
    update();
  }
  function rate(grade) {
    if (!flipped) return;
    var s = (grade === 'again' || grade === 'hard') ? 'retry' : 'known';
    var d = deck(); if (!d.length) return;
    var id = d[st.pos];
    st.status[id] = s;
    if (s === 'retry') st.rts[id] = Date.now(); else delete st.rts[id];
    markSeen(id);
    toastAch(window.Progress.record(id, grade, byId[id].cat));
    if (st.retryOnly || st.dueOnly) {
      var nd = deck();
      if (nd.length > 1 && nd[st.pos] === id) st.pos = 0; // Karte steht jetzt hinten: weiter mit der ersten
      clampPos();
    } else { st.pos = (st.pos + 1) % d.length; }
    update();
  }

  card.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.ph')) return; setFlip(!flipped); });
  card.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('.ph')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlip(!flipped); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    if (e.key === 'ArrowRight') { go(1); }
    else if (e.key === 'ArrowLeft') { go(-1); }
    else if (e.key === '1') { rate('again'); }
    else if (e.key === '2') { rate('hard'); }
    else if (e.key === '3') { rate('mid'); }
    else if (e.key === '4') { rate('good'); }
  });
  $('flip').addEventListener('click', function () { setFlip(true); });
  $('r-again').addEventListener('click', function () { rate('again'); });
  $('r-hard').addEventListener('click', function () { rate('hard'); });
  $('r-mid').addEventListener('click', function () { rate('mid'); });
  $('r-good').addEventListener('click', function () { rate('good'); });
  $('prev').addEventListener('click', function () { go(-1); });
  $('next').addEventListener('click', function () { go(1); });
  $('mode-struct').addEventListener('click', function () { st.mode = 'struct'; update(); });
  $('mode-name').addEventListener('click', function () { st.mode = 'name'; update(); });
  $('cat').addEventListener('change', function () { st.cat = $('cat').value; st.pos = 0; update(); });
  $('retry-only').addEventListener('click', function () { st.retryOnly = !st.retryOnly; st.dueOnly = false; st.pos = 0; update(); });
  $('due-only').addEventListener('click', function () { st.dueOnly = !st.dueOnly; st.retryOnly = false; st.pos = 0; update(); });
  $('shuffle').addEventListener('click', function () {
    var o = st.order.slice();
    for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = o[i]; o[i] = o[j]; o[j] = t; }
    st.order = o; st.pos = 0; update();
  });
  $('reset').addEventListener('click', function () { st.status = {}; st.rts = {}; st.pos = 0; st.retryOnly = false; st.dueOnly = false; update(); });
  $('again').addEventListener('click', function () {
    base().forEach(function (id) { delete st.status[id]; });
    st.pos = 0; st.retryOnly = false; st.dueOnly = false; update();
  });
  $('show-all').addEventListener('click', function () { st.retryOnly = false; st.dueOnly = false; st.pos = 0; update(); });
  $('dots').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.dot') : null;
    if (!b) return;
    st.retryOnly = false; st.dueOnly = false; st.pos = base().indexOf(b.getAttribute('data-id')); update();
  });

  /* Kurzer Hinweis, wenn ein Erfolg freigeschaltet wurde. */
  var toastQ = [], toastBusy = false;
  function toastNext() {
    var t = $('toast');
    if (!toastQ.length) { toastBusy = false; return; }
    toastBusy = true;
    var title = toastQ.shift(), ach = window.Progress.ach.filter(function (x) { return x.t === title; })[0];
    var ic = ach && window.StatsUI ? window.StatsUI.icon(ach.k) : '';
    t.innerHTML = '<span class="ti">' + ic + '</span><span class="tt"><small>Erfolg freigeschaltet</small><b>' + title + '</b></span>';
    t.hidden = false; t.classList.remove('show', 'hide'); void t.offsetWidth; t.classList.add('show');
    setTimeout(function () {
      t.classList.remove('show'); t.classList.add('hide');
      setTimeout(function () { t.hidden = true; t.classList.remove('hide'); setTimeout(toastNext, 150); }, 420);
    }, toastQ.length ? 2600 : 3600);
  }
  /* Mehrere Erfolge auf einmal werden nacheinander angezeigt. */
  function toastAch(list) {
    if (!list || !list.length) return;
    list.forEach(function (x) { toastQ.push(x); });
    if (!toastBusy) toastNext();
  }
  window.toastAch = toastAch;

  /* Installationshinweis: Android/Chrome per Button, iPhone per Anleitung. */
  var deferred = null;
  function dismissed() { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; } }
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
  function showInstall(text, withBtn) {
    if (standalone() || dismissed()) return;
    $('install-text').textContent = text;
    $('install-btn').hidden = !withBtn;
    $('install').hidden = false;
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    showInstall('Als App auf dem Startbildschirm installieren und offline lernen.', true);
  });
  window.addEventListener('appinstalled', function () { $('install').hidden = true; });
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) showInstall('Zum Installieren: Teilen-Symbol antippen und „Zum Home-Bildschirm“ wählen.', false);
  $('install-btn').addEventListener('click', function () {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function () { deferred = null; $('install').hidden = true; });
  });
  $('install-close').addEventListener('click', function () {
    $('install').hidden = true;
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  });

  update();

  /* ---------- Datenbank: Suche ---------- */
  var SUB = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','⁺':'+','⁻':'-','−':'-' };
  function norm(s) {
    s = String(s || '').toLowerCase().replace(/[₀-₉⁺⁻−]/g, function (ch) { return SUB[ch]; })
      .replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
    try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return s.replace(/<[^>]*>/g, '').replace(/[^a-z0-9+\- ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  CARDS.forEach(function (c) {
    c.n = { name: norm(c.name), alt: norm(c.alt), f: norm(c.formula), g: norm((c.groups || []).join(' ')), w: norm(c.where), id: norm(c.id) };
  });
  var dbQ = '', dbCat = 'all', dbOpen = null, dbScroll = 0;
  function score(c, toks) {
    var total = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], s = 0, n = c.n;
      if (n.name === t) s = 100;
      else if (n.name.indexOf(t) === 0) s = 80;
      else if (n.name.split(' ').some(function (w) { return w.indexOf(t) === 0; })) s = 65;
      else if (n.name.indexOf(t) >= 0) s = 55;
      else if (n.f === t || n.f.replace(/ /g, '') === t) s = 70;
      else if (n.alt.indexOf(t) >= 0) s = 45;
      else if (n.f.indexOf(t) >= 0) s = 35;
      else if (n.id.indexOf(t) >= 0) s = 30;
      else if (n.g.indexOf(t) >= 0) s = 20;
      else if (n.w.indexOf(t) >= 0) s = 10;
      if (!s) return 0;
      total += s;
    }
    return total;
  }
  function dbResults() {
    var toks = norm(dbQ).split(' ').filter(Boolean);
    var pool = CARDS.filter(function (c) { return dbCat === 'all' || c.cat === dbCat; });
    if (!toks.length) return pool.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    return pool.map(function (c) { return { c: c, s: score(c, toks) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.c.name.localeCompare(b.c.name, 'de'); })
      .map(function (x) { return x.c; });
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function renderDb() {
    var r = dbResults();
    $('db-count').textContent = r.length + (r.length === 1 ? ' Molekül' : ' Moleküle') + (dbQ.trim() ? ' gefunden' : ' (A–Z)');
    $('db-list').innerHTML = r.length ? r.map(function (c) {
      return '<li><button type="button" class="res" data-id="' + esc(c.id) + '"><span class="thumb">' + svgOf(c) + '</span><span class="rt"><b>' + c.name + '</b><span>' + c.formula + ' · ' + esc(c.cat) + '</span></span></button></li>';
    }).join('') : '<li class="none">Nichts gefunden. Versuche den Namen, die Summenformel oder einen Teil davon.</li>';
  }
  function openDetail(id) {
    var c = byId[id]; if (!c) return;
    dbOpen = id; dbScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
    var alt = (c.alt ? '<p class="alt">auch: ' + c.alt + '</p>' : '') + (c.ster ? '<p class="alt">Stereochemie: ' + c.ster + '</p>' : '');
    $('db-detail').innerHTML = '<div class="face dface"><button type="button" class="tbtn" id="db-back">← Zurück zur Liste</button>' +
      '<div class="eyebrow"><span>' + esc(c.cat) + '</span></div><div class="struct">' + svgOf(c) + '</div>' + phBox(c) + vsNote(c) +
      '<div><h2 class="name">' + c.name + '</h2>' + alt + '<p class="formula">' + c.formula + '</p></div>' +
      '<div class="chips">' + c.groups.map(function (g) { return '<span class="chip">' + g + '</span>'; }).join('') + '</div>' +
      '<div class="where"><h3>Im Alltag</h3><p>' + c.where + '</p></div></div>';
    phApply($('db-detail'));
    $('db-detail').hidden = false; $('db-list').hidden = true; $('db-count').hidden = true;
    document.querySelector('.search').hidden = true;
    window.scrollTo(0, 0);
  }
  function closeDetail() {
    dbOpen = null;
    $('db-detail').hidden = true; $('db-list').hidden = false; $('db-count').hidden = false;
    document.querySelector('.search').hidden = false;
    var y = dbScroll; window.scrollTo(0, y); setTimeout(function () { window.scrollTo(0, y); }, 0);
  }
  var dbCats = '<option value="all">Alle Kategorien</option>';
  CATS.forEach(function (c) { dbCats += '<option value="' + esc(c) + '">' + c + '</option>'; });
  $('db-cat').innerHTML = dbCats;
  $('q').addEventListener('input', function () { dbQ = $('q').value; renderDb(); });
  $('db-cat').addEventListener('change', function () { dbCat = $('db-cat').value; renderDb(); });
  $('db-list').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.res') : null;
    if (b) openDetail(b.getAttribute('data-id'));
  });
  $('db-detail').addEventListener('click', function (e) { if (e.target.id === 'db-back') closeDetail(); });
  function tab(which) {
    var db = which === 'db', pa = which === 'path', sa = which === 'stats';
    $('view-db').hidden = !db; $('view-path').hidden = !pa; $('view-stats').hidden = !sa; $('view-learn').hidden = db || pa || sa;
    $('tab-db').setAttribute('aria-selected', db); $('tab-path').setAttribute('aria-selected', pa); $('tab-stats').setAttribute('aria-selected', sa); $('tab-learn').setAttribute('aria-selected', !db && !pa && !sa);
    $('sub').textContent = sa ? 'Dein Lernfortschritt und deine Erfolge.' : pa ? 'Stoffwechselwege verstehen und üben.' : db ? CARDS.length + ' Strukturen zum Nachschlagen.' : CARDS.length + ' Moleküle aus Alltag und Biochemie. Erst raten, dann umdrehen.';
    if (pa && window.PathUI) window.PathUI.open();
    if (sa && window.StatsUI) window.StatsUI.open();
    if (db) { renderDb(); setTimeout(function () { if (!dbOpen) $('q').focus(); }, 0); }
    try { history.replaceState(null, '', db ? '#datenbank' : pa ? '#stoffwechsel' : sa ? '#statistik' : location.pathname + location.search); } catch (e) {}
  }
  function refreshViews() {
    if (!$('view-learn').hidden) fill();
    if (!$('view-db').hidden) { if (dbOpen) { var y0 = window.pageYOffset; openDetail(dbOpen); window.scrollTo(0, y0); } else renderDb(); }
  }
  $('h-toggle').addEventListener('click', function () { setH(!Chem.getH()); });
  setH(Chem.getH(), true);
  $('tab-learn').addEventListener('click', function () { tab('learn'); });
  $('tab-db').addEventListener('click', function () { tab('db'); });
  $('tab-path').addEventListener('click', function () { tab('path'); });
  $('tab-stats').addEventListener('click', function () { tab('stats'); });
  window.startDue = function () { st.dueOnly = true; st.retryOnly = false; st.cat = 'all'; st.pos = 0; tab('learn'); update(); window.scrollTo(0, 0); };
  window.openMolecule = function (id) { tab('db'); openDetail(id); };
  if (location.hash === '#datenbank') tab('db'); else if (location.hash === '#stoffwechsel') tab('path'); else if (location.hash === '#statistik') tab('stats');

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
