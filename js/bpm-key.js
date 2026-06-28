// BPM & tonalità: decodifica l'audio, manda i campioni al worker, mostra i risultati.
(function () {
  const $ = s => document.querySelector(s);
  const drop = $('#drop'), fileInput = $('#file');
  const worker = new Worker('../js/bpm-key-worker.js');

  const FLAT = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' };

  drop.onclick = () => fileInput.click();
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); };
  fileInput.onchange = () => { if (fileInput.files[0]) handle(fileInput.files[0]); };

  async function handle(file) {
    $('#fileName').textContent = '📄 ' + file.name;
    $('#results').style.display = 'none';
    $('#barWrap').style.display = 'block';
    $('#bar').style.width = '0%';
    $('#msg').textContent = 'Decodifico l\'audio…';

    try {
      const buf = await file.arrayBuffer();
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const audio = await actx.decodeAudioData(buf);
      actx.close();

      // mono mix
      const ch0 = audio.getChannelData(0);
      let mono;
      if (audio.numberOfChannels > 1) {
        const ch1 = audio.getChannelData(1);
        mono = new Float32Array(ch0.length);
        for (let i = 0; i < ch0.length; i++) mono[i] = (ch0[i] + ch1[i]) / 2;
      } else mono = ch0.slice();

      // limita a ~90s per velocità
      const maxSamples = audio.sampleRate * 90;
      if (mono.length > maxSamples) mono = mono.slice(0, maxSamples);

      $('#msg').textContent = 'Analizzo tempo e tonalità…';
      worker.postMessage({ data: mono, sampleRate: audio.sampleRate }, [mono.buffer]);
    } catch (e) {
      $('#msg').textContent = 'Non riesco a leggere questo file audio. Prova con un mp3 o wav.';
      $('#barWrap').style.display = 'none';
    }
  }

  worker.onmessage = (e) => {
    const d = e.data;
    if (d.type === 'progress') { $('#bar').style.width = Math.round(d.value * 100) + '%'; }
    else if (d.type === 'done') {
      $('#bar').style.width = '100%';
      setTimeout(() => $('#barWrap').style.display = 'none', 400);
      $('#msg').textContent = '';
      $('#results').style.display = 'grid';
      $('#bpm').textContent = d.bpm;
      $('#bpmSub').textContent = `≈ ${(d.bpm/2).toFixed(0)} o ${(d.bpm*2)} se ti suona dimezzato/doppio`;
      const flat = FLAT[d.key] ? ` (${FLAT[d.key]})` : '';
      $('#key').innerHTML = d.key.replace('#','♯') + ' <span style="font-size:1.4rem;color:var(--muted)">' + d.mode + '</span>';
      $('#keySub').textContent = `affidabilità ~${d.confidence}%${flat ? ' · ' + d.key + flat : ''}`;
    } else if (d.type === 'error') {
      $('#msg').textContent = 'Errore durante l\'analisi.';
      $('#barWrap').style.display = 'none';
    }
  };
})();
