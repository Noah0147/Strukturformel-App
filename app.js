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
  $('foot').textContent = CARDS.length + ' Karten' + (ver.length === 3 ? ' · Stand ' + ver[2] + '.' + ver[1] + '.' + ver[0] : '');

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

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
