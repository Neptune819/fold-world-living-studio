import {artworks} from './gallery-data.js';

document.body.classList.toggle('embedded', parent !== window);
history.scrollRestoration = 'manual';

const overview = document.querySelector('#overview');
const detail = document.querySelector('#work-detail');
const grid = document.querySelector('#work-grid');
const search = document.querySelector('#gallery-search');
const clearSearch = document.querySelector('#clear-search');
const filters = document.querySelector('#collection-filters');
const lightbox = document.querySelector('#art-lightbox');
const stage = document.querySelector('#lightbox-stage');
const zoom = document.querySelector('#lightbox-zoom');
const storageKey = 'fold-art-gallery-view-v2';
const collections = {
  all: artworks.map(a => a.n),
  narrative: [1, 3, 7, 8, 14, 16, 18],
  abstract: [2, 10, 12, 13, 15],
  print: [4, 9, 17],
  photo: [5, 11],
  digital: [6]
};
const number = n => String(n).padStart(2, '0');
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const route = a => `#work-${number(a.n)}`;
let stored = {};
try { stored = JSON.parse(sessionStorage.getItem(storageKey)) || {}; } catch {}
const initialParams = new URLSearchParams(location.search);
let query = initialParams.has('q') ? initialParams.get('q') : String(stored.query || '');
let collection = initialParams.get('collection') || stored.collection || 'all';
if (!Object.hasOwn(collections, collection)) collection = 'all';
let selected = null;
let overviewScroll = Number.isFinite(stored.scroll) ? Math.max(0, stored.scroll) : 0;
let opener = Number.isInteger(stored.opener) ? stored.opener : null;
let hasOverviewPosition = Boolean(stored.hasPosition);
let lightboxOpener = null;
let savedOverflow = '';
let routeTicket = 0;

grid.innerHTML = artworks.map(a => `<a class="work-card" href="${route(a)}" data-work="${a.n}" aria-label="查看《${escape(a.title)}》：${escape(a.style)}"><div class="work-picture"><img src="${a.thumbnail}" width="480" height="600" loading="lazy" decoding="async" alt="${escape(a.title)}，${escape(a.style)}风格的 AI 作品"><span class="thumbnail-error" hidden>图片暂未加载<br>打开作品可重试</span></div><div class="work-caption"><span class="work-number">${number(a.n)}</span><div><h3>${escape(a.title)}</h3><p>${escape(a.style)}</p></div></div></a>`).join('');
const cards = [...grid.querySelectorAll('.work-card')];
const searchable = new Map(artworks.map(a => [a.n, [a.title, a.style, a.en, a.era, a.artist].join(' ').normalize('NFKC').toLocaleLowerCase()]));

function notifyHost() {
  if (parent === window) return;
  try { parent.document.dispatchEvent(new CustomEvent('gallery-location-change')); } catch {}
}

function rememberView() {
  try { sessionStorage.setItem(storageKey, JSON.stringify({query, collection, scroll: overviewScroll, opener, hasPosition: hasOverviewPosition})); } catch {}
}

function applyFilters(updateURL = false) {
  const words = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  let count = 0;
  for (const card of cards) {
    const n = Number(card.dataset.work);
    card.hidden = !collections[collection].includes(n) || !words.every(word => searchable.get(n).includes(word));
    if (!card.hidden) count++;
  }
  filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.collection === collection)));
  search.value = query;
  clearSearch.hidden = !query;
  document.querySelector('#empty-results').hidden = count !== 0;
  document.querySelector('#result-count').textContent = count === artworks.length ? `共 ${count} 件作品` : `找到 ${count} / ${artworks.length} 件作品`;
  if (updateURL) {
    const url = new URL(location.href);
    query.trim() ? url.searchParams.set('q', query.trim()) : url.searchParams.delete('q');
    collection === 'all' ? url.searchParams.delete('collection') : url.searchParams.set('collection', collection);
    history.replaceState(null, '', url.href);
  }
  rememberView();
  notifyHost();
}

function resetSearch(all = false) {
  query = '';
  if (all) collection = 'all';
  applyFilters(true);
  search.focus({preventScroll: true});
}

