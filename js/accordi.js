// Progressioni & emozioni: scegli un sentimento -> progressioni che lo evocano.
// Grafo dei movimenti (armonia funzionale) + generazione + ascolto Web Audio.
(function () {
  const $ = s => document.querySelector(s);
  const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const FLAT_MAJOR = new Set([1,3,5,6,8,10]);
  const FLAT_MINOR = new Set([0,2,3,5,8,10]);

  const SCALE = {
    major: { off: [0,2,4,5,7,9,11], qual: ['maj','min','min','maj','maj','min','dim'],
             roman: ['I','ii','iii','IV','V','vi','vii°'],
             // settima diatonica per grado (null = resta triade)
             sev:  ['maj7','m7','m7','maj7','7','m7',null] },
    minor: { off: [0,2,3,5,7,8,10], qual: ['min','dim','maj','min','maj','maj','maj'],
             roman: ['i','ii°','III','iv','V','VI','VII'],
             sev:  ['m7',null,'maj7','m7','7','maj7','7'] },
  };

  // intervalli (semitoni) dell'estensione, oltre alla triade
  const EXT_ADD = { 'maj7': 11, '7': 10, 'm7': 10, '6': 9, 'add9': 14 };
  // come si scrive l'estensione accanto al nome dell'accordo
  const EXT_LBL = { 'maj7': 'maj7', '7': '7', 'm7': '7', '6': '6', 'add9': 'add9' };

  const MOVES = {
    major: { 0:[[3,3],[4,3],[5,3],[1,2],[2,1]], 1:[[4,4],[6,2],[3,1]], 2:[[5,3],[3,2],[1,1]],
             3:[[4,4],[0,2],[1,2],[6,1]], 4:[[0,5],[5,2]], 5:[[1,3],[3,2],[4,2]], 6:[[0,4],[2,1]] },
    minor: { 0:[[3,3],[4,3],[5,3],[2,2],[1,1]], 1:[[4,4],[6,1]], 2:[[5,3],[3,2],[6,2]],
             3:[[4,4],[0,2],[1,2]], 4:[[0,5],[5,2]], 5:[[3,2],[1,2],[2,2],[6,2]], 6:[[2,3],[0,2]] },
  };

  const POS = {
    0:[120,70], 5:[120,195], 2:[120,320], 3:[360,110], 1:[360,265], 4:[600,110], 6:[600,265],
  };
  const SUFFIX = { maj:'', min:'m', dim:'dim' };
  const TRIAD  = { maj:[0,4,7], min:[0,3,7], dim:[0,3,6] };

  // ===== EMOZIONI =====
  // progs = sequenze di gradi (indici 0..6) nel modo dell'emozione
  const EMOTIONS = [
    { id:'malinconia', e:'😢', label:'Malinconia', mode:'minor', color:'#7b9cff', bpm:'65–80',
      feel:'lento, arpeggi morbidi', why:'Il modo minore e la discesa verso VI e III danno tristezza dolce, che non si risolve mai del tutto.',
      progs:[[0,5,2,6],[0,3,4,0],[0,5,3,4]] },
    { id:'nostalgia', e:'🥹', label:'Nostalgia', mode:'major', color:'#d8a657', bpm:'80–95',
      feel:'andamento ondeggiante, accordi colorati', why:'Il maggiore con il vi e il iii ricorda qualcosa di bello ma lontano. Con le settime diventa agrodolce.',
      progs:[[5,3,0,4],[0,2,3,0],[0,4,1,3]] },
    { id:'speranza', e:'🌅', label:'Speranza', mode:'major', color:'#7ee0c0', bpm:'95–115',
      feel:'crescendo, dinamica che cresce', why:'Partire dal IV e salire verso il V dà la sensazione di slancio in avanti, di apertura.',
      progs:[[3,0,4,0],[0,4,5,3],[3,4,0,0]] },
    { id:'gioia', e:'😀', label:'Gioia', mode:'major', color:'#ffd166', bpm:'120–140',
      feel:'ritmo vivace, accordi pieni', why:'Solo accordi maggiori (I–IV–V), tensioni minime: tutto suona luminoso e diretto.',
      progs:[[0,3,4,0],[0,4,3,4],[0,3,0,4]] },
    { id:'serenita', e:'😌', label:'Serenità', mode:'major', color:'#9be7a0', bpm:'70–90',
      feel:'calmo, accordi tenuti', why:'Il movimento plagale IV→I (la “cadenza amen”) chiude con dolcezza, senza la tensione del V.',
      progs:[[0,3,0,4],[0,4,3,0],[3,0,4,0]] },
    { id:'romantica', e:'😍', label:'Romantica', mode:'major', color:'#ff9ec7', bpm:'70–88',
      feel:'rubato, espressivo', why:'Il giro I–vi–ii–V e le settime creano calore e desiderio, tipico delle ballad.',
      progs:[[0,5,1,4],[0,5,3,4],[3,4,2,5]] },
    { id:'sognante', e:'🌙', label:'Sognante', mode:'major', color:'#c9a0ff', bpm:'85–100',
      feel:'sospeso, riverbero', why:'Accordi maggiori con settima maggiore (maj7) che “galleggiano”, senza una direzione obbligata.',
      progs:[[0,2,5,3],[3,0,2,5],[0,5,2,3]], color7:true },
    { id:'tensione', e:'😨', label:'Tensione', mode:'minor', color:'#ff9f6b', bpm:'100–125',
      feel:'incalzante, staccato', why:'Il ii° diminuito e il V irrisolto tengono l’ascoltatore in allerta, in attesa.',
      progs:[[0,1,4,0],[0,4,0,4],[0,3,1,4]] },
    { id:'epico', e:'🏔️', label:'Epico', mode:'minor', color:'#ffcf5e', bpm:'120–145',
      feel:'ampio, dinamica forte', why:'La salita VI→VII→i è un “lift” eroico: sembra che qualcosa di grande stia per accadere.',
      progs:[[5,6,0,0],[0,5,6,4],[5,6,0,4]] },
    { id:'rabbia', e:'😠', label:'Rabbia / Grinta', mode:'minor', color:'#ff6b6b', bpm:'140–165',
      feel:'duro, power chord', why:'Il minore con VII e VI in discesa, ritmo serrato: energia e urgenza, da suonare con distorsione.',
      progs:[[0,6,5,0],[0,3,6,0],[0,5,0,6]] },
    { id:'mistero', e:'🕵️', label:'Mistero', mode:'minor', color:'#8f8fe0', bpm:'85–105',
      feel:'rarefatto, note lunghe', why:'Movimenti verso il VI e il ii° diminuito, senza risoluzioni nette: lascia tutto in sospeso.',
      progs:[[0,5,3,1],[0,2,5,1],[0,5,1,4]] },
  ];

  let keyRoot = 0, mode = 'major', colored = false, emotion = null;
  let chords = [];   // triadi diatoniche {name, roman, qual, pc, idx, sev}
  let prog = [];
  let selected = null;
  let actx = null;
  function ac() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); return actx; }

  function buildChords() {
    const sc = SCALE[mode];
    const useFlat = mode === 'major' ? FLAT_MAJOR.has(keyRoot) : FLAT_MINOR.has(keyRoot);
    const names = useFlat ? FLAT : SHARP;
    chords = sc.off.map((o, i) => {
      const pc = (keyRoot + o) % 12;
      return { name: names[pc] + SUFFIX[sc.qual[i]], roman: sc.roman[i], qual: sc.qual[i], pc, idx: i, sev: sc.sev[i] };
    });
  }

  // nome e note di un accordo, con o senza colore (settima)
  function chordName(idx) {
    const c = chords[idx];
    if (colored && c.sev) return c.name + EXT_LBL[c.sev];
    return c.name;
  }
  function chordNotes(idx) {
    const c = chords[idx];
    const notes = TRIAD[c.qual].slice();
    if (colored && c.sev) notes.push(EXT_ADD[c.sev]);
    return notes.map(s => 55 + c.pc + s);   // midi
  }

  // ---------- GRAFO ----------
  function center(i) { const [x, y] = POS[i]; return { x, y }; }
  function arrowPath(a, b, bend) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const mx = (a.x + b.x) / 2 + nx * bend, my = (a.y + b.y) / 2 + ny * bend;
    const r = 38;
    const a2 = { x: a.x + dx / len * r, y: a.y + dy / len * r };
    const b2 = { x: b.x - dx / len * r, y: b.y - dy / len * r };
    return `M ${a2.x} ${a2.y} Q ${mx} ${my} ${b2.x} ${b2.y}`;
  }
  function renderGraph() {
    const svg = $('#graph');
    const NS = 'http://www.w3.org/2000/svg';
    svg.innerHTML = `
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--border)"/>
        </marker>
        <marker id="ahA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--emo-c, var(--accent-2))"/>
        </marker>
      </defs>
      <text class="zone-label" x="120" y="24">Tonica</text>
      <text class="zone-label" x="360" y="24">Sottodominante</text>
      <text class="zone-label" x="600" y="24">Dominante</text>`;
    const seen = new Set();
    for (const [from, list] of Object.entries(MOVES[mode])) {
      for (const [to] of list) {
        const a = center(+from), b = center(to);
        const back = seen.has(to + '-' + from);
        const bend = back ? 26 : (Math.abs(b.y - a.y) < 5 ? 0 : 14);
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', arrowPath(a, b, bend));
        p.setAttribute('class', 'arrow');
        p.setAttribute('marker-end', 'url(#ah)');
        p.dataset.from = from; p.dataset.to = to;
        svg.appendChild(p);
        seen.add(from + '-' + to);
      }
    }
    chords.forEach((c, i) => {
      const { x, y } = center(i);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'node'); g.dataset.idx = i;
      g.setAttribute('transform', `translate(${x},${y})`);
      g.innerHTML = `<circle r="34"></circle>` +
        `<text class="roman" y="-13" font-size="12">${c.roman}</text>` +
        `<text y="6" font-size="18">${c.name}</text>`;
      g.addEventListener('click', () => onNode(i));
      svg.appendChild(g);
    });
    highlight();
  }
  function highlight() {
    const svg = $('#graph');
    const outs = selected == null ? null : new Set((MOVES[mode][selected] || []).map(m => m[0]));
    svg.querySelectorAll('.arrow').forEach(p => {
      p.classList.remove('active', 'dim');
      p.setAttribute('marker-end', 'url(#ah)');
      if (selected == null) return;
      if (+p.dataset.from === selected) { p.classList.add('active'); p.setAttribute('marker-end', 'url(#ahA)'); }
      else p.classList.add('dim');
    });
    svg.querySelectorAll('.node').forEach(n => {
      const i = +n.dataset.idx;
      n.classList.toggle('selected', i === selected);
      n.classList.toggle('target', outs ? outs.has(i) : false);
    });
  }
  function onNode(i) { selected = i; highlight(); prog.push(i); renderProg(); playChord(i, ac().currentTime, 0.7); }

  // ---------- PROGRESSIONE ----------
  function renderProg() {
    const el = $('#prog');
    if (!prog.length) { el.innerHTML = '<span class="empty">Scegli un\'emozione e premi “Genera”, oppure clicca gli accordi nel grafo qui sotto.</span>'; return; }
    el.innerHTML = prog.map((idx, n) =>
      `<span class="chip" data-n="${n}"><span class="r">${chords[idx].roman}</span>${chordName(idx)}</span>`).join('');
  }

  // ---------- GENERAZIONE ----------
  function generate() {
    if (emotion) {
      const p = emotion.progs[Math.floor(Math.random() * emotion.progs.length)];
      prog = p.slice();
      if (emotion.color7) $('#colore').checked = colored = true;
    } else {
      let cur = 0; prog = [0];
      for (let k = 1; k < 4; k++) {
        const opts = (MOVES[mode][cur] || []).filter(m => m[0] !== cur);
        cur = weightedPick(opts.length ? opts : [[0, 1]]);
        prog.push(cur);
      }
    }
    selected = prog[prog.length - 1];
    renderProg(); highlight();
  }
  function weightedPick(list) {
    const tot = list.reduce((s, m) => s + m[1], 0);
    let r = Math.random() * tot;
    for (const m of list) if ((r -= m[1]) <= 0) return m[0];
    return list[0][0];
  }

  // ---------- AUDIO ----------
  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function playChord(i, time, dur) {
    const notes = chordNotes(i);
    const master = ac().createGain();
    master.gain.setValueAtTime(0.0001, time);
    master.gain.exponentialRampToValueAtTime(0.45, time + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    master.connect(ac().destination);
    for (const n of notes) {
      const o = ac().createOscillator();
      o.type = 'triangle'; o.frequency.value = midiToFreq(n);
      o.connect(master); o.start(time); o.stop(time + dur + 0.05);
    }
  }
  function playProg() {
    if (!prog.length) return;
    ac().resume();
    const step = 0.62, t0 = ac().currentTime + 0.05;
    prog.forEach((idx, n) => playChord(idx, t0 + n * step, step * 0.95));
    document.querySelectorAll('.prog .chip').forEach(c => c.classList.remove('playing'));
    prog.forEach((idx, n) => setTimeout(() => {
      document.querySelectorAll('.prog .chip').forEach(c => c.classList.remove('playing'));
      const chip = document.querySelector(`.prog .chip[data-n="${n}"]`);
      if (chip) chip.classList.add('playing');
      if (n === prog.length - 1) setTimeout(() => chip && chip.classList.remove('playing'), step * 1000);
    }, 50 + n * step * 1000));
  }

  // ---------- EMOZIONI UI ----------
  function renderEmotions() {
    $('#emotions').innerHTML = EMOTIONS.map(em =>
      `<button class="emo" data-id="${em.id}" style="--emo-c:${em.color}"><span class="e">${em.e}</span>${em.label}</button>`).join('');
    $('#emotions').querySelectorAll('.emo').forEach(b => b.onclick = () => selectEmotion(b.dataset.id));
  }
  function selectEmotion(id) {
    const em = EMOTIONS.find(e => e.id === id);
    const same = emotion && emotion.id === id;
    emotion = same ? null : em;                       // ri-clic = deseleziona
    document.documentElement.style.setProperty('--emo-c', emotion ? emotion.color : '');
    $('#emotions').querySelectorAll('.emo').forEach(b => b.classList.toggle('on', emotion && b.dataset.id === id));

    const info = $('#emoInfo');
    if (!emotion) { info.classList.remove('show'); $('#ideeTitle').textContent = 'Progressioni famose'; renderPresets(); return; }

    // imposta il modo dell'emozione
    mode = emotion.mode; $('#mode').value = mode;
    if (emotion.color7) { colored = true; $('#colore').checked = true; }
    buildChords(); renderGraph();

    info.classList.add('show');
    info.innerHTML =
      `<h3>${emotion.e} ${emotion.label}</h3>` +
      `<div class="meta"><span>Modo: <b>${mode === 'major' ? 'maggiore' : 'minore'}</b></span>` +
      `<span>Tempo suggerito: <b>${emotion.bpm} BPM</b></span><span>Carattere: <b>${emotion.feel}</b></span></div>` +
      `<p>${emotion.why}</p>`;

    // proponi subito una progressione dell'emozione
    generate();
    // mostra le idee dell'emozione nei preset
    $('#ideeTitle').textContent = `Idee per “${emotion.label}”`;
    renderPresets();
  }

  // ---------- PRESET / IDEE ----------
  const PRESETS = {
    major: [
      { name:'Pop', d:'I–V–vi–IV', seq:[0,4,5,3] }, { name:"Anni '50", d:'I–vi–IV–V', seq:[0,5,3,4] },
      { name:'Jazz', d:'ii–V–I', seq:[1,4,0] }, { name:'Folk', d:'I–IV–V', seq:[0,3,4] },
      { name:'Canone', d:'I–V–vi–iii–IV–I–IV–V', seq:[0,4,5,2,3,0,3,4] },
    ],
    minor: [
      { name:'Pop minore', d:'i–VI–III–VII', seq:[0,5,2,6] }, { name:'Andaluso', d:'i–VII–VI–V', seq:[0,6,5,4] },
      { name:'Drammatico', d:'i–iv–V', seq:[0,3,4] }, { name:'Malinconico', d:'i–VI–iv–V', seq:[0,5,3,4] },
    ],
  };
  function romanSeq(seq) { return seq.map(i => chords[i].roman).join('–'); }
  function renderPresets() {
    let items;
    if (emotion) items = emotion.progs.map(seq => ({ name: romanSeq(seq), d: seq.map(i => chordName(i)).join(' '), seq }));
    else items = PRESETS[mode];
    $('#presets').innerHTML = items.map((p, n) =>
      `<button data-n="${n}"><b>${p.name}</b> <span class="d">${p.d}</span></button>`).join('');
    const list = items;
    $('#presets').querySelectorAll('button').forEach(b => b.onclick = () => {
      prog = list[+b.dataset.n].seq.slice(); selected = null; renderProg(); highlight();
    });
  }

  // ---------- EVENTI ----------
  function rebuildAll() { keyRoot = $('#key').selectedIndex; mode = $('#mode').value; buildChords(); renderGraph(); renderProg(); renderPresets(); }
  $('#key').onchange = () => { keyRoot = $('#key').selectedIndex; buildChords(); renderGraph(); renderProg(); renderPresets(); };
  $('#mode').onchange = () => { emotion = null; document.documentElement.style.setProperty('--emo-c',''); $('#emotions').querySelectorAll('.emo').forEach(b=>b.classList.remove('on')); $('#emoInfo').classList.remove('show'); $('#ideeTitle').textContent='Progressioni famose'; rebuildAll(); };
  $('#colore').onchange = e => { colored = e.target.checked; renderProg(); renderPresets(); };
  $('#gen').onclick = generate;
  $('#play').onclick = playProg;
  $('#undo').onclick = () => { prog.pop(); renderProg(); };
  $('#clear').onclick = () => { prog = []; selected = null; renderProg(); highlight(); };
  $('#copy').onclick = async () => {
    if (!prog.length) return;
    const txt = prog.map(i => chordName(i)).join(' - ');
    try { await navigator.clipboard.writeText(txt); $('#copy').textContent = '✅ Copiato'; setTimeout(() => $('#copy').textContent = '📋 Copia accordi', 1200); }
    catch { prompt('Copia gli accordi:', txt); }
  };

  // avvio
  renderEmotions();
  rebuildAll();
})();
