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
  const selectedId = isDetail ? new URLSearchParams(location.search).get('id') : null;
  const selected = characters.find(c => c.id === selectedId);
  const href = character => 'personaggio.html?id=' + encodeURIComponent(character.id);
  const number = n => String(n).padStart(2, '0');
  const sidebar = $('#sidebar');
  sidebar.innerHTML = `
    <a class="brand" href="index.html" aria-label="WEDOO Fighters, tutti i personaggi"><span class="brand-mark" aria-hidden="true">WF</span><span class="brand-name">WEDOO<small>FIGHTERS</small></span></a>
    <button class="sidebar-close icon-button" type="button" aria-label="Chiudi il menu">×</button>
    <label class="sidebar-search"><span aria-hidden="true">⌕</span><span class="screen-reader-only">Cerca un personaggio</span><input id="character-search" type="search" placeholder="Cerca personaggio…" autocomplete="off" spellcheck="false"></label>
    <a class="all-link" href="index.html" ${!isDetail ? 'aria-current="page"' : ''}><span><b class="grid-symbol" aria-hidden="true">▦</b> Tutti i personaggi</span><span>${characters.length}</span></a>
    <div class="sidebar-label"><span>PERSONAGGI</span><span id="nav-count">${characters.length}</span></div>
    <nav class="character-nav" aria-label="Elenco personaggi">${characters.map((c, i) => `<a class="nav-link" data-character="${escape(c.id)}" href="${href(c)}" ${c.id === selectedId ? 'aria-current="page"' : ''}><span class="nav-number" aria-hidden="true">${number(i + 1)}</span><span>${escape(c.name.toUpperCase())}</span></a>`).join('')}<p class="nav-empty" hidden>Nessun risultato.</p></nav>
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
      const focusable = [...sidebar.querySelectorAll('a,button,input')].filter(el => !el.hidden && el.getClientRects().length);
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
  if (!isDetail) {
    $('#total-count').textContent = characters.length;
    $('#visible-count').textContent = characters.length;
    $('#character-grid').innerHTML = characters.map((c, i) => `<a class="character-card" data-character="${escape(c.id)}" href="${href(c)}" aria-label="Esplora le animazioni di ${escape(c.name)}"><div class="card-portrait"><span class="card-number" aria-hidden="true">${number(i + 1)} / ${number(characters.length)}</span><img data-portrait src="${escape(c.thumbnail)}" alt="${escape(c.name)}, posa originale" loading="lazy" decoding="async" width="512" height="512"></div><div class="card-label"><div><h3>${escape(c.name)}</h3><p>${c.animations.length} ${c.animations.length === 1 ? 'animazione disponibile' : 'animazioni disponibili'}</p></div><span class="card-arrow" aria-hidden="true">↗</span></div></a>`).join('');
    installImageFallbacks();
  }
  $('#character-search').addEventListener('input', event => {
    const query = event.target.value.trim().toLocaleLowerCase('it');
    const matches = new Set(characters.filter(c => c.name.toLocaleLowerCase('it').includes(query)).map(c => c.id));
    document.querySelectorAll('[data-character]').forEach(el => el.hidden = !matches.has(el.dataset.character));
    $('#nav-count').textContent = matches.size;
    $('.nav-empty').hidden = matches.size > 0;
    if (!isDetail) { $('#visible-count').textContent = matches.size; $('#empty-state').hidden = matches.size > 0; }
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
  const pager = (character, direction) => character ? `<a class="icon-button" href="${href(character)}" aria-label="${direction === '←' ? 'Precedente' : 'Successivo'}: ${escape(character.name)}">${direction}</a>` : `<span class="icon-button pager-disabled" aria-hidden="true">${direction}</span>`;
  $('#character-detail').innerHTML = `
    <a class="back-link" href="index.html">← Torna al roster</a>
    <section class="detail-heading"><div><p class="eyebrow">PERSONAGGIO ${number(position + 1)} / ${number(characters.length)}</p><h1>${escape(selected.name.toUpperCase())}<span class="accent">.</span></h1><p class="intro">Esplora le mosse, osserva ogni frame.</p></div><nav class="character-pager" aria-label="Personaggio precedente e successivo">${pager(previous, '←')}${pager(next, '→')}</nav></section>
    <div class="detail-layout"><section class="player-panel" aria-label="Anteprima animazione"><div class="panel-header"><h2><span class="playing-dot" aria-hidden="true"></span><span id="animation-title">Idle</span></h2><span class="version-tag" id="version-tag"></span></div>
      <div class="stage" data-background="dark" aria-busy="true"><span class="stage-label">ANIMATION PREVIEW</span><canvas id="sprite-canvas" width="512" height="512" tabindex="0" role="img" aria-label="Animazione del personaggio ${escape(selected.name)}">Anteprima animata di ${escape(selected.name)}.</canvas><div class="stage-loading" role="status">Caricamento animazione…</div><div class="stage-error" role="alert" hidden></div></div>
      <div class="player-controls"><div class="timeline"><input id="frame-slider" type="range" min="0" max="0" value="0" step="1" aria-label="Seleziona un frame" disabled><span class="frame-counter" aria-hidden="true">00 / 00</span></div><div class="controls-row"><div class="transport"><button class="play-button" id="play-button" type="button" disabled>▶ Riproduci</button><button class="step-button" id="step-button" type="button" aria-label="Frame successivo" title="Frame successivo" disabled>▹|</button></div><label class="loop-control"><input type="checkbox" id="loop-toggle" checked> Loop</label><label class="speed-control">Velocità<select id="speed-select" aria-label="Velocità rispetto a quella salvata"><option value="0.25">0,25×</option><option value="0.5">0,5×</option><option value="1" selected>1? ? 18 fps</option><option value="1.5">1,5×</option><option value="2">2×</option></select></label></div></div></section>
      <aside class="animation-sidebar" aria-label="Animazioni e impostazioni"><div class="animation-navigation"><div class="animation-list-label"><span>ANIMAZIONI</span><span>${number(selected.animations.length)}</span></div><div id="animation-list"></div></div>
      <section class="info-panel"><h3>Questa animazione</h3><dl><dt>Frame</dt><dd id="info-frames">—</dd><dt>Dimensioni frame</dt><dd id="info-size">—</dd><dt>Riproduzione</dt><dd id="info-fps">—</dd><dt>Velocità salvata</dt><dd id="info-speed">—</dd></dl></section>
      <section class="info-panel"><h3>Sfondo anteprima</h3><div class="swatches" role="group" aria-label="Sfondo dell'anteprima"><button class="swatch" type="button" data-background="dark" aria-label="Sfondo scuro" title="Scuro" aria-pressed="true"></button><button class="swatch" type="button" data-background="light" aria-label="Sfondo chiaro" title="Chiaro" aria-pressed="false"></button><button class="swatch" type="button" data-background="checker" aria-label="Sfondo a scacchi" title="Scacchi" aria-pressed="false"></button></div></section>
      <a class="download-button" id="download-png" download>Scarica spritesheet <span aria-hidden="true">↓</span></a><p class="keyboard-tip"><kbd>Spazio</kbd> riproduci / pausa<br><kbd>← →</kbd> scorri i frame nell'anteprima</p></aside></div>`;
  const canvas = $('#sprite-canvas'), context = canvas.getContext('2d');
  const stage = $('.stage'), slider = $('#frame-slider'), playButton = $('#play-button');
  if (!context) { $('.stage-error').hidden = false; $('.stage-error').textContent = 'Questo browser non supporta l’anteprima animata.'; $('.stage-loading').hidden = true; return; }
  let animation, image, loaded = false, playing = false, frameState = {frame:0,remainder:0}, lastTime = null, loadId = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fps = () => MovesCore.effectiveFps(animation, Number($('#speed-select').value));
  function draw() {
    if (!loaded) return;
    const [x,y,w,h] = animation.frames[frameState.frame];
    context.clearRect(0,0,canvas.width,canvas.height); context.imageSmoothingEnabled = false;
    context.drawImage(image,x,y,w,h,0,0,canvas.width,canvas.height);
    slider.value = frameState.frame; slider.setAttribute('aria-valuetext', `Frame ${frameState.frame + 1} di ${animation.frames.length}`);
    $('.frame-counter').textContent = `${number(frameState.frame + 1)} / ${number(animation.frames.length)}`;
  }
  function setPlaying(value) {
    playing = value && loaded; lastTime = null;
    playButton.textContent = playing ? 'Ⅱ Pausa' : '▶ Riproduci';
    playButton.setAttribute('aria-label', playing ? 'Metti in pausa' : 'Riproduci animazione');
    $('.playing-dot').classList.toggle('is-paused', !playing);
  }
  function jump(frame) {
    setPlaying(false); frameState = {frame:Math.max(0,Math.min(animation.frames.length - 1,frame)),remainder:0}; draw();
  }
  function tick(time) {
    if (loaded && playing && !document.hidden) {
      if (lastTime !== null) {
        const oldFrame = frameState.frame;
        frameState = MovesCore.advance(frameState,Math.min(time - lastTime,250),fps(),animation.frames.length,$('#loop-toggle').checked);
        if (oldFrame !== frameState.frame) draw();
        if (frameState.ended) setPlaying(false);
      }
      lastTime = time;
    } else lastTime = null;
    requestAnimationFrame(tick);
  }
  function updateFps() { $('#info-fps').textContent = new Intl.NumberFormat('it',{maximumFractionDigits:1}).format(fps()) + ' fps'; }
  async function openAnimation(nextAnimation) {
    const token = ++loadId;
    loaded = false; setPlaying(false); animation = nextAnimation; frameState = {frame:0,remainder:0};
    context.clearRect(0,0,canvas.width,canvas.height); stage.setAttribute('aria-busy','true');
    $('.stage-loading').hidden = false; $('.stage-error').hidden = true;
    slider.disabled = true; playButton.disabled = true; $('#step-button').disabled = true;
    canvas.width = animation.frameWidth; canvas.height = animation.frameHeight;
    $('#animation-title').textContent = animation.name;
    $('#speed-select option[value="1"]').textContent = `1× · ${MovesCore.effectiveFps(animation,1)} fps`;
    $('#speed-select').setAttribute('aria-label','Velocità rispetto a quella base');
    $('#version-tag').textContent = animation.trimmed ? 'TRIMMED' : 'COMPLETA';
    $('#info-frames').textContent = animation.frames.length;
    $('#info-size').textContent = `${animation.frameWidth} × ${animation.frameHeight}`;
    $('#info-speed').textContent = new Intl.NumberFormat('it',{maximumFractionDigits:2}).format(animation.savedSpeed) + '×';
    $('#download-png').href = animation.image;
    $('#download-png').download = `${selected.id}-${animation.id}.png`;
    updateFps();
    document.querySelectorAll('[data-animation]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.animation === animation.id)));
    try {
      const nextImage = await new Promise((resolve,reject) => {
        const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Impossibile caricare lo spritesheet. Controlla che la cartella animation sia accanto a demo-moves.')); img.src = animation.image;
      });
      if (token !== loadId) return;
      if (animation.frames.some(([x,y,w,h]) => x+w > nextImage.naturalWidth || y+h > nextImage.naturalHeight)) throw new Error('Lo spritesheet non corrisponde ai frame salvati. Aggiorna il catalogo della demo.');
      image = nextImage; loaded = true;
      slider.max = animation.frames.length - 1; slider.disabled = false; playButton.disabled = false; $('#step-button').disabled = false;
      $('.stage-loading').hidden = true; stage.setAttribute('aria-busy','false'); draw(); setPlaying(!reducedMotion);
    } catch (error) {
      if (token !== loadId) return;
      $('.stage-loading').hidden = true; $('.stage-error').hidden = false; $('.stage-error').textContent = error.message; stage.setAttribute('aria-busy','false');
    }
  }
  $('#animation-list').innerHTML = selected.animations.map(a => `<button class="animation-option" type="button" data-animation="${escape(a.id)}" aria-pressed="false"><span class="motion-icon" aria-hidden="true">◈</span><span><strong>${escape(a.name)}</strong><small>${escape(a.description)}</small></span><span class="animation-check" aria-hidden="true">✓</span></button>`).join('');
  document.querySelectorAll('[data-animation]').forEach(button => button.addEventListener('click', () => openAnimation(selected.animations.find(a => a.id === button.dataset.animation))));
  playButton.addEventListener('click', () => {
    if (!playing && frameState.frame === animation.frames.length - 1 && !$('#loop-toggle').checked) { frameState = {frame:0,remainder:0}; draw(); }
    setPlaying(!playing);
  });
  $('#step-button').addEventListener('click', () => jump((frameState.frame+1)%animation.frames.length));
  slider.addEventListener('input', () => jump(Number(slider.value)));
  $('#speed-select').addEventListener('change', () => { frameState.remainder = 0; lastTime = null; updateFps(); });
  document.querySelectorAll('.swatch').forEach(button => button.addEventListener('click', () => {
    stage.dataset.background = button.dataset.background;
    document.querySelectorAll('.swatch').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
  }));
  document.addEventListener('visibilitychange', () => lastTime = null);
  canvas.addEventListener('keydown', event => {
    if (!loaded) return;
    if (event.code === 'Space') { event.preventDefault(); playButton.click(); }
    if (['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); jump((frameState.frame+(event.key === 'ArrowRight'?1:-1)+animation.frames.length)%animation.frames.length); }
  });
  const activeLink = sidebar.querySelector('[aria-current="page"]');
  if (activeLink) activeLink.scrollIntoView({block:'nearest'});
  requestAnimationFrame(tick); openAnimation(selected.animations[0]);
})();
