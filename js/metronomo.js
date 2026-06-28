// Metronomo (Web Audio, scheduling lookahead) + accordatore cromatico (autocorrelazione).
(function () {
  const $ = s => document.querySelector(s);
  const T = window.I18N;
  let actx = null;
  function ac() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); return actx; }

  // =================== METRONOMO ===================
  let bpm = 100, beatsPerBar = 4, accentOn = true;
  let running = false, nextNoteTime = 0, beatInBar = 0, lookahead = 25, scheduleAhead = 0.1;
  let timer = null;
  const beatsEl = $('#beats');

  function buildBeats() {
    beatsEl.innerHTML = '';
    const n = beatsPerBar === 1 ? 1 : beatsPerBar;
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'beat' + (i === 0 && accentOn ? ' accent' : '');
      beatsEl.appendChild(d);
    }
  }
  function flashBeat(i) {
    const kids = beatsEl.children; if (!kids.length) return;
    const idx = i % kids.length;
    [...kids].forEach((k, j) => k.classList.toggle('on', j === idx));
    setTimeout(() => { if (kids[idx]) kids[idx].classList.remove('on'); }, 90);
  }
  function click(time, accent) {
    const o = ac().createOscillator(), g = ac().createGain();
    o.frequency.value = accent ? 1500 : 1000;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(accent ? 0.6 : 0.35, time + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    o.connect(g); g.connect(ac().destination);
    o.start(time); o.stop(time + 0.06);
  }
  function scheduler() {
    while (nextNoteTime < ac().currentTime + scheduleAhead) {
      const accent = accentOn && beatInBar === 0 && beatsPerBar !== 1;
      click(nextNoteTime, accent);
      const beatNow = beatInBar;
      const delay = (nextNoteTime - ac().currentTime) * 1000;
      setTimeout(() => flashBeat(beatNow), Math.max(0, delay));
      nextNoteTime += 60 / bpm;
      beatInBar = (beatInBar + 1) % (beatsPerBar === 1 ? 1 : beatsPerBar);
    }
  }
  function start() {
    if (running) return stop();
    ac().resume();
    running = true; beatInBar = 0; nextNoteTime = ac().currentTime + 0.05;
    timer = setInterval(scheduler, lookahead);
    $('#startBtn').textContent = T.t('metro.stop');
    $('#startBtn').classList.add('secondary');
  }
  function stop() {
    running = false; clearInterval(timer);
    [...beatsEl.children].forEach(k => k.classList.remove('on'));
    $('#startBtn').textContent = T.t('metro.start');
    $('#startBtn').classList.remove('secondary');
  }
  function setBpm(v) {
    bpm = Math.max(30, Math.min(260, Math.round(v)));
    $('#bpmVal').textContent = bpm; $('#bpmRange').value = bpm;
  }

  $('#bpmRange').addEventListener('input', e => setBpm(+e.target.value));
  $('#bpmPlus').onclick = () => setBpm(bpm + 1);
  $('#bpmMinus').onclick = () => setBpm(bpm - 1);
  $('#startBtn').onclick = start;
  $('#sig').addEventListener('change', e => { beatsPerBar = +e.target.value; beatInBar = 0; buildBeats(); });
  $('#accent').addEventListener('change', e => { accentOn = e.target.checked; buildBeats(); });

  // tap tempo
  let taps = [];
  $('#tap').onclick = () => {
    const now = performance.now();
    taps = taps.filter(t => now - t < 2500); taps.push(now);
    if (taps.length >= 2) {
      const diffs = []; for (let i = 1; i < taps.length; i++) diffs.push(taps[i] - taps[i - 1]);
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      setBpm(60000 / avg);
    }
  };
  buildBeats();

  // =================== ACCORDATORE ===================
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  let tuning = false, analyser = null, buf = null, rafId = null, stream = null;

  function freqToNote(f) {
    const n = 12 * Math.log2(f / 440) + 69;          // numero MIDI
    const midi = Math.round(n);
    const cents = Math.round((n - midi) * 100);
    return { name: NOTE_NAMES[midi % 12], octave: Math.floor(midi / 12) - 1, cents };
  }

  // autocorrelazione (algoritmo classico, robusto su voce/strumento)
  function autoCorrelate(b, sampleRate) {
    let size = b.length, rms = 0;
    for (let i = 0; i < size; i++) rms += b[i] * b[i];
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) return -1;                        // troppo silenzio

    let r1 = 0, r2 = size - 1, thres = 0.2;
    for (let i = 0; i < size / 2; i++) if (Math.abs(b[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < size / 2; i++) if (Math.abs(b[size - i]) < thres) { r2 = size - i; break; }
    const c = b.slice(r1, r2); size = c.length;

    const corr = new Array(size).fill(0);
    for (let lag = 0; lag < size; lag++)
      for (let i = 0; i < size - lag; i++) corr[lag] += c[i] * c[i + lag];

    let d = 0; while (d < size - 1 && corr[d] > corr[d + 1]) d++;
    let maxv = -1, maxp = -1;
    for (let i = d; i < size; i++) if (corr[i] > maxv) { maxv = corr[i]; maxp = i; }
    if (maxp <= 0) return -1;
    // interpolazione parabolica
    const x1 = corr[maxp - 1] || 0, x2 = corr[maxp], x3 = corr[maxp + 1] || 0;
    const a = (x1 + x3 - 2 * x2) / 2, b2 = (x3 - x1) / 2;
    const shift = a ? -b2 / (2 * a) : 0;
    return sampleRate / (maxp + shift);
  }

  let smoothCents = 0;
  function loop() {
    analyser.getFloatTimeDomainData(buf);
    const f = autoCorrelate(buf, ac().sampleRate);
    if (f > 0 && f < 2000) {
      const { name, octave, cents } = freqToNote(f);
      $('#noteName').firstChild.nodeValue = name.replace('#', '♯');
      $('#octave').textContent = octave;
      smoothCents = smoothCents * 0.6 + cents * 0.4;
      const pos = 50 + Math.max(-50, Math.min(50, smoothCents)); // -50..+50 cent -> 0..100%
      const needle = $('#needle');
      needle.style.left = pos + '%';
      const inTune = Math.abs(smoothCents) < 5;
      needle.classList.toggle('intune', inTune);
      $('#cents').textContent = (cents > 0 ? '+' : '') + cents + ' ' + T.t('metro.centUnit') + (inTune ? '  ' + T.t('metro.inTune') : '');
      $('#tunerStatus').textContent = `${f.toFixed(1)} Hz`;
    }
    rafId = requestAnimationFrame(loop);
  }

  async function toggleTuner() {
    if (tuning) {
      tuning = false; cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      $('#tunerBtn').textContent = T.t('metro.micOn');
      $('#tunerStatus').textContent = '';
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const src = ac().createMediaStreamSource(stream);
      analyser = ac().createAnalyser();
      analyser.fftSize = 2048;
      buf = new Float32Array(analyser.fftSize);
      src.connect(analyser);
      tuning = true;
      $('#tunerBtn').textContent = T.t('metro.micOff');
      $('#tunerStatus').textContent = T.t('metro.listening');
      loop();
    } catch (e) {
      $('#tunerStatus').textContent = T.t('metro.micErr');
    }
  }
  $('#tunerBtn').onclick = toggleTuner;

  // riferimento corde chitarra
  const GUITAR = ['E2','A2','D3','G3','B3','E4'];
  $('#strings').innerHTML = GUITAR.map(s => `<span class="pill">${s.replace(/(\d)/, '<sub>$1</sub>')}</span>`).join('');
})();
