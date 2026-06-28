// Header, footer e navigazione condivisi. Usa il sistema i18n (js/i18n.js).
(function () {
  const T = window.I18N;
  const inTools = location.pathname.includes('/tools/');
  const base = inTools ? '../' : './';

  const tools = [
    { href: 'tools/editor.html',         key: 'nav.editor' },
    { href: 'tools/rime.html',           key: 'nav.rime' },
    { href: 'tools/accordi.html',        key: 'nav.accordi' },
    { href: 'tools/metronomo.html',      key: 'nav.metro' },
    { href: 'tools/bpm-key.html',        key: 'nav.bpm' },
    { href: 'tools/vocal-remover.html',  key: 'nav.vocal' },
  ];

  const current = location.pathname.split('/').pop();

  const nav = tools.map(tool => {
    const file = tool.href.split('/').pop();
    const active = file === current ? ' class="active"' : '';
    return `<a href="${base}${tool.href}"${active}>${T.t(tool.key)}</a>`;
  }).join('');

  const langBtns = T.LANGS.map(l =>
    `<button data-lang="${l}" class="${l === T.lang ? 'on' : ''}">${l.toUpperCase()}</button>`).join('');

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="wrap">
      <a class="brand" href="${base}index.html">
        <span class="logo">K</span> Kantautore
      </a>
      <nav class="nav">${nav}</nav>
      <div class="lang">${langBtns}</div>
    </div>`;
  document.body.prepend(header);
  header.querySelectorAll('.lang button').forEach(b =>
    b.addEventListener('click', () => T.setLang(b.dataset.lang)));

  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="wrap">
      ${T.t('footer.tagline')}<br>
      ${T.t('footer.made')} <a href="https://github.com/iltempe" target="_blank" rel="noopener">@iltempe</a> ·
      <a href="https://github.com/iltempe/Kantautore" target="_blank" rel="noopener">${T.t('footer.code')}</a> ·
      <a href="https://www.patreon.com/c/iltempe/" target="_blank" rel="noopener">❤ ${T.t('footer.support')}</a>
    </div>`;
  document.body.append(footer);

  // applica le traduzioni statiche della pagina
  T.apply(document);

  window.KAN = { base };
})();
