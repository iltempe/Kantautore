// Web Worker bilingue per le rime.
//  IT: lista di parole italiane + rime "per terminazione" (via sillabe.js).
//  EN: dizionario fonetico CMU (data/words_en.txt) -> rime sui suoni reali.
importScripts('sillabe.js');
const S = self.SILLABE;

let lang = 'it', ready = false;
let byRhyme = new Map();      // chiave -> [parole]
let byAsson = new Map();
let wordInfo = null;          // solo EN: parola -> {rhyme, asson, syl}

function indexInto(map, key, w) {
  let a = map.get(key);
  if (!a) { a = []; map.set(key, a); }
  a.push(w);
}

async function init(l) {
  lang = l === 'en' ? 'en' : 'it';
  try {
    if (lang === 'en') {
      const txt = await (await fetch('../data/words_en.txt')).text();
      wordInfo = new Map();
      let count = 0;
      for (const line of txt.split('\n')) {
        if (!line) continue;
        const [w, rh, as, sy] = line.split('\t');
        indexInto(byRhyme, rh, w);
        indexInto(byAsson, as, w);
        wordInfo.set(w, { rhyme: rh, asson: as, syl: +sy });
        count++;
      }
      ready = true;
      postMessage({ type: 'ready', count });
    } else {
      const txt = await (await fetch('../data/parole.min.txt')).text();
      const words = txt.split('\n').filter(Boolean);
      for (const w of words) {
        indexInto(byRhyme, S.rhymeKey(w), w);
        indexInto(byAsson, S.assonanceKey(w), w);
      }
      ready = true;
      postMessage({ type: 'ready', count: words.length });
    }
  } catch (e) {
    postMessage({ type: 'error', message: String(e) });
  }
}

function commonSuffix(a, b) {
  let i = a.length - 1, j = b.length - 1, n = 0;
  while (i >= 0 && j >= 0 && a[i] === b[j]) { i--; j--; n++; }
  return n;
}

function search(query, mode) {
  const raw = query.toLowerCase().trim();
  const assonance = mode === 'assonanza';
  const map = assonance ? byAsson : byRhyme;

  if (lang === 'en') {
    const q = raw.replace(/[^a-z]/g, '');
    if (!q) return { results: [], key: '' };
    const info = wordInfo.get(q);
    if (!info) return { results: [], key: '', notFound: true };
    const key = assonance ? info.asson : info.rhyme;
    const qSyl = info.syl;
    const pool = (map.get(key) || []).filter(w => w !== q);
    const scored = pool.map(w => ({ w, suf: commonSuffix(q, w), syl: (wordInfo.get(w) || {}).syl || 0 }));
    scored.sort((a, b) =>
      Math.abs(a.syl - qSyl) - Math.abs(b.syl - qSyl) || b.suf - a.suf ||
      a.w.length - b.w.length || a.w.localeCompare(b.w));
    return { results: scored.slice(0, 200), key, qSyl };
  }

  const q = raw.replace(/[^a-zàáâèéêìíîòóôùúûü]/g, '');
  if (!q) return { results: [], key: '' };
  const key = assonance ? S.assonanceKey(q) : S.rhymeKey(q);
  const qSyl = S.countSyllables(q);
  const pool = (map.get(key) || []).filter(w => w !== q);
  const scored = pool.map(w => ({ w, suf: commonSuffix(q, w), syl: S.countSyllables(w) }));
  scored.sort((a, b) =>
    b.suf - a.suf || Math.abs(a.syl - qSyl) - Math.abs(b.syl - qSyl) ||
    a.w.length - b.w.length || a.w.localeCompare(b.w));
  return { results: scored.slice(0, 200), key, qSyl };
}

onmessage = (e) => {
  const { type, query, mode, id, lang: l } = e.data;
  if (type === 'init') { init(l); return; }
  if (type === 'search') {
    if (!ready) { postMessage({ type: 'result', id, notReady: true }); return; }
    postMessage({ type: 'result', id, ...search(query, mode) });
  }
};
