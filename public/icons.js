(function () {
  const svgNS = 'http://www.w3.org/2000/svg';
  const symbolMap = {
    zap: '<path d="M13 2L4 13h5l-1 9 9-11h-5l1-9Z"/><path d="M12 2v8"/><path d="M8 13h6"/>',
    droplet: '<path d="M12 2.5c2.7 3.1 6 6.1 6 9.4A6 6 0 0 1 6 12c0-3.3 3.3-6.3 6-9.4Z"/><path d="M10 16c.7 1.5 1.3 2.5 2 2.5s1.3-1 2-2.5"/>',
    pipe: '<path d="M7 5h3a2 2 0 0 1 2 2v3"/><path d="M17 19h-3a2 2 0 0 1-2-2v-3"/><path d="M7 19h10"/><path d="M7 5v14"/><path d="M17 5v14"/>',
    snowflake: '<path d="M12 2v20"/><path d="M4 12h16"/><path d="M6 6l12 12"/><path d="M18 6L6 18"/><path d="M8 4l4 8 4-8"/><path d="M8 20l4-8 4 8"/>',
    wrench: '<path d="M14.5 5.5a4.5 4.5 0 0 0-6.3 6.3l-6.2 6.2 2.1 2.1 6.2-6.2a4.5 4.5 0 0 0 6.3-6.3l-2.1-2.1Z"/><path d="M15.5 9.5l2.5 2.5"/><path d="M8.5 16.5l-2.5 2.5"/>',
    warning: '<path d="M12 3.5 21 18a1.5 1.5 0 0 1-1.3 2.3H4.3A1.5 1.5 0 0 1 3 18l9-14.5Z"/><path d="M12 8v5"/><path d="M12 17.2h.01"/>',
    shield: '<path d="M12 2.8 18.5 5v6.8c0 4.3-2.5 7.8-6.5 9.4-4-1.6-6.5-5.1-6.5-9.4V5L12 2.8Z"/><path d="M9.5 11.8 11.3 13.7l3.8-4.8"/>',
    radio: '<path d="M4 15a8 8 0 0 1 16 0"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M10 15a2 2 0 0 1 4 0"/><path d="M12 18v3"/><path d="M6 20h12"/>',
    mic: '<path d="M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3Z"/><path d="M6.5 11.5A5.5 5.5 0 0 0 12 17a5.5 5.5 0 0 0 5.5-5.5"/><path d="M12 17v4"/><path d="M9 21h6"/>',
    download: '<path d="M12 3v9"/><path d="m8 18 4 4 4-4"/><path d="M4 18v1.5A1.5 1.5 0 0 0 5.5 21h13A1.5 1.5 0 0 0 20 19.5V18"/>',
    history: '<path d="M3.5 12A8.5 8.5 0 1 0 12 3.5"/><path d="M3.5 5.5V12H10"/><path d="M12 7.5v5l3.5 2"/>',
    trash: '<path d="M4 7h16"/><path d="M8 7V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V7"/><path d="M7 7l1 12h8l1-12"/><path d="M10 11v5"/><path d="M14 11v5"/>',
    copy: '<rect x="9" y="9" width="9" height="9" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>',
    check: '<path d="M5 12.5 9 16.5l10-11"/>',
    x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    user: '<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7.5A4 4 0 0 1 12 3.5a4 4 0 0 1 4 4V10"/>',
    wifiOff: '<path d="M2 6.5c4.3-3.8 13.7-3.8 18 0"/><path d="M5 10.5c3.1-2.7 10.9-2.7 14 0"/><path d="M8 14.5c2-1.8 6-1.8 8 0"/><path d="M11 18.5h2"/><path d="M4 20l16-16"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5h.01"/>',
    logo: '<path d="M12 2.5 17.5 5v6c0 4.3-2.7 7.6-5.5 9.4-2.8-1.8-5.5-5.1-5.5-9.4v-6L12 2.5Z"/><path d="M9.8 12.2 11.2 13.8l3.6-4.2"/><path d="M7.5 7.5h9"/>',
    alert: '<path d="M12 3.5 21 18a1.5 1.5 0 0 1-1.3 2.3H4.3A1.5 1.5 0 0 1 3 18l9-14.5Z"/><path d="M12 8v5"/><path d="M12 17.2h.01"/>'
  };

  function renderIcon(name, options = {}) {
    const size = options.size || 24;
    const title = options.title || '';
    const label = options.label || '';
    const extraClass = options.className || '';
    const accessible = label ? ' aria-label="' + label + '"' : ' aria-hidden="true"';
    const titleMarkup = title ? '<title>' + title + '</title>' : '';
    const strokeWidth = options.strokeWidth || 1.75;
    return '\n      <svg class="icon ' + extraClass + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round" ' + accessible + '>\n        ' + titleMarkup + '\n        <use href="#icon-' + name + '"></use>\n      </svg>\n    ';
  }

  function ensureSprite() {
    if (document.getElementById('campusfix-sprite')) {
      return;
    }

    const sprite = document.createElementNS(svgNS, 'svg');
    sprite.setAttribute('width', '0');
    sprite.setAttribute('height', '0');
    sprite.setAttribute('style', 'position:absolute; width:0; height:0; overflow:hidden');
    sprite.setAttribute('aria-hidden', 'true');
    sprite.id = 'campusfix-sprite';

    const defs = document.createElementNS(svgNS, 'defs');
    Object.entries(symbolMap).forEach(([name, markup]) => {
      const symbol = document.createElementNS(svgNS, 'symbol');
      symbol.setAttribute('id', 'icon-' + name);
      symbol.setAttribute('viewBox', '0 0 24 24');
      symbol.innerHTML = markup;
      defs.appendChild(symbol);
    });
    sprite.appendChild(defs);
    document.body.insertBefore(sprite, document.body.firstChild);
  }

  ensureSprite();
  window.CampusFixIcons = { render: renderIcon, ensureSprite };
})();
