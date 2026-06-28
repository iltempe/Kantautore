// Generatore di progressioni di accordi + grafo dei movimenti (armonia funzionale).
(function () {
  const $ = s => document.querySelector(s);
  const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  // tonalità che si scrivono con i bemolli (per nomi accordi più naturali)
  const FLAT_MAJOR = new Set([1,3,5,6,8,10]);   // Db Eb F Gb Ab Bb
  const FLAT_MINOR = new Set([0,2,3,5,8,10]);   // Cm Dm Ebm Fm Abm Bbm

  const SCALE = {
    major: { off: [0,2,4,5,7,9,11], qual: ['maj','min','min','maj','maj','min','dim'],
             roman: ['I','ii','iii','IV','V','vi','vii°'] },
    // minore con dominante maggiore (V), molto usata nel cantautorato
    minor: { off: [0,2,3,5,7,8,10], qual: ['min','dim','maj','min','maj','maj','maj'],
             roman: ['i','ii°','III','iv','V','VI','VII'] },
  };

  // Movimenti tipici: da grado -> [gradi raggiungibili] (con pesi per la generazione)
  const MOVES = {
    major: { 0:[[3,3],[4,3],[5,3],[1,2],[2,1]], 1:[[4,4],[6,2],[3,1]], 2:[[5,3],[3,2],[1,1]],
             3:[[4,4],[0,2],[1,2],[6,1]], 4:[[0,5],[5,2]], 5:[[1,3],[3,2],[4,2]], 6:[[0,4],[2,1]] },
    minor: { 0:[[3,3],[4,3],[5,3],[2,2],[1,1]], 1:[[4,4],[6,1]], 2:[[5,3],[3,2],[6,2]],
             3:[[4,4],[0,2],[1,2]], 4:[[0,5],[5,2]], 5:[[3,2],[1,2],[2,2],[6,2]], 6:[[2,3],[0,2]] },
  };

  // posizione dei nodi nel grafo per indice di grado (zone funzionali)
  const POS = {
    0:[120,70],  5:[120,195], 2:[120,320],          // Tonica
    3:[360,110], 1:[360,265],                        // Sottodominante
    4:[600,110], 6:[600,265],                        // Dominante
  };
  const SUFFIX = { maj:'', min:'m', dim:'dim' };
  const TRIAD  = { maj:[0,4,7], min:[0,3,7], dim:[0,3,6] };

  let keyRoot = 0, mode = 'major';
  let chords = [];          // [{name, roman, qual, pc, idx}]
  let prog = [];            // indici di grado scelti
  let selected = null;
  let actx = null;

  function ac() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); return actx; }

  function buildChords() {
    const sc = SCALE[mode];
    const useFlat = mode === 'major' ? FLAT_MAJOR.has(keyRoot) : FLAT_MINOR.has(keyRoot);
    const names = useFlat ? FLAT : SHARP;
    chords = sc.off.map((o, i) => {
      const pc = (keyRoot + o) % 12;
      return { name: names[pc] + SUFFIX[sc.qual[i]], roman: sc.roman[i], qual: sc.qual[i], pc, idx: i };
    });
  }

  // ---------- GRAFO ----------
  function center(i) { const [x, y] = POS[i]; return { x, y }; }
  function arrowPath(a, b, bend) {
    // curva quadratica con leggero scostamento perpendicolare per separare andata/ritorno
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const mx = (a.x + b.x) / 2 + nx * bend, my = (a.y + b.y) / 2 + ny * bend;
    // accorcia agli estremi per non entrare nei cerchi (r=34)
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
          <path d="M0 0 L10 5 L0 10 z" fill="var(--accent-2)"/>
        </marker>
      </defs>
      <text class="zone-label" x="120" y="24">Tonica</text>
      <text class="zone-label" x="360" y="24">Sottodominante</text>
      <text class="zone-label" x="600" y="24">Dominante</text>`;

    // archi
    const seen = new Set();
    for (const [from, list] of Object.entries(MOVES[mode])) {
      for (const [to] of list) {
        const a = center(+from), b = center(to);
        const back = seen.has(to + '-' + from);     // esiste già la freccia opposta?
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
    // nodi
    chords.forEach((c, i) => {
      const { x, y } = center(i);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'node'); g.dataset.idx = i;
      g.setAttribute('transform', `translate(${x},${y})`);
      g.innerHTML =
        `<circle r="34"></circle>` +
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

  function onNode(i) {
    selected = i;
    highlight();
    addToProg(i);
    playChord(i, ac().currentTime, 0.7);
  }

  // ---------- PROGRESSIONE ----------
  function addToProg(i) { prog.push(i); renderProg(); }
  function renderProg() {
    const el = $('#prog');
    if (!prog.length) { el.innerHTML = '<span class="empty">Clicca gli accordi nel grafo qui sotto, oppure premi “Genera” o scegli una progressione famosa.</span>'; return; }
    el.innerHTML = prog.map((idx, n) =>
      `<span class="chip" data-n="${n}"><span class="r">${chords[idx].roman}</span>${chords[idx].name}</span>`).join('');
  }
  function rebuildProgNames() { renderProg(); }   // i nomi seguono chords[] aggiornati

  // ---------- GENERAZIONE ----------
  function weightedPick(list) {
    const tot = list.reduce((s, m) => s + m[1], 0);
    let r = Math.random() * tot;
    for (const m of list) { if ((r -= m[1]) <= 0) return m[0]; }
    return list[0][0];
  }
  function generate() {
    const len = 4;
    let cur = 0; prog = [0];
    for (let k = 1; k < len; k++) {
      let opts = (MOVES[mode][cur] || []).filter(m => m[0] !== cur);
      // all'ultimo passo preferisci la dominante per poter risolvere
      cur = weightedPick(opts.length ? opts : [[0,1]]);
      prog.push(cur);
    }
    selected = prog[prog.length - 1];
    renderProg(); highlight();
  }

  // ---------- AUDIO ----------
  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function playChord(i, time, dur) {
    const c = chords[i];
    const rootMidi = 55 + c.pc;                 // registro medio-grave
    const notes = TRIAD[c.qual].map(s => rootMidi + s);
    const master = ac().createGain();
    master.gain.setValueAtTime(0.0001, time);
    master.gain.exponentialRampToValueAtTime(0.5, time + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    master.connect(ac().destination);
    for (const n of notes) {
      const o = ac().createOscillator();
      o.type = 'triangle'; o.frequency.value = midiToFreq(n);
      o.connect(master); o.start(time); o.stop(time + dur + 0.05);
    }
  }
  let playTimer = null;
  function playProg() {
    if (!prog.length) return;
    ac().resume();
    clearTimeout(playTimer);
    const step = 0.62, t0 = ac().currentTime + 0.05;
    prog.forEach((idx, n) => playChord(idx, t0 + n * step, step * 0.95));
    // evidenzia il chip a tempo
    document.querySelectorAll('.prog .chip').forEach(c => c.classList.remove('playing'));
    prog.forEach((idx, n) => setTimeout(() => {
      document.querySelectorAll('.prog .chip').forEach(c => c.classList.remove('playing'));
      const chip = document.querySelector(`.prog .chip[data-n="${n}"]`);
      if (chip) chip.classList.add('playing');
      if (n === prog.length - 1) setTimeout(() => chip && chip.classList.remove('playing'), step * 1000);
    }, 50 + n * step * 1000));
  }

  // ---------- PRESET ----------
  const PRESETS = {
    major: [
      { name: 'Pop', d: 'I–V–vi–IV', seq: [0,4,5,3] },
      { name: 'Sad/emo', d: 'vi–IV–I–V', seq: [5,3,0,4] },
      { name: "Anni '50", d: 'I–vi–IV–V', seq: [0,5,3,4] },
      { name: 'Jazz', d: 'ii–V–I', seq: [1,4,0] },
      { name: 'Folk', d: 'I–IV–V', seq: [0,3,4] },
      { name: 'Canone', d: 'I–V–vi–iii–IV–I–IV–V', seq: [0,4,5,2,3,0,3,4] },
    ],
    minor: [
      { name: 'Pop minore', d: 'i–VI–III–VII', seq: [0,5,2,6] },
      { name: 'Andaluso', d: 'i–VII–VI–V', seq: [0,6,5,4] },
      { name: 'Drammatico', d: 'i–iv–V', seq: [0,3,4] },
      { name: 'Malinconico', d: 'i–VI–iv–V', seq: [0,5,3,4] },
      { name: 'Tensione', d: 'i–V–VI–iv', seq: [0,4,5,3] },
    ],
  };
  function renderPresets() {
    $('#presets').innerHTML = PRESETS[mode].map((p, n) =>
      `<button data-n="${n}"><b>${p.name}</b> <span class="d">${p.d}</span></button>`).join('');
    $('#presets').querySelectorAll('button').forEach(b => b.onclick = () => {
      prog = PRESETS[mode][+b.dataset.n].seq.slice();
      selected = null; renderProg(); highlight();
    });
  }

  // ---------- EVENTI ----------
  function rebuildAll() {
    keyRoot = $('#key').selectedIndex;
    mode = $('#mode').value;
    buildChords(); renderGraph(); renderProg(); renderPresets();
  }
  $('#key').onchange = () => { keyRoot = $('#key').selectedIndex; buildChords(); renderGraph(); rebuildProgNames(); };
  $('#mode').onchange = rebuildAll;
  $('#gen').onclick = generate;
  $('#play').onclick = playProg;
  $('#undo').onclick = () => { prog.pop(); renderProg(); };
  $('#clear').onclick = () => { prog = []; selected = null; renderProg(); highlight(); };
  $('#copy').onclick = async () => {
    if (!prog.length) return;
    const txt = prog.map(i => chords[i].name).join(' - ');
    try { await navigator.clipboard.writeText(txt); $('#copy').textContent = '✅ Copiato'; setTimeout(() => $('#copy').textContent = '📋 Copia accordi', 1200); }
    catch { prompt('Copia gli accordi:', txt); }
  };

  // avvio
  rebuildAll();
})();
