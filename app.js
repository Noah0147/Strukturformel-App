(function () {
  'use strict';
  var CARDS = window.MOLECULES.slice();
  var Chem = window.Chem;
  var CATS = (window.CATEGORIES || []).slice();
  CARDS.forEach(function (c) {
    if (CATS.indexOf(c.cat) < 0) CATS.push(c.cat);
    c.svg = Chem.render(c.m, 'Strukturformel eines Moleküls');
  });

  var KEY = 'strukturformel-app-v1';
  var SEEN_KEY = 'strukturformel-app-seen-v1';
  var DISMISS_KEY = 'strukturformel-app-install-dismissed';
  var byId = {}; CARDS.forEach(function (c) { byId[c.id] = c; });
  var ids = CARDS.map(function (c) { return c.id; });
  var st = { status: {}, mode: 'struct', order: ids.slice(), pos: 0, retryOnly: false, cat: 'all' };

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) {
      if (saved.status) st.status = saved.status;
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
  $('foot').textContent = CARDS.length + ' Karten' + (ver.length === 3 ? ' · Stand ' + parseInt(ver[2], 10) + '.' + ver[1] + '.' + ver[0] : '');

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
  function deck() { var b = base(); return st.retryOnly ? b.filter(function (id) { return st.status[id] === 'retry'; }) : b; }
  function clampPos() { var d = deck(); if (!d.length) { st.pos = 0; } else if (st.pos >= d.length || st.pos < 0) { st.pos = ((st.pos % d.length) + d.length) % d.length; } }

  function faces(c, n) {
    var p = '<span>Karte ' + (st.pos + 1) + ' von ' + n + '</span>';
    var nw = isNew(c.id) ? '<span class="newchip">Neu</span>' : '';
    var alt = (c.alt ? '<p class="alt">auch: ' + c.alt + '</p>' : '') + (c.ster ? '<p class="alt">Stereochemie: ' + c.ster + '</p>' : '');
    var info = '<div class="chips">' + c.groups.map(function (g) { return '<span class="chip">' + g + '</span>'; }).join('') + '</div>' +
               '<div class="where"><h3>Im Alltag</h3><p>' + c.where + '</p></div>';
    if (st.mode === 'struct') {
      return {
        f: '<div class="eyebrow"><span>Struktur' + nw + '</span>' + p + '</div><div class="struct">' + c.svg + '</div><p class="hint">Wie heißt dieses Molekül? Tippen zum Umdrehen.</p>',
        b: '<div class="eyebrow"><span>Name</span>' + p + '</div><div><h2 class="name">' + c.name + '</h2>' + alt + '<p class="formula">' + c.formula + '</p></div>' + info
      };
    }
    return {
      f: '<div class="eyebrow"><span>Name' + nw + '</span>' + p + '</div><div class="struct"><h2 class="name center">' + c.name + '</h2></div><p class="hint">Wie sieht die Struktur aus? Tippen zum Umdrehen.</p>',
      b: '<div class="eyebrow"><span>Struktur</span>' + p + '</div><div class="struct small">' + c.svg + '</div><p class="formula">' + c.formula + '</p>' + info
    };
  }

  function setFlip(v) {
    flipped = v;
    card.classList.toggle('flipped', v);
    front.setAttribute('aria-hidden', v ? 'true' : 'false');
    back.setAttribute('aria-hidden', v ? 'false' : 'true');
    $('flip').hidden = v;
    $('r-retry').hidden = !v;
    $('r-known').hidden = !v;
  }

  function fill() {
    var d = deck(), has = d.length > 0;
    $('stage').hidden = !has;
    if (!has) return;
    var c = byId[d[st.pos]], f = faces(c, d.length);
    front.innerHTML = f.f; back.innerHTML = f.b;
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
    $('cat').value = st.cat;
    $('done').hidden = !(known === b.length && b.length > 0 && !st.retryOnly);
    $('empty').hidden = !(st.retryOnly && d.length === 0);
  }

  function update() { clampPos(); chrome(); show(); save(); }

  function go(delta) {
    var d = deck(); if (!d.length) return;
    st.pos = (st.pos + delta + d.length) % d.length;
    update();
  }
  function rate(s) {
    if (!flipped) return;
    var d = deck(); if (!d.length) return;
    var id = d[st.pos];
    st.status[id] = s;
    markSeen(id);
    if (st.retryOnly) { clampPos(); } else { st.pos = (st.pos + 1) % d.length; }
    update();
  }

  card.addEventListener('click', function () { setFlip(!flipped); });
  card.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlip(!flipped); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    if (e.key === 'ArrowRight') { go(1); }
    else if (e.key === 'ArrowLeft') { go(-1); }
    else if (e.key === '1') { rate('retry'); }
    else if (e.key === '2') { rate('known'); }
  });
  $('flip').addEventListener('click', function () { setFlip(true); });
  $('r-retry').addEventListener('click', function () { rate('retry'); });
  $('r-known').addEventListener('click', function () { rate('known'); });
  $('prev').addEventListener('click', function () { go(-1); });
  $('next').addEventListener('click', function () { go(1); });
  $('mode-struct').addEventListener('click', function () { st.mode = 'struct'; update(); });
  $('mode-name').addEventListener('click', function () { st.mode = 'name'; update(); });
  $('cat').addEventListener('change', function () { st.cat = $('cat').value; st.pos = 0; update(); });
  $('retry-only').addEventListener('click', function () { st.retryOnly = !st.retryOnly; st.pos = 0; update(); });
  $('shuffle').addEventListener('click', function () {
    var o = st.order.slice();
    for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = o[i]; o[i] = o[j]; o[j] = t; }
    st.order = o; st.pos = 0; update();
  });
  $('reset').addEventListener('click', function () { st.status = {}; st.pos = 0; st.retryOnly = false; update(); });
  $('again').addEventListener('click', function () {
    base().forEach(function (id) { delete st.status[id]; });
    st.pos = 0; st.retryOnly = false; update();
  });
  $('show-all').addEventListener('click', function () { st.retryOnly = false; st.pos = 0; update(); });
  $('dots').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.dot') : null;
    if (!b) return;
    st.retryOnly = false; st.pos = base().indexOf(b.getAttribute('data-id')); update();
  });

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
  var dbQ = '', dbCat = 'all', dbOpen = null;
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
      return '<li><button type="button" class="res" data-id="' + esc(c.id) + '"><span class="thumb">' + c.svg + '</span><span class="rt"><b>' + c.name + '</b><span>' + c.formula + ' · ' + esc(c.cat) + '</span></span></button></li>';
    }).join('') : '<li class="none">Nichts gefunden. Versuche den Namen, die Summenformel oder einen Teil davon.</li>';
  }
  function openDetail(id) {
    var c = byId[id]; if (!c) return;
    dbOpen = id;
    var alt = (c.alt ? '<p class="alt">auch: ' + c.alt + '</p>' : '') + (c.ster ? '<p class="alt">Stereochemie: ' + c.ster + '</p>' : '');
    $('db-detail').innerHTML = '<div class="face dface"><button type="button" class="tbtn" id="db-back">← Zurück zur Liste</button>' +
      '<div class="eyebrow"><span>' + esc(c.cat) + '</span></div><div class="struct">' + c.svg + '</div>' +
      '<div><h2 class="name">' + c.name + '</h2>' + alt + '<p class="formula">' + c.formula + '</p></div>' +
      '<div class="chips">' + c.groups.map(function (g) { return '<span class="chip">' + g + '</span>'; }).join('') + '</div>' +
      '<div class="where"><h3>Im Alltag</h3><p>' + c.where + '</p></div></div>';
    $('db-detail').hidden = false; $('db-list').hidden = true; $('db-count').hidden = true;
    document.querySelector('.search').hidden = true;
    window.scrollTo(0, 0);
  }
  function closeDetail() {
    dbOpen = null;
    $('db-detail').hidden = true; $('db-list').hidden = false; $('db-count').hidden = false;
    document.querySelector('.search').hidden = false;
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
    var db = which === 'db';
    $('view-db').hidden = !db; $('view-learn').hidden = db;
    $('tab-db').setAttribute('aria-selected', db); $('tab-learn').setAttribute('aria-selected', !db);
    $('sub').textContent = db ? CARDS.length + ' Strukturen zum Nachschlagen.' : CARDS.length + ' Moleküle aus Alltag und Biochemie. Erst raten, dann umdrehen.';
    if (db) { renderDb(); setTimeout(function () { if (!dbOpen) $('q').focus(); }, 0); }
    try { history.replaceState(null, '', db ? '#datenbank' : location.pathname + location.search); } catch (e) {}
  }
  $('tab-learn').addEventListener('click', function () { tab('learn'); });
  $('tab-db').addEventListener('click', function () { tab('db'); });
  if (location.hash === '#datenbank') tab('db');

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