search.addEventListener('input', e => {
  if (e.isComposing) return;
  query = search.value;
  applyFilters(true);
});
search.addEventListener('compositionend', () => { query = search.value; applyFilters(true); });
clearSearch.addEventListener('click', () => resetSearch());
document.querySelector('#reset-filters').addEventListener('click', () => resetSearch(true));
filters.addEventListener('click', e => {
  const button = e.target.closest('button[data-collection]');
  if (!button) return;
  collection = button.dataset.collection;
  applyFilters(true);
});
grid.addEventListener('click', e => {
  const card = e.target.closest('.work-card');
  if (!card || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  overviewScroll = scrollY;
  opener = Number(card.dataset.work);
  hasOverviewPosition = true;
  rememberView();
});

grid.addEventListener('error', e => {
  if (!(e.target instanceof HTMLImageElement)) return;
  const frame = e.target.closest('.work-picture');
  frame.classList.add('image-failed');
  frame.querySelector('.thumbnail-error').hidden = false;
}, true);
grid.addEventListener('load', e => {
  if (!(e.target instanceof HTMLImageElement)) return;
  const frame = e.target.closest('.work-picture');
  frame.classList.remove('image-failed');
  frame.querySelector('.thumbnail-error').hidden = true;
}, true);

function attachHeroImage() {
  const image = document.querySelector('.intro-art img');
  const frame = image.closest('.hero-image-frame');
  const status = document.querySelector('#hero-image-status');
  const message = status.querySelector('p');
  const retry = document.querySelector('#retry-hero-image');
  const sources = [...new Set([image.src, ...image.srcset.split(',').map(candidate => new URL(candidate.trim().split(/\s+/)[0], location.href).href)])];
  let pending = false;
  const update = () => {
    const failed = image.complete && !image.naturalWidth;
    const focusedRetry = document.activeElement === retry;
    pending = false;
    frame.classList.toggle('image-failed', failed);
    frame.setAttribute('aria-busy', 'false');
    status.hidden = !failed;
    retry.setAttribute('aria-disabled', 'false');
    retry.textContent = '重新加载封面';
    message.textContent = '封面图片暂未加载。';
    if (!failed && image.complete && focusedRetry) document.querySelector('#hero-caption').focus({preventScroll: true});
  };
  image.addEventListener('load', update);
  image.addEventListener('error', update);
  retry.addEventListener('click', () => {
    if (pending) return;
    pending = true;
    const current = image.currentSrc || image.src;
    const alternate = sources.find(source => source !== current) || sources[0];
    frame.setAttribute('aria-busy', 'true');
    retry.setAttribute('aria-disabled', 'true');
    retry.textContent = '正在加载…';
    message.textContent = '正在重新加载封面…';
    image.removeAttribute('srcset');
    image.src = alternate;
  });
  update();
}
attachHeroImage();

function closeLightbox() {
  if (!lightbox.open) return;
  lightbox.close();
  document.documentElement.style.overflow = savedOverflow;
  stage.replaceChildren();
  lightboxOpener?.isConnected && lightboxOpener.focus({preventScroll: true});
}

function openLightbox(button) {
  const source = detail.querySelector('.detail-art img');
  if (!selected || !source?.complete || !source.naturalWidth || lightbox.open) return;
  lightboxOpener = button;
  savedOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  const image = new Image();
  image.id = 'lightbox-image';
  image.src = source.currentSrc || source.src;
  image.alt = source.alt;
  image.style.setProperty('--original-width', `${source.naturalWidth}px`);
  image.draggable = false;
  stage.replaceChildren(image);
  stage.classList.remove('original-size');
  document.querySelector('#lightbox-title').textContent = selected.title;
  zoom.textContent = '原尺寸';
  zoom.setAttribute('aria-pressed', 'false');
  lightbox.showModal();
  document.querySelector('#lightbox-close').focus({preventScroll: true});
}

function toggleZoom() {
  const original = stage.classList.toggle('original-size');
  zoom.textContent = original ? '适合窗口' : '原尺寸';
  zoom.setAttribute('aria-pressed', String(original));
  requestAnimationFrame(() => {
    stage.scrollLeft = original ? Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2) : 0;
    stage.scrollTop = 0;
  });
}
zoom.addEventListener('click', toggleZoom);
stage.addEventListener('dblclick', toggleZoom);
document.querySelector('#lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('cancel', e => { e.preventDefault(); closeLightbox(); });

function attachDetailImage() {
  const image = detail.querySelector('.detail-art img');
  const button = detail.querySelector('.detail-zoom-button');
  const status = detail.querySelector('#image-status');
  const retry = detail.querySelector('#retry-image');
  const update = () => {
    const failed = image.complete && !image.naturalWidth;
    const ready = image.complete && image.naturalWidth > 0;
    button.disabled = !ready;
    button.classList.toggle('image-failed', failed);
    status.hidden = !failed;
    retry.hidden = !failed;
  };
  image.addEventListener('load', update);
  image.addEventListener('error', update);
  button.addEventListener('click', () => openLightbox(button));
  retry.addEventListener('click', () => { image.src = selected.image; status.hidden = true; retry.hidden = true; button.disabled = true; });
  update();
}

function render() {
  const ticket = ++routeTicket;
  const wasDetail = Boolean(selected);
  const match = /^#work-(\d{2})$/.exec(location.hash);
  const a = match && artworks.find(a => a.n === Number(match[1]));
  if (lightbox.open) closeLightbox();
  selected = a || null;
  if (!a) {
    overview.hidden = false;
    detail.hidden = true;
    document.title = 'AI 艺术实验画廊 · 折界';
    notifyHost();
    if (wasDetail) requestAnimationFrame(() => {
      if (ticket !== routeTicket) return;
      const card = grid.querySelector(`[data-work="${opener}"]`);
      if (hasOverviewPosition) scrollTo({top: overviewScroll, behavior: 'instant'});
      else if (card && !card.hidden) card.scrollIntoView({block: 'center', behavior: 'instant'});
      else document.querySelector('#works').scrollIntoView({behavior: 'instant'});
      (card && !card.hidden ? card : document.querySelector('#works-heading')).focus({preventScroll: true});
    });
    return;
  }
  if (!wasDetail && !opener) opener = a.n;
  overview.hidden = true;
  detail.hidden = false;
  document.title = `${a.title} · ${a.style} · AI 艺术画廊`;
  const previous = artworks[a.n - 2], next = artworks[a.n];
  detail.innerHTML = `<nav class="detail-top" aria-label="作品位置"><a href="#works">← 作品目录</a><span class="detail-count">${number(a.n)} / ${artworks.length}</span></nav><div class="detail-layout"><figure class="detail-art"><button type="button" class="detail-zoom-button" aria-haspopup="dialog" aria-controls="art-lightbox" aria-label="放大查看《${escape(a.title)}》的细节"><img src="${a.image}" width="1122" height="1402" alt="${escape(a.title)}，${escape(a.style)}风格的 AI 作品"><span class="zoom-affordance" aria-hidden="true">查看大图 ↗</span></button><figcaption>AI 生成作品 · ${number(a.n)} · 点击图片查看细节</figcaption><p id="image-status" class="image-status" role="status" hidden>图片暂未加载。</p><button id="retry-image" class="retry-image" type="button" hidden>重新加载图片</button></figure><div class="detail-copy"><h1 id="work-title" tabindex="-1">${escape(a.title)}</h1><h2 class="style-name">${escape(a.style)}</h2><p class="style-english">${escape(a.en)}</p><div class="style-context"><p>${escape(a.era)}</p><p>${escape(a.artist)}</p></div><section class="detail-section"><h2>风格简介</h2><p>${escape(a.intro)}</p></section><section class="detail-section"><h2>画面中的风格</h2><p>${escape(a.reading)}</p></section><section class="detail-section"><h2>AI 创作要点</h2><p>${escape(a.ai)}</p></section><a class="source-link" href="${escape(a.url)}" target="_blank" rel="noopener noreferrer">资料来源：${escape(a.source)} ↗</a></div></div><nav class="detail-navigation" aria-label="浏览相邻作品">${previous ? `<a href="${route(previous)}">← ${escape(previous.title)}<br>${escape(previous.style)}</a>` : '<span></span>'}${next ? `<a class="next-work" href="${route(next)}">${escape(next.title)} →<br>${escape(next.style)}</a>` : '<a class="next-work" href="#works">返回作品目录 →</a>'}</nav>`;
  attachDetailImage();
  scrollTo({top: 0, behavior: 'instant'});
  document.querySelector('#work-title').focus({preventScroll: true});
  notifyHost();
}
applyFilters(true);
addEventListener('hashchange', render);
addEventListener('popstate', () => {
  const params = new URLSearchParams(location.search);
  query = params.get('q') || '';
  collection = Object.hasOwn(collections, params.get('collection')) ? params.get('collection') : 'all';
  applyFilters();
});
render();

document.addEventListener('keydown', e => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
  if (lightbox.open) {
    if (e.key === 'Tab') {
      const stops = [...lightbox.querySelectorAll('button:not([disabled]),[tabindex="0"]')];
      const first = stops[0], last = stops.at(-1), active = document.activeElement;
      if (!lightbox.contains(active) || (!e.shiftKey && active === last) || (e.shiftKey && active === first)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus({preventScroll: true});
      }
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeLightbox(); }
    return;
  }
  if (e.target === search && e.key === 'Escape' && query) {
    e.preventDefault();
    e.stopPropagation();
    resetSearch();
    return;
  }
  if (e.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
  if (!selected) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); location.hash = 'works'; }
  if (e.key === 'ArrowLeft' && selected.n > 1) { e.preventDefault(); location.hash = route(artworks[selected.n - 2]); }
  if (e.key === 'ArrowRight' && selected.n < artworks.length) { e.preventDefault(); location.hash = route(artworks[selected.n]); }
});

addEventListener('pagehide', () => {
  if (!selected) { overviewScroll = scrollY; hasOverviewPosition = true; }
  rememberView();
});
document.querySelector('#back-to-world').addEventListener('click', e => {
  if (parent === window) return;
  try { parent.document.dispatchEvent(new CustomEvent('close-featured-page')); e.preventDefault(); } catch {}
});
