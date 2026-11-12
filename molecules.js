/*
  Moleküldaten der Strukturformel-Karten.
  Neue Karte: Eintrag am Ende von MOLECULES anhängen, id eindeutig, cat aus CATEGORIES.
  Zeichen-Bausteine: h.add(x, y, label), h.at(atomIndex, winkelInGrad, label), h.bd(a, b, ordnung)
  Ringe: ring(h, mx, my, startwinkel, bindungsordnungen, {position: 'Label'}) liefert die Atomindizes.
*/
(function () {
  var C = window.Chem, L = C.L, mol = C.mol, ring = C.ring, KEK = C.KEK, SAT = C.SAT,
      AP = C.AP, RP = C.RP, fusedPent = C.fusedPent, aaBase = C.aaBase;

  /* Hilfsfunktionen für Fünfringe, Steroide und Nucleoside */
  function pentAt(h, cx, cy, startDeg, labels) {
    var idx = [], k, q;
    for (k = 0; k < 5; k++) { q = (startDeg + 72 * k) * Math.PI / 180; idx.push(h.add(cx + RP * Math.cos(q), cy - RP * Math.sin(q), labels && labels[k])); }
    return { idx: idx, c: [cx, cy] };
  }
  function pentFrom(h, a, theta, labels) {
    var A = h.m.atoms[a], t = theta * Math.PI / 180, cx = A.x + RP * Math.cos(t), cy = A.y - RP * Math.sin(t), idx = [a], k, q;
    for (k = 1; k < 5; k++) { q = (theta + 180 + 72 * k) * Math.PI / 180; idx.push(h.add(cx + RP * Math.cos(q), cy - RP * Math.sin(q), labels && labels[k])); }
    return { idx: idx, c: [cx, cy] };
  }
  function pbond(h, P) { var i = P.idx; for (var k = 0; k < 5; k++) h.bd(i[k], i[(k + 1) % 5]); }
  function outDir(h, P, k) { var a = h.m.atoms[P.idx[k]]; return Math.atan2(P.c[1] - a.y, a.x - P.c[0]) * 180 / Math.PI; }
  function oh(h, a, ang) { var o = h.at(a, ang, Math.cos(ang * Math.PI / 180) >= -0.01 ? 'OH' : 'HO'); h.bd(a, o); return o; }
  function imidazole(h, a, theta) {
    var P = pentFrom(h, a, theta, { 2: 'NH', 4: 'N' }), i = P.idx;
    h.bd(i[0], i[1], 2, P.c); h.bd(i[1], i[2]); h.bd(i[2], i[3]); h.bd(i[3], i[4], 2, P.c); h.bd(i[4], i[0]);
    return P;
  }
  function steroid(h, dbl) {
    var d = Math.PI / 180, S = Math.sqrt(3) * L, cxC = S * 1.5, cyC = -1.5 * L, a = {};
    function hx(n, cx, cy, deg) { a[n] = h.add(cx + L * Math.cos(deg * d), cy - L * Math.sin(deg * d)); }
    hx('c1', 0, 0, 90); hx('c2', 0, 0, 150); hx('c3', 0, 0, 210); hx('c4', 0, 0, 270); hx('c5', 0, 0, 330); hx('c10', 0, 0, 30);
    hx('c6', S, 0, 270); hx('c7', S, 0, 330); hx('c8', S, 0, 30); hx('c9', S, 0, 90);
    hx('c11', cxC, cyC, 150); hx('c12', cxC, cyC, 90); hx('c13', cxC, cyC, 30); hx('c14', cxC, cyC, 330);
    var pcx = cxC + L * Math.cos(30 * d) + AP;
    function px(n, deg) { a[n] = h.add(pcx + RP * Math.cos(deg * d), cyC - RP * Math.sin(deg * d)); }
    px('c15', 288); px('c16', 0); px('c17', 72);
    var rings = { A: [0, 0], B: [S, 0], C: [cxC, cyC], D: [pcx, cyC] };
    [['c1', 'c2', 'A'], ['c2', 'c3', 'A'], ['c3', 'c4', 'A'], ['c4', 'c5', 'A'], ['c5', 'c10', 'A'], ['c10', 'c1', 'A'],
     ['c5', 'c6', 'B'], ['c6', 'c7', 'B'], ['c7', 'c8', 'B'], ['c8', 'c9', 'B'], ['c9', 'c10', 'B'],
     ['c8', 'c14', 'C'], ['c14', 'c13', 'C'], ['c13', 'c12', 'C'], ['c12', 'c11', 'C'], ['c11', 'c9', 'C'],
     ['c14', 'c15', 'D'], ['c15', 'c16', 'D'], ['c16', 'c17', 'D'], ['c17', 'c13', 'D']].forEach(function (b) {
      var two = dbl && (dbl.indexOf(b[0] + '-' + b[1]) >= 0 || dbl.indexOf(b[1] + '-' + b[0]) >= 0);
      h.bd(a[b[0]], a[b[1]], two ? 2 : 1, two ? rings[b[2]] : null);
    });
    return a;
  }
  function adenosinCore(h) {
    var r = ring(h, 0, 0, 90, [2, 1, 2, 1, 0, 1], { 1: 'N', 3: 'N' });
    var nh = h.at(r[0], 90, 'NH₂'); h.bd(r[0], nh);
    var p = fusedPent(h, r, 'N', 'N', '78');
    var c1 = h.at(p.n9, -72); h.bd(p.n9, c1);
    var S = pentFrom(h, c1, -72, { 4: 'O' }); pbond(h, S);
    oh(h, S.idx[1], outDir(h, S, 1)); oh(h, S.idx[2], outDir(h, S, 2));
    var c5 = h.at(S.idx[3], outDir(h, S, 3)); h.bd(S.idx[3], c5);
    return c5;
  }
  function indole(h, kek) {
    var r = ring(h, 0, 0, 90, KEK);
    var A = h.m.atoms, p4 = A[r[4]], p5 = A[r[5]];
    var pcx = (p4.x + p5.x) / 2 + AP, pcy = (p4.y + p5.y) / 2, ctr = [pcx, pcy];
    function pv(deg, l) { var q = deg * Math.PI / 180; return h.add(pcx + RP * Math.cos(q), pcy - RP * Math.sin(q), l); }
    var c3 = pv(72), c2 = pv(0), n1 = pv(-72, 'NH');
    h.bd(r[5], c3); h.bd(c3, c2, 2, ctr); h.bd(c2, n1); h.bd(n1, r[4]);
    return { r: r, c3: c3 };
  }

  /* Hilfsfunktionen für Ketten, Carboxygruppen, Phosphate und Nucleoside */
  function zig(h, start, n, first, orders) {
    var out = [], prev = start, a = first, k, i;
    for (k = 0; k < n; k++) { i = h.at(prev, a); h.bd(prev, i, (orders && orders[k]) || 1); out.push(i); prev = i; a = -a; }
    return out;
  }
  function cooh(h, c, s) { /* Carboxygruppe am Kettenende; s = Winkel des letzten Schritts */
    var o = h.at(c, s > 0 ? 90 : -90, 'O'), q = h.at(c, s > 0 ? -30 : 30, 'OH');
    h.bd(c, o, 2); h.bd(c, q);
  }
  function cooStart(h, c, s) { /* Carboxygruppe am Kettenanfang; s = Winkel des ersten Schritts */
    var o, q;
    if (s < 0) { o = h.at(c, 90, 'O'); q = h.at(c, 210, 'HO'); } else { o = h.at(c, 270, 'O'); q = h.at(c, 150, 'HO'); }
    h.bd(c, o, 2); h.bd(c, q);
  }
  function phos(h, c5, n) {
    var prev = h.at(c5, 24, 'O'), k, pa, o1, q1, ob;
    h.bd(c5, prev);
    for (k = 0; k < n; k++) {
      pa = h.at(prev, -30, 'P'); h.bd(prev, pa);
      o1 = h.at(pa, 90, 'O'); h.bd(pa, o1, 2);
      q1 = h.at(pa, 270, 'OH'); h.bd(pa, q1);
      if (k < n - 1) { ob = h.at(pa, 30, 'O'); h.bd(pa, ob); prev = ob; }
      else { h.bd(pa, h.at(pa, 30, 'OH')); }
    }
  }
  function nucleoside(h, nIdx) { /* Ribose am Ring-Stickstoff nIdx (Pyrimidin) */
    var c1 = h.at(nIdx, 330); h.bd(nIdx, c1);
    var S = pentFrom(h, c1, 330, { 4: 'O' }); pbond(h, S);
    oh(h, S.idx[1], outDir(h, S, 1)); oh(h, S.idx[2], outDir(h, S, 2));
    var c5 = h.at(S.idx[3], outDir(h, S, 3)); h.bd(S.idx[3], c5); oh(h, c5, 300);
  }
  function quatN(h) { /* N mit drei Methylgruppen (Ladung nicht gezeigt) */
    var n = h.add(0, 0, 'N');
    h.bd(n, h.at(n, 90)); h.bd(n, h.at(n, 180)); h.bd(n, h.at(n, 270));
    return n;
  }

  window.DATA_VERSION = '2026-11-12';
  window.CATEGORIES = ['Alkohole & Carbonyle', 'Säuren & Ester', 'Aromaten', 'Aminosäuren', 'Nucleobasen & Purine', 'Wirkstoffe & Aromastoffe', 'Stoffwechsel & Pflanzen', 'Zucker & Nucleotide', 'Steroide & Botenstoffe', 'Kleine Moleküle'];

  window.MOLECULES = [
    { id: 'essig', cat: 'Säuren & Ester', name: 'Essigsäure', alt: 'Ethansäure', formula: 'C₂H₄O₂', groups: ['Carboxygruppe'],
      where: 'Speiseessig (etwa 5 %), Essigreiniger und Entkalker. Im Stoffwechsel steckt ihr Rest als Acetyl-Gruppe in Acetyl-CoA.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), o1 = h.at(c1, 90, 'O'), o2 = h.at(c1, -30, 'OH'); h.bd(c0, c1); h.bd(c1, o1, 2); h.bd(c1, o2); }) },
    { id: 'ethanol', cat: 'Alkohole & Carbonyle', name: 'Ethanol', alt: 'Ethylalkohol', formula: 'C₂H₆O', groups: ['Hydroxygruppe (Alkohol)'],
      where: 'Alkoholische Getränke. In Desinfektionsmitteln ist er der Wirkstoff.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), o = h.at(c1, -30, 'OH'); h.bd(c0, c1); h.bd(c1, o); }) },
    { id: 'aceton', cat: 'Alkohole & Carbonyle', name: 'Aceton', alt: 'Propanon', formula: 'C₃H₆O', groups: ['Carbonylgruppe (Keton)'],
      where: 'Nagellackentferner und vielseitiges Lösungsmittel.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), c2 = h.at(c1, -30), o = h.at(c1, 90, 'O'); h.bd(c0, c1); h.bd(c1, c2); h.bd(c1, o, 2); }) },
    { id: 'benzol', cat: 'Aromaten', name: 'Benzol', alt: '', formula: 'C₆H₆', groups: ['Aromatischer Ring', '6 delokalisierte π-Elektronen'],
      where: 'Grundgerüst vieler Alltagsmoleküle. Selbst ist es krebserregend und kommt nur in Spuren in Benzin vor.',
      m: mol(function (h) { ring(h, 0, 0, 90, KEK); }) },
    { id: 'harnstoff', cat: 'Stoffwechsel & Pflanzen', name: 'Harnstoff', alt: 'Urea, Carbamid', formula: 'CH₄N₂O', groups: ['Amid (Carbonyl zwischen zwei Aminogruppen)'],
      where: 'Urin, Dünger und Hautcremes. Im Körper ist er das Endprodukt des Eiweißabbaus (Harnstoffzyklus in der Leber).',
      m: mol(function (h) { var c = h.add(0, 0), o = h.at(c, 90, 'O'), n1 = h.at(c, 210, 'H₂N'), n2 = h.at(c, -30, 'NH₂'); h.bd(c, o, 2); h.bd(c, n1); h.bd(c, n2); }) },
    { id: 'glycin', cat: 'Aminosäuren', name: 'Glycin', alt: 'Aminoethansäure', formula: 'C₂H₅NO₂', groups: ['Aminogruppe', 'Carboxygruppe'],
      where: 'Die kleinste Aminosäure und Proteinbaustein. Besonders viel steckt im Kollagen.',
      m: mol(function (h) { aaBase(h); }) },
    { id: 'milch', cat: 'Säuren & Ester', name: 'Milchsäure', alt: '2-Hydroxypropansäure', formula: 'C₃H₆O₃', groups: ['Hydroxygruppe', 'Carboxygruppe'],
      where: 'Joghurt und Sauerkraut. Als Lactat entsteht sie im Muskel, wenn Sauerstoff knapp wird.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, -30), oh = h.at(c1, -90, 'OH'), c2 = h.at(c1, 30), o = h.at(c2, 90, 'O'), o2 = h.at(c2, -30, 'OH'); h.bd(c0, c1); h.bd(c1, oh); h.bd(c1, c2); h.bd(c2, o, 2); h.bd(c2, o2); }) },
    { id: 'phenol', cat: 'Aromaten', name: 'Phenol', alt: 'Hydroxybenzol', formula: 'C₆H₆O', groups: ['Aromatischer Ring', 'Hydroxygruppe'],
      where: 'Früher als Desinfektionsmittel genutzt. Der Phenolring steckt in der Aminosäure Tyrosin.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK); var oh = h.at(r[0], 90, 'OH'); h.bd(r[0], oh); }) },
    { id: 'glycerin', cat: 'Alkohole & Carbonyle', name: 'Glycerin', alt: 'Propan-1,2,3-triol', formula: 'C₃H₈O₃', groups: ['Drei Hydroxygruppen'],
      where: 'Rückgrat der Fette (Triglyceride). Außerdem in Kosmetik, Seife und als Feuchthaltemittel.',
      m: mol(function (h) { var o0 = h.add(0, 0, 'HO'), c0 = h.at(o0, -30), c1 = h.at(c0, 30), oh = h.at(c1, 90, 'OH'), c2 = h.at(c1, -30), o1 = h.at(c2, 30, 'OH'); h.bd(o0, c0); h.bd(c0, c1); h.bd(c1, oh); h.bd(c1, c2); h.bd(c2, o1); }) },
    { id: 'vanillin', cat: 'Wirkstoffe & Aromastoffe', name: 'Vanillin', alt: '4-Hydroxy-3-methoxybenzaldehyd', formula: 'C₈H₈O₃', groups: ['Aldehyd', 'Ether', 'Hydroxygruppe', 'Aromatischer Ring'],
      where: 'Der Hauptaromastoff der Vanille. Steckt in Backwaren, Eis und Vanillezucker.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK);
        var c = h.at(r[0], 90), o = h.at(c, 30, 'O'); h.bd(r[0], c); h.bd(c, o, 2);
        var oh = h.at(r[3], -90, 'OH'); h.bd(r[3], oh);
        var oe = h.at(r[4], -30, 'O'), me = h.at(oe, 30); h.bd(r[4], oe); h.bd(oe, me);
      }) },
    { id: 'paracetamol', cat: 'Wirkstoffe & Aromastoffe', name: 'Paracetamol', alt: 'N-(4-Hydroxyphenyl)acetamid', formula: 'C₈H₉NO₂', groups: ['Amid', 'Hydroxygruppe', 'Aromatischer Ring'],
      where: 'Verbreitetes Schmerz- und Fiebermittel. Die Amidbindung ist dieselbe wie die Peptidbindung in Proteinen.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 0, KEK);
        var oh = h.at(r[3], 180, 'OH'); h.bd(r[3], oh);
        var n = h.at(r[0], 0, 'NH'), c = h.at(n, -30), o = h.at(c, -90, 'O'), me = h.at(c, 30);
        h.bd(r[0], n); h.bd(n, c); h.bd(c, o, 2); h.bd(c, me);
      }) },
    { id: 'ethylacetat', cat: 'Säuren & Ester', name: 'Ethylacetat', alt: 'Essigsäureethylester', formula: 'C₄H₈O₂', groups: ['Ester'],
      where: 'Lösungsmittel in Nagellack und Klebstoff. Riecht fruchtig und kommt als Aroma in Früchten vor.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), o1 = h.at(c1, 90, 'O'), o2 = h.at(c1, -30, 'O'), c3 = h.at(o2, 30), c4 = h.at(c3, -30); h.bd(c0, c1); h.bd(c1, o1, 2); h.bd(c1, o2); h.bd(o2, c3); h.bd(c3, c4); }) },
    { id: 'menthol', cat: 'Wirkstoffe & Aromastoffe', name: 'Menthol', alt: '2-Isopropyl-5-methylcyclohexanol', formula: 'C₁₀H₂₀O', groups: ['Gesättigter Ring (Cyclohexan)', 'Hydroxygruppe'],
      where: 'Kühlgefühl in Zahnpasta, Kaugummi und Hustenbonbons. Es aktiviert Kälterezeptoren in der Haut.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, SAT);
        var oh = h.at(r[5], 30, 'OH'); h.bd(r[5], oh);
        var ip = h.at(r[4], -30), a = h.at(ip, 30), b = h.at(ip, -90); h.bd(r[4], ip); h.bd(ip, a); h.bd(ip, b);
        var me = h.at(r[1], 150); h.bd(r[1], me);
      }) },
    { id: 'aspirin', cat: 'Wirkstoffe & Aromastoffe', name: 'Acetylsalicylsäure', alt: 'ASS, Aspirin', formula: 'C₉H₈O₄', groups: ['Carboxygruppe', 'Ester', 'Aromatischer Ring'],
      where: 'Schmerzmittel, das auch das Blut verdünnt. Es hemmt das Enzym Cyclooxygenase.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 0, KEK);
        var c = h.at(r[1], 60), o = h.at(c, 120, 'O'), oh = h.at(c, 0, 'OH'); h.bd(r[1], c); h.bd(c, o, 2); h.bd(c, oh);
        var oe = h.at(r[2], 120, 'O'), ce = h.at(oe, 180), o2 = h.at(ce, 120, 'O'), me = h.at(ce, 240);
        h.bd(r[2], oe); h.bd(oe, ce); h.bd(ce, o2, 2); h.bd(ce, me);
      }) },
    { id: 'koffein', cat: 'Nucleobasen & Purine', name: 'Koffein', alt: '1,3,7-Trimethylxanthin', formula: 'C₈H₁₀N₄O₂', groups: ['Purin-Gerüst (zwei verknüpfte Ringe)', 'Amid-Gruppen', 'Methylgruppen'],
      where: 'Kaffee, Tee und Cola. Es blockiert Adenosin-Rezeptoren im Gehirn. Das Purin-Gerüst teilt es mit Adenin und Guanin aus der DNA.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 0, 1], { 1: 'N', 3: 'N' });
        var p = fusedPent(h, r, 'N', 'N', '89');
        var o6 = h.at(r[0], 90, 'O'); h.bd(r[0], o6, 2);
        var me1 = h.at(r[1], 150); h.bd(r[1], me1);
        var o2 = h.at(r[2], 210, 'O'); h.bd(r[2], o2, 2);
        var me3 = h.at(r[3], 270); h.bd(r[3], me3);
        var me7 = h.at(p.n7, 72); h.bd(p.n7, me7);
      }) },

    { id: 'isopropanol', cat: 'Alkohole & Carbonyle', name: 'Isopropanol', alt: 'Propan-2-ol', formula: 'C₃H₈O', groups: ['Hydroxygruppe (sekundärer Alkohol)'],
      where: 'Desinfektionsmittel und Franzbranntwein. Auch Lösungsmittel in Reinigern.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), c2 = h.at(c1, -30), oh = h.at(c1, 90, 'OH'); h.bd(c0, c1); h.bd(c1, c2); h.bd(c1, oh); }) },
    { id: 'glykol', cat: 'Alkohole & Carbonyle', name: 'Ethylenglykol', alt: 'Ethan-1,2-diol', formula: 'C₂H₆O₂', groups: ['Zwei Hydroxygruppen'],
      where: 'Frostschutzmittel im Kühlwasser von Autos. Es ist giftig.',
      m: mol(function (h) { var o0 = h.add(0, 0, 'HO'), c0 = h.at(o0, -30), c1 = h.at(c0, 30), o1 = h.at(c1, -30, 'OH'); h.bd(o0, c0); h.bd(c0, c1); h.bd(c1, o1); }) },
    { id: 'acetaldehyd', cat: 'Alkohole & Carbonyle', name: 'Acetaldehyd', alt: 'Ethanal', formula: 'C₂H₄O', groups: ['Aldehyd'],
      where: 'Entsteht beim Abbau von Ethanol in der Leber und ist mitverantwortlich für die Katersymptome.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), o = h.at(c1, 90, 'O'); h.bd(c0, c1); h.bd(c1, o, 2); }) },
    { id: 'ameisen', cat: 'Säuren & Ester', name: 'Ameisensäure', alt: 'Methansäure', formula: 'CH₂O₂', groups: ['Carboxygruppe'],
      where: 'Im Gift von Ameisen und in Brennnesselhaaren. Wird auch zum Entkalken und Konservieren genutzt.',
      m: mol(function (h) { var c = h.add(0, 0), o = h.at(c, 90, 'O'), oh = h.at(c, -30, 'OH'); h.bd(c, o, 2); h.bd(c, oh); }) },
    { id: 'butter', cat: 'Säuren & Ester', name: 'Buttersäure', alt: 'Butansäure', formula: 'C₄H₈O₂', groups: ['Carboxygruppe'],
      where: 'Typischer Geruch von ranziger Butter und von Schweiß.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), c2 = h.at(c1, -30), c3 = h.at(c2, 30), o = h.at(c3, 90, 'O'), oh = h.at(c3, -30, 'OH'); h.bd(c0, c1); h.bd(c1, c2); h.bd(c2, c3); h.bd(c3, o, 2); h.bd(c3, oh); }) },
    { id: 'zitronen', cat: 'Säuren & Ester', name: 'Zitronensäure', alt: '2-Hydroxypropan-1,2,3-tricarbonsäure', formula: 'C₆H₈O₇', groups: ['Drei Carboxygruppen', 'Hydroxygruppe'],
      where: 'Zitrusfrüchte, Brausepulver und Entkalker. Als Citrat ist sie Teil des Citratzyklus.',
      m: mol(function (h) {
        var c0 = h.add(0, 0), oh = h.at(c0, 90, 'OH'); h.bd(c0, oh);
        var ca = h.at(c0, 180), cb = h.at(ca, 150), oa = h.at(cb, 90, 'O'), oa2 = h.at(cb, 210, 'HO');
        h.bd(c0, ca); h.bd(ca, cb); h.bd(cb, oa, 2); h.bd(cb, oa2);
        var cr = h.at(c0, 0), cc = h.at(cr, 30), ob = h.at(cc, 90, 'O'), ob2 = h.at(cc, -30, 'OH');
        h.bd(c0, cr); h.bd(cr, cc); h.bd(cc, ob, 2); h.bd(cc, ob2);
        var cd = h.at(c0, -90), od = h.at(cd, 210, 'O'), od2 = h.at(cd, -30, 'OH');
        h.bd(c0, cd); h.bd(cd, od, 2); h.bd(cd, od2);
      }) },
    { id: 'oxal', cat: 'Säuren & Ester', name: 'Oxalsäure', alt: 'Ethandisäure', formula: 'C₂H₂O₄', groups: ['Zwei Carboxygruppen'],
      where: 'In Rhabarber und Spinat. Ihre Salze (Oxalate) können Nierensteine bilden.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 0), a = h.at(c0, 120, 'O'), b = h.at(c0, 240, 'HO'), c = h.at(c1, 60, 'O'), d = h.at(c1, -60, 'OH'); h.bd(c0, c1); h.bd(c0, a, 2); h.bd(c0, b); h.bd(c1, c, 2); h.bd(c1, d); }) },
    { id: 'pyruvat', cat: 'Säuren & Ester', name: 'Brenztraubensäure', alt: 'Pyruvat, 2-Oxopropansäure', formula: 'C₃H₄O₃', groups: ['Carbonylgruppe (Keton)', 'Carboxygruppe'],
      where: 'Endprodukt der Glykolyse. Wird zu Acetyl-CoA oder bei Sauerstoffmangel zu Lactat umgesetzt.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), o1 = h.at(c1, 90, 'O'), c2 = h.at(c1, -30), o2 = h.at(c2, 30, 'O'), o3 = h.at(c2, -90, 'OH'); h.bd(c0, c1); h.bd(c1, o1, 2); h.bd(c1, c2); h.bd(c2, o2, 2); h.bd(c2, o3); }) },

    { id: 'toluol', cat: 'Aromaten', name: 'Toluol', alt: 'Methylbenzol', formula: 'C₇H₈', groups: ['Aromatischer Ring', 'Methylgruppe'],
      where: 'Lösungsmittel in Lacken und Klebstoffen und Bestandteil von Benzin.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), me = h.at(r[0], 90); h.bd(r[0], me); }) },
    { id: 'benzoe', cat: 'Aromaten', name: 'Benzoesäure', alt: '', formula: 'C₇H₆O₂', groups: ['Aromatischer Ring', 'Carboxygruppe'],
      where: 'Konservierungsmittel E 210 in sauren Lebensmitteln. Kommt auch natürlich in Preiselbeeren vor.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), c = h.at(r[0], 90), o = h.at(c, 30, 'O'), ho = h.at(c, 150, 'HO'); h.bd(r[0], c); h.bd(c, o, 2); h.bd(c, ho); }) },
    { id: 'anilin', cat: 'Aromaten', name: 'Anilin', alt: 'Aminobenzol', formula: 'C₆H₇N', groups: ['Aromatischer Ring', 'Aminogruppe'],
      where: 'Ausgangsstoff für Farbstoffe, Kunststoffe und viele Arzneistoffe.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), n = h.at(r[0], 90, 'NH₂'); h.bd(r[0], n); }) },
    { id: 'salicyl', cat: 'Aromaten', name: 'Salicylsäure', alt: '2-Hydroxybenzoesäure', formula: 'C₇H₆O₃', groups: ['Aromatischer Ring', 'Carboxygruppe', 'Hydroxygruppe'],
      where: 'In Aknemitteln und Hühneraugenpflastern. Ausgangsstoff von Aspirin, kommt in Weidenrinde vor.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 0, KEK);
        var c = h.at(r[1], 60), o = h.at(c, 120, 'O'), oh = h.at(c, 0, 'OH'); h.bd(r[1], c); h.bd(c, o, 2); h.bd(c, oh);
        var ho = h.at(r[2], 120, 'HO'); h.bd(r[2], ho);
      }) },
    { id: 'naphthalin', cat: 'Aromaten', name: 'Naphthalin', alt: '', formula: 'C₁₀H₈', groups: ['Zwei kondensierte aromatische Ringe'],
      where: 'Der klassische Geruch von Mottenkugeln.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK), cx2 = L * Math.sqrt(3);
        function pt(deg) { var q = deg * Math.PI / 180; return [cx2 + L * Math.cos(q), -L * Math.sin(q)]; }
        var t = pt(90), ur = pt(30), lr = pt(-30), b = pt(-90);
        var a1 = h.add(t[0], t[1]), a2 = h.add(ur[0], ur[1]), a3 = h.add(lr[0], lr[1]), a4 = h.add(b[0], b[1]);
        h.bd(r[5], a1); h.bd(a1, a2, 2, [cx2, 0]); h.bd(a2, a3); h.bd(a3, a4, 2, [cx2, 0]); h.bd(a4, r[4]);
      }) },

    { id: 'ibuprofen', cat: 'Wirkstoffe & Aromastoffe', name: 'Ibuprofen', alt: '2-(4-Isobutylphenyl)propansäure', formula: 'C₁₃H₁₈O₂', groups: ['Carboxygruppe', 'Aromatischer Ring'],
      where: 'Schmerz- und Entzündungshemmer. Wie ASS hemmt es die Cyclooxygenase.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 0, KEK);
        var c1 = h.at(r[3], 210), c2 = h.at(c1, 150), m1 = h.at(c2, 90), m2 = h.at(c2, 210);
        h.bd(r[3], c1); h.bd(c1, c2); h.bd(c2, m1); h.bd(c2, m2);
        var c3 = h.at(r[0], 30), mA = h.at(c3, 90), c4 = h.at(c3, -30), o = h.at(c4, 30, 'O'), oh = h.at(c4, 270, 'OH');
        h.bd(r[0], c3); h.bd(c3, mA); h.bd(c3, c4); h.bd(c4, o, 2); h.bd(c4, oh);
      }) },
    { id: 'nikotin', cat: 'Wirkstoffe & Aromastoffe', name: 'Nikotin', alt: '', formula: 'C₁₀H₁₄N₂', groups: ['Pyridin-Ring', 'Pyrrolidin-Ring', 'Tertiäres Amin'],
      where: 'Wirkstoff der Tabakpflanze. Er bindet an nikotinische Acetylcholin-Rezeptoren.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK, { 3: 'N' });
        var p0 = h.at(r[5], 30); h.bd(r[5], p0);
        var a = h.m.atoms[p0], cx = a.x + RP * Math.cos(Math.PI / 6), cy = a.y - RP * Math.sin(Math.PI / 6);
        var idx = [p0], k, q;
        for (k = 1; k < 5; k++) { q = (210 + 72 * k) * Math.PI / 180; idx.push(h.add(cx + RP * Math.cos(q), cy - RP * Math.sin(q), k === 4 ? 'N' : '')); }
        for (k = 0; k < 5; k++) h.bd(idx[k], idx[(k + 1) % 5]);
        var me = h.at(idx[4], 138); h.bd(idx[4], me);
      }) },
    { id: 'limonen', cat: 'Wirkstoffe & Aromastoffe', name: 'Limonen', alt: '', formula: 'C₁₀H₁₆', groups: ['Ring mit Doppelbindung', 'Terpen'],
      where: 'Duftstoff in Orangen- und Zitronenschalen. Steckt in vielen Reinigern.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 1, 2]);
        var me = h.at(r[0], 90); h.bd(r[0], me);
        var c = h.at(r[3], -90), a = h.at(c, -30), b = h.at(c, 210);
        h.bd(r[3], c); h.bd(c, a, 2); h.bd(c, b);
      }) },
    { id: 'dopamin', cat: 'Wirkstoffe & Aromastoffe', name: 'Dopamin', alt: '', formula: 'C₈H₁₁NO₂', groups: ['Catechol (zwei Hydroxygruppen am Ring)', 'Aminogruppe'],
      where: 'Neurotransmitter im Belohnungssystem. Der Körper stellt ihn aus Tyrosin her.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK);
        var ho = h.at(r[2], 210, 'HO'), oh = h.at(r[3], -90, 'OH'); h.bd(r[2], ho); h.bd(r[3], oh);
        var c1 = h.at(r[0], 90), c2 = h.at(c1, 150), n = h.at(c2, 210, 'H₂N');
        h.bd(r[0], c1); h.bd(c1, c2); h.bd(c2, n);
      }) },

    { id: 'vitc', cat: 'Stoffwechsel & Pflanzen', name: 'Vitamin C', alt: 'Ascorbinsäure', formula: 'C₆H₈O₆', groups: ['Lacton (cyclischer Ester)', 'Enol-Hydroxygruppen', 'Diol-Seitenkette'],
      where: 'Zitrusfrüchte und Paprika. Wirkt als Antioxidans und wird für die Kollagensynthese gebraucht. Stereochemie hier nicht gezeigt.',
      m: mol(function (h) {
        var idx = [], k, q, lab = { 3: 'O' };
        for (k = 0; k < 5; k++) { q = (90 + 72 * k) * Math.PI / 180; idx.push(h.add(RP * Math.cos(q), -RP * Math.sin(q), lab[k])); }
        h.bd(idx[0], idx[1], 2, [0, 0]); h.bd(idx[1], idx[2]); h.bd(idx[2], idx[3]); h.bd(idx[3], idx[4]); h.bd(idx[4], idx[0]);
        var a = h.at(idx[0], 90, 'OH'), b = h.at(idx[1], 162, 'HO'), c = h.at(idx[4], 18, 'O');
        h.bd(idx[0], a); h.bd(idx[1], b); h.bd(idx[4], c, 2);
        var c5 = h.at(idx[2], 240), o5 = h.at(c5, 180, 'HO'), c6 = h.at(c5, 300), o6 = h.at(c6, 0, 'OH');
        h.bd(idx[2], c5); h.bd(c5, o5); h.bd(c5, c6); h.bd(c6, o6);
      }) },
    { id: 'glucose', cat: 'Stoffwechsel & Pflanzen', name: 'Glucose', alt: 'Traubenzucker', formula: 'C₆H₁₂O₆', groups: ['Fünf Hydroxygruppen', 'Ring mit Halbacetal'],
      where: 'Zentraler Energieträger der Zellen und Baustein von Stärke und Cellulose. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, SAT, { 0: 'O' });
        var c6 = h.at(r[1], 150), o6 = h.at(c6, 90, 'OH'); h.bd(r[1], c6); h.bd(c6, o6);
        var a = h.at(r[2], 210, 'HO'), b = h.at(r[3], -90, 'OH'), c = h.at(r[4], -30, 'OH'), d = h.at(r[5], 30, 'OH');
        h.bd(r[2], a); h.bd(r[3], b); h.bd(r[4], c); h.bd(r[5], d);
      }) },

    { id: 'alanin', cat: 'Aminosäuren', name: 'Alanin', alt: '2-Aminopropansäure', formula: 'C₃H₇NO₂', groups: ['Aminogruppe', 'Carboxygruppe', 'Methyl-Seitenkette'],
      where: 'Proteinbaustein. Wichtig im Glucose-Alanin-Zyklus zwischen Muskel und Leber.',
      m: mol(function (h) { var b = aaBase(h), me = h.at(b.c1, -90); h.bd(b.c1, me); }) },
    { id: 'serin', cat: 'Aminosäuren', name: 'Serin', alt: '2-Amino-3-hydroxypropansäure', formula: 'C₃H₇NO₃', groups: ['Aminogruppe', 'Carboxygruppe', 'Hydroxy-Seitenkette'],
      where: 'Proteinbaustein. Seine OH-Gruppe wird in Proteinen oft phosphoryliert.',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, -90), oh = h.at(c3, -90, 'OH'); h.bd(b.c1, c3); h.bd(c3, oh); }) },
    { id: 'cystein', cat: 'Aminosäuren', name: 'Cystein', alt: '2-Amino-3-mercaptopropansäure', formula: 'C₃H₇NO₂S', groups: ['Aminogruppe', 'Carboxygruppe', 'Thiolgruppe (SH)'],
      where: 'Bildet Disulfidbrücken zwischen Proteinketten, zum Beispiel im Keratin der Haare.',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, -90), sh = h.at(c3, -90, 'SH'); h.bd(b.c1, c3); h.bd(c3, sh); }) },
    { id: 'asp', cat: 'Aminosäuren', name: 'Asparaginsäure', alt: 'Aspartat', formula: 'C₄H₇NO₄', groups: ['Aminogruppe', 'Zwei Carboxygruppen'],
      where: 'Saure Aminosäure und Proteinbaustein. Ausgangsstoff des Süßstoffs Aspartam.',
      m: mol(function (h) {
        var b = aaBase(h), c3 = h.at(b.c1, 270), c4 = h.at(c3, 210), o = h.at(c4, 270, 'O'), ho = h.at(c4, 150, 'HO');
        h.bd(b.c1, c3); h.bd(c3, c4); h.bd(c4, o, 2); h.bd(c4, ho);
      }) },
    { id: 'glu', cat: 'Aminosäuren', name: 'Glutaminsäure', alt: 'Glutamat', formula: 'C₅H₉NO₄', groups: ['Aminogruppe', 'Zwei Carboxygruppen'],
      where: 'Als Glutamat der wichtigste erregende Neurotransmitter. Als Würzmittel sorgt es für Umami.',
      m: mol(function (h) {
        var b = aaBase(h), c3 = h.at(b.c1, 270), c4 = h.at(c3, 210), c5 = h.at(c4, 150), o = h.at(c5, 210, 'O'), ho = h.at(c5, 90, 'HO');
        h.bd(b.c1, c3); h.bd(c3, c4); h.bd(c4, c5); h.bd(c5, o, 2); h.bd(c5, ho);
      }) },
    { id: 'phe', cat: 'Aminosäuren', name: 'Phenylalanin', alt: '', formula: 'C₉H₁₁NO₂', groups: ['Aminogruppe', 'Carboxygruppe', 'Aromatische Seitenkette'],
      where: 'Essenzielle Aminosäure und Ausgangsstoff für Tyrosin.',
      m: mol(function (h) {
        var b = aaBase(h), c3 = h.at(b.c1, -90), a = h.m.atoms[c3];
        var r = ring(h, a.x + 2 * L * Math.cos(Math.PI / 6), a.y + L, 150, KEK); h.bd(b.c1, c3); h.bd(c3, r[0]);
      }) },
    { id: 'tyr', cat: 'Aminosäuren', name: 'Tyrosin', alt: '', formula: 'C₉H₁₁NO₃', groups: ['Aminogruppe', 'Carboxygruppe', 'Phenol-Seitenkette'],
      where: 'Vorstufe von Dopamin, Adrenalin und dem Pigment Melanin.',
      m: mol(function (h) {
        var b = aaBase(h), c3 = h.at(b.c1, -90), a = h.m.atoms[c3];
        var r = ring(h, a.x + 2 * L * Math.cos(Math.PI / 6), a.y + L, 150, KEK); h.bd(b.c1, c3); h.bd(c3, r[0]);
        var oh = h.at(r[3], 330, 'OH'); h.bd(r[3], oh);
      }) },

    { id: 'adenin', cat: 'Nucleobasen & Purine', name: 'Adenin', alt: '', formula: 'C₅H₅N₅', groups: ['Purinbase', 'Aminogruppe'],
      where: 'Base in DNA und RNA (paart mit Thymin bzw. Uracil) und Teil von ATP.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [2, 1, 2, 1, 0, 1], { 1: 'N', 3: 'N' });
        var nh = h.at(r[0], 90, 'NH₂'); h.bd(r[0], nh);
        fusedPent(h, r, 'N', 'NH', '78');
      }) },
    { id: 'guanin', cat: 'Nucleobasen & Purine', name: 'Guanin', alt: '', formula: 'C₅H₅N₅O', groups: ['Purinbase', 'Carbonylgruppe', 'Aminogruppe'],
      where: 'Base in DNA und RNA. Es paart mit Cytosin über drei Wasserstoffbrücken.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 2, 1, 0, 1], { 1: 'HN', 3: 'N' });
        var o = h.at(r[0], 90, 'O'); h.bd(r[0], o, 2);
        var nh = h.at(r[2], 210, 'H₂N'); h.bd(r[2], nh);
        fusedPent(h, r, 'N', 'NH', '78');
      }) },
    { id: 'cytosin', cat: 'Nucleobasen & Purine', name: 'Cytosin', alt: '', formula: 'C₄H₅N₃O', groups: ['Pyrimidinbase', 'Aminogruppe', 'Carbonylgruppe'],
      where: 'Base in DNA und RNA. Es paart mit Guanin. Durch Desaminierung entsteht daraus Uracil.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 2, 1, 1, 1, 2], { 2: 'N', 4: 'NH' });
        var nh = h.at(r[1], 150, 'H₂N'); h.bd(r[1], nh);
        var o = h.at(r[3], -90, 'O'); h.bd(r[3], o, 2);
      }) },
    { id: 'uracil', cat: 'Nucleobasen & Purine', name: 'Uracil', alt: '', formula: 'C₄H₄N₂O₂', groups: ['Pyrimidinbase', 'Zwei Carbonylgruppen'],
      where: 'Base der RNA. Sie ersetzt dort das Thymin.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 1, 2], { 2: 'HN', 4: 'NH' });
        var o1 = h.at(r[1], 150, 'O'); h.bd(r[1], o1, 2);
        var o2 = h.at(r[3], -90, 'O'); h.bd(r[3], o2, 2);
      }) },
    { id: 'thymin', cat: 'Nucleobasen & Purine', name: 'Thymin', alt: '5-Methyluracil', formula: 'C₅H₆N₂O₂', groups: ['Pyrimidinbase', 'Zwei Carbonylgruppen', 'Methylgruppe'],
      where: 'Base der DNA. Sie paart mit Adenin über zwei Wasserstoffbrücken und ist Uracil mit zusätzlicher Methylgruppe.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 1, 2], { 2: 'HN', 4: 'NH' });
        var o1 = h.at(r[1], 150, 'O'); h.bd(r[1], o1, 2);
        var o2 = h.at(r[3], -90, 'O'); h.bd(r[3], o2, 2);
        var me = h.at(r[0], 90); h.bd(r[0], me);
      }) },
    { id: 'harnsaeure', cat: 'Nucleobasen & Purine', name: 'Harnsäure', alt: '', formula: 'C₅H₄N₄O₃', groups: ['Purin-Gerüst', 'Drei Carbonylgruppen'],
      where: 'Endprodukt des Purinabbaus beim Menschen. Zu viel davon im Blut kann Gicht auslösen.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 0, 1], { 1: 'HN', 3: 'NH' });
        var o6 = h.at(r[0], 90, 'O'); h.bd(r[0], o6, 2);
        var o2 = h.at(r[2], 210, 'O'); h.bd(r[2], o2, 2);
        var p = fusedPent(h, r, 'NH', 'NH', 'none');
        var o8 = h.at(p.c8, 0, 'O'); h.bd(p.c8, o8, 2);
      }) },

    { id: 'ethen', cat: 'Stoffwechsel & Pflanzen', name: 'Ethen', alt: 'Ethylen', formula: 'C₂H₄', groups: ['C=C-Doppelbindung'],
      where: 'Pflanzenhormon, das Früchte reifen lässt. Bananen und Äpfel geben es ab.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30); h.bd(c0, c1, 2); }) },
    { id: 'isopren', cat: 'Stoffwechsel & Pflanzen', name: 'Isopren', alt: '2-Methylbuta-1,3-dien', formula: 'C₅H₈', groups: ['Zwei Doppelbindungen (Dien)'],
      where: 'Baueinheit der Terpene und Steroide. Auch Kautschuk besteht aus Isopren-Einheiten.',
      m: mol(function (h) {
        var c0 = h.add(0, 0), c1 = h.at(c0, 30), me = h.at(c1, 90), c2 = h.at(c1, -30), c3 = h.at(c2, 30);
        h.bd(c0, c1, 2); h.bd(c1, me); h.bd(c1, c2); h.bd(c2, c3, 2);
      }) },
    { id: 'auxin', cat: 'Stoffwechsel & Pflanzen', name: 'Indol-3-essigsäure', alt: 'IAA, Auxin', formula: 'C₁₀H₉NO₂', groups: ['Indol-Gerüst', 'Carboxygruppe'],
      where: 'Das wichtigste Pflanzenwachstumshormon. Es steuert Streckungswachstum und Phototropismus.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK);
        var a = h.m.atoms, p4 = a[r[4]], p5 = a[r[5]];
        var pcx = (p4.x + p5.x) / 2 + AP, pcy = (p4.y + p5.y) / 2, ctr = [pcx, pcy];
        function pv(deg, l) { var q = deg * Math.PI / 180; return h.add(pcx + RP * Math.cos(q), pcy - RP * Math.sin(q), l); }
        var c3 = pv(72), c2 = pv(0), n1 = pv(-72, 'NH');
        h.bd(r[5], c3); h.bd(c3, c2, 2, ctr); h.bd(c2, n1); h.bd(n1, r[4]);
        var ch2 = h.at(c3, 72), cb = h.at(ch2, 12), o = h.at(cb, 72, 'O'), oh = h.at(cb, -48, 'OH');
        h.bd(c3, ch2); h.bd(ch2, cb); h.bd(cb, o, 2); h.bd(cb, oh);
      }) },

    /* ---- Aminosäuren (Rest der 20 proteinogenen) ---- */
    { id: 'valin', cat: 'Aminosäuren', name: 'Valin', alt: '2-Amino-3-methylbutansäure', formula: 'C₅H₁₁NO₂', groups: ['Aminogruppe', 'Carboxygruppe', 'Verzweigte Seitenkette'],
      where: 'Essenzielle Aminosäure mit unpolarer, verzweigter Seitenkette. Bei der Sichelzellanämie ersetzt sie im Hämoglobin die Glutaminsäure an Position 6.',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, -90), m1 = h.at(c3, 210), m2 = h.at(c3, -30); h.bd(b.c1, c3); h.bd(c3, m1); h.bd(c3, m2); }) },
    { id: 'leucin', cat: 'Aminosäuren', name: 'Leucin', alt: '2-Amino-4-methylpentansäure', formula: 'C₆H₁₃NO₂', groups: ['Aminogruppe', 'Carboxygruppe', 'Verzweigte Seitenkette'],
      where: 'Essenzielle Aminosäure und besonders häufig in Proteinen. Leucin-Zipper sind Motive, mit denen sich DNA-bindende Proteine zusammenlagern.',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, -90), c4 = h.at(c3, -30), m1 = h.at(c4, 30), m2 = h.at(c4, -90); h.bd(b.c1, c3); h.bd(c3, c4); h.bd(c4, m1); h.bd(c4, m2); }) },
    { id: 'isoleucin', cat: 'Aminosäuren', name: 'Isoleucin', alt: '2-Amino-3-methylpentansäure', formula: 'C₆H₁₃NO₂', groups: ['Aminogruppe', 'Carboxygruppe', 'Verzweigte Seitenkette'],
      where: 'Essenzielle Aminosäure und Isomer des Leucins. Mit Valin und Leucin zählt sie zu den verzweigtkettigen Aminosäuren (BCAA).',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, -90), me = h.at(c3, 210), c4 = h.at(c3, -30), c5 = h.at(c4, 30); h.bd(b.c1, c3); h.bd(c3, me); h.bd(c3, c4); h.bd(c4, c5); }) },
    { id: 'methionin', cat: 'Aminosäuren', name: 'Methionin', alt: '2-Amino-4-(methylthio)butansäure', formula: 'C₅H₁₁NO₂S', groups: ['Aminogruppe', 'Carboxygruppe', 'Thioether'],
      where: 'Essenzielle, schwefelhaltige Aminosäure. Sie ist die Start-Aminosäure der Proteinbiosynthese (Startcodon AUG).',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, -90), c4 = h.at(c3, -30), s = h.at(c4, -90, 'S'), me = h.at(s, -30); h.bd(b.c1, c3); h.bd(c3, c4); h.bd(c4, s); h.bd(s, me); }) },
    { id: 'prolin', cat: 'Aminosäuren', name: 'Prolin', alt: 'Pyrrolidin-2-carbonsäure', formula: 'C₅H₉NO₂', groups: ['Sekundäres Amin im Ring', 'Carboxygruppe'],
      where: 'Die Aminogruppe ist Teil eines Rings. Prolin knickt Peptidketten ab und ist besonders häufig im Kollagen.',
      m: mol(function (h) {
        var P = pentAt(h, 0, 0, 0, { 1: 'NH' }); pbond(h, P);
        var cc = h.at(P.idx[0], 0), o = h.at(cc, 60, 'O'), o2 = h.at(cc, -60, 'OH');
        h.bd(P.idx[0], cc); h.bd(cc, o, 2); h.bd(cc, o2);
      }) },
    { id: 'threonin', cat: 'Aminosäuren', name: 'Threonin', alt: '2-Amino-3-hydroxybutansäure', formula: 'C₄H₉NO₃', groups: ['Aminogruppe', 'Carboxygruppe', 'Hydroxy-Seitenkette'],
      where: 'Essenzielle Aminosäure. Wie Serin kann ihre OH-Gruppe in Proteinen phosphoryliert werden.',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, -90), o = h.at(c3, 210, 'HO'), me = h.at(c3, -30); h.bd(b.c1, c3); h.bd(c3, o); h.bd(c3, me); }) },
    { id: 'asn', cat: 'Aminosäuren', name: 'Asparagin', alt: '2,4-Diamino-4-oxobutansäure', formula: 'C₄H₈N₂O₃', groups: ['Aminogruppe', 'Carboxygruppe', 'Amid-Seitenkette'],
      where: 'Amid der Asparaginsäure. An ihrer Seitenkette werden in Proteinen Zuckerreste angehängt (N-Glykosylierung).',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, 270), c4 = h.at(c3, 210), o = h.at(c4, 270, 'O'), n = h.at(c4, 150, 'H₂N'); h.bd(b.c1, c3); h.bd(c3, c4); h.bd(c4, o, 2); h.bd(c4, n); }) },
    { id: 'gln', cat: 'Aminosäuren', name: 'Glutamin', alt: '2,5-Diamino-5-oxopentansäure', formula: 'C₅H₁₀N₂O₃', groups: ['Aminogruppe', 'Carboxygruppe', 'Amid-Seitenkette'],
      where: 'Häufigste freie Aminosäure im Blut. Als Amid der Glutaminsäure dient sie im Stoffwechsel als Stickstoffspeicher.',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, 270), c4 = h.at(c3, 210), c5 = h.at(c4, 150), o = h.at(c5, 90, 'O'), n = h.at(c5, 210, 'H₂N'); h.bd(b.c1, c3); h.bd(c3, c4); h.bd(c4, c5); h.bd(c5, o, 2); h.bd(c5, n); }) },
    { id: 'lysin', cat: 'Aminosäuren', name: 'Lysin', alt: '2,6-Diaminohexansäure', formula: 'C₆H₁₄N₂O₂', groups: ['Zwei Aminogruppen', 'Carboxygruppe'],
      where: 'Essenzielle Aminosäure mit basischer Seitenkette. In Histonen wird sie acetyliert und methyliert und steuert so die Genaktivität.',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, -90), c4 = h.at(c3, -30), c5 = h.at(c4, -90), c6 = h.at(c5, -30), n = h.at(c6, -90, 'NH₂'); h.bd(b.c1, c3); h.bd(c3, c4); h.bd(c4, c5); h.bd(c5, c6); h.bd(c6, n); }) },
    { id: 'arginin', cat: 'Aminosäuren', name: 'Arginin', alt: '2-Amino-5-guanidinopentansäure', formula: 'C₆H₁₄N₄O₂', groups: ['Guanidinogruppe', 'Aminogruppe', 'Carboxygruppe'],
      where: 'Basische Aminosäure und Teil des Harnstoffzyklus. Aus ihr entsteht das Signalmolekül Stickstoffmonoxid (NO).',
      m: mol(function (h) {
        var b = aaBase(h), c3 = h.at(b.c1, -90), c4 = h.at(c3, -30), c5 = h.at(c4, 30), c6 = h.at(c5, -30), n1 = h.at(c6, 30, 'HN'), cg = h.at(n1, -30), n2 = h.at(cg, -90, 'NH₂'), n3 = h.at(cg, 30, 'NH');
        h.bd(b.c1, c3); h.bd(c3, c4); h.bd(c4, c5); h.bd(c5, c6); h.bd(c6, n1); h.bd(n1, cg); h.bd(cg, n2); h.bd(cg, n3, 2);
      }) },
    { id: 'histidin', cat: 'Aminosäuren', name: 'Histidin', alt: '2-Amino-3-(imidazol-4-yl)propansäure', formula: 'C₆H₉N₃O₂', groups: ['Imidazolring', 'Aminogruppe', 'Carboxygruppe'],
      where: 'Der Imidazolring puffert nahe dem neutralen pH und sitzt in vielen aktiven Zentren von Enzymen. Aus Histidin entsteht Histamin.',
      m: mol(function (h) { var b = aaBase(h), c3 = h.at(b.c1, -90), a = h.at(c3, -30); h.bd(b.c1, c3); h.bd(c3, a); imidazole(h, a, -30); }) },
    { id: 'trp', cat: 'Aminosäuren', name: 'Tryptophan', alt: '2-Amino-3-(indol-3-yl)propansäure', formula: 'C₁₁H₁₂N₂O₂', groups: ['Indol-Ring', 'Aminogruppe', 'Carboxygruppe'],
      where: 'Essenzielle Aminosäure mit der größten Seitenkette. Aus ihr entstehen Serotonin und Melatonin.',
      m: mol(function (h) {
        var x = indole(h), ch2 = h.at(x.c3, 72), ca = h.at(ch2, 12), nn = h.at(ca, -48, 'NH₂'), cc = h.at(ca, 72), o1 = h.at(cc, 132, 'O'), o2 = h.at(cc, 12, 'OH');
        h.bd(x.c3, ch2); h.bd(ch2, ca); h.bd(ca, nn); h.bd(ca, cc); h.bd(cc, o1, 2); h.bd(cc, o2);
      }) },

    /* ---- Zucker & Nucleotide ---- */
    { id: 'ribose', cat: 'Zucker & Nucleotide', name: 'Ribose', alt: 'D-Ribose (Ringform)', formula: 'C₅H₁₀O₅', groups: ['Fünfring (Furanose)', 'Hydroxygruppen'],
      where: 'Zucker im Rückgrat der RNA und in ATP. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var P = pentAt(h, 0, 0, 90, { 0: 'O' }), i = P.idx; pbond(h, P);
        oh(h, i[4], 18); oh(h, i[3], 306); oh(h, i[2], 234);
        var c5 = h.at(i[1], 162); h.bd(i[1], c5); oh(h, c5, 102);
      }) },
    { id: 'desoxyribose', cat: 'Zucker & Nucleotide', name: 'Desoxyribose', alt: '2-Desoxy-D-ribose', formula: 'C₅H₁₀O₄', groups: ['Fünfring (Furanose)', 'Hydroxygruppen'],
      where: 'Zucker im Rückgrat der DNA. Im Vergleich zur Ribose fehlt die OH-Gruppe am C2. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var P = pentAt(h, 0, 0, 90, { 0: 'O' }), i = P.idx; pbond(h, P);
        oh(h, i[4], 18); oh(h, i[2], 234);
        var c5 = h.at(i[1], 162); h.bd(i[1], c5); oh(h, c5, 102);
      }) },
    { id: 'fructose', cat: 'Zucker & Nucleotide', name: 'Fructose', alt: 'Fruchtzucker', formula: 'C₆H₁₂O₆', groups: ['Fünfring (Furanose)', 'Hydroxygruppen', 'Keto-Zucker'],
      where: 'In Obst und Honig. Mit Glucose bildet sie den Haushaltszucker Saccharose. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var P = pentAt(h, 0, 0, 90, { 0: 'O' }), i = P.idx; pbond(h, P);
        var c1 = h.at(i[4], 60); h.bd(i[4], c1); oh(h, c1, 0); oh(h, i[4], -20);
        oh(h, i[3], 306); oh(h, i[2], 234);
        var c6 = h.at(i[1], 162); h.bd(i[1], c6); oh(h, c6, 102);
      }) },
    { id: 'adenosin', cat: 'Zucker & Nucleotide', name: 'Adenosin', alt: 'Adenin + Ribose', formula: 'C₁₀H₁₃N₅O₄', groups: ['Nucleosid', 'Purinbase', 'Ribose'],
      where: 'Die Base Adenin, über N9 mit Ribose verbunden. Koffein blockiert die Adenosin-Rezeptoren im Gehirn.',
      m: mol(function (h) { var c5 = adenosinCore(h); oh(h, c5, 24); }) },
    { id: 'atp', cat: 'Zucker & Nucleotide', name: 'ATP', alt: 'Adenosintriphosphat', formula: 'C₁₀H₁₆N₅O₁₃P₃', groups: ['Nucleotid', 'Drei Phosphatgruppen', 'Ribose', 'Adenin'],
      where: 'Universeller Energieträger der Zelle. Beim Abspalten der letzten Phosphatgruppe wird Energie frei. Ladungen sind hier nicht gezeigt.',
      m: mol(function (h) {
        var c5 = adenosinCore(h), o5 = h.at(c5, 24, 'O'), prev = o5, k, pa, ob, o1, q1;
        h.bd(c5, o5);
        for (k = 0; k < 3; k++) {
          pa = h.at(prev, -30, 'P'); h.bd(prev, pa);
          o1 = h.at(pa, 90, 'O'); h.bd(pa, o1, 2);
          q1 = h.at(pa, 270, 'OH'); h.bd(pa, q1);
          if (k < 2) { ob = h.at(pa, 30, 'O'); h.bd(pa, ob); prev = ob; }
          else { var q2 = h.at(pa, 30, 'OH'); h.bd(pa, q2); }
        }
      }) },

    /* ---- Steroide & Botenstoffe ---- */
    { id: 'cholesterin', cat: 'Steroide & Botenstoffe', name: 'Cholesterin', alt: 'Cholesterol', formula: 'C₂₇H₄₆O', groups: ['Steroidgerüst (vier Ringe)', 'Hydroxygruppe', 'C=C-Doppelbindung'],
      where: 'Baustein tierischer Zellmembranen und Ausgangsstoff der Steroidhormone, Gallensäuren und von Vitamin D. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var a = steroid(h, ['c5-c6']), o = h.at(a.c3, 210, 'HO'); h.bd(a.c3, o);
        var m19 = h.at(a.c10, 90); h.bd(a.c10, m19);
        var m18 = h.at(a.c13, 90); h.bd(a.c13, m18);
        var c20 = h.at(a.c17, 72); h.bd(a.c17, c20);
        var c21 = h.at(c20, 132); h.bd(c20, c21);
        var c22 = h.at(c20, 12); h.bd(c20, c22);
        var c23 = h.at(c22, 72); h.bd(c22, c23);
        var c24 = h.at(c23, 12); h.bd(c23, c24);
        var c25 = h.at(c24, 72); h.bd(c24, c25);
        var c26 = h.at(c25, 132); h.bd(c25, c26);
        var c27 = h.at(c25, 12); h.bd(c25, c27);
      }) },
    { id: 'estradiol', cat: 'Steroide & Botenstoffe', name: 'Östradiol', alt: 'Estradiol', formula: 'C₁₈H₂₄O₂', groups: ['Steroidgerüst', 'Aromatischer A-Ring (Phenol)', 'Zwei Hydroxygruppen'],
      where: 'Das wichtigste Östrogen und weibliches Sexualhormon. Der aromatische A-Ring unterscheidet es von Testosteron. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var a = steroid(h, ['c1-c2', 'c3-c4', 'c5-c10']), o = h.at(a.c3, 210, 'HO'); h.bd(a.c3, o);
        var m18 = h.at(a.c13, 90); h.bd(a.c13, m18);
        var o17 = h.at(a.c17, 72, 'OH'); h.bd(a.c17, o17);
      }) },
    { id: 'testosteron', cat: 'Steroide & Botenstoffe', name: 'Testosteron', alt: '', formula: 'C₁₉H₂₈O₂', groups: ['Steroidgerüst', 'Keton (Enon)', 'Hydroxygruppe'],
      where: 'Das wichtigste männliche Sexualhormon (Androgen). Es wird aus Cholesterin gebildet. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var a = steroid(h, ['c4-c5']), o = h.at(a.c3, 210, 'O'); h.bd(a.c3, o, 2);
        var m19 = h.at(a.c10, 90); h.bd(a.c10, m19);
        var m18 = h.at(a.c13, 90); h.bd(a.c13, m18);
        var o17 = h.at(a.c17, 72, 'OH'); h.bd(a.c17, o17);
      }) },
    { id: 'gaba', cat: 'Steroide & Botenstoffe', name: 'GABA', alt: 'γ-Aminobuttersäure, 4-Aminobutansäure', formula: 'C₄H₉NO₂', groups: ['Aminogruppe', 'Carboxygruppe'],
      where: 'Wichtigster hemmender Neurotransmitter im Gehirn. Er entsteht aus Glutamat durch Abspaltung der Carboxygruppe.',
      m: mol(function (h) {
        var n = h.add(0, 0, 'H₂N'), ca = h.at(n, -30), cb = h.at(ca, 30), cc = h.at(cb, -30), cd = h.at(cc, 30), o = h.at(cd, 90, 'O'), o2 = h.at(cd, -30, 'OH');
        h.bd(n, ca); h.bd(ca, cb); h.bd(cb, cc); h.bd(cc, cd); h.bd(cd, o, 2); h.bd(cd, o2);
      }) },
    { id: 'serotonin', cat: 'Steroide & Botenstoffe', name: 'Serotonin', alt: '5-Hydroxytryptamin (5-HT)', formula: 'C₁₀H₁₂N₂O', groups: ['Indol-Ring', 'Hydroxygruppe', 'Aminogruppe'],
      where: 'Neurotransmitter und Gewebehormon, beeinflusst unter anderem Stimmung und Darmbewegung. Es wird aus Tryptophan gebildet.',
      m: mol(function (h) {
        var x = indole(h); oh(h, x.r[1], 150);
        var ch2 = h.at(x.c3, 72), cb = h.at(ch2, 12), nn = h.at(cb, -48, 'NH₂');
        h.bd(x.c3, ch2); h.bd(ch2, cb); h.bd(cb, nn);
      }) },
    { id: 'adrenalin', cat: 'Steroide & Botenstoffe', name: 'Adrenalin', alt: 'Epinephrin', formula: 'C₉H₁₃NO₃', groups: ['Catechol', 'Sekundäres Amin', 'Hydroxygruppe'],
      where: 'Stresshormon aus dem Nebennierenmark. Es entsteht aus Tyrosin über Dopamin und Noradrenalin.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK);
        var ho = h.at(r[2], 210, 'HO'), o2 = h.at(r[3], -90, 'OH'); h.bd(r[2], ho); h.bd(r[3], o2);
        var c1 = h.at(r[0], 90), ohc = h.at(c1, 30, 'OH'), c2 = h.at(c1, 150), n = h.at(c2, 210, 'HN'), me = h.at(n, 150);
        h.bd(r[0], c1); h.bd(c1, ohc); h.bd(c1, c2); h.bd(c2, n); h.bd(n, me);
      }) },
    { id: 'histamin', cat: 'Steroide & Botenstoffe', name: 'Histamin', alt: '', formula: 'C₅H₉N₃', groups: ['Imidazolring', 'Aminogruppe'],
      where: 'Gewebehormon bei Allergien und Entzündungen. Es entsteht aus Histidin durch Abspaltung von CO₂. Antihistaminika blockieren seine Rezeptoren.',
      m: mol(function (h) {
        var n = h.add(0, 0, 'H₂N'), ca = h.at(n, -30), cb = h.at(ca, 30), a = h.at(cb, -30);
        h.bd(n, ca); h.bd(ca, cb); h.bd(cb, a); imidazole(h, a, -30);
      }) },

    /* ---- Vitamin ---- */
    { id: 'nicotinamid', cat: 'Stoffwechsel & Pflanzen', name: 'Nicotinamid', alt: 'Niacinamid, Vitamin B3', formula: 'C₆H₆N₂O', groups: ['Pyridin-Ring', 'Amid'],
      where: 'Vitamin B3. Es ist Baustein der Coenzyme NAD und NADP, die in Stoffwechselreaktionen Elektronen übertragen.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK, { 2: 'N' });
        var c = h.at(r[0], 90), o = h.at(c, 30, 'O'), n = h.at(c, 150, 'H₂N');
        h.bd(r[0], c); h.bd(c, o, 2); h.bd(c, n);
      }) },

    /* ---- Kleine Moleküle ---- */
    { id: 'wasser', cat: 'Kleine Moleküle', name: 'Wasser', alt: '', formula: 'H₂O', groups: ['Polares Molekül', 'Gewinkelt (104,5°)'],
      where: 'Das Lösungsmittel des Lebens. Wasserstoffbrücken zwischen den Molekülen sorgen für den hohen Siedepunkt und die Oberflächenspannung.',
      m: mol(function (h) { var o = h.add(0, 0, 'O'), a = h.at(o, 217.75, 'H'), b = h.at(o, 322.25, 'H'); h.bd(o, a); h.bd(o, b); }) },
    { id: 'co2', cat: 'Kleine Moleküle', name: 'Kohlenstoffdioxid', alt: 'CO₂', formula: 'CO₂', groups: ['Zwei C=O-Doppelbindungen', 'Linear, unpolar'],
      where: 'Entsteht bei der Zellatmung und steckt im Sprudelwasser. Pflanzen binden es bei der Fotosynthese im Calvin-Zyklus.',
      m: mol(function (h) { var o1 = h.add(0, 0, 'O'), c = h.at(o1, 0, 'C'), o2 = h.at(c, 0, 'O'); h.bd(o1, c, 2); h.bd(c, o2, 2); }) },
    { id: 'ammoniak', cat: 'Kleine Moleküle', name: 'Ammoniak', alt: '', formula: 'NH₃', groups: ['Pyramidal gebaut', 'Basisch'],
      where: 'Zellgift, das die Leber zu Harnstoff entgiftet. Im Haushalt steckt es als Salmiakgeist in manchen Reinigern.',
      m: mol(function (h) { var n = h.add(0, 0, 'N'), a = h.at(n, 270, 'H'), b = h.at(n, 30, 'H'), c = h.at(n, 150, 'H'); h.bd(n, a); h.bd(n, b); h.bd(n, c); }) },
    { id: 'methan', cat: 'Kleine Moleküle', name: 'Methan', alt: '', formula: 'CH₄', groups: ['Tetraedrisch', 'Kohlenwasserstoff'],
      where: 'Hauptbestandteil von Erdgas und ein starkes Treibhausgas. Es entsteht auch bei der Verdauung von Wiederkäuern.',
      m: mol(function (h) { var c = h.add(0, 0, 'C'), a = h.at(c, 45, 'H'), b = h.at(c, 135, 'H'), d = h.at(c, 225, 'H'), e = h.at(c, 315, 'H'); h.bd(c, a); h.bd(c, b); h.bd(c, d); h.bd(c, e); }) },
    { id: 'h2o2', cat: 'Kleine Moleküle', name: 'Wasserstoffperoxid', alt: 'H₂O₂', formula: 'H₂O₂', groups: ['Peroxidbindung (O–O)'],
      where: 'Bleich- und Desinfektionsmittel. In Zellen entsteht es als Nebenprodukt und wird von der Katalase zu Wasser und Sauerstoff abgebaut.',
      m: mol(function (h) { var a = h.add(0, 0, 'H'), o1 = h.at(a, -30, 'O'), o2 = h.at(o1, 30, 'O'), b = h.at(o2, -30, 'H'); h.bd(a, o1); h.bd(o1, o2); h.bd(o2, b); }) },
    { id: 'phosphorsaeure', cat: 'Kleine Moleküle', name: 'Phosphorsäure', alt: 'H₃PO₄', formula: 'H₃PO₄', groups: ['Phosphatgruppe', 'Drei OH-Gruppen'],
      where: 'In Cola als Säuerungsmittel. Ihre Derivate bilden das Rückgrat von DNA und RNA und stecken in ATP.',
      m: mol(function (h) { var p = h.add(0, 0, 'P'), o = h.at(p, 90, 'O'), a = h.at(p, 180, 'HO'), b = h.at(p, 0, 'OH'), c = h.at(p, 270, 'OH'); h.bd(p, o, 2); h.bd(p, a); h.bd(p, b); h.bd(p, c); }) },

    /* ================= Erweiterung auf 150 Karten (2026-11-12, zweite Runde) ================= */

    /* ---- Alkohole & Carbonyle ---- */
    { id: 'methanol', cat: 'Alkohole & Carbonyle', name: 'Methanol', alt: 'Methylalkohol', formula: 'CH₄O', groups: ['Hydroxygruppe (primärer Alkohol)'],
      where: 'Der einfachste Alkohol, zum Beispiel als Vergällungsmittel in Brennspiritus und in Scheibenreiniger. Schon kleine Mengen sind giftig, weil der Körper daraus Formaldehyd und Ameisensäure macht.',
      m: mol(function (h) { var c = h.add(0, 0), o = h.at(c, 30, 'OH'); h.bd(c, o); }) },
    { id: 'butanol', cat: 'Alkohole & Carbonyle', name: '1-Butanol', alt: 'Butan-1-ol', formula: 'C₄H₁₀O', groups: ['Hydroxygruppe (primärer Alkohol)'],
      where: 'Lösungsmittel in Lacken und Farben. In winzigen Mengen steckt es im Fuselöl, das bei der alkoholischen Gärung entsteht.',
      m: mol(function (h) { var c0 = h.add(0, 0), z = zig(h, c0, 3, 30), o = h.at(z[2], -30, 'OH'); h.bd(z[2], o); }) },
    { id: 'formaldehyd', cat: 'Alkohole & Carbonyle', name: 'Formaldehyd', alt: 'Methanal', formula: 'CH₂O', groups: ['Aldehyd'],
      where: 'In wässriger Lösung (Formalin) als Konservierungsmittel für Präparate. Es vernetzt Aminogruppen von Proteinen, deshalb "fixiert" es Gewebe. Entsteht auch beim Abbau von Methanol.',
      m: mol(function (h) { var c = h.add(0, 0, 'C'), a = h.at(c, 150, 'H'), b = h.at(c, 210, 'H'), o = h.at(c, 0, 'O'); h.bd(c, a); h.bd(c, b); h.bd(c, o, 2); }) },
    { id: 'benzaldehyd', cat: 'Alkohole & Carbonyle', name: 'Benzaldehyd', alt: '', formula: 'C₇H₆O', groups: ['Aromatischer Ring', 'Aldehyd'],
      where: 'Das Bittermandelaroma. Es steckt in Marzipan, Persipan und in Bittermandeln und Aprikosenkernen.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), c = h.at(r[0], 90), o = h.at(c, 30, 'O'); h.bd(r[0], c); h.bd(c, o, 2); }) },
    { id: 'diethylether', cat: 'Alkohole & Carbonyle', name: 'Diethylether', alt: 'Ethoxyethan', formula: 'C₄H₁₀O', groups: ['Ether'],
      where: 'Früher das klassische Narkosemittel. Heute vor allem Lösungsmittel im Labor und Startspray für Motoren. Er ist extrem leicht entzündlich.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), o = h.at(c1, -30, 'O'), c2 = h.at(o, 30), c3 = h.at(c2, -30); h.bd(c0, c1); h.bd(c1, o); h.bd(o, c2); h.bd(c2, c3); }) },
    { id: 'dihydroxyaceton', cat: 'Alkohole & Carbonyle', name: 'Dihydroxyaceton', alt: '1,3-Dihydroxypropan-2-on', formula: 'C₃H₆O₃', groups: ['Keton', 'Zwei Hydroxygruppen'],
      where: 'Wirkstoff in Selbstbräunern, er reagiert mit Aminosäuren der obersten Hautschicht. Als Phosphat ist es ein Zwischenprodukt der Glykolyse.',
      m: mol(function (h) { var o0 = h.add(0, 0, 'HO'), c0 = h.at(o0, -30), c1 = h.at(c0, 30), o1 = h.at(c1, 90, 'O'), c2 = h.at(c1, -30), o2 = h.at(c2, 30, 'OH'); h.bd(o0, c0); h.bd(c0, c1); h.bd(c1, o1, 2); h.bd(c1, c2); h.bd(c2, o2); }) },
    { id: 'glycerinaldehyd', cat: 'Alkohole & Carbonyle', name: 'Glycerinaldehyd', alt: '2,3-Dihydroxypropanal', formula: 'C₃H₆O₃', groups: ['Aldehyd', 'Zwei Hydroxygruppen'],
      where: 'Der einfachste Zucker (eine Triose). Als Glycerinaldehyd-3-phosphat ist er ein zentrales Zwischenprodukt der Glykolyse und des Calvin-Zyklus.',
      m: mol(function (h) { var o0 = h.add(0, 0, 'HO'), c0 = h.at(o0, -30), c1 = h.at(c0, 30), c2 = h.at(c1, -30), o1 = h.at(c1, 90, 'OH'), o2 = h.at(c2, 90, 'O'); h.bd(o0, c0); h.bd(c0, c1); h.bd(c1, c2); h.bd(c1, o1); h.bd(c2, o2, 2); }) },

    /* ---- Säuren & Ester ---- */
    { id: 'propionsaeure', cat: 'Säuren & Ester', name: 'Propionsäure', alt: 'Propansäure', formula: 'C₃H₆O₂', groups: ['Carboxygruppe'],
      where: 'Konservierungsstoff E280 gegen Schimmel in Brot und Backwaren. Propionsäurebakterien geben dem Emmentaler seinen Geschmack und seine Löcher.',
      m: mol(function (h) { var c0 = h.add(0, 0), z = zig(h, c0, 2, -30); cooh(h, z[1], 30); }) },
    { id: 'bernstein', cat: 'Säuren & Ester', name: 'Bernsteinsäure', alt: 'Butandisäure (Succinat)', formula: 'C₄H₆O₄', groups: ['Zwei Carboxygruppen'],
      where: 'Zwischenprodukt des Citratzyklus (als Succinat). Ihren Namen hat sie vom Bernstein, aus dem man sie früher gewann.',
      m: mol(function (h) { var c0 = h.add(0, 0); cooStart(h, c0, -30); var z = zig(h, c0, 3, -30); cooh(h, z[2], -30); }) },
    { id: 'fumarsaeure', cat: 'Säuren & Ester', name: 'Fumarsäure', alt: 'trans-Butendisäure (Fumarat)', formula: 'C₄H₄O₄', groups: ['Zwei Carboxygruppen', 'trans-C=C-Doppelbindung'],
      where: 'Zwischenprodukt des Citratzyklus und Säuerungsmittel E297. Ihr cis-Isomer heißt Maleinsäure.',
      m: mol(function (h) { var c0 = h.add(0, 0); cooStart(h, c0, -30); var z = zig(h, c0, 3, -30, [1, 2, 1]); cooh(h, z[2], -30); }) },
    { id: 'malat', cat: 'Säuren & Ester', name: 'Äpfelsäure', alt: 'Hydroxybutandisäure (Malat)', formula: 'C₄H₆O₅', groups: ['Zwei Carboxygruppen', 'Hydroxygruppe'],
      where: 'Gibt unreifen Äpfeln und Stachelbeeren den sauren Geschmack (Säuerungsmittel E296). Als Malat Teil des Citratzyklus.',
      m: mol(function (h) { var c0 = h.add(0, 0); cooStart(h, c0, -30); var z = zig(h, c0, 3, -30); oh(h, z[0], 270); cooh(h, z[2], -30); }) },
    { id: 'weinsaeure', cat: 'Säuren & Ester', name: 'Weinsäure', alt: '2,3-Dihydroxybutandisäure', formula: 'C₄H₆O₆', groups: ['Zwei Carboxygruppen', 'Zwei Hydroxygruppen'],
      where: 'In Trauben und Wein, ihr Salz fällt als Weinstein aus. Sie steckt im Weinsteinbackpulver.',
      m: mol(function (h) { var c0 = h.add(0, 0); cooStart(h, c0, -30); var z = zig(h, c0, 3, -30); oh(h, z[0], 270); oh(h, z[1], 90); cooh(h, z[2], -30); }) },
    { id: 'oxalacetat', cat: 'Säuren & Ester', name: 'Oxalessigsäure', alt: 'Oxobutandisäure (Oxalacetat)', formula: 'C₄H₄O₅', groups: ['Zwei Carboxygruppen', 'Ketogruppe'],
      where: 'Im Citratzyklus nimmt sie Acetyl-CoA auf und bildet Citrat. Sie ist auch Ausgangspunkt der Gluconeogenese.',
      m: mol(function (h) { var c0 = h.add(0, 0); cooStart(h, c0, -30); var z = zig(h, c0, 3, -30), o = h.at(z[0], 270, 'O'); h.bd(z[0], o, 2); cooh(h, z[2], -30); }) },
    { id: 'ketoglutarat', cat: 'Säuren & Ester', name: 'α-Ketoglutarsäure', alt: '2-Oxopentandisäure (α-Ketoglutarat)', formula: 'C₅H₆O₅', groups: ['Zwei Carboxygruppen', 'Ketogruppe'],
      where: 'Zwischenprodukt des Citratzyklus. Durch Transaminierung wird daraus die Aminosäure Glutamat.',
      m: mol(function (h) { var c0 = h.add(0, 0); cooStart(h, c0, -30); var z = zig(h, c0, 4, -30), o = h.at(z[0], 270, 'O'); h.bd(z[0], o, 2); cooh(h, z[3], 30); }) },
    { id: 'palmitin', cat: 'Säuren & Ester', name: 'Palmitinsäure', alt: 'Hexadecansäure', formula: 'C₁₆H₃₂O₂', groups: ['Carboxygruppe', 'Gesättigte Fettsäure (C16)'],
      where: 'Die häufigste gesättigte Fettsäure. Sie steckt in Palmöl, Butter und Fleisch, und der Körper baut sie selbst aus Acetyl-CoA auf.',
      m: mol(function (h) {
        var c = h.add(0, 0), prev = c, steps = [30, -30, 30, -30, 30, -30, 30, 90, 150, 210, 150, 210, 150, 210, 150], k, i;
        for (k = 0; k < steps.length; k++) { i = h.at(prev, steps[k]); h.bd(prev, i); prev = i; }
        var o = h.at(prev, 90, 'O'), q = h.at(prev, 210, 'HO'); h.bd(prev, o, 2); h.bd(prev, q);
      }) },
    { id: 'oelsaeure', cat: 'Säuren & Ester', name: 'Ölsäure', alt: 'cis-9-Octadecensäure', formula: 'C₁₈H₃₄O₂', groups: ['Carboxygruppe', 'cis-C=C-Doppelbindung', 'Einfach ungesättigte Fettsäure (C18)'],
      where: 'Hauptfettsäure im Olivenöl. Die cis-Doppelbindung knickt die Kette, deshalb ist Olivenöl bei Zimmertemperatur flüssig.',
      m: mol(function (h) {
        var c = h.add(0, 0), prev = c, steps = [30, -30, 30, -30, 30, -30, 30, -30, 30, 90, 150, 210, 150, 210, 150, 210, 150], k, i;
        cooStart(h, c, 30);
        for (k = 0; k < steps.length; k++) { i = h.at(prev, steps[k]); h.bd(prev, i, k === 8 ? 2 : 1); prev = i; }
      }) },
    { id: 'methylsalicylat', cat: 'Säuren & Ester', name: 'Methylsalicylat', alt: 'Salicylsäuremethylester', formula: 'C₈H₈O₃', groups: ['Aromatischer Ring', 'Ester', 'Hydroxygruppe'],
      where: 'Wintergrünöl, bekannt aus Rheumasalben und Kaugummi-Aroma. Im Körper wird es zu Salicylsäure gespalten, der Muttersubstanz von Aspirin.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK), ho = h.at(r[1], 150, 'HO'); h.bd(r[1], ho);
        var c = h.at(r[0], 90), o1 = h.at(c, 150, 'O'), o2 = h.at(c, 30, 'O'), me = h.at(o2, -30);
        h.bd(r[0], c); h.bd(c, o1, 2); h.bd(c, o2); h.bd(o2, me);
      }) },
    { id: 'kohlensaeure', cat: 'Säuren & Ester', name: 'Kohlensäure', alt: 'H₂CO₃', formula: 'H₂CO₃', groups: ['Carbonylgruppe', 'Zwei Hydroxygruppen'],
      where: 'Entsteht, wenn sich CO₂ in Wasser löst, etwa im Sprudelwasser. Im Blut puffert das Paar Kohlensäure und Hydrogencarbonat den pH-Wert.',
      m: mol(function (h) { var c = h.add(0, 0), o = h.at(c, 90, 'O'), a = h.at(c, 210, 'HO'), b = h.at(c, 330, 'OH'); h.bd(c, o, 2); h.bd(c, a); h.bd(c, b); }) },

    /* ---- Aromaten ---- */
    { id: 'styrol', cat: 'Aromaten', name: 'Styrol', alt: 'Vinylbenzol', formula: 'C₈H₈', groups: ['Aromatischer Ring', 'Vinylgruppe'],
      where: 'Ausgangsstoff von Polystyrol: Styropor-Verpackungen, Joghurtbecher und CD-Hüllen.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), c1 = h.at(r[0], 90), c2 = h.at(c1, 30); h.bd(r[0], c1); h.bd(c1, c2, 2); }) },
    { id: 'pyridin', cat: 'Aromaten', name: 'Pyridin', alt: '', formula: 'C₅H₅N', groups: ['Aromatischer Sechsring mit Stickstoff'],
      where: 'Stechend riechendes Lösungsmittel. Sein Ringgerüst steckt in Nicotinamid (Vitamin B3), Nicotin und Vitamin B6.',
      m: mol(function (h) { ring(h, 0, 0, 90, KEK, { 0: 'N' }); }) },
    { id: 'furan', cat: 'Aromaten', name: 'Furan', alt: '', formula: 'C₄H₄O', groups: ['Aromatischer Fünfring mit Sauerstoff'],
      where: 'Entsteht beim Rösten von Kaffee und Backen von Brot. Der Fünfring ist das Grundgerüst der Furanosen, etwa von Ribose und Fructose.',
      m: mol(function (h) { var P = pentAt(h, 0, 0, 90, { 0: 'O' }), i = P.idx; h.bd(i[0], i[1]); h.bd(i[1], i[2], 2, P.c); h.bd(i[2], i[3]); h.bd(i[3], i[4], 2, P.c); h.bd(i[4], i[0]); }) },
    { id: 'pyrrol', cat: 'Aromaten', name: 'Pyrrol', alt: '', formula: 'C₄H₅N', groups: ['Aromatischer Fünfring mit Stickstoff'],
      where: 'Vier Pyrrolringe bilden das Porphyrin-Gerüst von Häm im Hämoglobin und von Chlorophyll in Pflanzen.',
      m: mol(function (h) { var P = pentAt(h, 0, 0, 90, { 0: 'NH' }), i = P.idx; h.bd(i[0], i[1]); h.bd(i[1], i[2], 2, P.c); h.bd(i[2], i[3]); h.bd(i[3], i[4], 2, P.c); h.bd(i[4], i[0]); }) },
    { id: 'hydrochinon', cat: 'Aromaten', name: 'Hydrochinon', alt: 'Benzol-1,4-diol', formula: 'C₆H₆O₂', groups: ['Aromatischer Ring', 'Zwei Hydroxygruppen (para)'],
      where: 'Entwickler in der klassischen Fotografie und früher in Aufhellungscremes für die Haut. Es lässt sich leicht zu Chinon oxidieren.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), a = h.at(r[0], 90, 'OH'), b = h.at(r[3], 270, 'OH'); h.bd(r[0], a); h.bd(r[3], b); }) },
    { id: 'brenzcatechin', cat: 'Aromaten', name: 'Brenzcatechin', alt: 'Catechol, Benzol-1,2-diol', formula: 'C₆H₆O₂', groups: ['Aromatischer Ring', 'Zwei Hydroxygruppen (ortho)'],
      where: 'Das Catechol-Gerüst steckt in Dopamin, Adrenalin und in den Gerbstoffen von Tee und Wein. Catechole färben sich an der Luft braun, wie ein angeschnittener Apfel.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), a = h.at(r[2], 210, 'HO'), b = h.at(r[3], 270, 'OH'); h.bd(r[2], a); h.bd(r[3], b); }) },
    { id: 'paba', cat: 'Aromaten', name: 'p-Aminobenzoesäure', alt: 'PABA, 4-Aminobenzoesäure', formula: 'C₇H₇NO₂', groups: ['Aromatischer Ring', 'Aminogruppe', 'Carboxygruppe'],
      where: 'Bakterien brauchen sie zur Herstellung von Folsäure. Sulfonamid-Antibiotika blockieren genau diesen Schritt. Früher war sie ein UV-Filter in Sonnencreme.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), n = h.at(r[0], 90, 'NH₂'), c = h.at(r[3], 270), o = h.at(c, 210, 'O'), q = h.at(c, 330, 'OH'); h.bd(r[0], n); h.bd(r[3], c); h.bd(c, o, 2); h.bd(c, q); }) },
    { id: 'benzylalkohol', cat: 'Aromaten', name: 'Benzylalkohol', alt: 'Phenylmethanol', formula: 'C₇H₈O', groups: ['Aromatischer Ring', 'Hydroxygruppe (primärer Alkohol)'],
      where: 'Konservierungsmittel in Kosmetika und Medikamenten, Duftstoff (Jasmin) und Lösungsmittel.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), c = h.at(r[0], 90), o = h.at(c, 30, 'OH'); h.bd(r[0], c); h.bd(c, o); }) },

    /* ---- Nucleobasen & Purine ---- */
    { id: 'theobromin', cat: 'Nucleobasen & Purine', name: 'Theobromin', alt: '3,7-Dimethylxanthin', formula: 'C₇H₈N₄O₂', groups: ['Purin-Gerüst', 'Amid-Gruppen', 'Zwei Methylgruppen'],
      where: 'Der Wirkstoff in Kakao und Schokolade, milder als Koffein. Hunde bauen es sehr langsam ab, deshalb ist Schokolade für sie giftig.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 0, 1], { 1: 'HN', 3: 'N' });
        var p = fusedPent(h, r, 'N', 'N', '89');
        var o6 = h.at(r[0], 90, 'O'); h.bd(r[0], o6, 2);
        var o2 = h.at(r[2], 210, 'O'); h.bd(r[2], o2, 2);
        var me3 = h.at(r[3], 270); h.bd(r[3], me3);
        var me7 = h.at(p.n7, 72); h.bd(p.n7, me7);
      }) },
    { id: 'theophyllin', cat: 'Nucleobasen & Purine', name: 'Theophyllin', alt: '1,3-Dimethylxanthin', formula: 'C₇H₈N₄O₂', groups: ['Purin-Gerüst', 'Amid-Gruppen', 'Zwei Methylgruppen'],
      where: 'In Spuren im Tee. Als Medikament erweitert es die Bronchien und wird bei Asthma und COPD eingesetzt.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 0, 1], { 1: 'N', 3: 'N' });
        fusedPent(h, r, 'NH', 'N', '89');
        var o6 = h.at(r[0], 90, 'O'); h.bd(r[0], o6, 2);
        var me1 = h.at(r[1], 150); h.bd(r[1], me1);
        var o2 = h.at(r[2], 210, 'O'); h.bd(r[2], o2, 2);
        var me3 = h.at(r[3], 270); h.bd(r[3], me3);
      }) },
    { id: 'xanthin', cat: 'Nucleobasen & Purine', name: 'Xanthin', alt: '', formula: 'C₅H₄N₄O₂', groups: ['Purin-Gerüst', 'Zwei Carbonylgruppen'],
      where: 'Zwischenstufe beim Abbau der Purine: Hypoxanthin wird zu Xanthin und dann zu Harnsäure. Koffein, Theobromin und Theophyllin sind methylierte Xanthine.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 0, 1], { 1: 'HN', 3: 'NH' });
        fusedPent(h, r, 'NH', 'N', '89');
        var o6 = h.at(r[0], 90, 'O'); h.bd(r[0], o6, 2);
        var o2 = h.at(r[2], 210, 'O'); h.bd(r[2], o2, 2);
      }) },
    { id: 'hypoxanthin', cat: 'Nucleobasen & Purine', name: 'Hypoxanthin', alt: '', formula: 'C₅H₄N₄O', groups: ['Purin-Gerüst', 'Carbonylgruppe'],
      where: 'Entsteht beim Abbau von Adenin und kommt in tRNA-Molekülen als Nucleosid Inosin vor. Die Xanthinoxidase macht daraus Xanthin.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 2, 1, 0, 1], { 1: 'HN', 3: 'N' });
        var o = h.at(r[0], 90, 'O'); h.bd(r[0], o, 2);
        fusedPent(h, r, 'N', 'NH', '78');
      }) },

    /* ---- Wirkstoffe & Aromastoffe ---- */
    { id: 'thymol', cat: 'Wirkstoffe & Aromastoffe', name: 'Thymol', alt: '2-Isopropyl-5-methylphenol', formula: 'C₁₀H₁₄O', groups: ['Aromatischer Ring', 'Hydroxygruppe (Phenol)', 'Isopropylgruppe'],
      where: 'Der Hauptaromastoff von Thymian. Er wirkt antiseptisch und steckt in Mundwässern und Hustensäften.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK), ho = h.at(r[1], 150, 'HO'); h.bd(r[1], ho);
        var c = h.at(r[0], 90), a = h.at(c, 30), b = h.at(c, 150); h.bd(r[0], c); h.bd(c, a); h.bd(c, b);
        var me = h.at(r[3], 270); h.bd(r[3], me);
      }) },
    { id: 'eugenol', cat: 'Wirkstoffe & Aromastoffe', name: 'Eugenol', alt: '4-Allyl-2-methoxyphenol', formula: 'C₁₀H₁₂O₂', groups: ['Aromatischer Ring', 'Phenol', 'Methoxygruppe', 'Allylgruppe'],
      where: 'Der typische Duft von Nelken. Er riecht nach Zahnarztpraxis, denn er steckt in Füllungsmaterialien und wirkt leicht betäubend.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK), ho = h.at(r[2], 210, 'HO'); h.bd(r[2], ho);
        var o = h.at(r[1], 150, 'O'), me = h.at(o, 90); h.bd(r[1], o); h.bd(o, me);
        var c1 = h.at(r[5], 30), c2 = h.at(c1, -30), c3 = h.at(c2, 30); h.bd(r[5], c1); h.bd(c1, c2); h.bd(c2, c3, 2);
      }) },
    { id: 'zimtaldehyd', cat: 'Wirkstoffe & Aromastoffe', name: 'Zimtaldehyd', alt: '3-Phenylprop-2-enal', formula: 'C₉H₈O', groups: ['Aromatischer Ring', 'C=C-Doppelbindung', 'Aldehyd'],
      where: 'Der Hauptaromastoff von Zimt, gewonnen aus der Rinde des Zimtbaums.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, KEK), c1 = h.at(r[0], 90), c2 = h.at(c1, 30), c3 = h.at(c2, -30), o = h.at(c3, 30, 'O'); h.bd(r[0], c1); h.bd(c1, c2, 2); h.bd(c2, c3); h.bd(c3, o, 2); }) },
    { id: 'carvon', cat: 'Wirkstoffe & Aromastoffe', name: 'Carvon', alt: '', formula: 'C₁₀H₁₄O', groups: ['Ring mit Keton', 'Zwei C=C-Doppelbindungen', 'Terpen'],
      where: 'Das eine Spiegelbild riecht nach Kümmel, das andere nach Minze. Hier ein schönes Beispiel, dass Stereochemie den Geruch bestimmt. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 2, 1]);
        var o = h.at(r[0], 90, 'O'); h.bd(r[0], o, 2);
        var me = h.at(r[5], 30); h.bd(r[5], me);
        var c = h.at(r[2], 210), a = h.at(c, 150), b = h.at(c, 270); h.bd(r[2], c); h.bd(c, a, 2); h.bd(c, b);
      }) },
    { id: 'linalool', cat: 'Wirkstoffe & Aromastoffe', name: 'Linalool', alt: '3,7-Dimethylocta-1,6-dien-3-ol', formula: 'C₁₀H₁₈O', groups: ['Hydroxygruppe (tertiärer Alkohol)', 'Zwei C=C-Doppelbindungen', 'Terpen'],
      where: 'Blumiger Duft von Lavendel, Koriander und Orangenblüten. Er steckt in vielen Parfums, Seifen und Waschmitteln und muss auf Kosmetika als Allergen deklariert werden.',
      m: mol(function (h) {
        var c1 = h.add(0, 0), c2 = h.at(c1, -30), c3 = h.at(c2, 30);
        h.bd(c1, c2, 2); h.bd(c2, c3);
        oh(h, c3, 90); var me = h.at(c3, 270); h.bd(c3, me);
        var c4 = h.at(c3, -30), c5 = h.at(c4, 30), c6 = h.at(c5, -30), c7 = h.at(c6, 30);
        h.bd(c3, c4); h.bd(c4, c5); h.bd(c5, c6); h.bd(c6, c7, 2);
        var m1 = h.at(c7, 90), m2 = h.at(c7, -30); h.bd(c7, m1); h.bd(c7, m2);
      }) },
    { id: 'geraniol', cat: 'Wirkstoffe & Aromastoffe', name: 'Geraniol', alt: '(E)-3,7-Dimethylocta-2,6-dien-1-ol', formula: 'C₁₀H₁₈O', groups: ['Hydroxygruppe (primärer Alkohol)', 'Zwei C=C-Doppelbindungen', 'Terpen'],
      where: 'Der Rosenduft. Er steckt in Rosen- und Geranienöl, in Parfums und Seifen und bildet sich auch in der Duftdrüse der Honigbiene.',
      m: mol(function (h) {
        var o = h.add(0, 0, 'HO'), c1 = h.at(o, -30), c2 = h.at(c1, 30), c3 = h.at(c2, -30), c4 = h.at(c3, 30), c5 = h.at(c4, -30), c6 = h.at(c5, 30), c7 = h.at(c6, -30), c8 = h.at(c7, 30);
        h.bd(o, c1); h.bd(c1, c2); h.bd(c2, c3, 2); h.bd(c3, c4); h.bd(c4, c5); h.bd(c5, c6); h.bd(c6, c7, 2); h.bd(c7, c8);
        var m3 = h.at(c3, 270), m7 = h.at(c7, 270); h.bd(c3, m3); h.bd(c7, m7);
      }) },
    { id: 'citral', cat: 'Wirkstoffe & Aromastoffe', name: 'Citral', alt: 'Geranial', formula: 'C₁₀H₁₆O', groups: ['Aldehyd', 'Zwei C=C-Doppelbindungen', 'Terpen'],
      where: 'Der Zitronenduft in Zitronengras und Zitronenschalen. Er ist Aromastoff in Limonaden, Süßigkeiten und Putzmitteln.',
      m: mol(function (h) {
        var o = h.add(0, 0, 'O'), c1 = h.at(o, -30), c2 = h.at(c1, 30), c3 = h.at(c2, -30), c4 = h.at(c3, 30), c5 = h.at(c4, -30), c6 = h.at(c5, 30), c7 = h.at(c6, -30), c8 = h.at(c7, 30);
        h.bd(o, c1, 2); h.bd(c1, c2); h.bd(c2, c3, 2); h.bd(c3, c4); h.bd(c4, c5); h.bd(c5, c6); h.bd(c6, c7, 2); h.bd(c7, c8);
        var m3 = h.at(c3, 270), m7 = h.at(c7, 270); h.bd(c3, m3); h.bd(c7, m7);
      }) },
    { id: 'capsaicin', cat: 'Wirkstoffe & Aromastoffe', name: 'Capsaicin', alt: '', formula: 'C₁₈H₂₇NO₃', groups: ['Aromatischer Ring', 'Amid', 'Phenol und Methoxygruppe', 'C=C-Doppelbindung'],
      where: 'Der scharfe Stoff in Chili. Er aktiviert den Hitze- und Schmerzrezeptor TRPV1, deshalb fühlt sich Schärfe heiß an. Wärmepflaster enthalten ihn ebenfalls.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK), ho = h.at(r[2], 210, 'HO'); h.bd(r[2], ho);
        var o = h.at(r[1], 150, 'O'), me = h.at(o, 90); h.bd(r[1], o); h.bd(o, me);
        var c1 = h.at(r[5], 30), n = h.at(c1, -30, 'NH'), c = h.at(n, 30), oc = h.at(c, 90, 'O');
        h.bd(r[5], c1); h.bd(c1, n); h.bd(n, c); h.bd(c, oc, 2);
        var z = zig(h, c, 6, -30, [1, 1, 1, 1, 1, 2]);
        var last = z[5], c8 = h.at(last, -30);
        h.bd(last, c8);
        var m1 = h.at(c8, 30), m2 = h.at(c8, 270); h.bd(c8, m1); h.bd(c8, m2);
      }) },

    /* ---- Stoffwechsel & Pflanzen ---- */
    { id: 'taurin', cat: 'Stoffwechsel & Pflanzen', name: 'Taurin', alt: '2-Aminoethansulfonsäure', formula: 'C₂H₇NO₃S', groups: ['Aminogruppe', 'Sulfonsäuregruppe'],
      where: 'In Energydrinks und in der Galle, wo es mit Gallensäuren zu Taurocholsäure verbunden wird. Es ist keine proteinogene Aminosäure.',
      m: mol(function (h) {
        var n = h.add(0, 0, 'H₂N'), c1 = h.at(n, -30), c2 = h.at(c1, 30), s = h.at(c2, -30, 'S');
        h.bd(n, c1); h.bd(c1, c2); h.bd(c2, s);
        var o1 = h.at(s, 90, 'O'), o2 = h.at(s, 270, 'O'), o3 = h.at(s, 0, 'OH'); h.bd(s, o1, 2); h.bd(s, o2, 2); h.bd(s, o3);
      }) },
    { id: 'kreatin', cat: 'Stoffwechsel & Pflanzen', name: 'Kreatin', alt: 'N-Methylguanidinoessigsäure', formula: 'C₄H₉N₃O₂', groups: ['Guanidinogruppe', 'Carboxygruppe'],
      where: 'Energiespeicher im Muskel als Kreatinphosphat und beliebtes Nahrungsergänzungsmittel im Kraftsport. Beim Abbau entsteht Kreatinin, ein Nierenwert im Blut.',
      m: mol(function (h) {
        var c = h.add(0, 0), n1 = h.at(c, 150, 'H₂N'), n2 = h.at(c, 270, 'NH'), n3 = h.at(c, 30, 'N');
        h.bd(c, n1); h.bd(c, n2, 2); h.bd(c, n3);
        var me = h.at(n3, 90), c4 = h.at(n3, -30), c5 = h.at(c4, 30);
        h.bd(n3, me); h.bd(n3, c4); h.bd(c4, c5); cooh(h, c5, 30);
      }) },
    { id: 'carnitin', cat: 'Stoffwechsel & Pflanzen', name: 'Carnitin', alt: '3-Hydroxy-4-trimethylammoniobutanoat', formula: 'C₇H₁₅NO₃', groups: ['Quartäres Ammonium', 'Hydroxygruppe', 'Carboxygruppe'],
      where: 'Transportiert Fettsäuren in die Mitochondrien, wo sie abgebaut werden. Es kommt vor allem in Fleisch vor. Ladungen sind hier nicht gezeigt.',
      m: mol(function (h) {
        var n = quatN(h), c1 = h.at(n, 0), c2 = h.at(c1, -30);
        h.bd(n, c1); h.bd(c1, c2); oh(h, c2, 270);
        var c3 = h.at(c2, 30), c4 = h.at(c3, -30); h.bd(c2, c3); h.bd(c3, c4); cooh(h, c4, -30);
      }) },
    { id: 'retinol', cat: 'Stoffwechsel & Pflanzen', name: 'Retinol', alt: 'Vitamin A', formula: 'C₂₀H₃₀O', groups: ['Ring mit Doppelbindung', 'Konjugierte Polyenkette', 'Hydroxygruppe'],
      where: 'Vitamin A aus Leber, Milch und Eigelb. Aus β-Carotin der Karotten bildet der Körper es selbst. Der Sehfarbstoff Rhodopsin enthält Retinal, das aus Retinol entsteht.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 1, 2]);
        var me5 = h.at(r[0], 90); h.bd(r[0], me5);
        var g1 = h.at(r[4], 300), g2 = h.at(r[4], 0); h.bd(r[4], g1); h.bd(r[4], g2);
        var c7 = h.at(r[5], 30), c8 = h.at(c7, -30), c9 = h.at(c8, 30), c10 = h.at(c9, -30), c11 = h.at(c10, 30), c12 = h.at(c11, -30), c13 = h.at(c12, 30), c14 = h.at(c13, -30), c15 = h.at(c14, 30);
        h.bd(r[5], c7); h.bd(c7, c8, 2); h.bd(c8, c9); h.bd(c9, c10, 2); h.bd(c10, c11); h.bd(c11, c12, 2); h.bd(c12, c13); h.bd(c13, c14, 2); h.bd(c14, c15);
        var m9 = h.at(c9, 90), m13 = h.at(c13, 90); h.bd(c9, m9); h.bd(c13, m13);
        var o = h.at(c15, -30, 'OH'); h.bd(c15, o);
      }) },
    { id: 'pep', cat: 'Stoffwechsel & Pflanzen', name: 'Phosphoenolpyruvat', alt: 'PEP', formula: 'C₃H₅O₆P', groups: ['Enolphosphat', 'Carboxygruppe', 'C=C-Doppelbindung'],
      where: 'Zwischenprodukt der Glykolyse mit sehr energiereicher Phosphatbindung. In der letzten Glykolysereaktion überträgt die Pyruvatkinase die Phosphatgruppe auf ADP und bildet ATP.',
      m: mol(function (h) {
        var c2 = h.add(0, 0), c1 = h.at(c2, 90); h.bd(c2, c1, 2);
        var c3 = h.at(c2, -30), o3 = h.at(c3, 270, 'O'), q3 = h.at(c3, 30, 'OH'); h.bd(c2, c3); h.bd(c3, o3, 2); h.bd(c3, q3);
        var o = h.at(c2, 210, 'O'), p = h.at(o, 150, 'P'); h.bd(c2, o); h.bd(o, p);
        var po = h.at(p, 90, 'O'), pa = h.at(p, 180, 'HO'), pb = h.at(p, 270, 'OH'); h.bd(p, po, 2); h.bd(p, pa); h.bd(p, pb);
      }) },
    { id: 'hydroxybutyrat', cat: 'Stoffwechsel & Pflanzen', name: 'β-Hydroxybutyrat', alt: '3-Hydroxybuttersäure', formula: 'C₄H₈O₃', groups: ['Hydroxygruppe', 'Carboxygruppe'],
      where: 'Ein Ketonkörper. Die Leber bildet ihn beim Fasten, bei Low-Carb-Ernährung und bei Diabetes. Das Gehirn kann ihn dann als Energiequelle nutzen.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, -30), c2 = h.at(c1, 30), c3 = h.at(c2, -30); h.bd(c0, c1); h.bd(c1, c2); h.bd(c2, c3); oh(h, c1, 270); cooh(h, c3, -30); }) },

    /* ---- Zucker & Nucleotide ---- */
    { id: 'sorbit', cat: 'Zucker & Nucleotide', name: 'Sorbit', alt: 'Sorbitol, D-Glucitol', formula: 'C₆H₁₄O₆', groups: ['Sechs Hydroxygruppen', 'Zuckeralkohol'],
      where: 'Zuckeraustauschstoff E420 in zuckerfreien Kaugummis und Bonbons. Er kommt natürlich in Äpfeln, Birnen und Pflaumen vor. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var o0 = h.add(0, 0, 'HO'), c1 = h.at(o0, -30), c2 = h.at(c1, 30), c3 = h.at(c2, -30), c4 = h.at(c3, 30), c5 = h.at(c4, -30), c6 = h.at(c5, 30), o7 = h.at(c6, -30, 'OH');
        h.bd(o0, c1); h.bd(c1, c2); h.bd(c2, c3); h.bd(c3, c4); h.bd(c4, c5); h.bd(c5, c6); h.bd(c6, o7);
        oh(h, c2, 90); oh(h, c3, 270); oh(h, c4, 90); oh(h, c5, 270);
      }) },
    { id: 'xylit', cat: 'Zucker & Nucleotide', name: 'Xylit', alt: 'Birkenzucker', formula: 'C₅H₁₂O₅', groups: ['Fünf Hydroxygruppen', 'Zuckeralkohol'],
      where: 'Zuckeraustauschstoff E967, bekannt als Birkenzucker, in Zahnpflegekaugummis. Für Hunde ist er giftig. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var o0 = h.add(0, 0, 'HO'), c1 = h.at(o0, -30), c2 = h.at(c1, 30), c3 = h.at(c2, -30), c4 = h.at(c3, 30), c5 = h.at(c4, -30), o6 = h.at(c5, 30, 'OH');
        h.bd(o0, c1); h.bd(c1, c2); h.bd(c2, c3); h.bd(c3, c4); h.bd(c4, c5); h.bd(c5, o6);
        oh(h, c2, 90); oh(h, c3, 270); oh(h, c4, 90);
      }) },
    { id: 'inosit', cat: 'Zucker & Nucleotide', name: 'Inositol', alt: 'myo-Inositol, Cyclohexanhexol', formula: 'C₆H₁₂O₆', groups: ['Sechsring', 'Sechs Hydroxygruppen'],
      where: 'Baustein der Phosphoinositide in Zellmembranen. Das daraus abgespaltene IP₃ ist ein wichtiger Botenstoff, der Calcium aus dem ER freisetzt. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) { var r = ring(h, 0, 0, 90, SAT), k; for (k = 0; k < 6; k++) oh(h, r[k], 90 + 60 * k); }) },
    { id: 'glucosamin', cat: 'Zucker & Nucleotide', name: 'Glucosamin', alt: '2-Amino-2-desoxyglucose', formula: 'C₆H₁₃NO₅', groups: ['Aminogruppe', 'Hydroxygruppen', 'Ring mit Halbacetal'],
      where: 'Baustein von Chitin in Insektenpanzern und Pilzzellwänden und von Knorpelbestandteilen. Es ist auch ein beliebtes Nahrungsergänzungsmittel für die Gelenke. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, SAT, { 0: 'O' });
        var c6 = h.at(r[1], 150), o6 = h.at(c6, 90, 'OH'); h.bd(r[1], c6); h.bd(c6, o6);
        var a = h.at(r[2], 210, 'HO'), b = h.at(r[3], -90, 'OH'), c = h.at(r[4], -30, 'NH₂'), d = h.at(r[5], 30, 'OH');
        h.bd(r[2], a); h.bd(r[3], b); h.bd(r[4], c); h.bd(r[5], d);
      }) },
    { id: 'amp', cat: 'Zucker & Nucleotide', name: 'AMP', alt: 'Adenosinmonophosphat', formula: 'C₁₀H₁₄N₅O₇P', groups: ['Nucleotid', 'Eine Phosphatgruppe', 'Ribose', 'Adenin'],
      where: 'Baustein der RNA und Abbauprodukt von ATP. Ein hoher AMP-Spiegel zeigt Energiemangel an und aktiviert die AMP-Kinase. Ladungen sind hier nicht gezeigt.',
      m: mol(function (h) { var c5 = adenosinCore(h); phos(h, c5, 1); }) },
    { id: 'adp', cat: 'Zucker & Nucleotide', name: 'ADP', alt: 'Adenosindiphosphat', formula: 'C₁₀H₁₅N₅O₁₀P₂', groups: ['Nucleotid', 'Zwei Phosphatgruppen', 'Ribose', 'Adenin'],
      where: 'Entsteht, wenn ATP eine Phosphatgruppe abgibt. In den Mitochondrien wird es durch die ATP-Synthase wieder zu ATP aufgeladen. Ladungen sind hier nicht gezeigt.',
      m: mol(function (h) { var c5 = adenosinCore(h); phos(h, c5, 2); }) },
    { id: 'uridin', cat: 'Zucker & Nucleotide', name: 'Uridin', alt: 'Uracil + Ribose', formula: 'C₉H₁₂N₂O₆', groups: ['Nucleosid', 'Pyrimidinbase', 'Ribose'],
      where: 'Nucleosid der RNA. Als UDP-Glucose liefert es aktivierte Glucose für den Aufbau von Glykogen. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 1, 1, 1, 1, 2], { 2: 'HN', 4: 'N' });
        var o1 = h.at(r[1], 150, 'O'); h.bd(r[1], o1, 2);
        var o2 = h.at(r[3], 270, 'O'); h.bd(r[3], o2, 2);
        nucleoside(h, r[4]);
      }) },
    { id: 'cytidin', cat: 'Zucker & Nucleotide', name: 'Cytidin', alt: 'Cytosin + Ribose', formula: 'C₉H₁₃N₃O₅', groups: ['Nucleosid', 'Pyrimidinbase', 'Ribose'],
      where: 'Nucleosid der RNA. Das Gegenstück in der DNA ist Desoxycytidin. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, [1, 2, 1, 1, 1, 2], { 2: 'N', 4: 'N' });
        var nh = h.at(r[1], 150, 'H₂N'); h.bd(r[1], nh);
        var o = h.at(r[3], 270, 'O'); h.bd(r[3], o, 2);
        nucleoside(h, r[4]);
      }) },
    { id: 'saccharose', cat: 'Zucker & Nucleotide', name: 'Saccharose', alt: 'Haushaltszucker, Rohrzucker', formula: 'C₁₂H₂₂O₁₁', groups: ['Disaccharid', 'Glucose + Fructose', 'Glykosidische Bindung'],
      where: 'Der normale Haushaltszucker aus Zuckerrübe und Zuckerrohr. Pflanzen transportieren ihre Fotosyntheseprodukte als Saccharose durch das Phloem. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, SAT, { 0: 'O' });
        var c6 = h.at(r[1], 150), o6 = h.at(c6, 90, 'OH'); h.bd(r[1], c6); h.bd(c6, o6);
        var a = h.at(r[2], 210, 'HO'), b = h.at(r[3], -90, 'OH'), c = h.at(r[4], -30, 'OH');
        h.bd(r[2], a); h.bd(r[3], b); h.bd(r[4], c);
        var og = h.at(r[5], 30, 'O'); h.bd(r[5], og);
        var c2 = h.at(og, -30); h.bd(og, c2);
        var F = pentFrom(h, c2, 0, { 4: 'O' }); pbond(h, F);
        var c1f = h.at(c2, 100); h.bd(c2, c1f); oh(h, c1f, 90);
        oh(h, F.idx[1], outDir(h, F, 1)); oh(h, F.idx[2], outDir(h, F, 2));
        var f6 = h.at(F.idx[3], outDir(h, F, 3)); h.bd(F.idx[3], f6); oh(h, f6, 330);
      }) },

    /* ---- Steroide & Botenstoffe ---- */
    { id: 'progesteron', cat: 'Steroide & Botenstoffe', name: 'Progesteron', alt: 'Gelbkörperhormon', formula: 'C₂₁H₃₀O₂', groups: ['Steroidgerüst', 'Zwei Ketogruppen', 'C=C-Doppelbindung'],
      where: 'Hormon des Zyklus und der Schwangerschaft, gebildet im Gelbkörper und in der Plazenta. Es ist Vorstufe von Cortisol und Testosteron. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var a = steroid(h, ['c4-c5']), o = h.at(a.c3, 210, 'O'); h.bd(a.c3, o, 2);
        var m19 = h.at(a.c10, 90); h.bd(a.c10, m19);
        var m18 = h.at(a.c13, 90); h.bd(a.c13, m18);
        var c20 = h.at(a.c17, 72), o20 = h.at(c20, 132, 'O'), c21 = h.at(c20, 12);
        h.bd(a.c17, c20); h.bd(c20, o20, 2); h.bd(c20, c21);
      }) },
    { id: 'cortisol', cat: 'Steroide & Botenstoffe', name: 'Cortisol', alt: 'Hydrocortison', formula: 'C₂₁H₃₀O₅', groups: ['Steroidgerüst', 'Ketogruppen', 'Drei Hydroxygruppen'],
      where: 'Das Stresshormon der Nebennierenrinde, wirkt entzündungshemmend und hebt den Blutzucker. Cortison-Salben sind davon abgeleitet. Die Stereochemie ist hier nicht gezeigt.',
      m: mol(function (h) {
        var a = steroid(h, ['c4-c5']), o = h.at(a.c3, 210, 'O'); h.bd(a.c3, o, 2);
        var m19 = h.at(a.c10, 90); h.bd(a.c10, m19);
        var m18 = h.at(a.c13, 90); h.bd(a.c13, m18);
        oh(h, a.c11, 150);
        oh(h, a.c17, 40);
        var c20 = h.at(a.c17, 100), o20 = h.at(c20, 150, 'O'), c21 = h.at(c20, 40);
        h.bd(a.c17, c20); h.bd(c20, o20, 2); h.bd(c20, c21); oh(h, c21, 90);
      }) },
    { id: 'acetylcholin', cat: 'Steroide & Botenstoffe', name: 'Acetylcholin', alt: '', formula: 'C₇H₁₆NO₂⁺', groups: ['Quartäres Ammonium', 'Ester'],
      where: 'Neurotransmitter an der Verbindung von Nerv und Muskel. Botulinumtoxin (Botox) verhindert seine Freisetzung und lähmt dadurch den Muskel. Die Ladung ist hier nicht gezeigt.',
      m: mol(function (h) {
        var n = quatN(h), c1 = h.at(n, 0), c2 = h.at(c1, -30), o = h.at(c2, 30, 'O'), c3 = h.at(o, -30), oc = h.at(c3, 270, 'O'), me = h.at(c3, 30);
        h.bd(n, c1); h.bd(c1, c2); h.bd(c2, o); h.bd(o, c3); h.bd(c3, oc, 2); h.bd(c3, me);
      }) },
    { id: 'cholin', cat: 'Steroide & Botenstoffe', name: 'Cholin', alt: '', formula: 'C₅H₁₄NO⁺', groups: ['Quartäres Ammonium', 'Hydroxygruppe'],
      where: 'In Eigelb und Leber enthalten. Baustein von Lecithin (Phosphatidylcholin) in Zellmembranen und von Acetylcholin. Die Ladung ist hier nicht gezeigt.',
      m: mol(function (h) { var n = quatN(h), c1 = h.at(n, 0), c2 = h.at(c1, -30); h.bd(n, c1); h.bd(c1, c2); oh(h, c2, 30); }) },
    { id: 'noradrenalin', cat: 'Steroide & Botenstoffe', name: 'Noradrenalin', alt: 'Norepinephrin', formula: 'C₈H₁₁NO₃', groups: ['Catechol', 'Primäres Amin', 'Hydroxygruppe'],
      where: 'Neurotransmitter des Sympathikus und Stresshormon. Es entsteht aus Dopamin und wird zu Adrenalin methyliert.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK);
        var ho = h.at(r[2], 210, 'HO'), o2 = h.at(r[3], -90, 'OH'); h.bd(r[2], ho); h.bd(r[3], o2);
        var c1 = h.at(r[0], 90), ohc = h.at(c1, 30, 'OH'), c2 = h.at(c1, 150), n = h.at(c2, 210, 'H₂N');
        h.bd(r[0], c1); h.bd(c1, ohc); h.bd(c1, c2); h.bd(c2, n);
      }) },
    { id: 'melatonin', cat: 'Steroide & Botenstoffe', name: 'Melatonin', alt: 'N-Acetyl-5-methoxytryptamin', formula: 'C₁₃H₁₆N₂O₂', groups: ['Indol-Ring', 'Methoxygruppe', 'Amid'],
      where: 'Das Schlafhormon der Zirbeldrüse. Es wird nachts aus Serotonin gebildet, Licht hemmt die Bildung.',
      m: mol(function (h) {
        var x = indole(h);
        var o = h.at(x.r[1], 150, 'O'), me = h.at(o, 90); h.bd(x.r[1], o); h.bd(o, me);
        var ch2 = h.at(x.c3, 72), cb = h.at(ch2, 12), nn = h.at(cb, -48, 'NH'), c = h.at(nn, 12), oc = h.at(c, 72, 'O'), cm = h.at(c, -48);
        h.bd(x.c3, ch2); h.bd(ch2, cb); h.bd(cb, nn); h.bd(nn, c); h.bd(c, oc, 2); h.bd(c, cm);
      }) },
    { id: 'tyramin', cat: 'Steroide & Botenstoffe', name: 'Tyramin', alt: '4-Hydroxyphenylethylamin', formula: 'C₈H₁₁NO', groups: ['Phenol', 'Primäres Amin'],
      where: 'Entsteht bei der Reifung von Käse, Salami und Wein und kann den Blutdruck erhöhen. Bei MAO-Hemmern (einer Medikamentengruppe) wird es schlecht abgebaut.',
      m: mol(function (h) {
        var r = ring(h, 0, 0, 90, KEK), o = h.at(r[3], 270, 'OH'); h.bd(r[3], o);
        var c1 = h.at(r[0], 90), c2 = h.at(c1, 150), n = h.at(c2, 210, 'H₂N');
        h.bd(r[0], c1); h.bd(c1, c2); h.bd(c2, n);
      }) },
    { id: 'tryptamin', cat: 'Steroide & Botenstoffe', name: 'Tryptamin', alt: '', formula: 'C₁₀H₁₂N₂', groups: ['Indol-Ring', 'Primäres Amin'],
      where: 'Es entsteht aus Tryptophan durch Abspaltung von CO₂. Serotonin und Melatonin leiten sich von diesem Grundgerüst ab.',
      m: mol(function (h) {
        var x = indole(h), ch2 = h.at(x.c3, 72), cb = h.at(ch2, 12), nn = h.at(cb, -48, 'NH₂');
        h.bd(x.c3, ch2); h.bd(ch2, cb); h.bd(cb, nn);
      }) },

    /* ---- Kleine Moleküle ---- */
    { id: 'propan', cat: 'Kleine Moleküle', name: 'Propan', alt: '', formula: 'C₃H₈', groups: ['Alkan', 'Kohlenwasserstoff'],
      where: 'Flüssiggas (LPG) in Campingkochern, Heizgeräten und Autogastanks.',
      m: mol(function (h) { var c0 = h.add(0, 0), c1 = h.at(c0, 30), c2 = h.at(c1, -30); h.bd(c0, c1); h.bd(c1, c2); }) },
    { id: 'butan', cat: 'Kleine Moleküle', name: 'Butan', alt: '', formula: 'C₄H₁₀', groups: ['Alkan', 'Kohlenwasserstoff'],
      where: 'Das Gas in Feuerzeugen und Gaskartuschen. Schon bei geringem Druck wird es flüssig.',
      m: mol(function (h) { var c0 = h.add(0, 0); zig(h, c0, 3, 30); }) },
    { id: 'ethin', cat: 'Kleine Moleküle', name: 'Ethin', alt: 'Acetylen', formula: 'C₂H₂', groups: ['C≡C-Dreifachbindung', 'Linear'],
      where: 'Brenngas beim Schweißen: Acetylen verbrennt mit sehr heißer Flamme. Früher brannte es in Karbidlampen.',
      m: mol(function (h) { var a = h.add(0, 0, 'H'), b = h.at(a, 0, 'C'), c = h.at(b, 0, 'C'), d = h.at(c, 0, 'H'); h.bd(a, b); h.bd(b, c, 3); h.bd(c, d); }) },
    { id: 'cyclohexan', cat: 'Kleine Moleküle', name: 'Cyclohexan', alt: '', formula: 'C₆H₁₂', groups: ['Cycloalkan', 'Gesättigter Sechsring'],
      where: 'Lösungsmittel und Ausgangsstoff für Nylon. Im Raum liegt der Ring als Sessel vor, hier ist er flach gezeichnet.',
      m: mol(function (h) { ring(h, 0, 0, 90, SAT); }) },
    { id: 'stickstoff', cat: 'Kleine Moleküle', name: 'Stickstoff', alt: 'N₂', formula: 'N₂', groups: ['N≡N-Dreifachbindung', 'Unpolar'],
      where: 'Rund 78 % der Luft. Die Dreifachbindung ist so stabil, dass nur Bakterien mit dem Enzym Nitrogenase (und die Industrie im Haber-Bosch-Verfahren) ihn für Lebewesen nutzbar machen.',
      m: mol(function (h) { var a = h.add(0, 0, 'N'), b = h.at(a, 0, 'N'); h.bd(a, b, 3); }) },
    { id: 'sauerstoff', cat: 'Kleine Moleküle', name: 'Sauerstoff', alt: 'O₂', formula: 'O₂', groups: ['O=O-Doppelbindung', 'Unpolar'],
      where: 'Rund 21 % der Luft. In der Atmungskette ist er der letzte Elektronenakzeptor und wird dabei zu Wasser reduziert.',
      m: mol(function (h) { var a = h.add(0, 0, 'O'), b = h.at(a, 0, 'O'); h.bd(a, b, 2); }) },
    { id: 'schwefelsaeure', cat: 'Kleine Moleküle', name: 'Schwefelsäure', alt: 'H₂SO₄', formula: 'H₂SO₄', groups: ['Sulfatgruppe', 'Zwei OH-Gruppen', 'Starke Säure'],
      where: 'Die Säure in Autobatterien (Bleiakku) und eine der wichtigsten Industriechemikalien, etwa für Düngemittel. Konzentriert verätzt sie stark.',
      m: mol(function (h) { var s = h.add(0, 0, 'S'), o1 = h.at(s, 90, 'O'), o2 = h.at(s, 270, 'O'), a = h.at(s, 180, 'HO'), b = h.at(s, 0, 'OH'); h.bd(s, o1, 2); h.bd(s, o2, 2); h.bd(s, a); h.bd(s, b); }) },
    { id: 'blausaeure', cat: 'Kleine Moleküle', name: 'Blausäure', alt: 'Cyanwasserstoff, HCN', formula: 'HCN', groups: ['C≡N-Dreifachbindung', 'Linear'],
      where: 'Riecht nach bitteren Mandeln und entsteht beim Abbau von Amygdalin in Bittermandeln und Aprikosenkernen. Sie blockiert die Cytochrom-c-Oxidase der Atmungskette und ist daher stark giftig.',
      m: mol(function (h) { var a = h.add(0, 0, 'H'), b = h.at(a, 0, 'C'), c = h.at(b, 0, 'N'); h.bd(a, b); h.bd(b, c, 3); }) }
  ];
})();
