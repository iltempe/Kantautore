// Worker: analisi BPM (onset envelope + autocorrelazione) e tonalità (chroma + Krumhansl-Schmuckler).

// ---- FFT radix-2 (in place, reale->complesso via array separati) ----
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k], ai = im[i + k];
        const br = re[i + k + len / 2], bi = im[i + k + len / 2];
        const tr = br * cwr - bi * cwi, ti = br * cwi + bi * cwr;
        re[i + k] = ar + tr; im[i + k] = ai + ti;
        re[i + k + len / 2] = ar - tr; im[i + k + len / 2] = ai - ti;
        const ncwr = cwr * wr - cwi * wi; cwi = cwr * wi + cwi * wr; cwr = ncwr;
      }
    }
  }
}

const MAJOR = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
const MINOR = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
const PC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function correlate(a, b) {
  const ma = avg(a), mb = avg(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < 12; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return num / (Math.sqrt(da * db) || 1);
}
const avg = a => a.reduce((s, v) => s + v, 0) / a.length;

function analyze(data, sr) {
  const N = 4096, hop = 2048;
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)); // Hann

  const chroma = new Float32Array(12);
  const energy = [];
  const re = new Float32Array(N), im = new Float32Array(N);

  const frames = Math.floor((data.length - N) / hop);
  for (let f = 0; f < frames; f++) {
    const off = f * hop;
    let e = 0;
    for (let i = 0; i < N; i++) { const s = data[off + i] * win[i]; re[i] = s; im[i] = 0; e += data[off + i] * data[off + i]; }
    energy.push(e);
    fft(re, im);
    for (let k = 1; k < N / 2; k++) {
      const freq = k * sr / N;
      if (freq < 55 || freq > 2000) continue;          // range utile per la tonalità
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
      const pc = ((Math.round(12 * Math.log2(freq / 440)) % 12) + 120) % 12;
      chroma[pc] += mag;
    }
    if (f % 12 === 0) postMessage({ type: 'progress', value: f / frames });
  }

  // ---- TONALITÀ ----
  let best = { score: -2 };
  for (let r = 0; r < 12; r++) {
    const majP = MAJOR.map((_, i) => MAJOR[(i - r + 12) % 12]);
    const minP = MINOR.map((_, i) => MINOR[(i - r + 12) % 12]);
    const sMaj = correlate(chroma, majP), sMin = correlate(chroma, minP);
    if (sMaj > best.score) best = { score: sMaj, root: r, mode: 'maggiore' };
    if (sMin > best.score) best = { score: sMin, root: r, mode: 'minore' };
  }

  // ---- BPM ----
  const onset = [];
  for (let i = 1; i < energy.length; i++) onset.push(Math.max(0, energy[i] - energy[i - 1]));
  const om = avg(onset);
  for (let i = 0; i < onset.length; i++) onset[i] -= om;       // rimuovi media
  const fps = sr / hop;
  const minLag = Math.floor(fps * 60 / 200);                   // 200 BPM
  const maxLag = Math.ceil(fps * 60 / 50);                     // 50 BPM
  let bestBpm = 0, bestCorr = -1;
  for (let lag = minLag; lag <= maxLag && lag < onset.length; lag++) {
    let c = 0;
    for (let i = 0; i + lag < onset.length; i++) c += onset[i] * onset[i + lag];
    if (c > bestCorr) { bestCorr = c; bestBpm = 60 * fps / lag; }
  }
  // normalizza nell'intervallo musicale tipico 70-180
  while (bestBpm < 70) bestBpm *= 2;
  while (bestBpm > 180) bestBpm /= 2;

  return {
    bpm: Math.round(bestBpm),
    key: PC[best.root],
    mode: best.mode,
    confidence: Math.max(0, Math.round(best.score * 100)),
  };
}

onmessage = (e) => {
  const { data, sampleRate } = e.data;
  try {
    const res = analyze(data, sampleRate);
    postMessage({ type: 'done', ...res });
  } catch (err) {
    postMessage({ type: 'error', message: String(err) });
  }
};
