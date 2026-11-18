/* Zellatmung: Überblick, Glykolyse, Pyruvat-Dehydrogenase, Citratzyklus. Die Atmungskette steht in pathways.js. */
(function () {
  function mc(q, opts, a, why) { return { q: q, o: opts, a: a, why: why }; }
  function lab(P, keys) { return keys.map(function (k) { return P.mets[k].n; }).join(' + '); }
  function orderMets(P, keys, title) { return { title: title, items: keys.map(function (k) { return [k, P.mets[k].n]; }) }; }
  function orderEnz(P, title) { return { title: title, items: P.steps.map(function (s, i) { return ['e' + i, s.e]; }) }; }

  var M = {
    glc: { n: 'α-D-Glucose', m: 'aglucose' }, g6p: { n: 'Glucose-6-phosphat', m: 'glucose6p' }, f6p: { n: 'Fructose-6-phosphat', m: 'fructose6p' },
    fbp: { n: 'Fructose-1,6-bisphosphat', m: 'fructose16bp' }, dhap: { n: 'Dihydroxyacetonphosphat', m: 'dhap' }, gap: { n: 'Glycerinaldehyd-3-phosphat', m: 'gap' },
    bpg: { n: '1,3-Bisphosphoglycerat', m: 'bpg13' }, pg3: { n: '3-Phosphoglycerat', m: 'pg3' }, pg2: { n: '2-Phosphoglycerat', m: 'pg2' },
    pep: { n: 'Phosphoenolpyruvat', m: 'pep' }, pyr: { n: 'Pyruvat', m: 'pyruvat' }, acoa: { n: 'Acetyl-CoA', m: 'acetylcoa' },
    oaa: { n: 'Oxalacetat', m: 'oxalacetat' }, cit: { n: 'Citrat', m: 'zitronen' }, iso: { n: 'Isocitrat', m: 'isocitrat' },
    akg: { n: 'α-Ketoglutarat', m: 'ketoglutarat' }, scoa: { n: 'Succinyl-CoA', m: 'succinylcoa' }, suc: { n: 'Succinat', m: 'bernstein' },
    fum: { n: 'Fumarat', m: 'fumarsaeure' }, mal: { n: 'Malat', m: 'malat' }
  };

  /* ---------- Glykolyse ---------- */
  var gly = {
    id: 'glykolyse', type: 'steps', name: 'Glykolyse', sub: 'Cytosol · Glucose → 2 Pyruvat',
    intro: 'Die Glykolyse baut Glucose (C₆) im Cytosol zu zwei Pyruvat (C₃) ab. Sie braucht keinen Sauerstoff. In der Vorbereitungsphase (Schritt 1–5) werden zwei ATP investiert, in der Ertragsphase (Schritt 6–10) entstehen vier ATP und zwei NADH. Tippe auf ein Zwischenprodukt, um die Struktur in der Datenbank zu öffnen.',
    mets: M,
    start: ['glc'],
    steps: [
      { a: ['glc'], b: ['g6p'], e: 'Hexokinase', co: ['ATP → ADP'], irr: true, note: 'Gezeigt ist α-D-Glucose, die Hexokinase akzeptiert aber auch das β-Anomer. Die Phosphatgruppe macht das Molekül geladen, Glucose-6-phosphat kann die Zelle nicht mehr verlassen. In der Leber arbeitet die Glucokinase. Hexokinase wird durch ihr Produkt gehemmt.' },
      { a: ['g6p'], b: ['f6p'], e: 'Phosphoglucose-Isomerase', co: [], note: 'Isomerisierung von der Aldose zur Ketose, reversibel.' },
      { a: ['f6p'], b: ['fbp'], e: 'Phosphofructokinase-1', co: ['ATP → ADP'], irr: true, key: true, note: 'Schrittmacher der Glykolyse. Gehemmt durch ATP und Citrat, aktiviert durch AMP und Fructose-2,6-bisphosphat.' },
      { a: ['fbp'], b: ['gap', 'dhap'], e: 'Aldolase', co: [], note: 'Spaltet die Hexose in zwei Triosephosphate. Ab hier läuft jeder Schritt zweimal pro Glucose.' },
      { a: ['dhap'], b: ['gap'], e: 'Triosephosphat-Isomerase', co: [], nob: true, note: 'Wandelt DHAP in GAP um, damit beide Hälften weiter abgebaut werden können.' },
      { a: ['gap'], b: ['bpg'], e: 'GAP-Dehydrogenase', co: ['NAD⁺ + Pᵢ → NADH + H⁺'], note: 'Oxidation des Aldehyds mit anorganischem Phosphat. Es entsteht das energiereiche Acylphosphat.' },
      { a: ['bpg'], b: ['pg3'], e: 'Phosphoglycerat-Kinase', co: ['ADP → ATP'], note: 'Substratkettenphosphorylierung: das erste ATP. Es gleicht den Verbrauch aus Schritt 1 und 3 aus.' },
      { a: ['pg3'], b: ['pg2'], e: 'Phosphoglycerat-Mutase', co: [], note: 'Verschiebt die Phosphatgruppe von C3 nach C2.' },
      { a: ['pg2'], b: ['pep'], e: 'Enolase', co: ['− H₂O'], note: 'Die Wasserabspaltung macht die Phosphatbindung sehr energiereich. Fluorid hemmt die Enolase.' },
      { a: ['pep'], b: ['pyr'], e: 'Pyruvatkinase', co: ['ADP → ATP'], irr: true, key: true, note: 'Zweite Substratkettenphosphorylierung. Aktiviert durch Fructose-1,6-bisphosphat, gehemmt durch ATP und Alanin.' }
    ],
    facts: [
      'Bilanz pro Glucose: 2 ATP verbraucht (Schritt 1 und 3), 4 ATP gebildet (Schritt 7 und 10), netto +2 ATP und 2 NADH.',
      'Gesamtgleichung: Glucose + 2 NAD⁺ + 2 ADP + 2 Pᵢ → 2 Pyruvat + 2 NADH + 2 ATP + 2 H⁺ + 2 H₂O.',
      'Irreversibel (und damit Kontrollpunkte): Hexokinase, Phosphofructokinase-1 und Pyruvatkinase. Alle anderen Schritte sind reversibel (sie werden auch bei der Gluconeogenese benutzt).',
      'Ohne Sauerstoff muss NAD⁺ regeneriert werden: Pyruvat wird zu Lactat (Milchsäuregärung, Muskel, Erythrocyten) oder zu Ethanol (Hefe).',
      'Alltag: Blutentnahmeröhrchen für die Glucosemessung enthalten Natriumfluorid. Es hemmt die Enolase und verhindert, dass Blutzellen im Röhrchen Glucose verbrauchen.'
    ],
    qs: [
      mc('Wo läuft die Glykolyse ab?', ['Im Cytosol', 'In der Mitochondrienmatrix', 'An der inneren Mitochondrienmembran', 'Im Zellkern'], 0, 'Alle zehn Enzyme liegen gelöst im Cytosol.'),
      mc('Wie viel ATP gewinnt die Glykolyse netto pro Glucose?', ['0', '2', '4', '8'], 1, '4 ATP werden gebildet, 2 ATP wurden investiert: netto +2.'),
      mc('Wie viele ATP werden in der Vorbereitungsphase verbraucht?', ['1', '2', '3', '4'], 1, 'Hexokinase und Phosphofructokinase-1 verbrauchen je ein ATP.'),
      mc('Wie viel NADH entsteht in der Glykolyse pro Glucose?', ['1', '2', '4', '6'], 1, 'Die GAP-Dehydrogenase läuft für jedes der zwei Triosephosphate einmal.'),
      mc('Welches Enzym ist der Schrittmacher der Glykolyse?', ['Hexokinase', 'Aldolase', 'Phosphofructokinase-1', 'Enolase'], 2, 'PFK-1 katalysiert den langsamsten, stark regulierten Schritt.'),
      mc('Was aktiviert die Phosphofructokinase-1?', ['ATP', 'Citrat', 'AMP', 'Pyruvat'], 2, 'AMP zeigt Energiemangel an. ATP und Citrat zeigen Energieüberschuss und hemmen die PFK-1.'),
      mc('Welche drei Enzyme der Glykolyse sind irreversibel?', ['Hexokinase, PFK-1, Pyruvatkinase', 'Aldolase, Enolase, Mutase', 'GAP-Dehydrogenase, PGK, Mutase', 'Isomerase, Aldolase, Enolase'], 0, 'Diese drei Schritte müssen bei der Gluconeogenese umgangen werden.'),
      mc('Welche Enzyme bilden ATP durch Substratkettenphosphorylierung?', ['Hexokinase und PFK-1', 'Phosphoglycerat-Kinase und Pyruvatkinase', 'Aldolase und Enolase', 'GAP-Dehydrogenase und Mutase'], 1, 'Beide übertragen ein energiereiches Phosphat direkt auf ADP.'),
      mc('In welche Produkte spaltet die Aldolase Fructose-1,6-bisphosphat?', ['Zwei Moleküle Pyruvat', 'DHAP und Glycerinaldehyd-3-phosphat', 'Glucose und Phosphat', 'Zwei Moleküle Acetyl-CoA'], 1, 'Aus C₆ werden zwei Triosephosphate (C₃).'),
      mc('Was macht die Triosephosphat-Isomerase?', ['DHAP zu GAP umlagern', 'Glucose-6-phosphat zu Fructose-6-phosphat umlagern', 'PEP zu Pyruvat umsetzen', '3-PG zu 2-PG umlagern'], 0, 'Dadurch gelangen beide Hälften der Hexose in die Ertragsphase.'),
      mc('Welche Stoffe braucht die GAP-Dehydrogenase?', ['NAD⁺ und Pᵢ', 'ATP und CoA', 'FAD und H₂O', 'GTP und CO₂'], 0, 'Der Aldehyd wird oxidiert (NAD⁺ → NADH) und mit anorganischem Phosphat verestert.'),
      mc('Was ist das Endprodukt der Glykolyse?', ['Acetyl-CoA', 'Citrat', 'Zwei Pyruvat', 'Lactat in jedem Fall'], 2, 'Lactat entsteht erst danach und nur, wenn kein Sauerstoff zur Verfügung steht.'),
      mc('Wie wird NAD⁺ ohne Sauerstoff im Muskel regeneriert?', ['Durch Bildung von Lactat', 'Durch die Atmungskette', 'Durch den Citratzyklus', 'Durch Bildung von Acetyl-CoA'], 0, 'Die Lactat-Dehydrogenase reduziert Pyruvat zu Lactat und oxidiert dabei NADH zu NAD⁺.'),
      mc('Was spaltet die Enolase ab?', ['CO₂', 'Wasser', 'Phosphat', 'NADH'], 1, 'Aus 2-Phosphoglycerat wird durch Wasserabspaltung Phosphoenolpyruvat.'),
      mc('Warum bleibt Glucose-6-phosphat in der Zelle?', ['Es ist zu groß', 'Die geladene Phosphatgruppe passiert die Membran nicht', 'Es bindet an die Mitochondrien', 'Es wird sofort zu Lactat'], 1, 'Die negativ geladene Phosphatgruppe verhindert die Diffusion durch die Lipid-Doppelschicht.'),
      mc('Welches Enzym in der Glykolyse hemmt Fluorid?', ['Hexokinase', 'Enolase', 'Pyruvatkinase', 'Aldolase'], 1, 'Deshalb enthalten Blutröhrchen für die Glucosebestimmung Natriumfluorid.'),
      mc('Warum sind Erythrocyten ganz auf die Glykolyse angewiesen?', ['Sie haben keine Mitochondrien', 'Sie haben keine Glucose-Transporter', 'Sie haben keine Enzyme für Glucose', 'Sie brauchen kein ATP'], 0, 'Ohne Mitochondrien gibt es weder Citratzyklus noch Atmungskette.'),
      mc('Wie viele C-Atome hat Pyruvat?', ['2', '3', '4', '6'], 1, 'Glucose (C₆) liefert zwei Pyruvat (C₃).')
    ]
  };
  gly.orders = [orderMets(gly, ['glc', 'g6p', 'f6p', 'fbp', 'gap', 'bpg', 'pg3', 'pg2', 'pep', 'pyr'], 'Zwischenprodukte der Glykolyse'), orderEnz(gly, 'Enzyme der Glykolyse')];

  /* ---------- Pyruvat-Dehydrogenase ---------- */
  var pdh = {
    id: 'pdh', type: 'steps', name: 'Pyruvat-Dehydrogenase', sub: 'Mitochondrienmatrix · Pyruvat → Acetyl-CoA',
    intro: 'Die Brückenreaktion verbindet Glykolyse und Citratzyklus. Pyruvat gelangt in die Mitochondrienmatrix und wird dort vom Pyruvat-Dehydrogenase-Komplex (PDH) oxidativ decarboxyliert. Es entstehen Acetyl-CoA, CO₂ und NADH. Pro Glucose läuft die Reaktion zweimal.',
    mets: M, start: ['pyr'],
    steps: [
      { a: ['pyr'], b: ['acoa'], e: 'Pyruvat-Dehydrogenase-Komplex', co: ['NAD⁺ → NADH + H⁺', '+ CoA-SH', '− CO₂'], irr: true, key: true, note: 'Irreversibel: Aus Acetyl-CoA kann der Körper keine Glucose herstellen. Deshalb können Fette nicht in Zucker umgewandelt werden.' }
    ],
    extra: [{
      title: 'Drei Enzyme, fünf Cofaktoren', items: [
        ['E1 · Pyruvat-Decarboxylase', 'Cofaktor Thiaminpyrophosphat (TPP, Vitamin B₁). Spaltet CO₂ ab.'],
        ['E2 · Dihydrolipoyl-Transacetylase', 'Cofaktoren Liponsäure und Coenzym A (Vitamin B₅, Pantothensäure). Überträgt die Acetylgruppe auf CoA.'],
        ['E3 · Dihydrolipoyl-Dehydrogenase', 'Cofaktoren FAD (Vitamin B₂) und NAD⁺ (Vitamin B₃, Niacin). Regeneriert die Liponsäure und bildet NADH.']
      ]
    }],
    facts: [
      'Gesamtgleichung: Pyruvat + NAD⁺ + CoA-SH → Acetyl-CoA + CO₂ + NADH + H⁺.',
      'Hemmung: Acetyl-CoA, NADH und ATP (Produkte und Energieüberschuss). Die PDH-Kinase phosphoryliert den Komplex und schaltet ihn ab, die PDH-Phosphatase aktiviert ihn wieder. Insulin aktiviert die PDH.',
      'Alltag: Bei Vitamin-B₁-Mangel (Thiaminmangel, z. B. bei chronischem Alkoholismus) staut sich Pyruvat und es entsteht Lactat. Arsen und Quecksilber blockieren die Liponsäure.',
      'Aufgebaut wie der α-Ketoglutarat-Dehydrogenase-Komplex im Citratzyklus: gleiche Cofaktoren, gleiches Reaktionsprinzip.'
    ],
    qs: [
      mc('Wo läuft die Pyruvat-Dehydrogenase-Reaktion ab?', ['Im Cytosol', 'In der Mitochondrienmatrix', 'Im Intermembranraum', 'Im Zellkern'], 1, 'Pyruvat wird über einen Transporter in die Matrix aufgenommen, dort sitzt der PDH-Komplex.'),
      mc('Welche Produkte entstehen aus Pyruvat in der PDH-Reaktion?', ['Acetyl-CoA, CO₂ und NADH', 'Lactat und NAD⁺', 'Citrat und ATP', 'Oxalacetat und FADH₂'], 0, 'Oxidative Decarboxylierung: CO₂ geht verloren, NAD⁺ wird zu NADH, die Acetylgruppe wird auf CoA übertragen.'),
      mc('Welches Vitamin liefert den Cofaktor TPP der PDH?', ['Vitamin B₁ (Thiamin)', 'Vitamin B₂ (Riboflavin)', 'Vitamin B₃ (Niacin)', 'Vitamin B₅ (Pantothensäure)'], 0, 'Thiaminpyrophosphat bindet das Pyruvat im E1-Enzym.'),
      mc('Aus welchem Vitamin stammt Coenzym A?', ['Vitamin B₁', 'Vitamin B₅ (Pantothensäure)', 'Vitamin B₆', 'Vitamin C'], 1, 'Pantothensäure ist ein Baustein von Coenzym A.'),
      mc('Welcher Cofaktor der PDH stammt aus Riboflavin (Vitamin B₂)?', ['TPP', 'Liponsäure', 'FAD', 'NAD⁺'], 2, 'FAD sitzt im E3-Enzym (Dihydrolipoyl-Dehydrogenase).'),
      mc('Warum kann der Körper aus Fettsäuren keine Glucose herstellen?', ['Die PDH-Reaktion ist irreversibel, Acetyl-CoA kann nicht zu Pyruvat werden', 'Fettsäuren haben zu viele C-Atome', 'Es fehlt das Enzym Hexokinase', 'Die Glykolyse ist irreversibel'], 0, 'Acetyl-CoA liefert netto kein Oxalacetat, der Weg Pyruvat → Acetyl-CoA ist eine Einbahnstraße.'),
      mc('Was hemmt den PDH-Komplex?', ['Acetyl-CoA und NADH', 'ADP und Pyruvat', 'Insulin', 'NAD⁺ und CoA'], 0, 'Produkte und Energieüberschuss schalten die PDH ab, ADP, Pyruvat, NAD⁺ und Insulin aktivieren.'),
      mc('Wie viele CO₂ entstehen in der PDH-Reaktion pro Glucose?', ['1', '2', '4', '6'], 1, 'Je Pyruvat ein CO₂, und aus einer Glucose entstehen zwei Pyruvat.'),
      mc('Wie viele C-Atome hat Acetyl-CoA (ohne CoA)?', ['2', '3', '4', '6'], 0, 'Die Acetylgruppe hat 2 C-Atome, sie stammen aus C2 und C3 des Pyruvats.'),
      mc('Welche Substanz blockiert die Liponsäure der PDH?', ['Arsen', 'Fluorid', 'Malonat', 'Rotenon'], 0, 'Arsenverbindungen binden die SH-Gruppen der Liponsäure.')
    ]
  };
  pdh.orders = [{ title: 'Schritte der PDH-Reaktion', items: [['a', 'Pyruvat'], ['b', 'Decarboxylierung (CO₂ weg)'], ['c', 'Acetylgruppe auf CoA'], ['d', 'NAD⁺ → NADH'], ['e', 'Acetyl-CoA']] }];

  /* ---------- Citratzyklus ---------- */
  var tca = {
    id: 'citratzyklus', type: 'steps', name: 'Citratzyklus', sub: 'Mitochondrienmatrix · Acetyl-CoA → 2 CO₂',
    intro: 'Der Citratzyklus (Krebs-Zyklus) oxidiert die Acetylgruppe von Acetyl-CoA vollständig zu zwei CO₂. Die Energie wird in 3 NADH, 1 FADH₂ und 1 GTP gespeichert. Oxalacetat wird dabei zurückgebildet, der Zyklus schließt sich. Tippe auf ein Zwischenprodukt, um die Struktur in der Datenbank zu öffnen.',
    mets: M, start: ['oaa', 'acoa'],
    steps: [
      { a: ['oaa', 'acoa'], b: ['cit'], e: 'Citrat-Synthase', co: ['+ H₂O', '− CoA-SH'], irr: true, note: 'Kondensation von C₂ (Acetyl) und C₄ (Oxalacetat) zu C₆. Gehemmt durch ATP, NADH und Succinyl-CoA.' },
      { a: ['cit'], b: ['iso'], e: 'Aconitase', co: ['über cis-Aconitat'], note: 'Die OH-Gruppe wird verschoben, damit sie im nächsten Schritt oxidiert werden kann. Fluoracetat (Rattengift) wird zu Fluorcitrat und hemmt die Aconitase.' },
      { a: ['iso'], b: ['akg'], e: 'Isocitrat-Dehydrogenase', co: ['NAD⁺ → NADH + H⁺', '− CO₂'], irr: true, key: true, note: 'Erste Decarboxylierung (C₆ → C₅) und erstes NADH. Wichtigster Kontrollpunkt: aktiviert durch ADP, gehemmt durch ATP und NADH.' },
      { a: ['akg'], b: ['scoa'], e: 'α-Ketoglutarat-Dehydrogenase-Komplex', co: ['NAD⁺ → NADH + H⁺', '+ CoA-SH', '− CO₂'], irr: true, note: 'Zweite Decarboxylierung (C₅ → C₄). Aufgebaut wie der PDH-Komplex (gleiche Cofaktoren), gehemmt durch Succinyl-CoA und NADH.' },
      { a: ['scoa'], b: ['suc'], e: 'Succinyl-CoA-Synthetase', co: ['GDP + Pᵢ → GTP', '− CoA-SH'], note: 'Substratkettenphosphorylierung: Die Energie der Thioesterbindung bildet GTP (in manchen Geweben ATP).' },
      { a: ['suc'], b: ['fum'], e: 'Succinat-Dehydrogenase', co: ['FAD → FADH₂'], note: 'Einziges Enzym des Zyklus in der inneren Membran, zugleich Komplex II der Atmungskette. Malonat hemmt kompetitiv.' },
      { a: ['fum'], b: ['mal'], e: 'Fumarase', co: ['+ H₂O'], note: 'Addition von Wasser an die Doppelbindung, stereospezifisch zu L-Malat.' },
      { a: ['mal'], b: ['oaa'], e: 'Malat-Dehydrogenase', co: ['NAD⁺ → NADH + H⁺'], nob: true, note: 'Bildet Oxalacetat zurück: Der Zyklus ist geschlossen und Oxalacetat steht wieder für Schritt 1 bereit.' }
    ],
    facts: [
      'Pro Acetyl-CoA: 3 NADH, 1 FADH₂, 1 GTP und 2 CO₂. Pro Glucose (zwei Umläufe): 6 NADH, 2 FADH₂, 2 GTP und 4 CO₂.',
      'Die zwei Decarboxylierungen (Isocitrat-DH und α-Ketoglutarat-DH) liefern das CO₂. Die Oxidationen (3 × NADH, 1 × FADH₂) laufen an Isocitrat, α-Ketoglutarat, Succinat und Malat.',
      'Anaplerotische Reaktion: Die Pyruvat-Carboxylase (Cofaktor Biotin) füllt Oxalacetat aus Pyruvat wieder auf, wenn Zwischenprodukte des Zyklus für Synthesen abgezogen wurden.',
      'Der Zyklus verbraucht keinen O₂ direkt, braucht aber die Atmungskette, die NAD⁺ und FAD regeneriert. Ohne O₂ steht er still.',
      'Anzahl der C-Atome: Oxalacetat C₄ → Citrat C₆ → α-Ketoglutarat C₅ → Succinyl-CoA C₄.'
    ],
    qs: [
      mc('Wo läuft der Citratzyklus ab?', ['Im Cytosol', 'In der Mitochondrienmatrix', 'Im Zellkern', 'Im Intermembranraum'], 1, 'Die Enzyme liegen in der Matrix, nur die Succinat-Dehydrogenase sitzt in der inneren Membran.'),
      mc('Wie viel NADH entsteht pro Umlauf des Citratzyklus?', ['1', '2', '3', '4'], 2, 'Isocitrat-DH, α-Ketoglutarat-DH und Malat-DH bilden je ein NADH.'),
      mc('Wie viel FADH₂ entsteht pro Umlauf?', ['0', '1', '2', '3'], 1, 'Die Succinat-Dehydrogenase bildet FADH₂.'),
      mc('Wie viel CO₂ entsteht pro Umlauf?', ['1', '2', '3', '4'], 1, 'Je eins in der Isocitrat-DH und der α-Ketoglutarat-DH.'),
      mc('Wie viel GTP entsteht pro Umlauf?', ['0', '1', '2', '3'], 1, 'Bei der Succinyl-CoA-Synthetase.'),
      mc('Welches Enzym ist der wichtigste Kontrollpunkt des Zyklus?', ['Citrat-Synthase', 'Isocitrat-Dehydrogenase', 'Fumarase', 'Aconitase'], 1, 'Sie wird durch ADP aktiviert und durch ATP und NADH gehemmt (die Citrat-Synthase ist ebenfalls reguliert).'),
      mc('Welche zwei Enzyme decarboxylieren im Citratzyklus?', ['Aconitase und Fumarase', 'Isocitrat-DH und α-Ketoglutarat-DH', 'Citrat-Synthase und Malat-DH', 'Succinat-DH und Fumarase'], 1, 'Beide spalten CO₂ ab und bilden NADH.'),
      mc('In welchem Schritt entsteht GTP?', ['Citrat → Isocitrat', 'Succinyl-CoA → Succinat', 'Fumarat → Malat', 'Malat → Oxalacetat'], 1, 'Substratkettenphosphorylierung durch die Succinyl-CoA-Synthetase.'),
      mc('Welches Enzym des Zyklus ist zugleich Komplex II der Atmungskette?', ['Fumarase', 'Succinat-Dehydrogenase', 'Malat-Dehydrogenase', 'Aconitase'], 1, 'Sie sitzt in der inneren Mitochondrienmembran.'),
      mc('Welche beiden Stoffe kondensiert die Citrat-Synthase?', ['Acetyl-CoA und Oxalacetat', 'Pyruvat und Malat', 'Acetyl-CoA und Fumarat', 'Succinat und Oxalacetat'], 0, 'C₂ + C₄ ergibt Citrat (C₆).'),
      mc('Wie viele C-Atome hat Citrat?', ['4', '5', '6', '3'], 2, 'Drei Carboxygruppen an einem C₃-Gerüst, zusammen 6 C-Atome.'),
      mc('Welches Gift führt zu Fluorcitrat und hemmt die Aconitase?', ['Fluoracetat', 'Cyanid', 'Rotenon', 'Oligomycin'], 0, 'Fluoracetat (Rattengift) wird zu Fluoracetyl-CoA und dann zu Fluorcitrat.'),
      mc('Welcher Stoff hemmt die Succinat-Dehydrogenase kompetitiv?', ['Malonat', 'Antimycin A', 'Oligomycin', 'Cyanid'], 0, 'Malonat ähnelt Succinat und besetzt dessen Bindestelle.'),
      mc('Welches Vitamin ist Cofaktor der Pyruvat-Carboxylase, die Oxalacetat auffüllt?', ['Biotin', 'Vitamin C', 'Vitamin K', 'Vitamin A'], 0, 'Biotin überträgt das CO₂ bei der Carboxylierung von Pyruvat zu Oxalacetat.'),
      mc('Was addiert die Fumarase an Fumarat?', ['Wasser', 'CO₂', 'Phosphat', 'NADH'], 0, 'Aus Fumarat entsteht durch Hydratisierung L-Malat.'),
      mc('Warum steht der Citratzyklus ohne Sauerstoff still?', ['NAD⁺ und FAD werden ohne Atmungskette nicht regeneriert', 'Citrat-Synthase braucht O₂', 'Acetyl-CoA wird dann zu Lactat', 'Die Mitochondrien lösen sich auf'], 0, 'O₂ ist der letzte Elektronenakzeptor der Atmungskette, ohne sie gibt es kein NAD⁺ mehr.'),
      mc('Wie viele C-Atome hat α-Ketoglutarat?', ['4', '5', '6', '3'], 1, 'Nach der ersten Decarboxylierung bleiben C₅ übrig.')
    ]
  };
  tca.orders = [orderMets(tca, ['oaa', 'cit', 'iso', 'akg', 'scoa', 'suc', 'fum', 'mal'], 'Zwischenprodukte des Citratzyklus (ab Oxalacetat)'), orderEnz(tca, 'Enzyme des Citratzyklus')];

  /* ---------- Überblick ---------- */
  var ov = {
    id: 'ueberblick', type: 'overview', name: 'Zellatmung im Überblick', sub: 'Vier Stufen vom Glucose-Molekül bis zum ATP',
    intro: 'Die Zellatmung baut Glucose mit Sauerstoff zu CO₂ und Wasser ab und gewinnt dabei ATP. Sie läuft in vier Stufen an unterschiedlichen Orten der Zelle ab. Die Zahlen gelten pro Glucose.',
    stages: [
      { n: 'Glykolyse', ort: 'Cytosol', ein: 'Glucose (C₆)', aus: '2 Pyruvat, 2 NADH, netto 2 ATP', o2: 'kein O₂ nötig' },
      { n: 'Pyruvat-Dehydrogenase', ort: 'Mitochondrienmatrix', ein: '2 Pyruvat', aus: '2 Acetyl-CoA, 2 NADH, 2 CO₂', o2: 'kein O₂ direkt' },
      { n: 'Citratzyklus', ort: 'Mitochondrienmatrix', ein: '2 Acetyl-CoA', aus: '6 NADH, 2 FADH₂, 2 GTP, 4 CO₂', o2: 'kein O₂ direkt' },
      { n: 'Atmungskette und ATP-Synthase', ort: 'innere Mitochondrienmembran', ein: '10 NADH, 2 FADH₂, O₂', aus: 'H₂O, ca. 26–28 ATP', o2: 'O₂ wird hier verbraucht' }
    ],
    facts: [
      'Gesamtgleichung: C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + Energie (ca. 30–32 ATP).',
      'ATP-Bilanz: Substratkettenphosphorylierung 4 (2 in der Glykolyse, 2 GTP im Citratzyklus) plus oxidative Phosphorylierung ca. 26–28, zusammen ca. 30–32 ATP pro Glucose (je nach NADH-Shuttle).',
      'Insgesamt entstehen 10 NADH (2 + 2 + 6) und 2 FADH₂. Mit 2,5 ATP pro NADH und 1,5 pro FADH₂ ergeben sich 25 + 3 = 28 ATP aus der Atmungskette, abzüglich Verluste beim Transport des cytosolischen NADH.',
      'CO₂ entsteht in der PDH-Reaktion und im Citratzyklus, nicht in der Atmungskette. Wasser entsteht in der Atmungskette (Komplex IV), dort wird auch der gesamte Sauerstoff verbraucht.',
      'Ohne Sauerstoff bleibt nur die Glykolyse mit Gärung: 2 ATP pro Glucose und Lactat (oder Ethanol) als Endprodukt.'
    ],
    qs: [
      mc('Wo findet die Glykolyse statt?', ['Cytosol', 'Mitochondrienmatrix', 'Innere Mitochondrienmembran', 'Zellkern'], 0, 'Sie läuft im Cytosol ab, die weiteren Stufen in den Mitochondrien.'),
      mc('Wo findet der Citratzyklus statt?', ['Cytosol', 'Mitochondrienmatrix', 'Intermembranraum', 'Endoplasmatisches Retikulum'], 1, 'In der Matrix, zusammen mit der PDH-Reaktion.'),
      mc('Wo findet die Atmungskette statt?', ['Cytosol', 'Mitochondrienmatrix', 'Innere Mitochondrienmembran', 'Äußere Mitochondrienmembran'], 2, 'Die Komplexe I–IV und die ATP-Synthase sitzen in der inneren Membran.'),
      mc('In welchen Schritten entsteht CO₂?', ['Glykolyse und Atmungskette', 'PDH-Reaktion und Citratzyklus', 'Nur in der Atmungskette', 'Nur in der Glykolyse'], 1, 'Die PDH decarboxyliert Pyruvat, der Citratzyklus liefert zwei weitere CO₂ pro Acetyl-CoA.'),
      mc('Wo entsteht das Wasser der Zellatmung?', ['Glykolyse', 'Citratzyklus', 'Komplex IV der Atmungskette', 'PDH-Reaktion'], 2, 'O₂ wird dort zu H₂O reduziert.'),
      mc('Wie viele CO₂ entstehen insgesamt pro Glucose?', ['2', '4', '6', '12'], 2, '2 aus der PDH-Reaktion und 4 aus dem Citratzyklus.'),
      mc('Wie viele NADH entstehen insgesamt pro Glucose?', ['4', '6', '8', '10'], 3, '2 (Glykolyse) + 2 (PDH) + 6 (Citratzyklus).'),
      mc('Wie viele FADH₂ entstehen pro Glucose?', ['0', '2', '4', '6'], 1, 'Nur im Citratzyklus (Succinat-Dehydrogenase), zweimal pro Glucose.'),
      mc('Wie viel ATP entsteht ungefähr insgesamt pro Glucose bei vollständiger Atmung?', ['2', '10', '30 bis 32', '100'], 2, 'Rund 4 ATP/GTP durch Substratkettenphosphorylierung und ca. 26–28 durch die Atmungskette.'),
      mc('Welche Stufe liefert das meiste ATP?', ['Glykolyse', 'PDH-Reaktion', 'Citratzyklus', 'Atmungskette'], 3, 'Ca. 26–28 von ca. 30–32 ATP.'),
      mc('Wie viel ATP gewinnt die Zelle pro Glucose, wenn nur die Glykolyse läuft (Gärung)?', ['2', '4', '10', '30'], 0, 'Netto 2 ATP, NAD⁺ wird durch die Bildung von Lactat regeneriert.'),
      mc('Welche Stufe verbraucht den Sauerstoff?', ['Glykolyse', 'PDH-Reaktion', 'Citratzyklus', 'Atmungskette (Komplex IV)'], 3, 'Die übrigen Stufen brauchen O₂ nur indirekt.'),
      mc('In welcher Form wird Energie in Citratzyklus und Glykolyse vor allem gespeichert, bevor die Atmungskette sie nutzt?', ['Als NADH und FADH₂', 'Als Glycogen', 'Als Lactat', 'Als Fettsäuren'], 0, 'Diese Reduktionsäquivalente geben ihre Elektronen an die Atmungskette ab.'),
      mc('Welche Zellen haben keine Mitochondrien und gewinnen ATP nur über die Glykolyse?', ['Erythrocyten', 'Herzmuskelzellen', 'Leberzellen', 'Nervenzellen'], 0, 'Reife Erythrocyten haben keine Mitochondrien.')
    ]
  };
  ov.orders = [
    { title: 'Stufen der Zellatmung', items: [['g', 'Glykolyse'], ['p', 'Pyruvat-Dehydrogenase'], ['c', 'Citratzyklus'], ['a', 'Atmungskette']] },
    { title: 'Weg des Kohlenstoffs', items: [['glc', 'Glucose'], ['pyr', 'Pyruvat'], ['acoa', 'Acetyl-CoA'], ['cit', 'Citrat'], ['co2', 'CO₂']] }
  ];


  /* ---------- Diagramme (Layout in einem 360-Einheiten-Raster) und Übungsmodi ---------- */
  var colL = 70, colR = 290;
  gly.dia = { size: [360, 568], node: [106, 88],
    nodes: { glc: [56, 48], g6p: [56, 166], f6p: [56, 284], fbp: [56, 402], gap: [56, 520], dhap: [180, 461], bpg: [304, 520], pg3: [304, 402], pg2: [304, 284], pep: [304, 166], pyr: [304, 48] },
    pill: [[28, 0], [28, 0], [28, 0], [-28, 0], [6, 6], [0, 0], [-28, 0], [-28, 0], [-28, 0], [-28, 0]],
    tagAt: { 5: [0, 30, 'middle'], 6: [34, 3.5, 'start'], 8: [34, 3.5, 'start'], 9: [34, 3.5, 'start'] },
    notes: [[180, 52, 'Angaben pro Glucose']] };
  ['−1 ATP', '', '−1 ATP', '', '', '+2 NADH', '+2 ATP', '', '−2 H₂O', '+2 ATP'].forEach(function (t, i) { gly.steps[i].tag = t; });
  ['HK', 'PGI', 'PFK-1', 'ALD', 'TPI', 'GAPDH', 'PGK', 'PGM', 'ENO', 'PK'].forEach(function (t, i) { gly.steps[i].ab = t; });
  gly.modes = ['names', 'structs', 'enz'];

  tca.dia = { size: [360, 504], node: [90, 76], ring: [180, 245],
    nodes: { cit: [180, 46], iso: [298, 124], akg: [316, 245], scoa: [298, 366], suc: [180, 444], fum: [62, 366], mal: [44, 245], oaa: [62, 124], acoa: [180, 245] },
    tagAt: { 4: [22, 3.5, 'start'], 5: [-22, 3.5, 'end'] },
    notes: [[180, 498, 'Angaben pro Acetyl-CoA']] };
  ['', '', '+1 NADH|−1 CO₂', '+1 NADH|−1 CO₂', '+1 GTP', '+1 FADH₂', '', '+1 NADH'].forEach(function (t, i) { tca.steps[i].tag = t; });
  ['CS', 'ACO', 'IDH', 'KGDH', 'SCS', 'SDH', 'FUM', 'MDH'].forEach(function (t, i) { tca.steps[i].ab = t; });
  tca.modes = ['structs', 'names', 'enz'];

  pdh.dia = { size: [360, 160], node: [112, 96], nodes: { pyr: [58, 80], acoa: [302, 80] }, pill: [[0, 0]], pillText: 'PDH',
    notes: [[180, 40, '−1 CO₂'], [180, 122, '+1 NADH'], [180, 134, '(NAD⁺ → NADH)'], [180, 148, '+ CoA-SH']] };
  pdh.steps[0].ab = 'PDH'; pdh.steps[0].tag = '';
  pdh.pairs = [
    { title: 'Cofaktor und Vitamin', hint: 'Welches Vitamin liefert welchen Cofaktor des PDH-Komplexes?', rows: [['Thiaminpyrophosphat (TPP)', 'Vitamin B₁ (Thiamin)'], ['FAD', 'Vitamin B₂ (Riboflavin)'], ['NAD⁺', 'Vitamin B₃ (Niacin)'], ['Coenzym A', 'Vitamin B₅ (Pantothensäure)'], ['Liponsäure', 'wird vom Körper selbst gebildet']] },
    { title: 'Enzyme des Komplexes', hint: 'Welche Aufgabe hat welches Enzym des PDH-Komplexes?', rows: [['E1 · Pyruvat-Decarboxylase', 'spaltet CO₂ von Pyruvat ab'], ['E2 · Transacetylase', 'überträgt die Acetylgruppe auf CoA'], ['E3 · Dihydrolipoyl-Dehydrogenase', 'regeneriert Liponsäure, bildet NADH']] }
  ];
  pdh.modes = ['names', 'pairs0', 'structs', 'pairs1'];

  ov.dia = { size: [360, 440], node: [290, 88], nodes: { g: [180, 48], p: [180, 160], c: [180, 272], a: [180, 384] },
    links: [['g', 'p', '2 Pyruvat'], ['p', 'c', '2 Acetyl-CoA'], ['c', 'a', '10 NADH + 2 FADH₂ (aus allen Stufen)']] };
  ov.pairs = [
    { title: 'Stufe und Ort', hint: 'Wo in der Zelle läuft welche Stufe ab?', rows: [['Glykolyse', 'Cytosol'], ['Pyruvat-Dehydrogenase', 'Mitochondrienmatrix'], ['Citratzyklus', 'Mitochondrienmatrix'], ['Atmungskette', 'innere Mitochondrienmembran']] },
    { title: 'Stufe und Ausbeute', hint: 'Welche Produkte entstehen in welcher Stufe (pro Glucose)?', rows: [['Glykolyse', '2 Pyruvat, 2 NADH, netto 2 ATP'], ['Pyruvat-Dehydrogenase', '2 Acetyl-CoA, 2 NADH, 2 CO₂'], ['Citratzyklus', '6 NADH, 2 FADH₂, 2 GTP, 4 CO₂'], ['Atmungskette', 'H₂O und ca. 26–28 ATP']] }
  ];
  ov.modes = ['names', 'pairs0', 'pairs1'];

  var atm = (window.PATHWAYS || []).filter(function (p) { return p.id === 'atmungskette'; })[0];
  if (atm) {
    atm.dia = { size: [440, 312], comps: [
      { key: 'k1', val: 'NADH-Dehydrogenase (Komplex I)', short: 'I', pos: [40, 152, 60, 80] },
      { key: 'k2', val: 'Succinat-Dehydrogenase (Komplex II)', short: 'II', pos: [116, 152, 40, 80] },
      { key: 'q', val: 'Ubichinon (Q)', short: 'Q', pos: [172, 152, 30, 30] },
      { key: 'k3', val: 'Cytochrom-bc₁-Komplex (Komplex III)', short: 'III', pos: [238, 152, 60, 80] },
      { key: 'c', val: 'Cytochrom c', short: 'c', pos: [286, 84, 36, 26] },
      { key: 'k4', val: 'Cytochrom-c-Oxidase (Komplex IV)', short: 'IV', pos: [332, 152, 56, 80] },
      { key: 'k5', val: 'ATP-Synthase (Komplex V)', short: 'V', pos: [404, 166, 56, 108] }] };
    atm.pairs = [
      { title: 'Hemmstoffe', hint: 'Welcher Hemmstoff blockiert welches Bauteil?', rows: [['Rotenon', 'Komplex I'], ['Malonat', 'Komplex II'], ['Antimycin A', 'Komplex III'], ['Cyanid und Kohlenmonoxid', 'Komplex IV'], ['Oligomycin', 'ATP-Synthase']] },
      { title: 'Protonenpumpen', hint: 'Wie viele H⁺ pumpt das Bauteil pro NADH-Elektronenpaar?', rows: [['Komplex I', '4 H⁺'], ['Komplex II', '0 H⁺'], ['Komplex III', '4 H⁺'], ['Komplex IV', '2 H⁺']] },
      { title: 'Cofaktoren', hint: 'Welche Cofaktoren gehören zu welchem Bauteil?', rows: [['Komplex I', 'FMN und Fe-S-Cluster'], ['Komplex II', 'FAD, Fe-S-Cluster, Häm b'], ['Komplex III', 'Cytochrom b, c₁ und Rieske-Fe-S'], ['Komplex IV', 'Häm a, Häm a₃, Cu_A, Cu_B'], ['Cytochrom c', 'Häm c']] }
    ];
    atm.modes = ['comps', 'pairs0', 'pairs1', 'pairs2'];
  }

  gly.bil = { basis: 'pro Glucose', rein: ['1 α-D-Glucose', '2 NAD⁺', '2 ADP', '2 Pᵢ'], raus: ['2 Pyruvat', '2 NADH', '2 ATP (netto)', '2 H⁺', '2 H₂O'], note: 'Brutto: 2 ATP werden verbraucht (Schritt 1 und 3), 4 ATP gebildet (Schritt 7 und 10).' };
  pdh.bil = { basis: 'pro Pyruvat (pro Glucose zweimal)', rein: ['1 Pyruvat', '1 NAD⁺', '1 CoA-SH'], raus: ['1 Acetyl-CoA', '1 CO₂', '1 NADH', '1 H⁺'], note: '' };
  tca.bil = { basis: 'pro Acetyl-CoA (pro Glucose zweimal)', rein: ['1 Acetyl-CoA', '3 NAD⁺', '1 FAD', '1 GDP', '1 Pᵢ', '2 H₂O'], raus: ['2 CO₂', '3 NADH', '1 FADH₂', '1 GTP', '1 CoA-SH', '3 H⁺'], note: '' };
  ov.bil = { basis: 'pro Glucose, gesamt', rein: ['1 Glucose', '6 O₂', 'ca. 30–32 ADP', 'ca. 30–32 Pᵢ'], raus: ['6 CO₂', '6 H₂O', 'ca. 30–32 ATP'], note: 'ATP aus: 2 Glykolyse + 2 GTP im Citratzyklus + ca. 26–28 in der Atmungskette.' };
  if (atm) atm.bil = { basis: 'pro Glucose (aus 10 NADH und 2 FADH₂)', rein: ['10 NADH', '2 FADH₂', '6 O₂', 'ca. 26–28 ADP', 'ca. 26–28 Pᵢ'], raus: ['10 NAD⁺', '2 FAD', '12 H₂O', 'ca. 26–28 ATP'], note: '' };
  window.PATHWAYS = [gly, pdh, tca].concat(window.PATHWAYS || []).concat([ov]);
})();
