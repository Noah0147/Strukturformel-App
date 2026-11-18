/* Reiter „Stoffwechsel“: Verstehen (Schema + Bauteile) und Üben (Reihenfolge + mehrere Fragen pro Runde). */
(function () {
  var P = window.PATHWAYS || [], root = document.getElementById('view-path');
  if (!root || !P.length) return;
  var body = document.getElementById('path-body'), sel = document.getElementById('path-sel');
  var cur = P[0], mode = 'learn', selK = null, round = null, built = false;
  var QN = 5;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function comp(id) { for (var i = 0; i < cur.comps.length; i++) if (cur.comps[i].id === id) return cur.comps[i]; return null; }

  /* ---------- Verstehen ---------- */
  function row(k, v) { return v && v !== '–' ? '<div class="prow"><b>' + k + '</b><span>' + v + '</span></div>' : ''; }
  function info() {
    var c = comp(selK);
    if (!c) return '<p class="hint">Tippe im Schema ein Bauteil an oder wähle unten eins aus.</p>';
    return '<h2 class="name">' + c.name + '</h2><p class="alt">' + c.alt + '</p>' +
      row('Aufgabe', c.rolle) + row('Reaktion', c.reaktion) + row('Cofaktoren', c.cof) + row('Protonen', c.h) + row('Hemmstoffe', c.hemm) +
      '<div class="where"><h3>Im Alltag</h3><p>' + c.alltag + '</p></div>';
  }
  function learn() {
    body.innerHTML = '<div class="pcard"><p class="pintro">' + cur.intro + '</p><div class="pdia" id="pdia">' + cur.svg + '</div>' +
      '<div class="chips pchips" id="pchips">' + cur.comps.map(function (c) { return '<button type="button" class="pick" data-k="' + c.id + '">' + c.name + '</button>'; }).join('') + '</div>' +
      '<div class="pinfo" id="pinfo"></div></div>' +
      '<div class="pcard"><h3 class="ph3">Zum Merken</h3><ul class="pfacts">' + cur.facts.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul></div>';
    mark();
  }
  function mark() {
    var els = body.querySelectorAll('[data-k]');
    for (var i = 0; i < els.length; i++) {
      var on = els[i].getAttribute('data-k') === selK;
      if (els[i].classList) els[i].classList.toggle('sel', on);
      if (els[i].tagName === 'BUTTON') els[i].setAttribute('aria-pressed', on);
    }
    var pi = document.getElementById('pinfo'); if (pi) pi.innerHTML = info();
  }

  /* ---------- Üben ---------- */
  function newRound() {
    var ord = cur.orders[Math.floor(Math.random() * cur.orders.length)];
    round = {
      ord: ord, pool: shuffle(ord.items.map(function (x) { return x[0]; })), placed: [], done: false,
      qs: shuffle(cur.qs).slice(0, QN).map(function (q) {
        var idx = shuffle(q.o.map(function (_, i) { return i; }));
        return { q: q.q, o: idx.map(function (i) { return q.o[i]; }), a: idx.indexOf(q.a), why: q.why, chosen: null };
      })
    };
  }
  function label(id) { for (var i = 0; i < round.ord.items.length; i++) if (round.ord.items[i][0] === id) return round.ord.items[i][1]; return id; }
  function ordHtml() {
    var n = round.ord.items.length, h = '<ol class="slots">', i, ok;
    for (i = 0; i < n; i++) {
      var id = round.placed[i], cls = '';
      if (round.done) cls = id === round.ord.items[i][0] ? ' ok' : ' bad';
      h += '<li class="slot' + cls + '"><i>' + (i + 1) + '</i>' + (id ? '<button type="button" class="pick placed" data-pl="' + i + '"' + (round.done ? ' disabled' : '') + '>' + label(id) + '</button>' : '<span class="empty">–</span>') + '</li>';
    }
    h += '</ol>';
    if (!round.done) {
      h += '<div class="chips pool">' + round.pool.map(function (id) {
        return round.placed.indexOf(id) < 0 ? '<button type="button" class="pick" data-pk="' + id + '">' + label(id) + '</button>' : '';
      }).join('') + '</div>';
    } else {
      h += '<p class="sol">Richtig: ' + round.ord.items.map(function (x) { return x[1]; }).join(' → ') + '</p>';
    }
    return h;
  }
  function qHtml() {
    return round.qs.map(function (q, qi) {
      var h = '<fieldset class="q"><legend>' + (qi + 2) + ' · ' + q.q + '</legend>';
      q.o.forEach(function (o, oi) {
        var cls = '';
        if (round.done) cls = oi === q.a ? ' ok' : (q.chosen === oi ? ' bad' : '');
        h += '<label class="opt' + cls + '"><input type="radio" name="q' + qi + '" value="' + oi + '"' + (q.chosen === oi ? ' checked' : '') + (round.done ? ' disabled' : '') + '><span>' + o + '</span></label>';
      });
      if (round.done) h += '<p class="why">' + q.why + '</p>';
      return h + '</fieldset>';
    }).join('');
  }
  function result() {
    var okOrd = round.placed.length === round.ord.items.length && round.placed.every(function (id, i) { return id === round.ord.items[i][0]; });
    var qs = round.qs.filter(function (q) { return q.chosen === q.a; }).length, tot = round.qs.length + 1, sc = qs + (okOrd ? 1 : 0);
    return '<div class="banner pres"><p><b>' + sc + ' von ' + tot + ' richtig.</b> ' + (sc === tot ? 'Sehr gut, alles gewusst.' : 'Die Erklärungen unten helfen beim Merken.') + '</p><button type="button" class="tbtn" id="p-new">Neue Runde</button></div>';
  }
  function train() {
    if (!round) newRound();
    body.innerHTML = '<div id="pres"></div><div class="pcard"><h3 class="ph3">1 · ' + round.ord.title + '</h3><p class="hint left">Tippe die Teile in der Reihenfolge an, in der die Elektronen fließen. Tippe ein gesetztes Teil an, um es zu entfernen.</p><div id="pord"></div></div>' +
      '<div class="pcard" id="pq"></div><div class="actions"><button type="button" class="btn primary wide" id="p-check">Auswerten</button><button type="button" class="btn" id="p-new2">Neue Runde</button></div>';
    paint();
  }
  function paint() {
    document.getElementById('pord').innerHTML = ordHtml();
    document.getElementById('pq').innerHTML = '<h3 class="ph3">Fragen</h3>' + qHtml();
    document.getElementById('pres').innerHTML = round.done ? result() : '';
    document.getElementById('p-check').hidden = round.done;
  }

  function render() { if (mode === 'learn') learn(); else train(); }
  function setMode(m) {
    mode = m;
    document.getElementById('pm-learn').setAttribute('aria-pressed', m === 'learn');
    document.getElementById('pm-train').setAttribute('aria-pressed', m === 'train');
    render();
  }

  body.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-k],[data-pk],[data-pl],#p-check,#p-new,#p-new2') : null;
    if (!t) return;
    if (t.hasAttribute('data-k')) { selK = t.getAttribute('data-k'); mark(); var pi = document.getElementById('pinfo'); if (pi && pi.scrollIntoView && t.tagName !== 'BUTTON') pi.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (!round) return;
    if (t.hasAttribute('data-pk')) { round.placed.push(t.getAttribute('data-pk')); document.getElementById('pord').innerHTML = ordHtml(); return; }
    if (t.hasAttribute('data-pl')) { round.placed.splice(parseInt(t.getAttribute('data-pl'), 10), 1); document.getElementById('pord').innerHTML = ordHtml(); return; }
    if (t.id === 'p-check') { round.done = true; paint(); document.getElementById('pres').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (t.id === 'p-new' || t.id === 'p-new2') { newRound(); train(); window.scrollTo(0, 0); }
  });
  body.addEventListener('keydown', function (e) {
    var t = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && t.getAttribute && t.getAttribute('data-k') && t.tagName !== 'BUTTON') { e.preventDefault(); t.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  body.addEventListener('change', function (e) {
    var t = e.target;
    if (!round || round.done || !t || t.type !== 'radio') return;
    round.qs[parseInt(t.name.slice(1), 10)].chosen = parseInt(t.value, 10);
  });
  document.getElementById('pm-learn').addEventListener('click', function () { setMode('learn'); });
  document.getElementById('pm-train').addEventListener('click', function () { setMode('train'); });
  sel.innerHTML = P.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + '</option>'; }).join('');
  sel.addEventListener('change', function () { cur = P[parseInt(sel.value, 10)]; selK = null; round = null; render(); });
  window.PathUI = { open: function () { if (!built) { built = true; setMode('learn'); } }, count: P.length };
})();
