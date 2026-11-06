(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data = window.MOVES_CATALOG;
  if (!data?.characters?.length) {
    $('#main').innerHTML = '<p class="notice">Il catalogo non è disponibile. Esegui lo script di aggiornamento nella cartella demo-moves.</p>';
    return;
  }
  const characters = data.characters;
  const isDetail = document.body.dataset.page === 'character';
  const isMoves = document.body.dataset.page === 'moves';
  const isStages = document.body.dataset.page === 'stages';
  const isRoster = !isDetail && !isMoves && !isStages;
  const moveGroups = MovesGroups.group(characters);
  const params = new URLSearchParams(location.search);
  const storedAnimationId = (() => {
    try { return sessionStorage.getItem('wedoo-last-animation'); }
    catch { return null; }
  })();
  const selectedId = isDetail ? params.get('id') : null;
  const selectedAnimationId = isDetail ? params.get('anim') : storedAnimationId;
  const currentMove = moveGroups.find(move=>move.id===params.get('move')) ?? moveGroups[0];
  const selected = characters.find(c => c.id === selectedId);
  const href = (character, animationId = selectedAnimationId) => 'personaggio.html?id=' + encodeURIComponent(character.id) + (animationId ? '&anim=' + encodeURIComponent(animationId) : '');
  const number = n => String(n).padStart(2, '0');
  const sidebar = $('#sidebar');
  sidebar.innerHTML = `
    <a class="brand" href="index.html" aria-label="WEDOO Fighters, tutti i personaggi"><span class="brand-mark" aria-hidden="true">WF</span><span class="brand-name">WEDOO<small>FIGHTERS</small></span></a>
    <button class="sidebar-close icon-button" type="button" aria-label="Chiudi il menu">×</button>
    <label class="sidebar-search"><span aria-hidden="true">⌕</span><span class="screen-reader-only">Cerca un personaggio</span><input id="character-search" type="search" placeholder="Cerca personaggio…" autocomplete="off" spellcheck="false"></label>
    <a class="all-link" href="index.html" ${isRoster ? 'aria-current="page"' : ''}><span><b class="grid-symbol" aria-hidden="true">▦</b> Tutti i personaggi</span><span>${characters.length}</span></a>
    <a class="all-link" href="stages.html" ${isStages ? 'aria-current="page"' : ''}><span>Stages</span><span aria-hidden="true">→</span></a>
    <details class="sidebar-dropdown" ${isMoves ? 'open' : ''}>
    <summary class="sidebar-dropdown-toggle">Per mossa<span class="dropdown-chevron" aria-hidden="true"></span></summary>
    <nav class="moves-nav" aria-label="Per mossa">${moveGroups.map(move=>`<a class="nav-link move-nav-link" href="mosse.html?move=${encodeURIComponent(move.id)}" ${isMoves && move.id===currentMove.id ? 'aria-current="page"' : ''}><span>${escape(move.name)}</span><span class="move-count">${move.animations.length}</span></a>`).join('')}</nav>
    </details>
    <details class="sidebar-dropdown" ${!isMoves && !isStages ? 'open' : ''}>
    <summary class="sidebar-dropdown-toggle">Per personaggio<span class="dropdown-summary-end"><span id="nav-count">${characters.length}</span><span class="dropdown-chevron" aria-hidden="true"></span></span></summary>
    <nav class="character-nav" aria-label="Elenco personaggi">${characters.map((c, i) => `<a class="nav-link" data-character="${escape(c.id)}" href="${href(c)}" ${c.id === selectedId ? 'aria-current="page"' : ''}><span class="nav-number" aria-hidden="true">${number(i + 1)}</span><span>${escape(c.name.toUpperCase())}</span></a>`).join('')}<p class="nav-empty" hidden>Nessun risultato.</p></nav>
    </details>
    <div class="sidebar-bottom">MOVE LIBRARY <span aria-hidden="true">/</span> VOL. 01</div>`;
  const overlay = document.createElement('button');
  overlay.type = 'button'; overlay.className = 'menu-overlay'; overlay.setAttribute('aria-label', 'Chiudi il menu');
  document.body.append(overlay);
  const menuButton = $('.menu-toggle');
  function toggleMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    if (open) $('#character-search').focus(); else menuButton.focus();
  }
  menuButton.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')));
  $('.sidebar-close').addEventListener('click', () => toggleMenu(false));
  overlay.addEventListener('click', () => toggleMenu(false));
  document.addEventListener('keydown', event => {
    if (!document.body.classList.contains('menu-open')) return;
    if (event.key === 'Escape') { event.preventDefault(); toggleMenu(false); }
    if (event.key === 'Tab') {
      const focusable = [...sidebar.querySelectorAll('a,button,input,summary')].filter(el => !el.hidden && el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  function installImageFallbacks() {
    document.querySelectorAll('img[data-portrait]').forEach(img => img.addEventListener('error', () => {
      img.hidden = true;
      const message = document.createElement('span'); message.className = 'portrait-error'; message.textContent = 'Anteprima non disponibile';
      img.parentElement.append(message);
    }, {once:true}));
  }
  let rosterPreviews, moveGallery;
  function renderMove(query = '') {
    moveGallery?.destroy();
    const filtered = MovesGroups.filter(currentMove, query);
    const container = $('#move-gallery');
    $('#move-visible-count').textContent = filtered.animations.length;
    $('#move-empty').hidden = filtered.animations.length > 0;
    container.hidden = filtered.animations.length === 0;
    if (!filtered.animations.length) {container.innerHTML='';return;}
    moveGallery = MovesGallery.install(container, filtered, {
      title: currentMove.name + ' - Personaggi',
      description: 'Controlla ogni personaggio oppure riproduci tutte le anteprime.'
    });
  }
  if (isMoves) {
    document.title = currentMove.name + ' - Per mossa - WEDOO Fighters';
    $('#breadcrumb-name').textContent = currentMove.name;
    $('#move-name').textContent = currentMove.name;
    const reportPaths={'light-punch':'reports/light-punch-timing.html',block:'reports/block-timing.html',jump:'reports/jump-timing.html'};
    const reportPath=reportPaths[currentMove.id];
    $('#move-report').hidden = !reportPath;
    if(reportPath){
      const link=$('#move-report').querySelector('a');
      link.href=reportPath;
      link.textContent='Apri il report: '+currentMove.name+' →';
    }
    $('#move-total-count').textContent = currentMove.animations.length;
    renderMove();
    window.addEventListener('pagehide',()=>moveGallery?.destroy());
  }
  if (isRoster) {
    $('#total-count').textContent = characters.length;
    $('#visible-count').textContent = characters.length;
    $('#character-grid').innerHTML = characters.map((c, i) => `<a class="character-card" data-character="${escape(c.id)}" href="${href(c)}" aria-label="Esplora le animazioni di ${escape(c.name)}"><div class="card-portrait"><span class="card-number" aria-hidden="true">${number(i + 1)} / ${number(characters.length)}</span><img data-portrait src="${escape(c.thumbnail)}" alt="${escape(c.name)}, posa originale" loading="lazy" decoding="async" width="512" height="512"></div><div class="card-label"><div><h3>${escape(c.name)}</h3><p>${c.animations.length} ${c.animations.length === 1 ? 'animazione disponibile' : 'animazioni disponibili'}</p></div><span class="card-arrow" aria-hidden="true">↗</span></div></a>`).join('');
    installImageFallbacks();
    rosterPreviews = MovesRoster.install($('#character-grid'), characters);
  }
  $('#character-search').addEventListener('input', event => {
    const query = event.target.value.trim().toLocaleLowerCase('it');
    const matches = new Set(characters.filter(c => c.name.toLocaleLowerCase('it').includes(query)).map(c => c.id));
    document.querySelectorAll('[data-character]').forEach(el => el.hidden = !matches.has(el.dataset.character));
    rosterPreviews?.refresh();
    if (isMoves) renderMove(query);
    $('#nav-count').textContent = matches.size;
    $('.nav-empty').hidden = matches.size > 0;
    if (isRoster) { $('#visible-count').textContent = matches.size; $('#empty-state').hidden = matches.size > 0; }
  });
  if (!isDetail) return;
  if (!selected) {
    document.title = 'Personaggio non trovato · WEDOO Fighters';
    $('#character-detail').innerHTML = '<div class="empty-state"><h1>Personaggio non trovato.</h1><p class="intro">Scegli un nome dal menu oppure <a href="index.html">torna a tutti i personaggi</a>.</p></div>';
    return;
  }
  document.title = selected.name + ' · Animazioni · WEDOO Fighters';
  $('#breadcrumb-name').textContent = selected.name;
  const position = characters.indexOf(selected);
  const previous = characters[position - 1], next = characters[position + 1];
  const pager = (character, direction) => character ? `<a class="icon-button" data-character-link="${escape(character.id)}" href="${href(character)}" aria-label="${direction === '←' ? 'Precedente' : 'Successivo'}: ${escape(character.name)}">${direction}</a>` : `<span class="icon-button pager-disabled" aria-hidden="true">${direction}</span>`;
  $('#character-detail').innerHTML = `
    <a class="back-link" href="index.html">← Torna al roster</a>
    <section class="detail-heading"><div class="detail-identity"><div class="detail-portrait-frame"><video class="detail-portrait-fire" src="../portraits/fire.mp4" autoplay loop muted playsinline aria-hidden="true"></video><img class="detail-portrait" src="../portrait-pixeled/${encodeURIComponent(selected.id)}.png" alt="" width="100" height="100" decoding="async"></div><div class="detail-name"><p class="eyebrow">PERSONAGGIO ${number(position + 1)} / ${number(characters.length)}</p><h1>${escape(selected.name.toUpperCase())}<span class="accent">.</span></h1><p class="intro">Esplora le mosse, osserva ogni frame.</p></div></div><nav class="character-pager" aria-label="Personaggio precedente e successivo">${pager(previous, '←')}${pager(next, '→')}</nav></section>
    <div id="animation-gallery"></div>`;
  MovesGallery.install(document.querySelector('#animation-gallery'), selected, {highlightId:params.get('anim')});
  const activeLink = sidebar.querySelector('[aria-current="page"]');
  if (activeLink) activeLink.scrollIntoView({block:'nearest'});
})();
