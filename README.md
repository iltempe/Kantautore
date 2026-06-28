# 🎵 Kantautore

Strumenti semplici e **gratuiti** per chi scrive canzoni e produce in casa.
Tutto gira nel browser: nessun account, nessun server, i tuoi file non vengono caricati online.

## Strumenti

| Strumento | Cosa fa |
|-----------|---------|
| 🎼 **Editor testi & accordi** | Scrivi il testo con gli accordi tra `[ ]` (sintassi ChordPro). Anteprima con accordi sopra le parole, trasporto di tonalità, salvataggio automatico nel browser, export `.txt` e stampa/PDF. |
| 📖 **Rime & metrica** | Dizionario delle rime in italiano (~280.000 parole) con modalità rima e assonanza, più un conta-sillabe che applica la sinalefe e stima il tipo di verso (settenario, endecasillabo…). |
| 🥁 **Metronomo & accordatore** | Metronomo preciso (Web Audio) con tap tempo e tempi in chiave; accordatore cromatico che usa il microfono. |
| 🎚️ **BPM & tonalità** | Carichi un brano e stima battiti al minuto (onset detection) e tonalità (chroma + profili Krumhansl-Schmuckler). |
| 🎤 **Vocal remover** *(sperimentale)* | Cancellazione di fase del canale centrale per ricavare una base karaoke da una traccia stereo. Export `.wav`. |

## Come si avvia in locale

È un sito **statico**: basta servire la cartella con un server qualunque.

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

> Serve un server (non aprire i file con `file://`) perché i Web Worker e il
> caricamento del dizionario richiedono richieste HTTP.

## Lingue

Interfaccia disponibile in **italiano** e **inglese**, con selettore IT/EN
nell'header (la scelta resta salvata nel browser). I testi vivono in
[`js/i18n.js`](js/i18n.js). Nota: il dizionario delle rime e il conta-sillabe
sono pensati per la lingua italiana.

## Pubblicazione

Caricabile così com'è su qualsiasi hosting statico gratuito: GitHub Pages,
Netlify, Cloudflare Pages, Vercel. Nessuna build necessaria.

## Struttura

```
index.html            home con le card degli strumenti
tools/                una pagina per strumento
js/                   logica di ogni strumento + worker + sillabazione condivisa
css/style.css         tema condiviso
data/parole.min.txt   lista di parole italiane per le rime
```

## Note oneste

- Le stime di **BPM** e **tonalità** sono automatiche e possono sbagliare
  (tempo doppio/dimezzato, tonalità relativa): usale come punto di partenza.
- Il **vocal remover** non è separazione AI: toglie ciò che è al centro dello
  stereo, quindi funziona solo su brani stereo con voce centrata e dà un mono.
- La divisione in **sillabe** e il nome del verso sono euristici, ottimi per
  un riscontro pratico mentre scrivi.

---

Dati delle parole: [napolux/paroleitaliane](https://github.com/napolux/paroleitaliane).
