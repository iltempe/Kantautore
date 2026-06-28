// Vocal remover lite: cancellazione di fase (L - R) -> base karaoke mono. Anteprima + export WAV.
(function () {
  const $ = s => document.querySelector(s);
  const T = window.I18N;
  const drop = $('#drop'), fileInput = $('#file');
  let actx = null, origBuf = null, karBuf = null, source = null, fileName = 'base';

  function ac() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); return actx; }

  drop.onclick = () => fileInput.click();
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); };
  fileInput.onchange = () => { if (fileInput.files[0]) handle(fileInput.files[0]); };

  async function handle(file) {
    fileName = file.name.replace(/\.[^.]+$/, '');
    $('#msg').textContent = T.t('vocal.processing');
    $('#player').style.display = 'none';
    try {
      const data = await file.arrayBuffer();
      origBuf = await ac().decodeAudioData(data);

      if (origBuf.numberOfChannels < 2) {
        $('#msg').innerHTML = T.t('vocal.mono');
        return;
      }
      const L = origBuf.getChannelData(0), R = origBuf.getChannelData(1);
      const n = origBuf.length;
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = (L[i] - R[i]) * 0.5;

      karBuf = ac().createBuffer(1, n, origBuf.sampleRate);
      karBuf.getChannelData(0).set(out);

      $('#msg').textContent = T.t('vocal.ready');
      $('#player').style.display = 'block';
    } catch (e) {
      $('#msg').textContent = T.t('vocal.readErr');
    }
  }

  function play(buf, btn) {
    stop();
    source = ac().createBufferSource();
    source.buffer = buf;
    source.connect(ac().destination);
    source.start();
    document.querySelectorAll('.ab .btn').forEach(b => b.classList.remove('playing'));
    btn.classList.add('playing');
    source.onended = () => btn.classList.remove('playing');
    ac().resume();
  }
  function stop() {
    if (source) { try { source.stop(); } catch {} source = null; }
    document.querySelectorAll('.ab .btn').forEach(b => b.classList.remove('playing'));
  }

  $('#playOrig').onclick = () => play(origBuf, $('#playOrig'));
  $('#playKar').onclick = () => play(karBuf, $('#playKar'));
  $('#stop').onclick = stop;
  $('#download').onclick = () => {
    const wav = encodeWav(karBuf);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(wav);
    a.download = fileName + '_karaoke.wav';
    a.click(); URL.revokeObjectURL(a.href);
  };

  // ---- WAV encoder (16-bit PCM) ----
  function encodeWav(buf) {
    const ch = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length;
    const data = new DataView(new ArrayBuffer(44 + n * ch * 2));
    let p = 0;
    const str = s => { for (let i = 0; i < s.length; i++) data.setUint8(p++, s.charCodeAt(i)); };
    const u32 = v => { data.setUint32(p, v, true); p += 4; };
    const u16 = v => { data.setUint16(p, v, true); p += 2; };
    str('RIFF'); u32(36 + n * ch * 2); str('WAVE'); str('fmt '); u32(16);
    u16(1); u16(ch); u32(sr); u32(sr * ch * 2); u16(ch * 2); u16(16);
    str('data'); u32(n * ch * 2);
    const chans = []; for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
    for (let i = 0; i < n; i++)
      for (let c = 0; c < ch; c++) {
        let s = Math.max(-1, Math.min(1, chans[c][i]));
        data.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7FFF, true); p += 2;
      }
    return new Blob([data], { type: 'audio/wav' });
  }
})();
