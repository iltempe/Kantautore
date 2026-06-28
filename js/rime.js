// Pagina Rime & metrica.
(function () {
  const S = window.SILLABE;
  const T = window.I18N;
  const $ = s => document.querySelector(s);

  // ---------- RIME (via worker) ----------
  const worker = new Worker('../js/rime-worker.js');
  const wordEl = $('#word'), rhymesEl = $('#rhymes'), statusEl = $('#rstatus');
  let mode = 'rima', reqId = 0, dictReady = false;
  const isEn = T.lang === 'en';
  worker.postMessage({ type: 'init', lang: T.lang });   // carica il dizionario della lingua giusta

  worker.onmessage = (e) => {
    const d = e.data;
    if (d.type === 'ready') {
      dictReady = true;
      statusEl.textContent = T.t('rime.ready', { n: d.count.toLocaleString(T.locale) });
      if (wordEl.value.trim()) doSearch();
    } else if (d.type === 'error') {
      statusEl.textContent = T.t('rime.err');
    } else if (d.type === 'result') {
      if (d.notReady) return;
      renderRhymes(d);
    }
  };

  function doSearch() {
    const q = wordEl.value.trim();
    if (!q) { rhymesEl.innerHTML = ''; statusEl.textContent = dictReady ? '' : T.t('rime.loading'); return; }
    if (!dictReady) return;
    worker.postMessage({ type: 'search', query: q, mode, id: ++reqId });
  }

  function renderRhymes(d) {
    rhymesEl.innerHTML = '';
    if (d.notFound) { statusEl.textContent = T.t('rime.notFound', { w: wordEl.value.trim() }); return; }
    if (!d.results.length) {
      statusEl.textContent = T.t(mode === 'assonanza' ? 'rime.noAsson' : 'rime.noRhyme', { w: wordEl.value.trim() });
      return;
    }
    const n = d.results.length + (d.results.length === 200 ? '+' : '');
    statusEl.textContent = isEn ? T.t('rime.countWordsEn', { n }) : T.t('rime.countWords', { n, k: d.key });
    for (const r of d.results) {
      const span = document.createElement('span');
      span.className = 'rhyme';
      const sufStart = r.w.length - r.suf;
      span.innerHTML = escapeHtml(r.w.slice(0, sufStart)) + '<b>' + escapeHtml(r.w.slice(sufStart)) + '</b>';
      span.title = T.t('rime.sylTitle', { n: r.syl });
      rhymesEl.appendChild(span);
    }
  }

  wordEl.addEventListener('input', debounce(doSearch, 180));
  $('#mode').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    [...$('#mode').children].forEach(x => x.classList.toggle('on', x === b));
    doSearch();
  });

  // ---------- METRICA ----------
  const metricInput = $('#metricInput'), linesEl = $('#lines');

  const NAMES = { 3:'ternario', 4:'quaternario', 5:'quinario', 6:'senario',
    7:'settenario', 8:'ottonario', 9:'novenario', 10:'decasillabo', 11:'endecasillabo',
    12:'dodecasillabo' };

  function isVowelChar(c) { return S.isVowel(c); }

  // conta le sillabe metriche di un verso applicando la sinalefe
  function metricLine(line) {
    const words = line.trim().split(/\s+/).filter(w => /[a-zàáâèéêìíîòóôùúûü]/i.test(w));
    if (!words.length) return null;
    const parts = words.map(w => {
      const clean = w.replace(/[^a-zàáâèéêìíîòóôùúûü']/gi, '');
      return { raw: w, syl: clean ? S.syllabify(clean) : [w], clean };
    });
    let count = parts.reduce((a, p) => a + p.syl.length, 0);

    // sinalefe: parola che finisce in vocale + parola che inizia in vocale (o h muta)
    let merges = 0;
    for (let i = 0; i < parts.length - 1; i++) {
      const a = parts[i].clean, b = parts[i + 1].clean;
      if (!a || !b) continue;
      const lastA = a[a.length - 1];
      let firstB = b[0];
      if (firstB === 'h') firstB = b[1] || '';
      if (isVowelChar(lastA) && firstB && isVowelChar(firstB)) merges++;
    }
    count -= merges;

    // aggiustamento verso piano: tronca (+1) se l'ultima parola finisce per vocale accentata
    const lastClean = parts[parts.length - 1].clean;
    const lastCh = lastClean[lastClean.length - 1] || '';
    const tronca = 'àáèéìíòóùú'.includes(lastCh);
    const metric = count + (tronca ? 1 : 0);

    return { parts, count, metric, merges, tronca };
  }

  // conteggio sillabe per l'inglese (senza sinalefe né nome del verso)
  function metricLineEn(line) {
    const words = line.trim().split(/\s+/).filter(w => /[a-z']/i.test(w));
    if (!words.length) return null;
    const count = words.reduce((a, w) => a + S.countSyllablesEn(w), 0);
    return { en: true, words, count };
  }

  function renderMetric() {
    linesEl.innerHTML = '';
    const lines = metricInput.value.split('\n');
    let any = false;
    for (const line of lines) {
      if (line.trim() === '') continue;
      const m = isEn ? metricLineEn(line) : metricLine(line);
      if (!m) continue;
      any = true;
      const row = document.createElement('div'); row.className = 'ml';
      if (m.en) {
        row.innerHTML =
          `<span class="cnt">${m.count}</span>` +
          `<span class="name"></span>` +
          `<span class="syl">${escapeHtml(m.words.join(' '))}</span>`;
      } else {
        const name = NAMES[m.metric] || '';
        const sylHtml = m.parts.map(p =>
          `<span class="w">` + p.syl.map(s => `<span class="s">${escapeHtml(s)}</span>`).join('<span class="dot">·</span>') + `</span>`
        ).join(' ');
        row.innerHTML =
          `<span class="cnt">${m.metric}</span>` +
          `<span class="name">${name}${m.tronca ? T.t('rime.tronco') : ''}</span>` +
          `<span class="syl">${sylHtml}</span>`;
      }
      linesEl.appendChild(row);
    }
    if (!any) linesEl.innerHTML = `<p class="muted">${T.t('rime.emptyMetric')}</p>`;
  }

  metricInput.addEventListener('input', debounce(renderMetric, 120));
  renderMetric();

  // ---------- util ----------
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
})();
