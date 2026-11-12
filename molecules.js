/*
  Moleküldaten der Strukturformel-Karten.
  Neue Karte: Eintrag am Ende von MOLECULES anhängen, id eindeutig, cat aus CATEGORIES.
  Zeichen-Bausteine: h.add(x, y, label), h.at(atomIndex, winkelInGrad, label), h.bd(a, b, ordnung)
  Ringe: ring(h, mx, my, startwinkel, bindungsordnungen, {position: 'Label'}) liefert die Atomindizes.
*/
(function () {
  var C = window.Chem, L = C.L, mol = C.mol, ring = C.ring, KEK = C.KEK, SAT = C.SAT,
      AP = C.AP, RP = C.RP, fusedPent = C.fusedPent, aaBase = C.aaBase;

  window.DATA_VERSION = '2026-11-12';
  window.CATEGORIES = ['Alkohole & Carbonyle', 'Säuren & Ester', 'Aromaten', 'Aminosäuren', 'Nucleobasen & Purine', 'Wirkstoffe & Aromastoffe', 'Stoffwechsel & Pflanzen'];

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
        var r = ring(h, a.x, a.y + 2 * L, 90, KEK); h.bd(b.c1, c3); h.bd(c3, r[0]);
      }) },
    { id: 'tyr', cat: 'Aminosäuren', name: 'Tyrosin', alt: '', formula: 'C₉H₁₁NO₃', groups: ['Aminogruppe', 'Carboxygruppe', 'Phenol-Seitenkette'],
      where: 'Vorstufe von Dopamin, Adrenalin und dem Pigment Melanin.',
      m: mol(function (h) {
        var b = aaBase(h), c3 = h.at(b.c1, -90), a = h.m.atoms[c3];
        var r = ring(h, a.x, a.y + 2 * L, 90, KEK); h.bd(b.c1, c3); h.bd(c3, r[0]);
        var oh = h.at(r[3], -90, 'OH'); h.bd(r[3], oh);
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
      }) }
  ];
})();
