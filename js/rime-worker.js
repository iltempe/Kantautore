// Web Worker: carica la lista di parole, costruisce un indice di rime e risponde alle ricerche.
importScripts('sillabe.js');
const S = self.SILLABE;

let words = [];
let byRhyme = new Map();      // chiave rima -> [parole]
let byAsson = new Map();      // chiave assonanza -> [parole]
let ready = false;

function indexInto(map, key, w) {
  let a = map.get(key);
  if (!a) { a = []; map.set(key, a); }
  a.push(w);
}

async function init() {
  try {
    const res = await fetch('../data/parole.min.txt');
    const txt = await res.text();
    words = txt.split('\n').filter(Boolean);
    for (const w of words) {
      indexInto(byRhyme, S.rhymeKey(w), w);
      indexInto(byAsson, S.assonanceKey(w), w);
    }
    ready = true;
    postMessage({ type: 'ready', count: words.length });
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
  const q = query.toLowerCase().trim().replace(/[^a-zàáâèéêìíîòóôùúûü]/g, '');
  if (!q) return { results: [], key: '' };
  const key = mode === 'assonanza' ? S.assonanceKey(q) : S.rhymeKey(q);
  const map = mode === 'assonanza' ? byAsson : byRhyme;
  const pool = (map.get(key) || []).filter(w => w !== q);
  const qSyl = S.countSyllables(q);
  const scored = pool.map(w => ({
    w,
    suf: commonSuffix(q, w),
    syl: S.countSyllables(w),
  }));
  // ordina: suffisso comune più lungo, poi sillabe simili, poi parola più corta
  scored.sort((a, b) =>
    b.suf - a.suf ||
    Math.abs(a.syl - qSyl) - Math.abs(b.syl - qSyl) ||
    a.w.length - b.w.length ||
    a.w.localeCompare(b.w)
  );
  return { results: scored.slice(0, 200), key, qSyl };
}

onmessage = (e) => {
  const { type, query, mode, id } = e.data;
  if (type === 'search') {
    if (!ready) { postMessage({ type: 'result', id, notReady: true }); return; }
    const r = search(query, mode);
    postMessage({ type: 'result', id, ...r });
  }
};

init();
