// Navigazione condivisa fra le pagine.
// Calcola il prefisso giusto sia dalla home (index) sia dalle pagine in /tools/.
(function () {
  const inTools = location.pathname.includes('/tools/');
  const base = inTools ? '../' : './';

  const tools = [
    { href: 'tools/editor.html',         label: 'Editor testi' },
    { href: 'tools/rime.html',           label: 'Rime & metrica' },
    { href: 'tools/accordi.html',        label: 'Progressioni' },
    { href: 'tools/metronomo.html',      label: 'Metronomo & accordatore' },
    { href: 'tools/bpm-key.html',        label: 'BPM & tonalità' },
    { href: 'tools/vocal-remover.html',  label: 'Vocal remover' },
  ];

  const current = location.pathname.split('/').pop();

  const nav = tools.map(t => {
    const file = t.href.split('/').pop();
    const active = file === current ? ' class="active"' : '';
    return `<a href="${base}${t.href}"${active}>${t.label}</a>`;
  }).join('');

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="wrap">
      <a class="brand" href="${base}index.html">
        <span class="logo">K</span> Kantautore
      </a>
      <nav class="nav">${nav}</nav>
    </div>`;
  document.body.prepend(header);

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="wrap">Kantautore · strumenti gratuiti per chi scrive e produce canzoni · tutto gira nel tuo browser</div>`;
  document.body.append(footer);

  window.KAN = { base };
})();
