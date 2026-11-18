/* Stoffwechselwege. Jeder Weg: Bauteile (comps), ein Schema (svg mit data-k), Reihenfolge-Aufgaben (orders) und Fragen (qs).
   Neue Wege einfach als weiteren Eintrag in window.PATHWAYS ergänzen. */
(function () {
  var ARR = '<defs><marker id="ae" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--accent)"/></marker>' +
    '<marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--o)"/></marker></defs>';
  function cx(k, x, w, lab) { return '<g data-k="' + k + '" class="pk" tabindex="0" role="button" aria-label="' + lab + '"><rect class="cx" x="' + x + '" y="112" width="' + w + '" height="80" rx="10"/><text class="big" x="' + (x + w / 2) + '" y="159">' + lab + '</text></g>'; }
  function e(d) { return '<path class="ef" d="' + d + '" marker-end="url(#ae)"/>'; }
  function hp(x, y1, y2, t, ty) { return '<path class="hf" d="M' + x + ',' + y1 + ' L' + x + ',' + y2 + '" marker-end="url(#ah)"/><text class="hl" x="' + x + '" y="' + ty + '">' + t + '</text>'; }
  function sa(x) { return '<path class="sf" d="M' + x + ',254 L' + x + ',196" marker-end="url(#ae)"/>'; }
  var svg = '<svg viewBox="0 0 440 312" role="img" aria-label="Schema der Atmungskette in der inneren Mitochondrienmembran">' + ARR +
    '<text class="zone" x="220" y="22">Intermembranraum · H⁺ hoch, pH niedrig</text>' +
    '<rect class="mem" x="0" y="130" width="440" height="44"/>' +
    '<text class="zone" x="220" y="304">Matrix · H⁺ niedrig, pH hoch</text>' +
    cx('k1', 10, 60, 'I') + cx('k2', 96, 40, 'II') + cx('k3', 208, 60, 'III') + cx('k4', 304, 56, 'IV') +
    '<g data-k="k5" class="pk" tabindex="0" role="button" aria-label="ATP-Synthase"><rect class="cx" x="376" y="112" width="56" height="80" rx="10"/><text class="big" x="404" y="159">F₀</text><circle class="cx" cx="404" cy="214" r="22"/><text class="big" x="404" y="220" style="font-size:16px">F₁</text></g>' +
    '<g data-k="q" class="pk" tabindex="0" role="button" aria-label="Ubichinon"><circle class="cq" cx="172" cy="152" r="13"/><text class="big" x="172" y="158" style="font-size:16px">Q</text></g>' +
    '<g data-k="c" class="pk" tabindex="0" role="button" aria-label="Cytochrom c"><ellipse class="cc" cx="286" cy="84" rx="16" ry="11"/><text class="big" x="286" y="89" style="font-size:15px">c</text></g>' +
    e('M70,184 C96,212 150,212 166,166') + e('M137,152 L157,152') + e('M185,152 L206,152') + e('M246,112 Q262,88 268,86') + e('M302,88 Q326,90 332,110') +
    sa(22) +
    '<g data-k="nadh" class="pk" tabindex="0" role="button" aria-label="NADH"><text class="sub" x="22" y="272">NADH</text><text class="sub" x="22" y="286">+ H⁺</text></g>' +
    sa(116) + '<text class="sub" x="116" y="272">Succinat</text>' +
    '<g data-k="o2" class="pk" tabindex="0" role="button" aria-label="Sauerstoff"><text class="sub" x="318" y="272">½ O₂</text><text class="sub" x="318" y="286">→ H₂O</text></g>' +
    sa(318) +
    hp(60, 190, 104, '4 H⁺', 96) + hp(222, 190, 104, '4 H⁺', 96) + hp(348, 190, 104, '2 H⁺', 96) +
    '<text class="hl off" x="116" y="104">kein H⁺</text>' +
    '<path class="hf" d="M388,104 L388,196" marker-end="url(#ah)"/><text class="hl" x="388" y="96">H⁺</text>' +
    '<text class="sub" x="404" y="256">ADP + Pᵢ</text><text class="sub" x="404" y="270">→ ATP</text>' +
    '<g class="leg"><path class="ef" d="M10,44 L40,44" marker-end="url(#ae)"/><text class="legt" x="46" y="48">Elektronen</text><path class="hf" d="M146,44 L176,44" marker-end="url(#ah)"/><text class="legt" x="182" y="48">Protonen</text></g>' +
    '</svg>';

  function mc(q, opts, a, why) { return { q: q, o: opts, a: a, why: why }; }
  window.PATHWAYS = [{
    id: 'atmungskette', name: 'Atmungskette', sub: 'Oxidative Phosphorylierung in der inneren Mitochondrienmembran',
    intro: 'Die Atmungskette überträgt Elektronen von NADH und FADH₂ über mehrere Komplexe auf Sauerstoff. Die frei werdende Energie pumpt Protonen aus der Matrix in den Intermembranraum. Der entstehende Protonengradient treibt die ATP-Synthase an. Tippe ein Bauteil im Schema an.',
    svg: svg,
    facts: [
      'Elektronen fließen von negativem zu positivem Redoxpotential: NAD⁺/NADH −0,32 V, Q/QH₂ ≈ +0,04 V, Cyt c ≈ +0,25 V, ½O₂/H₂O +0,82 V.',
      'Gepumpte H⁺ pro NADH: 4 (I) + 4 (III) + 2 (IV) = 10. Pro FADH₂: 4 + 2 = 6, weil Komplex II nichts pumpt.',
      'Rund 4 H⁺ pro ATP (3 durch F₀ plus 1 für den Phosphat-Transport): ca. 2,5 ATP pro NADH und ca. 1,5 ATP pro FADH₂.',
      'Entkoppler und Hemmstoffe: Hemmer (Rotenon, Antimycin A, Cyanid, Oligomycin) stoppen die Kette. Entkoppler (DNP, UCP1) lassen H⁺ an der ATP-Synthase vorbeifließen: Wärme statt ATP.'
    ],
    comps: [
      { id: 'nadh', name: 'NADH und FADH₂', alt: 'Reduktionsäquivalente', rolle: 'Elektronenspender aus Glykolyse, Citratzyklus und β-Oxidation. NADH gibt zwei Elektronen an Komplex I ab, FADH₂ (bzw. das FAD in Komplex II) über Komplex II an Ubichinon.', reaktion: 'NADH + H⁺ → NAD⁺ + 2 H⁺ + 2 e⁻', cof: 'E°′ (NAD⁺/NADH) = −0,32 V', h: '–', hemm: '–', alltag: 'Kommt aus der Nahrung (Kohlenhydrate, Fette). Vitamin B₃ (Niacin) ist der Baustein von NAD⁺, Vitamin B₂ (Riboflavin) der von FAD und FMN.' },
      { id: 'k1', name: 'Komplex I', alt: 'NADH-Dehydrogenase · NADH-Q-Oxidoreduktase', rolle: 'Nimmt Elektronen von NADH auf und gibt sie an Ubichinon weiter. Größter Komplex der Kette.', reaktion: 'NADH + H⁺ + Q → NAD⁺ + QH₂', cof: 'FMN und mehrere Eisen-Schwefel-Cluster (Fe-S)', h: '4 H⁺ pro NADH (Matrix → Intermembranraum)', hemm: 'Rotenon, Piericidin A, Amytal', alltag: 'Rotenon ist ein Pflanzengift (Derris-Wurzel), das als Fisch- und Insektengift diente. Das Diabetesmittel Metformin hemmt unter anderem Komplex I.' },
      { id: 'k2', name: 'Komplex II', alt: 'Succinat-Dehydrogenase · Succinat-Q-Oxidoreduktase', rolle: 'Zugleich Enzym des Citratzyklus. Oxidiert Succinat zu Fumarat und gibt die Elektronen über FAD und Fe-S-Cluster an Ubichinon. Der einzige Komplex, der keine Protonen pumpt.', reaktion: 'Succinat + Q → Fumarat + QH₂', cof: 'FAD (fest gebunden), Fe-S-Cluster, Häm b', h: '0 H⁺ (die frei werdende Energie reicht nicht zum Pumpen)', hemm: 'Malonat (kompetitiv, Succinat-Analogon), Carboxin, TTFA', alltag: 'Carboxin ist ein Fungizid, mit dem Saatgut gegen Pilze gebeizt wird. Malonat ist der klassische Laborhemmstoff.' },
      { id: 'q', name: 'Ubichinon', alt: 'Coenzym Q₁₀ · Q (oxidiert), QH₂ (reduziert, Ubihydrochinon)', rolle: 'Lipophiler, frei beweglicher Elektronenträger in der Membran. Sammelt Elektronen von Komplex I und II und bringt sie zu Komplex III. Nimmt 2 e⁻ und 2 H⁺ auf, über das Semichinon als Zwischenstufe.', reaktion: 'Q + 2 e⁻ + 2 H⁺ ⇌ QH₂', cof: 'Chinonring mit langer Isoprenoid-Seitenkette (beim Menschen 10 Einheiten)', h: 'transportiert H⁺, pumpt aber nicht selbst', hemm: '–', alltag: 'Als „Q10“ ein beliebtes Nahrungsergänzungsmittel. Der Körper stellt es selbst her, über den Mevalonatweg (wie Cholesterin).' },
      { id: 'k3', name: 'Komplex III', alt: 'Cytochrom-bc₁-Komplex · Q-Cytochrom-c-Oxidoreduktase', rolle: 'Überträgt Elektronen von QH₂ auf Cytochrom c. Im Q-Zyklus wird QH₂ aufgeteilt: ein Elektron geht zu Cyt c, das zweite über Cyt b zurück zum Q.', reaktion: 'QH₂ + 2 Cyt c (Fe³⁺) → Q + 2 Cyt c (Fe²⁺) + 2 H⁺', cof: 'Cytochrom b (b_L, b_H), Cytochrom c₁, Rieske-Fe-S-Protein', h: '4 H⁺ pro QH₂ gelangen in den Intermembranraum', hemm: 'Antimycin A, Myxothiazol, Stigmatellin', alltag: 'Antimycin A ist ein Antibiotikum aus Streptomyces-Bakterien und wird als Fischgift eingesetzt.' },
      { id: 'c', name: 'Cytochrom c', alt: 'Cyt c', rolle: 'Kleines lösliches Häm-Protein im Intermembranraum. Pendelt zwischen Komplex III und IV und trägt nur ein Elektron (Fe³⁺ ⇌ Fe²⁺).', reaktion: 'Cyt c (Fe³⁺) + e⁻ ⇌ Cyt c (Fe²⁺)', cof: 'Häm c', h: '–', hemm: '–', alltag: 'Bei starkem Zellstress tritt Cyt c aus den Mitochondrien aus und löst die Apoptose aus (Aktivierung der Caspasen).' },
      { id: 'k4', name: 'Komplex IV', alt: 'Cytochrom-c-Oxidase', rolle: 'Überträgt vier Elektronen von Cyt c auf O₂ und bildet Wasser. Letzter Schritt der Kette.', reaktion: '4 Cyt c (Fe²⁺) + 4 H⁺ + O₂ → 4 Cyt c (Fe³⁺) + 2 H₂O', cof: 'Cu_A, Häm a, Häm a₃, Cu_B (Eisen und Kupfer)', h: '2 H⁺ pro 2 e⁻ (4 H⁺ pro O₂)', hemm: 'Cyanid, Kohlenmonoxid (CO), Azid, Schwefelwasserstoff (H₂S)', alltag: 'Cyanid (Bittermandeln, Brandrauch) und CO (defekte Heizungen) blockieren die Zellatmung: Die Zellen können trotz Sauerstoff im Blut keinen O₂ verwerten.' },
      { id: 'o2', name: 'Sauerstoff (O₂)', alt: 'letzter Elektronenakzeptor', rolle: 'Nimmt am Ende der Kette die Elektronen auf und wird zu Wasser reduziert. Ohne O₂ staut sich die Kette zurück, NADH wird nicht mehr zu NAD⁺ oxidiert.', reaktion: '½ O₂ + 2 H⁺ + 2 e⁻ → H₂O', cof: 'E°′ (½O₂/H₂O) = +0,82 V', h: '–', hemm: '–', alltag: 'Der Grund, warum wir atmen. Bei unvollständiger Reduktion entstehen reaktive Sauerstoffspezies (ROS).' },
      { id: 'k5', name: 'Komplex V', alt: 'ATP-Synthase · F₀F₁-ATPase', rolle: 'Nutzt den Protonengradienten (protonenmotorische Kraft). H⁺ strömen durch F₀ zurück in die Matrix, der c-Ring dreht sich und treibt F₁ an, das ATP aus ADP + Pᵢ bildet.', reaktion: 'ADP + Pᵢ + ca. 4 H⁺ (außen) → ATP + H₂O', cof: 'F₀: c-Ring und a-Untereinheit in der Membran; F₁: α₃β₃γδε in der Matrix (katalytisch)', h: 'verbraucht ca. 3 H⁺ pro ATP (+1 H⁺ für den Phosphat-Transport)', hemm: 'Oligomycin (blockiert F₀)', alltag: 'Entkoppler wie 2,4-Dinitrophenol (früher als Diätmittel, lebensgefährlich) oder UCP1 (Thermogenin) im braunen Fett lassen H⁺ an der ATP-Synthase vorbeifließen. Es entsteht Wärme statt ATP, z. B. bei Neugeborenen.' }
    ],
    orders: [
      { title: 'Elektronenweg ab NADH', items: [['nadh', 'NADH'], ['k1', 'Komplex I'], ['q', 'Ubichinon (Q)'], ['k3', 'Komplex III'], ['c', 'Cytochrom c'], ['k4', 'Komplex IV'], ['o2', 'O₂']] },
      { title: 'Elektronenweg ab Succinat', items: [['s', 'Succinat'], ['k2', 'Komplex II'], ['q', 'Ubichinon (Q)'], ['k3', 'Komplex III'], ['c', 'Cytochrom c'], ['k4', 'Komplex IV'], ['o2', 'O₂']] }
    ],
    qs: [
      mc('Welcher Komplex der Atmungskette pumpt keine Protonen?', ['Komplex I', 'Komplex II', 'Komplex III', 'Komplex IV'], 1, 'Komplex II (Succinat-Dehydrogenase) liefert nur Elektronen an Q. Der Energiegewinn reicht nicht zum Pumpen.'),
      mc('Wie viele H⁺ pumpt Komplex I pro NADH?', ['2', '4', '6', '10'], 1, 'Komplex I pumpt 4 H⁺ pro NADH.'),
      mc('Wie viele H⁺ pumpt Komplex IV pro Sauerstoffatom (2 e⁻)?', ['1', '2', '4', '6'], 1, 'Pro 2 e⁻ pumpt Komplex IV 2 H⁺, pro vollständigem O₂ also 4 H⁺.'),
      mc('Wie viele H⁺ werden insgesamt pro NADH in den Intermembranraum gepumpt?', ['4', '6', '8', '10'], 3, '4 (I) + 4 (III) + 2 (IV) = 10 H⁺.'),
      mc('Wie viele H⁺ werden pro FADH₂ gepumpt?', ['4', '6', '8', '10'], 1, 'FADH₂ umgeht Komplex I: 4 (III) + 2 (IV) = 6 H⁺.'),
      mc('Wie viel ATP entsteht ungefähr pro NADH?', ['1,5', '2,5', '3,5', '4,5'], 1, '10 H⁺ ÷ ca. 4 H⁺ pro ATP ≈ 2,5 ATP.'),
      mc('Wie viel ATP entsteht ungefähr pro FADH₂?', ['0,5', '1,5', '2,5', '3,5'], 1, '6 H⁺ ÷ ca. 4 H⁺ pro ATP ≈ 1,5 ATP.'),
      mc('Wer überträgt Elektronen von Komplex III auf Komplex IV?', ['Ubichinon', 'Cytochrom c', 'FMN', 'NAD⁺'], 1, 'Cytochrom c ist ein kleines lösliches Häm-Protein im Intermembranraum.'),
      mc('Welcher Carrier ist lipophil und wandert frei in der Membran?', ['Cytochrom c', 'NADH', 'Ubichinon', 'ATP'], 2, 'Ubichinon (Coenzym Q) trägt 2 e⁻ und 2 H⁺ von Komplex I/II zu Komplex III.'),
      mc('Wo befindet sich Cytochrom c?', ['In der Matrix', 'Im Intermembranraum', 'In der äußeren Membran', 'Im Cytosol'], 1, 'Es sitzt locker an der Außenseite der inneren Membran im Intermembranraum.'),
      mc('Was ist der letzte Elektronenakzeptor der Atmungskette?', ['NAD⁺', 'Cytochrom c', 'O₂', 'CO₂'], 2, 'O₂ wird zu H₂O reduziert (E°′ = +0,82 V, das positivste Potential der Kette).'),
      mc('Cyanid und Kohlenmonoxid hemmen welchen Komplex?', ['Komplex I', 'Komplex II', 'Komplex III', 'Komplex IV'], 3, 'Beide binden an das Häm a₃/Cu_B-Zentrum der Cytochrom-c-Oxidase.'),
      mc('Rotenon hemmt welchen Komplex?', ['Komplex I', 'Komplex II', 'Komplex III', 'Komplex IV'], 0, 'Rotenon blockiert die Übergabe der Elektronen von Komplex I an Ubichinon.'),
      mc('Antimycin A hemmt welchen Komplex?', ['Komplex I', 'Komplex II', 'Komplex III', 'ATP-Synthase'], 2, 'Antimycin A blockiert die Q-Bindestelle von Komplex III (Cytochrom b).'),
      mc('Oligomycin hemmt …', ['Komplex I', 'Komplex IV', 'Cytochrom c', 'die ATP-Synthase (F₀)'], 3, 'Oligomycin blockiert den Protonenkanal F₀, dadurch staut sich auch die Atmungskette zurück.'),
      mc('Welcher Stoff ist ein kompetitiver Hemmstoff von Komplex II?', ['Malonat', 'Rotenon', 'Cyanid', 'Oligomycin'], 0, 'Malonat ähnelt Succinat und besetzt dessen Bindestelle.'),
      mc('Welcher Cofaktor nimmt die Elektronen im Komplex I zuerst auf?', ['FAD', 'FMN', 'Häm a', 'Cu_A'], 1, 'FMN (aus Vitamin B₂), danach wandern die Elektronen über Fe-S-Cluster zum Q.'),
      mc('Welcher Cofaktor ist fest in Komplex II gebunden?', ['FMN', 'NAD⁺', 'FAD', 'Cu_B'], 2, 'FAD, dazu Fe-S-Cluster und Häm b. Komplex II ist zugleich Enzym des Citratzyklus.'),
      mc('Was bewirkt ein Entkoppler wie 2,4-Dinitrophenol?', ['Er stoppt den Elektronentransport', 'H⁺ fließen ohne ATP-Synthase zurück, es entsteht Wärme', 'Er hemmt die ATP-Synthase', 'Er erhöht die ATP-Ausbeute'], 1, 'Der Protonengradient wird abgebaut, ohne dass ATP entsteht. Die Energie geht als Wärme verloren.'),
      mc('Was treibt die ATP-Synthase direkt an?', ['NADH', 'Der Protonengradient (protonenmotorische Kraft)', 'Sauerstoff', 'Cytochrom c'], 1, 'Der Rückfluss der H⁺ durch F₀ dreht den c-Ring und treibt F₁ an.'),
      mc('Wo ist der pH-Wert niedriger?', ['In der Matrix', 'Im Intermembranraum', 'Beide gleich', 'Im Cytosol der Matrix'], 1, 'Dorthin werden die Protonen gepumpt, die Matrix wird dadurch basischer.'),
      mc('In welchem Komplex läuft der Q-Zyklus ab?', ['Komplex I', 'Komplex II', 'Komplex III', 'Komplex IV'], 2, 'Der Q-Zyklus gehört zum Cytochrom-bc₁-Komplex.'),
      mc('Welcher Komplex ist die Cytochrom-c-Oxidase?', ['Komplex I', 'Komplex II', 'Komplex III', 'Komplex IV'], 3, 'Komplex IV überträgt die Elektronen von Cyt c auf O₂.'),
      mc('Welcher Komplex heißt auch Cytochrom-bc₁-Komplex?', ['Komplex I', 'Komplex II', 'Komplex III', 'Komplex IV'], 2, 'Komplex III, Q-Cytochrom-c-Oxidoreduktase.'),
      mc('Welches Metall ist in Komplex IV neben Eisen entscheidend?', ['Zink', 'Kupfer', 'Magnesium', 'Mangan'], 1, 'Cu_A und Cu_B, zusammen mit Häm a und Häm a₃.'),
      mc('Wo liegt der katalytische Teil F₁ der ATP-Synthase?', ['Im Intermembranraum', 'In der äußeren Membran', 'Auf der Matrixseite', 'Im Cytosol'], 2, 'F₀ steckt in der Membran, F₁ ragt in die Matrix.'),
      mc('Wie viele Elektronen nimmt Ubichinon auf, um zu QH₂ zu werden?', ['1', '2', '3', '4'], 1, 'Q nimmt 2 e⁻ und 2 H⁺ auf (Cyt c dagegen nur 1 e⁻).'),
      mc('Wie viele H⁺ braucht die ATP-Synthase ungefähr pro ATP (inklusive Phosphat-Transport)?', ['1', '2', '4', '8'], 2, 'Etwa 3 H⁺ durch F₀ plus 1 H⁺ für den Phosphat-Transport.'),
      mc('Welches Redoxpaar hat das positivste Standardpotential?', ['NAD⁺/NADH', 'Q/QH₂', 'Cytochrom c', '½ O₂/H₂O'], 3, 'Elektronen fließen vom negativen NADH (−0,32 V) zum positiven O₂ (+0,82 V).'),
      mc('Welches Enzym des Citratzyklus ist Teil der Atmungskette?', ['Citrat-Synthase', 'Succinat-Dehydrogenase', 'Malat-Dehydrogenase', 'Aconitase'], 1, 'Die Succinat-Dehydrogenase ist Komplex II und sitzt in der inneren Membran.')
    ]
  }];
})();
