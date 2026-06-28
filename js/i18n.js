// Sistema di traduzione leggero (IT/EN) per tutto il sito. Nessuna dipendenza.
(function (g) {
  const LANGS = ['it', 'en'];
  let lang = localStorage.getItem('kan_lang');
  if (!LANGS.includes(lang)) lang = (navigator.language || 'it').slice(0, 2) === 'it' ? 'it' : 'en';

  const STR = {
    it: {
      common: { back: '← Tutti gli strumenti', untitled: '(senza titolo)' },
      nav: { editor: 'Editor testi', rime: 'Rime & metrica', accordi: 'Progressioni',
             metro: 'Metronomo & accordatore', bpm: 'BPM & tonalità', vocal: 'Vocal remover' },
      footer: { tagline: 'Kantautore · strumenti gratuiti per chi scrive e produce canzoni · tutto gira nel tuo browser',
                made: 'creato da', code: 'codice su GitHub', support: 'sostienimi su Patreon' },
      home: {
        badge: '100% gratis · nessun account · funziona offline',
        title: 'Strumenti per <span class="grad">cantautori</span>',
        sub: 'Tutto quello che ti serve per scrivere una canzone e produrla a casa tua. Semplice, in italiano, direttamente nel browser.',
        editorT: 'Editor testi & accordi', editorD: 'Scrivi il testo e posiziona gli accordi sopra le parole. Salvataggio automatico ed esportazione.',
        accordiT: 'Progressioni & emozioni', accordiD: 'Scegli un sentimento e ottieni accordi che lo evocano. Grafo interattivo dei movimenti, generatore e ascolto.',
        rimeT: 'Rime & metrica', rimeD: 'Dizionario delle rime in italiano e conta-sillabe per controllare la metrica dei versi.',
        metroT: 'Metronomo & accordatore', metroD: 'Metronomo preciso e accordatore cromatico per la chitarra, col microfono del tuo dispositivo.',
        bpmT: 'BPM & tonalità', bpmD: 'Carica una traccia audio e scopri i battiti al minuto e la tonalità stimata del brano.',
        vocalT: 'Vocal remover', vocalD: 'Attenua la voce al centro per ottenere una base karaoke da una traccia stereo.',
        tagWrite: 'Scrittura', tagProd: 'Produzione', tagExp: 'Sperimentale',
      },
      editor: {
        h1: '🎼 Editor testi & accordi',
        sub: 'Scrivi gli accordi tra parentesi quadre dentro al testo. Vengono mostrati sopra la parola giusta.',
        new: '+ Nuova canzone', titlePh: 'Titolo della canzone', transpose: 'Trasporta',
        print: '🖨 Stampa / PDF', export: '⬇ .txt', lyrics: 'Testo', preview: 'Anteprima', songs: 'Le tue canzoni',
        srcPh: '{titolo: La mia canzone}\n{strofa}\n[Am]Cammino [F]da solo nella [C]notte\n[G]penso a [Am]te\n\n{ritornello}\n[F]E se [G]potessi [C]dirti che...',
        hint: 'Accordi: <code>[Am]</code> <code>[C]</code> <code>[G7]</code> · Sezioni: <code>{strofa}</code> <code>{ritornello}</code> <code>{ponte}</code> · Commento: <code># nota</code>',
        songsHint: 'Le canzoni sono salvate solo su questo dispositivo (nel browser). Usa “.txt” o “Stampa/PDF” per conservarle altrove.',
        none: 'Nessuna canzone ancora. Premi “+ Nuova canzone”.',
        confirmDel: 'Eliminare “{t}”?', defName: 'canzone',
      },
      rime: {
        h1: '📖 Rime & metrica', sub: 'Trova parole che rimano e controlla quante sillabe ha ogni verso.',
        dict: 'Dizionario delle rime', word: 'Parola', wordPh: 'es. amore',
        rhyme: 'Rima', assonance: 'Assonanza', counter: 'Conta-sillabe',
        versesLbl: 'Incolla qui i tuoi versi (uno per riga)',
        versesPh: 'Cammino da solo nella notte\npenso ancora a te\ne il vento porta via la mia città',
        legend: 'Conteggio con <b>sinalefe</b> (vocali a contatto fra parole contano come una). Il nome del verso (settenario, endecasillabo…) è una stima, utile come riferimento ritmico.',
        loading: 'Carico il dizionario…', ready: 'Dizionario pronto · {n} parole', err: 'Errore nel caricare il dizionario.',
        noRhyme: 'Nessuna rima trovata per “{w}”.', noAsson: 'Nessuna assonanza trovata per “{w}”.',
        countWords: '{n} parole · finale «{k}»', sylTitle: '{n} sillabe', emptyMetric: 'Scrivi qualche verso qui sopra per vedere il conteggio.',
        tronco: ' (tronco)',
      },
      accordi: {
        h1: '🎹 Progressioni & emozioni',
        sub: 'Parti da come ti vuoi sentire. Scegli un\'emozione e ricevi progressioni di accordi che la evocano — poi esplora il grafo per muoverti da un accordo all\'altro.',
        ask: 'Che emozione vuoi trasmettere?', key: 'Tonalità', mode: 'Modo', major: 'Maggiore', minor: 'Minore',
        colored: 'accordi colorati (settime)', gen: '🎲 Genera', play: '▶ Ascolta', yourProg: 'La tua progressione',
        empty: 'Scegli un\'emozione e premi “Genera”, oppure clicca gli accordi nel grafo qui sotto.',
        undo: '↶ Togli ultimo', clear: '🗑 Svuota', copy: '📋 Copia accordi', copied: '✅ Copiato',
        tonic: 'Tonica', subdom: 'Sottodominante', dom: 'Dominante',
        legend: 'Il flusso naturale dell\'armonia va da sinistra a destra: <b>Tonica</b> (casa, riposo) → <b>Sottodominante</b> (allontanamento) → <b>Dominante</b> (tensione) → torna a <b>Tonica</b>.',
        famous: 'Progressioni famose', ideasFor: 'Idee per “{x}”',
        modeLbl: 'Modo:', tempoLbl: 'Tempo suggerito:', charLbl: 'Carattere:', bpmUnit: 'BPM',
        emo: {
          malinconia: { label: 'Malinconia', feel: 'lento, arpeggi morbidi', why: 'Il modo minore e la discesa verso VI e III danno tristezza dolce, che non si risolve mai del tutto.' },
          nostalgia: { label: 'Nostalgia', feel: 'andamento ondeggiante, accordi colorati', why: 'Il maggiore con il vi e il iii ricorda qualcosa di bello ma lontano. Con le settime diventa agrodolce.' },
          speranza: { label: 'Speranza', feel: 'crescendo, dinamica che cresce', why: 'Partire dal IV e salire verso il V dà la sensazione di slancio in avanti, di apertura.' },
          gioia: { label: 'Gioia', feel: 'ritmo vivace, accordi pieni', why: 'Solo accordi maggiori (I–IV–V), tensioni minime: tutto suona luminoso e diretto.' },
          serenita: { label: 'Serenità', feel: 'calmo, accordi tenuti', why: 'Il movimento plagale IV→I (la “cadenza amen”) chiude con dolcezza, senza la tensione del V.' },
          romantica: { label: 'Romantica', feel: 'rubato, espressivo', why: 'Il giro I–vi–ii–V e le settime creano calore e desiderio, tipico delle ballad.' },
          sognante: { label: 'Sognante', feel: 'sospeso, riverbero', why: 'Accordi maggiori con settima maggiore (maj7) che “galleggiano”, senza una direzione obbligata.' },
          tensione: { label: 'Tensione', feel: 'incalzante, staccato', why: 'Il ii° diminuito e il V irrisolto tengono l\'ascoltatore in allerta, in attesa.' },
          epico: { label: 'Epico', feel: 'ampio, dinamica forte', why: 'La salita VI→VII→i è un “lift” eroico: sembra che qualcosa di grande stia per accadere.' },
          rabbia: { label: 'Rabbia / Grinta', feel: 'duro, power chord', why: 'Il minore con VII e VI in discesa, ritmo serrato: energia e urgenza, da suonare con distorsione.' },
          mistero: { label: 'Mistero', feel: 'rarefatto, note lunghe', why: 'Movimenti verso il VI e il ii° diminuito, senza risoluzioni nette: lascia tutto in sospeso.' },
        },
        preset: { pop: 'Pop', fifties: "Anni '50", jazz: 'Jazz', folk: 'Folk', canon: 'Canone',
                  minpop: 'Pop minore', andalusian: 'Andaluso', dramatic: 'Drammatico', melancholic: 'Malinconico' },
      },
      metro: {
        h1: '🥁 Metronomo & accordatore', sub: 'Tieni il tempo mentre suoni e accorda lo strumento col microfono.',
        metronome: 'Metronomo', tap: '👆 Tap tempo', accent: 'accento sul 1', tuner: 'Accordatore',
        micOn: '🎙 Attiva microfono', micOff: '⏹ Stop microfono', cents: '— cent',
        strings: 'Corde chitarra standard: E2 · A2 · D3 · G3 · B3 · E4',
        start: '▶ Avvia', stop: '⏸ Ferma', listening: 'In ascolto…',
        micErr: 'Microfono non disponibile o permesso negato.', inTune: '✓ intonato', centUnit: 'cent',
      },
      bpm: {
        h1: '🎚️ BPM & tonalità', sub: 'Carica un file audio (mp3, wav, m4a…) per stimare i battiti al minuto e la tonalità.',
        drop: '<b>Trascina qui un file audio</b><br><span class="muted">oppure clicca per sceglierlo</span>',
        bpm: 'BPM', keyEst: 'Tonalità stimata',
        legend: 'Le stime sono automatiche: il BPM può risultare doppio o metà del reale, e la tonalità è un\'ipotesi basata sulle note più presenti. Usale come punto di partenza. Tutto avviene nel tuo browser, nessun file viene caricato online.',
        decoding: 'Decodifico l\'audio…', analyzing: 'Analizzo tempo e tonalità…',
        readErr: 'Non riesco a leggere questo file audio. Prova con un mp3 o wav.', analyzeErr: 'Errore durante l\'analisi.',
        bpmSub: '≈ {half} o {double} se ti suona dimezzato/doppio', keySub: 'affidabilità ~{c}%',
        major: 'maggiore', minor: 'minore',
      },
      vocal: {
        h1: '🎤 Vocal remover', exp: 'sperimentale',
        sub: 'Toglie i suoni al centro dello stereo (di solito la voce) per ottenere una base karaoke.',
        note: '<b>Come funziona, in onestà.</b> Questo strumento sottrae il canale destro dal sinistro: sparisce tutto ciò che è registrato “al centro” (spesso voce, ma anche cassa e basso). Funziona bene solo su brani <b>stereo</b> con la voce centrata, e il risultato è in mono. Non è una separazione AI: per quella servono modelli pesanti e un server.',
        drop: '<b>Trascina qui un brano stereo</b><br><span class="muted">oppure clicca per sceglierlo</span>',
        orig: '▶ Originale', kar: '▶ Base karaoke', stop: '⏹ Stop', download: '⬇ Scarica base karaoke (.wav)',
        processing: 'Elaboro l\'audio…', mono: '⚠️ Questo file è <b>mono</b>: la cancellazione del centro non può funzionare. Serve un brano stereo.',
        ready: '✅ Pronto. Confronta originale e base karaoke, poi scarica.',
        readErr: 'Non riesco a leggere questo file. Prova con un mp3 o wav stereo.',
      },
    },

    en: {
      common: { back: '← All tools', untitled: '(untitled)' },
      nav: { editor: 'Lyrics editor', rime: 'Rhymes & meter', accordi: 'Progressions',
             metro: 'Metronome & tuner', bpm: 'BPM & key', vocal: 'Vocal remover' },
      footer: { tagline: 'Kantautore · free tools for songwriters and home producers · everything runs in your browser',
                made: 'made by', code: 'source on GitHub', support: 'support me on Patreon' },
      home: {
        badge: '100% free · no account · works offline',
        title: 'Tools for <span class="grad">songwriters</span>',
        sub: 'Everything you need to write a song and produce it at home. Simple, right in your browser.',
        editorT: 'Lyrics & chords editor', editorD: 'Write your lyrics and place chords above the words. Autosave and export.',
        accordiT: 'Progressions & emotions', accordiD: 'Pick a feeling and get chords that evoke it. Interactive movement graph, generator and playback.',
        rimeT: 'Rhymes & meter', rimeD: 'Italian rhyming dictionary and a syllable counter to check the meter of your lines.',
        metroT: 'Metronome & tuner', metroD: 'Precise metronome and chromatic guitar tuner using your device microphone.',
        bpmT: 'BPM & key', bpmD: 'Load an audio track and find its beats per minute and estimated key.',
        vocalT: 'Vocal remover', vocalD: 'Attenuate the centered vocal to get a karaoke backing track from a stereo song.',
        tagWrite: 'Writing', tagProd: 'Production', tagExp: 'Experimental',
      },
      editor: {
        h1: '🎼 Lyrics & chords editor',
        sub: 'Write chords in square brackets inside the lyrics. They appear above the right word.',
        new: '+ New song', titlePh: 'Song title', transpose: 'Transpose',
        print: '🖨 Print / PDF', export: '⬇ .txt', lyrics: 'Lyrics', preview: 'Preview', songs: 'Your songs',
        srcPh: '{title: My song}\n{verse}\n[Am]Walking [F]alone in the [C]night\n[G]thinking of [Am]you\n\n{chorus}\n[F]And if [G]I could [C]tell you that...',
        hint: 'Chords: <code>[Am]</code> <code>[C]</code> <code>[G7]</code> · Sections: <code>{verse}</code> <code>{chorus}</code> <code>{bridge}</code> · Comment: <code># note</code>',
        songsHint: 'Songs are saved only on this device (in your browser). Use “.txt” or “Print/PDF” to keep them elsewhere.',
        none: 'No songs yet. Press “+ New song”.',
        confirmDel: 'Delete “{t}”?', defName: 'song',
      },
      rime: {
        h1: '📖 Rhymes & meter', sub: 'Find rhyming words and check how many syllables each line has.',
        dict: 'Rhyming dictionary', word: 'Word', wordPh: 'e.g. amore',
        rhyme: 'Rhyme', assonance: 'Assonance', counter: 'Syllable counter',
        versesLbl: 'Paste your lines here (one per line)',
        versesPh: 'Cammino da solo nella notte\npenso ancora a te\ne il vento porta via la mia città',
        legend: 'Counts with <b>synalepha</b> (vowels touching across words count as one). The verse name (settenario, endecasillabo…) is an estimate, handy as a rhythmic reference. This tool is built for <b>Italian</b> lyrics.',
        loading: 'Loading dictionary…', ready: 'Dictionary ready · {n} words', err: 'Failed to load the dictionary.',
        noRhyme: 'No rhyme found for “{w}”.', noAsson: 'No assonance found for “{w}”.',
        countWords: '{n} words · ending «{k}»', sylTitle: '{n} syllables', emptyMetric: 'Type some lines above to see the count.',
        tronco: ' (oxytone)',
      },
      accordi: {
        h1: '🎹 Progressions & emotions',
        sub: 'Start from how you want to feel. Pick an emotion and get chord progressions that evoke it — then explore the graph to move from one chord to another.',
        ask: 'What emotion do you want to convey?', key: 'Key', mode: 'Mode', major: 'Major', minor: 'Minor',
        colored: 'colored chords (sevenths)', gen: '🎲 Generate', play: '▶ Play', yourProg: 'Your progression',
        empty: 'Pick an emotion and press “Generate”, or click the chords in the graph below.',
        undo: '↶ Remove last', clear: '🗑 Clear', copy: '📋 Copy chords', copied: '✅ Copied',
        tonic: 'Tonic', subdom: 'Subdominant', dom: 'Dominant',
        legend: 'The natural flow of harmony goes left to right: <b>Tonic</b> (home, rest) → <b>Subdominant</b> (departure) → <b>Dominant</b> (tension) → back to <b>Tonic</b>.',
        famous: 'Famous progressions', ideasFor: 'Ideas for “{x}”',
        modeLbl: 'Mode:', tempoLbl: 'Suggested tempo:', charLbl: 'Character:', bpmUnit: 'BPM',
        emo: {
          malinconia: { label: 'Melancholy', feel: 'slow, soft arpeggios', why: 'The minor mode and the descent toward VI and III give a sweet sadness that never fully resolves.' },
          nostalgia: { label: 'Nostalgia', feel: 'swaying motion, colored chords', why: 'Major with vi and iii recalls something beautiful but far away. With sevenths it turns bittersweet.' },
          speranza: { label: 'Hope', feel: 'building up, growing dynamics', why: 'Starting on IV and rising to V gives a feeling of momentum and opening up.' },
          gioia: { label: 'Joy', feel: 'lively rhythm, full chords', why: 'Only major chords (I–IV–V), minimal tension: everything sounds bright and direct.' },
          serenita: { label: 'Serenity', feel: 'calm, sustained chords', why: 'The plagal move IV→I (the “amen cadence”) closes gently, without the tension of the V.' },
          romantica: { label: 'Romantic', feel: 'rubato, expressive', why: 'The I–vi–ii–V turnaround and sevenths create warmth and longing, typical of ballads.' },
          sognante: { label: 'Dreamy', feel: 'suspended, reverb', why: 'Major chords with a major seventh (maj7) that “float”, with no obligatory direction.' },
          tensione: { label: 'Tension', feel: 'driving, staccato', why: 'The diminished ii° and the unresolved V keep the listener on edge, waiting.' },
          epico: { label: 'Epic', feel: 'wide, strong dynamics', why: 'The rise VI→VII→i is a heroic “lift”: it feels like something big is about to happen.' },
          rabbia: { label: 'Anger / Drive', feel: 'hard, power chords', why: 'Minor with descending VII and VI, tight rhythm: energy and urgency — play it with distortion.' },
          mistero: { label: 'Mystery', feel: 'sparse, long notes', why: 'Movements toward VI and the diminished ii°, with no clear resolutions: leaves everything hanging.' },
        },
        preset: { pop: 'Pop', fifties: '50s', jazz: 'Jazz', folk: 'Folk', canon: 'Canon',
                  minpop: 'Minor pop', andalusian: 'Andalusian', dramatic: 'Dramatic', melancholic: 'Melancholic' },
      },
      metro: {
        h1: '🥁 Metronome & tuner', sub: 'Keep time while you play and tune your instrument with the microphone.',
        metronome: 'Metronome', tap: '👆 Tap tempo', accent: 'accent on beat 1', tuner: 'Tuner',
        micOn: '🎙 Enable microphone', micOff: '⏹ Stop microphone', cents: '— cents',
        strings: 'Standard guitar strings: E2 · A2 · D3 · G3 · B3 · E4',
        start: '▶ Start', stop: '⏸ Stop', listening: 'Listening…',
        micErr: 'Microphone unavailable or permission denied.', inTune: '✓ in tune', centUnit: 'cents',
      },
      bpm: {
        h1: '🎚️ BPM & key', sub: 'Load an audio file (mp3, wav, m4a…) to estimate the beats per minute and the key.',
        drop: '<b>Drag an audio file here</b><br><span class="muted">or click to choose one</span>',
        bpm: 'BPM', keyEst: 'Estimated key',
        legend: 'The estimates are automatic: the BPM may come out double or half the real value, and the key is a guess based on the most present notes. Use them as a starting point. Everything happens in your browser, no file is uploaded online.',
        decoding: 'Decoding audio…', analyzing: 'Analyzing tempo and key…',
        readErr: 'I can\'t read this audio file. Try an mp3 or wav.', analyzeErr: 'Error during analysis.',
        bpmSub: '≈ {half} or {double} if it sounds half/double', keySub: 'confidence ~{c}%',
        major: 'major', minor: 'minor',
      },
      vocal: {
        h1: '🎤 Vocal remover', exp: 'experimental',
        sub: 'Removes sounds in the center of the stereo image (usually the vocal) to get a karaoke backing track.',
        note: '<b>How it works, honestly.</b> This tool subtracts the right channel from the left: anything recorded “in the center” disappears (often vocals, but also kick and bass). It only works well on <b>stereo</b> songs with a centered vocal, and the result is mono. It is not AI separation: that needs heavy models and a server.',
        drop: '<b>Drag a stereo song here</b><br><span class="muted">or click to choose one</span>',
        orig: '▶ Original', kar: '▶ Karaoke track', stop: '⏹ Stop', download: '⬇ Download karaoke track (.wav)',
        processing: 'Processing audio…', mono: '⚠️ This file is <b>mono</b>: center cancellation can\'t work. You need a stereo song.',
        ready: '✅ Ready. Compare original and karaoke track, then download.',
        readErr: 'I can\'t read this file. Try a stereo mp3 or wav.',
      },
    },
  };

  function t(key, params) {
    let v;
    for (const L of [lang, 'it']) {
      v = key.split('.').reduce((o, k) => (o == null ? o : o[k]), STR[L]);
      if (v != null) break;
    }
    if (v == null) return key;
    if (params) v = v.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? params[k] : '{' + k + '}'));
    return v;
  }
  function setLang(l) { if (LANGS.includes(l)) { localStorage.setItem('kan_lang', l); location.reload(); } }
  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPh)); });
    if (document.documentElement) document.documentElement.lang = lang;
  }

  g.I18N = { t, lang, setLang, apply, locale: lang === 'en' ? 'en-US' : 'it-IT', LANGS };
  g.t = t;
})(window);
