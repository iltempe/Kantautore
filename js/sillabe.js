// Sillabazione dell'italiano (euristica, buona per uso pratico) + utilità per le rime.
// Funziona sia nella pagina sia dentro un Web Worker (espone su globalThis).
(function (g) {
  const ACCENTED = 'àáâèéêìíîòóôùúû';
  const PLAIN_OF = { 'à':'a','á':'a','â':'a','è':'e','é':'e','ê':'e','ì':'i','í':'i','î':'i','ò':'o','ó':'o','ô':'o','ù':'u','ú':'u','û':'u' };
  const VOWELS = 'aeiouàáâèéêìíîòóôùúû';
  const WEAK = 'iu';                 // semivocali (i, u NON accentate)
  const isVowel = c => VOWELS.includes(c);
  const isWeak  = c => WEAK.includes(c);         // solo i/u semplici
  const isAccented = c => ACCENTED.includes(c);
  const plain = c => PLAIN_OF[c] || c;

  // Digrammi/trigrammi consonantici inseparabili
  const DIGRAPHS = ['gli', 'sci', 'gn', 'gl', 'ch', 'gh', 'sc', 'ci', 'gi'];
  // attacchi muta+liquida e s-impura li gestiamo nelle regole

  function isDiphthong(a, b) {
    // due vocali contigue formano dittongo se almeno una è semivocale (i/u non accentata)
    if (isWeak(a) && isVowel(b)) return true;            // ia, ie, io, iu, ua, ue, ...
    if (isVowel(a) && isWeak(b)) return true;            // ai, ei, oi, au, eu, ...
    return false;                                        // due forti, o accentata => iato
  }

  // Spezza la parola in nuclei vocalici, restituisce gli indici di confine
  function syllabify(word) {
    const w = word.toLowerCase();
    const n = w.length;
    if (!n) return [word];

    // 1) trova i nuclei (gruppi di vocali che stanno insieme)
    const nuclei = []; // {start,end} su indici di carattere
    let i = 0;
    while (i < n) {
      if (isVowel(w[i])) {
        let s = i, e = i;
        while (e + 1 < n && isVowel(w[e + 1]) && isDiphthong(w[e], w[e + 1])) e++;
        nuclei.push({ s, e });
        i = e + 1;
      } else i++;
    }
    if (nuclei.length <= 1) return [word];

    // 2) per ogni coppia di nuclei, decidi dove tagliare le consonanti in mezzo
    const cuts = []; // indice di carattere dove inizia una nuova sillaba
    for (let k = 0; k < nuclei.length - 1; k++) {
      const cs = nuclei[k].e + 1;        // inizio cluster
      const ce = nuclei[k + 1].s;        // fine cluster (escluso)
      const cl = w.slice(cs, ce);
      let cut;
      if (cl.length === 0) {
        cut = cs;                         // iato: taglia tra le due vocali
      } else if (cl.length === 1) {
        cut = cs;                         // V-CV
      } else {
        const splitInside = onsetSplit(cl);
        cut = cs + splitInside;
      }
      cuts.push(cut);
    }

    // 3) costruisci le sillabe dai punti di taglio
    const parts = [];
    let prev = 0;
    for (const c of cuts) { parts.push(word.slice(prev, c)); prev = c; }
    parts.push(word.slice(prev));
    return parts.filter(p => p.length);
  }

  // Dato un cluster consonantico, ritorna quante consonanti restano alla sillaba precedente
  function onsetSplit(cl) {
    // s impura: s + consonante(i) -> tutto va dopo (mo-stro, pa-sta)
    if (cl[0] === 's' && cl.length >= 2 && !isVowel(cl[1])) return 0;
    // digrammi che non si dividono mai
    if (/^(gn|gl|ch|gh|sc)/.test(cl) && cl.length === 2) return 0;
    if (cl.length === 2) {
      // muta + liquida (l/r) resta unita: ca-pra, a-tle...
      if ('lr'.includes(cl[1]) && 'bcdfgptv'.includes(cl[0])) return 0;
      // doppie e altre coppie: si dividono
      return 1;
    }
    // 3+ consonanti: la prima resta, il resto va dopo (al-tro, com-pra)
    return 1;
  }

  // Chiave di rima: dalla penultima vocale in poi (copre le parole piane),
  // oppure dall'ultima vocale se è accentata (parole tronche).
  function rhymeKey(word) {
    const w = word.toLowerCase();
    const vIdx = [];
    for (let i = 0; i < w.length; i++) if (isVowel(w[i])) vIdx.push(i);
    if (!vIdx.length) return w;
    const last = vIdx[vIdx.length - 1];
    if (isAccented(w[last])) return normalize(w.slice(last)); // tronca
    if (vIdx.length >= 2) return normalize(w.slice(vIdx[vIdx.length - 2]));
    return normalize(w.slice(last));
  }

  // come rhymeKey ma più ampia (assonanza): solo le vocali finali
  function assonanceKey(word) {
    return rhymeKey(word).replace(/[^aeiou]/g, '');
  }

  function normalize(s) {
    return s.split('').map(plain).join('');
  }

  function countSyllables(word) { return syllabify(word).length; }

  // Conteggio sillabe per l'inglese (euristica classica, ~85% accurata).
  function countSyllablesEn(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    w = w.replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  }

  const api = { syllabify, countSyllables, countSyllablesEn, rhymeKey, assonanceKey, normalize, isVowel, isAccented, plain };
  g.SILLABE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
