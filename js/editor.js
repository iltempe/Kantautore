// Editor testi & accordi — sintassi ChordPro semplificata, salvataggio in localStorage.
(function () {
  const LS = 'kan_songs_v1';
  const T = window.I18N;
  const $ = s => document.querySelector(s);
  const srcEl = $('#src'), titleEl = $('#title'), previewEl = $('#preview'),
        listEl = $('#songlist'), semisEl = $('#semis');

  let db = load();
  let currentId = null;
  let semis = 0;

  function load() {
    try { return JSON.parse(localStorage.getItem(LS)) || { songs: [] }; }
    catch { return { songs: [] }; }
  }
  function save() { localStorage.setItem(LS, JSON.stringify(db)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // ---- Trasporto accordi ----
  const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const ROOT_RE = /^([A-G])(#|b)?(.*)$/;

  function transposeChord(ch, n) {
    if (!n) return ch;
    const m = ch.match(ROOT_RE);
    if (!m) return ch;
    let [, letter, acc, rest] = m;
    let idx = SHARP.indexOf(letter + (acc || ''));
    if (idx < 0) idx = FLAT.indexOf(letter + (acc || ''));
    if (idx < 0) return ch;
    let ni = (idx + n) % 12; if (ni < 0) ni += 12;
    const useFlat = n < 0;
    let root = (useFlat ? FLAT : SHARP)[ni];
    // gestisci basso slash es. C/G
    rest = rest.replace(/\/([A-G])(#|b)?/, (_, l, a) => {
      let bi = SHARP.indexOf(l + (a || '')); if (bi < 0) bi = FLAT.indexOf(l + (a || ''));
      if (bi < 0) return '/' + l + (a || '');
      let nb = (bi + n) % 12; if (nb < 0) nb += 12;
      return '/' + (useFlat ? FLAT : SHARP)[nb];
    });
    return root + rest;
  }

  // ---- Rendering anteprima ----
  function render() {
    const text = srcEl.value;
    previewEl.innerHTML = '';
    for (const raw of text.split('\n')) {
      const line = raw.replace(/\s+$/, '');
      if (/^\s*#/.test(line)) {
        const d = document.createElement('div');
        d.className = 'comment'; d.textContent = line.replace(/^\s*#\s?/, '');
        previewEl.appendChild(d); continue;
      }
      const dir = line.match(/^\s*\{(.+?)\}\s*$/);
      if (dir) {
        const inner = dir[1];
        const tm = inner.match(/^\s*(titolo|title)\s*:\s*(.+)$/i);
        const d = document.createElement('div');
        if (tm) { d.className = 'directive'; d.textContent = '♪ ' + tm[2]; }
        else { d.className = 'directive'; d.textContent = '[ ' + inner + ' ]'; }
        previewEl.appendChild(d); continue;
      }
      if (line.trim() === '') {
        const b = document.createElement('div'); b.className = 'blank';
        previewEl.appendChild(b); continue;
      }
      previewEl.appendChild(renderLyricLine(line));
    }
  }

  function renderLyricLine(line) {
    const div = document.createElement('div'); div.className = 'line';
    // spezza in segmenti [accordo]testo
    const re = /\[([^\]]*)\]/g;
    let last = 0, m, segs = [], firstChord = null;
    while ((m = re.exec(line))) {
      const before = line.slice(last, m.index);
      if (segs.length === 0 && before) segs.push({ chord: '', text: before });
      else if (before) segs[segs.length - 1].text += before;
      segs.push({ chord: m[1], text: '' });
      last = re.lastIndex;
    }
    const tail = line.slice(last);
    if (segs.length === 0) segs.push({ chord: '', text: tail });
    else segs[segs.length - 1].text += tail;

    for (const s of segs) {
      const seg = document.createElement('span'); seg.className = 'seg';
      const c = document.createElement('span'); c.className = 'chord';
      c.textContent = s.chord ? transposeChord(s.chord, semis) + ' ' : '';
      const l = document.createElement('span'); l.className = 'lyric';
      l.textContent = s.text || (s.chord ? ' ' : '');
      seg.appendChild(c); seg.appendChild(l);
      div.appendChild(seg);
    }
    return div;
  }

  // ---- Gestione canzoni ----
  function newSong() {
    const s = { id: uid(), title: '', src: '', updated: Date.now() };
    db.songs.unshift(s); save();
    open(s.id);
    titleEl.focus();
  }
  function open(id) {
    const s = db.songs.find(x => x.id === id);
    if (!s) return;
    currentId = id; semis = 0; semisEl.textContent = '0';
    titleEl.value = s.title; srcEl.value = s.src;
    render(); renderList();
  }
  function persistCurrent() {
    const s = db.songs.find(x => x.id === currentId);
    if (!s) return;
    s.title = titleEl.value; s.src = srcEl.value; s.updated = Date.now();
    // riordina per ultima modifica
    db.songs.sort((a, b) => b.updated - a.updated);
    save(); renderList();
  }
  function renderList() {
    listEl.innerHTML = '';
    if (!db.songs.length) { listEl.innerHTML = `<p class="muted">${T.t('editor.none')}</p>`; return; }
    for (const s of db.songs) {
      const row = document.createElement('div');
      row.className = 'song-row' + (s.id === currentId ? ' active' : '');
      const d = new Date(s.updated);
      row.innerHTML = `<span class="t">${s.title ? escapeHtml(s.title) : `<span class="muted">${T.t('common.untitled')}</span>`}</span>
        <span class="d">${d.toLocaleDateString(T.locale)} ${d.toLocaleTimeString(T.locale, { hour: '2-digit', minute: '2-digit' })}</span>
        <span class="x" title="Elimina">✕</span>`;
      row.querySelector('.t').onclick = () => open(s.id);
      row.querySelector('.d').onclick = () => open(s.id);
      row.querySelector('.x').onclick = (e) => { e.stopPropagation(); del(s.id); };
      listEl.appendChild(row);
    }
  }
  function del(id) {
    const s = db.songs.find(x => x.id === id);
    if (!confirm(T.t('editor.confirmDel', { t: s?.title || T.t('common.untitled') }))) return;
    db.songs = db.songs.filter(x => x.id !== id); save();
    if (currentId === id) {
      if (db.songs.length) open(db.songs[0].id);
      else { currentId = null; titleEl.value = ''; srcEl.value = ''; render(); }
    }
    renderList();
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // ---- Export ----
  function exportTxt() {
    const s = db.songs.find(x => x.id === currentId);
    if (!s) return;
    // applica trasporto al testo esportato
    const out = srcEl.value.replace(/\[([^\]]*)\]/g, (_, c) => '[' + transposeChord(c, semis) + ']');
    const blob = new Blob([(s.title ? s.title + '\n\n' : '') + out], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (s.title || T.t('editor.defName')).replace(/[^\w\-]+/g, '_') + '.txt';
    a.click(); URL.revokeObjectURL(a.href);
  }
  function printSong() {
    const s = db.songs.find(x => x.id === currentId);
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>${escapeHtml(s?.title || 'canzone')}</title>
      <style>body{font-family:monospace;padding:30px;color:#111}
      h1{font-family:sans-serif} .chord{color:#b85c00;font-weight:bold}
      .line{display:flex;flex-wrap:wrap;align-items:flex-end;margin-bottom:2px}
      .seg{display:inline-flex;flex-direction:column}.chord,.lyric{white-space:pre}
      .directive{color:#0066aa;font-weight:bold;margin:10px 0 4px}.comment{color:#888;font-style:italic}
      .chord{font-size:.8rem}</style></head><body>
      <h1>${escapeHtml(s?.title || '')}</h1>${previewEl.innerHTML}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 250);
  }

  // ---- Eventi ----
  let saveTimer;
  function onInput() { render(); clearTimeout(saveTimer); saveTimer = setTimeout(persistCurrent, 400); }
  srcEl.addEventListener('input', onInput);
  titleEl.addEventListener('input', onInput);
  $('#newSong').onclick = newSong;
  $('#up').onclick = () => { semis = Math.min(11, semis + 1); semisEl.textContent = (semis > 0 ? '+' : '') + semis; render(); };
  $('#down').onclick = () => { semis = Math.max(-11, semis - 1); semisEl.textContent = (semis > 0 ? '+' : '') + semis; render(); };
  $('#export').onclick = exportTxt;
  $('#print').onclick = printSong;

  // ---- Avvio ----
  if (db.songs.length) open(db.songs[0].id);
  else newSong();
})();
