/* OHMusic frontend: hash-routed SPA, no build step */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const view = $('#view');
const audio = $('#audio');
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const fmtLong = (s) => { const m = Math.round((s || 0) / 60); return m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`; };
const artHref = (a) => (a && a.id ? `#/artist/${a.id}` : `#/search/${encodeURIComponent(a?.name || '')}`);
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- icons ---------- */
const P = {
  logo: '<svg viewBox="0 0 32 32" width="__" height="__"><circle cx="16" cy="16" r="16" fill="currentColor"/><path d="M7 17c2-7 4-7 6 0s4 7 6 0 3-4 6-2" stroke="#000" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>',
  play: 'M8 5v14l11-7z',
  pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  next: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
  prev: 'M6 6h2v12H6zm3.5 6l8.5 6V6z',
  shuffle: 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z',
  repeat: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
  heart: 'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z',
  heartfill: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  more: 'M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  queue: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z',
  volume: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  mute: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  library: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z',
  browse: 'M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  down: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
  expand: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
  mic: 'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  back: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  forward: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  disc: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  radio: 'M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z',
  next1: 'M13 7v10h-2V9.5l-1.5.9-.5-1.7L11.5 7z',
  share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z',
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  addcircle: 'M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  checkcircle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  queueadd: 'M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z',
  download: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM13 7h-2v6.17l-2.59-2.58L7 12l5 5 5-5-1.41-1.41L13 13.17V7z',
  addbox: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-8-2h2v-4h4v-2h-4V7h-2v4H7v2h4z',
  person: 'M12 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 9c2.7 0 5.8 1.29 6 2v1H6v-1c.2-.71 3.3-2 6-2zm0-11C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z',
};
/* ---------- pixel art (original sprites drawn from text grids) ----------
   '#' = currentColor, y = gold, d = dark gold, w = highlight, k = black outline */
const ART = {
  coin: [
    '...kkkkkk...',
    '..kyyyyyyk..',
    '.kywwyyyydk.',
    'kywyyddyyydk',
    'kywyydyyyydk',
    'kywyydyyyydk',
    'kywyydyyyydk',
    'kywyyddyyydk',
    'kyyyyyyyyydk',
    '.kyyyyyyydk.',
    '..kddddddk..',
    '...kkkkkk...',
  ],
  heartfill: ['.##...##.', '#########', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'],
  heart: ['.##...##.', '#..#.#..#', '#...#...#', '#.......#', '.#.....#.', '..#...#..', '...#.#...', '....#....'],
  play: ['##......', '####....', '######..', '########', '########', '######..', '####....', '##......'],
  pause: ['###..###', '###..###', '###..###', '###..###', '###..###', '###..###', '###..###', '###..###'],
  next: ['#.....##', '##....##', '###...##', '####..##', '####..##', '###...##', '##....##', '#.....##'],
  prev: ['##.....#', '##....##', '##...###', '##..####', '##..####', '##...###', '##....##', '##.....#'],
  arrow: [
    'k...........', 'kk..........', 'kwk.........', 'kwwk........', 'kwwwk.......', 'kwwwwk......', 'kwwwwwk.....', 'kwwwwwwk....',
    'kwwwwwwwk...', 'kwwwwwkkkk..', 'kwwkwwk.....', 'kwk.kwwk....', 'kk..kwwk....', 'k....kwwk...', '.....kwwk...', '......kk....',
  ],
};
ART.arrowg = ART.arrow.map((r) => r.replaceAll('w', 'y'));
const PAL = { y: '#f5c451', d: '#c98a12', w: '#fff3bf', k: '#000' };
function artSvg(n, w) {
  const rows = ART[n], cols = rows[0].length;
  let r = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < cols; x++) {
      const c = row[x];
      if (c !== '.') r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c === '#' ? 'currentColor' : PAL[c]}"/>`;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows.length}" width="${w}" height="${Math.round((w * rows.length) / cols)}" shape-rendering="crispEdges">${r}</svg>`;
}
const ic = (n, s = 20) => (ART[n] ? artSvg(n, s) : `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="currentColor"><path d="${P[n]}"/></svg>`);
const setIc = (el, n, s) => { el.innerHTML = ic(n, s || +el.dataset.s || 20); };
$$('[data-ic]').forEach((el) => {
  const n = el.dataset.ic;
  const s = el.classList.contains('play') ? 20 : el.id === 'new-pl' ? 18 : +el.dataset.s || (n === 'coin' ? 30 : 20);
  setIc(el, n, s);
});
// expose sprites to CSS (bullets, cursors, favicon)
{
  const url = (n, w) => `url("data:image/svg+xml,${encodeURIComponent(artSvg(n, w))}")`;
  const root = document.documentElement.style;
  root.setProperty('--coin', url('coin', 24));
  root.setProperty('--cursor', url('arrow', 24));
  root.setProperty('--cursor-gold', url('arrowg', 24));
  $('#favicon').href = `data:image/svg+xml,${encodeURIComponent(artSvg('coin', 32))}`;
}
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#222229"/><circle cx="32" cy="32" r="13" fill="none" stroke="#f5c451" stroke-width="3"/><circle cx="32" cy="32" r="3" fill="#f5c451"/></svg>');
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG' && !e.target.dataset.fb) { e.target.dataset.fb = 1; e.target.src = PLACEHOLDER; }
}, true);
const img = (src, alt = '') => `<img src="${esc(src || PLACEHOLDER)}" alt="${esc(alt)}" loading="lazy" />`;

/* ---------- storage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const lib = {
  liked: store.get('oh.liked', []),
  playlists: store.get('oh.playlists', []),
  recent: store.get('oh.recent', []),
  searches: store.get('oh.searches', []),
  artists: store.get('oh.artists', []),
  albums: store.get('oh.albums', []),
};
const save = () => { store.set('oh.liked', lib.liked); store.set('oh.playlists', lib.playlists); store.set('oh.recent', lib.recent); store.set('oh.searches', lib.searches); store.set('oh.artists', lib.artists); store.set('oh.albums', lib.albums); };
const isLiked = (id) => lib.liked.some((t) => String(t.id) === String(id));
const isFollowing = (id) => lib.artists.some((a) => String(a.id) === String(id));

/* ---------- ui helpers ---------- */
let toastT;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2200);
}
async function api(p) {
  let r;
  try { r = await fetch(p); } catch { throw new Error('Cannot reach the OHMusic server. Is it running?'); }
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
  return r.json();
}
function askText(title, val = '') {
  return new Promise((res) => {
    const m = $('#modal');
    m.innerHTML = `<div class="box"><h3>${esc(title)}</h3><input id="m-in" value="${esc(val)}" maxlength="60" /><div class="act"><button class="btn ghost" id="m-c">Cancel</button><button class="btn" id="m-ok">Save</button></div></div>`;
    m.hidden = false;
    const inp = $('#m-in'); inp.focus(); inp.select();
    const done = (v) => { m.hidden = true; m.innerHTML = ''; res(v); };
    $('#m-c').onclick = () => done(null);
    $('#m-ok').onclick = () => done(inp.value.trim() || null);
    inp.onkeydown = (e) => { if (e.key === 'Enter') $('#m-ok').click(); if (e.key === 'Escape') done(null); };
    m.onclick = (e) => { if (e.target === m) done(null); };
  });
}


/* ---------- downloads (sequential, so the browser doesn't block them) ---------- */
async function downloadTracks(list) {
  if (!list.length) return;
  toast(list.length > 1 ? `Downloading ${list.length} songs…` : `Downloading “${list[0].title}”…`);
  for (const t of list) {
    const a = document.createElement('a');
    a.href = `/api/download?${trackQs(t)}`;
    a.download = '';
    document.body.appendChild(a); a.click(); a.remove();
    await new Promise((r) => setTimeout(r, 1500));
  }
}
let onSel = null; // album page hooks into row selection

/* ---------- colour theming from artwork ---------- */
const tintCache = new Map();
async function getTint(url) {
  if (!url) return null;
  if (tintCache.has(url)) return tintCache.get(url);
  try {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.src = `/api/img?u=${encodeURIComponent(url)}`;
    await im.decode();
    const c = document.createElement('canvas'); c.width = c.height = 20;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(im, 0, 0, 20, 20);
    const d = x.getImageData(0, 0, 20, 20).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
      const w = 1 + (mx - mn) / 24; // favour colourful pixels
      r += d[i] * w; g += d[i + 1] * w; b += d[i + 2] * w; n += w;
    }
    r /= n; g /= n; b /= n;
    const k = 105 / Math.max(r, g, b, 1); // normalise brightness so it stays dark
    const out = `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
    tintCache.set(url, out);
    return out;
  } catch { return null; }
}
let tintToken = 0;
async function setViewTint(url) {
  const my = ++tintToken;
  const t = await getTint(url);
  if (my === tintToken) document.documentElement.style.setProperty('--tint', t || '#3a2e10');
}

/* ---------- state ---------- */
const state = { queue: [], index: -1, shuffle: false, repeat: 0 /* 0 off, 1 all, 2 one */, errStreak: 0, counted: false };

/* ---------- retro HUD: every song you play earns a coin ---------- */
let coins = store.get('oh.coins', 0);
const played = new Set(store.get('oh.played', [])); // ids of songs you've already played
function renderHud() {
  $('#coins').textContent = String(coins).padStart(4, '0');
  $('#lv').textContent = String(Math.floor(coins / 10) + 1).padStart(2, '0');
  $('#xp').style.setProperty('--p', `${(coins % 10) * 10}%`);
}
function coinPop() {
  const r = $('#np-cover-btn').getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'coin-pop';
  el.innerHTML = `${ic('coin', 26)}<b>+1</b>`;
  el.style.left = `${r.left + 16}px`; el.style.top = `${r.top - 8}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
function earnCoin() {
  coins++; store.set('oh.coins', coins); renderHud(); coinPop();
  if (coins % 10 === 0) toast(`LEVEL UP!  LV ${Math.floor(coins / 10) + 1}`);
}
renderHud();
// CRT scanlines (toggle with C)
const setCrt = (on) => { document.body.classList.toggle('crt', on); store.set('oh.crt', on); };
setCrt(store.get('oh.crt', true));
const current = () => state.queue[state.index];
const tracksById = new Map();
const remember = (list) => list.forEach((t) => tracksById.set(String(t.id), t));

/* ---------- playback ---------- */
const trackQs = (t) => `artist=${encodeURIComponent(t.artist.name)}&title=${encodeURIComponent(t.title)}&duration=${t.duration || 0}${t.vid ? `&vid=${encodeURIComponent(t.vid)}` : ''}`;
const streamUrl = (t) => `/api/stream?${trackQs(t)}`;

function setQueue(list, i = 0, { shuffle = false } = {}) {
  if (!list.length) return;
  remember(list);
  state.queue = list.slice();
  if (shuffle) { state.shuffle = true; $('#btn-shuffle').classList.add('on'); i = Math.floor(Math.random() * list.length); }
  play(i);
}

function play(i) {
  if (i < 0 || i >= state.queue.length) return;
  state.index = i;
  state.counted = false;
  const t = current();
  $('#status').textContent = 'LOADING...';
  audio.src = streamUrl(t);
  audio.play().catch(() => {});
  lib.recent = [t, ...lib.recent.filter((x) => String(x.id) !== String(t.id))].slice(0, 30);
  save();
  updateNowPlaying();
  prefetchNext();
}

function prefetchNext() {
  const n = state.queue[state.index + 1];
  if (n) fetch(`/api/prefetch?${trackQs(n)}`).catch(() => {});
}

function next(auto = false) {
  if (!state.queue.length) return;
  if (auto && state.repeat === 2) return play(state.index);
  if (state.shuffle && state.queue.length > 1) {
    let j; do { j = Math.floor(Math.random() * state.queue.length); } while (j === state.index);
    return play(j);
  }
  if (state.index + 1 < state.queue.length) return play(state.index + 1);
  if (state.repeat === 1) return play(0);
  if (auto) { audio.pause(); setIc($('#btn-play'), 'play', 20); }
}
function prev() {
  if (audio.currentTime > 3) audio.currentTime = 0;
  else play(Math.max(0, state.index - 1));
}

function markPlaying() {
  const id = current() ? String(current().id) : null;
  $$('.tr[data-id]').forEach((el) => {
    el.classList.toggle('playing', el.dataset.id === id);
    el.classList.toggle('live', el.dataset.id === id && !audio.paused);
  });
}

async function updateNowPlaying() {
  const t = current();
  if (!t) return;
  $('#np-title').textContent = t.title;
  const a = $('#np-artist'); a.textContent = t.artist.name; a.href = artHref(t.artist);
  $('#np-cover').src = t.album.cover || PLACEHOLDER;
  syncLike();
  document.title = `${t.title} · ${t.artist.name} — OHMusic`;
  markPlaying();
  renderQueue();
  // fullscreen
  $('#fs-cover').src = t.album.coverBig || t.album.cover || PLACEHOLDER;
  $('#fs-title').textContent = t.title;
  const fa = $('#fs-artist'); fa.textContent = t.artist.name; fa.href = artHref(t.artist);
  getTint(t.album.coverBig || t.album.cover).then((c) => { $('#fs').style.setProperty('--fs-tint', c || '#3a2e10'); });
  if (!$('#fs').hidden) loadLyrics(t);
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title, artist: t.artist.name, album: t.album.title || '',
      artwork: t.album.coverBig ? [{ src: t.album.coverBig, sizes: '1000x1000', type: 'image/jpeg' }] : [],
    });
  }
}
function syncLike() {
  const t = current();
  const on = t && isLiked(t.id);
  setIc($('#np-like'), on ? 'heartfill' : 'heart', 20);
  $('#np-like').classList.toggle('on', !!on);
}

audio.addEventListener('playing', () => {
  setIc($('#btn-play'), 'pause', 20); $('#status').textContent = ''; state.errStreak = 0;
  $('#np-label').textContent = 'NOW PLAYING';
  if (!state.counted) {
    state.counted = true;
    const pid = String(current()?.id);
    if (pid && !played.has(pid)) { // a coin only for a brand-new song
      played.add(pid); store.set('oh.played', [...played].slice(-5000));
      earnCoin();
    }
  }
  markPlaying(); startViz();
});
audio.addEventListener('pause', () => { setIc($('#btn-play'), 'play', 20); $('#np-label').textContent = 'PAUSED'; markPlaying(); });
audio.addEventListener('waiting', () => { $('#status').textContent = 'BUFFERING...'; });
audio.addEventListener('canplay', () => { if ($('#status').textContent === 'BUFFERING...') $('#status').textContent = ''; });
audio.addEventListener('ended', () => next(true));
audio.addEventListener('error', () => {
  state.errStreak++;
  if (state.errStreak >= 3 || state.queue.length < 2) { $('#status').textContent = 'GAME OVER'; $('#np-label').textContent = 'ERROR'; toast('Playback failed. Check /api/health'); return; }
  $('#status').textContent = 'SKIPPING...';
  setTimeout(() => next(), 900);
});
audio.addEventListener('timeupdate', () => {
  const d = audio.duration && isFinite(audio.duration) ? audio.duration : current()?.duration || 0;
  $('#t-cur').textContent = fmt(audio.currentTime);
  $('#t-dur').textContent = fmt(d);
  if (d && !seeking) setRange($('#seek'), (audio.currentTime / d) * 1000, 1000);
  syncLyrics();
});

function setRange(el, v, max) { el.value = v; el.style.setProperty('--p', `${(v / max) * 100}%`); }
let seeking = false;
const seek = $('#seek');
seek.addEventListener('input', () => { seeking = true; setRange(seek, seek.value, 1000); });
seek.addEventListener('change', () => {
  const d = audio.duration && isFinite(audio.duration) ? audio.duration : current()?.duration || 0;
  audio.currentTime = (seek.value / 1000) * d; seeking = false;
});
const vol = $('#vol');
const setVol = (v) => { audio.volume = v / 100; setRange(vol, v, 100); setIc($('#btn-mute'), v === 0 || audio.muted ? 'mute' : 'volume', 20); store.set('oh.vol', v); };
vol.addEventListener('input', () => { audio.muted = false; setVol(+vol.value); });
setVol(store.get('oh.vol', 80));
$('#btn-mute').onclick = () => { audio.muted = !audio.muted; setIc($('#btn-mute'), audio.muted ? 'mute' : 'volume', 20); };

$('#btn-play').onclick = () => { if (!current()) return toast('Pick a song first'); audio.paused ? audio.play() : audio.pause(); };
$('#btn-next').onclick = () => next();
$('#btn-prev').onclick = prev;
$('#btn-shuffle').onclick = (e) => { state.shuffle = !state.shuffle; e.currentTarget.classList.toggle('on', state.shuffle); toast(`Shuffle ${state.shuffle ? 'on' : 'off'}`); };
$('#btn-repeat').onclick = (e) => {
  state.repeat = (state.repeat + 1) % 3;
  const b = e.currentTarget; b.classList.toggle('on', state.repeat > 0);
  setIc(b, state.repeat === 2 ? 'next1' : 'repeat', 20);
  if (state.repeat === 2) b.innerHTML = `<span style="position:relative;display:grid">${ic('repeat', 20)}<b style="position:absolute;inset:0;display:grid;place-items:center;font-size:8px">1</b></span>`;
  toast(['Repeat off', 'Repeat all', 'Repeat one'][state.repeat]);
};
$('#btn-queue').onclick = () => { const q = $('#queue'); q.hidden = !q.hidden; renderQueue(); };
$('#q-clear').onclick = () => { state.queue = current() ? [current()] : []; state.index = current() ? 0 : -1; renderQueue(); };
$('#np-like').onclick = () => { const t = current(); if (t) { toggleLike(t); } };
function toggleLike(t) {
  if (isLiked(t.id)) { lib.liked = lib.liked.filter((x) => String(x.id) !== String(t.id)); toast('Removed from Liked Songs'); }
  else { lib.liked = [t, ...lib.liked]; toast('Added to Liked Songs'); }
  save(); syncLike(); renderSidebar();
  $$(`.tr[data-id="${t.id}"] .heart`).forEach((h) => { h.classList.toggle('on', isLiked(t.id)); setIc(h, isLiked(t.id) ? 'heartfill' : 'heart', 18); });
}

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => audio.play());
  navigator.mediaSession.setActionHandler('pause', () => audio.pause());
  navigator.mediaSession.setActionHandler('nexttrack', () => next());
  navigator.mediaSession.setActionHandler('previoustrack', prev);
  navigator.mediaSession.setActionHandler('seekto', (d) => { audio.currentTime = d.seekTime; });
}

/* ---------- queue panel ---------- */
function renderQueue() {
  if ($('#queue').hidden) return;
  const box = $('#queue-list');
  if (!state.queue.length) { box.innerHTML = '<div class="empty">Queue is empty</div>'; return; }
  const row = (t, i) => `
    <div class="tr ${i === state.index ? 'playing' : ''}" data-q="${i}">
      ${img(t.album.cover)}
      <div style="min-width:0"><div class="name">${esc(t.title)}</div><div class="by">${esc(t.artist.name)}</div></div>
      <div class="d">${fmt(t.duration)}</div>
      <button class="icon-btn" data-rm="${i}" title="Remove">${ic('close', 16)}</button>
    </div>`;
  const cur = state.queue[state.index];
  box.innerHTML = (cur ? `<div class="q-label">Now playing</div>${row(cur, state.index)}` : '') +
    (state.queue.length > state.index + 1 ? `<div class="q-label">Next up</div>${state.queue.map((t, i) => (i > state.index ? row(t, i) : '')).join('')}` : '');
}
$('#queue').addEventListener('click', (e) => {
  const rm = e.target.closest('[data-rm]');
  if (rm) { e.stopPropagation(); const i = +rm.dataset.rm; state.queue.splice(i, 1); if (i < state.index) state.index--; renderQueue(); return; }
  const r = e.target.closest('[data-q]'); if (r) play(+r.dataset.q);
});

/* ---------- full-screen player: lyrics + visualiser ---------- */
let lyr = { lines: [], idx: -1, token: 0 };
function parseLrc(txt) {
  return txt.split('\n').map((l) => {
    const m = l.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
    return m ? { t: +m[1] * 60 + parseFloat(m[2]), text: m[3] } : null;
  }).filter((x) => x && x.text !== undefined);
}
async function loadLyrics(t) {
  const box = $('#lyrics');
  const my = ++lyr.token;
  lyr.lines = []; lyr.idx = -1;
  box.innerHTML = '<div class="ly-empty">Loading lyrics…</div>';
  try {
    const d = await api(`/api/lyrics?artist=${encodeURIComponent(t.artist.name)}&title=${encodeURIComponent(t.title)}&album=${encodeURIComponent(t.album.title || '')}&duration=${t.duration || 0}`);
    if (my !== lyr.token) return;
    if (d.synced) {
      lyr.lines = parseLrc(d.synced);
      box.innerHTML = lyr.lines.map((l, i) => `<p class="ly" data-t="${l.t}" data-i="${i}">${esc(l.text) || '♪'}</p>`).join('');
      syncLyrics(true);
    } else if (d.plain) box.innerHTML = `<div class="ly-plain">${esc(d.plain)}</div>`;
    else box.innerHTML = '<div class="ly-empty">No lyrics found for this track.</div>';
  } catch { if (my === lyr.token) box.innerHTML = '<div class="ly-empty">Couldn’t load lyrics.</div>'; }
}
function syncLyrics(force) {
  if (!lyr.lines.length || $('#fs').hidden) return;
  const t = audio.currentTime + 0.25;
  let idx = -1;
  for (let i = 0; i < lyr.lines.length; i++) { if (lyr.lines[i].t <= t) idx = i; else break; }
  if (idx === lyr.idx && !force) return;
  lyr.idx = idx;
  $$('#lyrics .ly').forEach((el, i) => { el.classList.toggle('active', i === idx); el.classList.toggle('past', i < idx); });
  const el = $(`#lyrics .ly[data-i="${idx}"]`);
  if (el) $('#lyrics').scrollTo({ top: el.offsetTop - $('#lyrics').clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
}
$('#lyrics').addEventListener('click', (e) => { const p = e.target.closest('.ly'); if (p) audio.currentTime = +p.dataset.t; });

let actx, analyser, vizRAF;
function initAudioGraph() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    const src = actx.createMediaElementSource(audio);
    analyser = actx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.82;
    src.connect(analyser); analyser.connect(actx.destination);
  } catch { actx = null; analyser = null; }
}
function startViz() {
  if ($('#fs').hidden || vizRAF) return;
  const c = $('#viz'), x = c.getContext('2d');
  const data = new Uint8Array(64);
  const cols = 32, rows = 10, cw = c.width / cols, ch = c.height / rows;
  const loop = () => {
    if ($('#fs').hidden) { vizRAF = null; return; }
    vizRAF = requestAnimationFrame(loop);
    x.clearRect(0, 0, c.width, c.height);
    if (analyser) analyser.getByteFrequencyData(data);
    for (let i = 0; i < cols; i++) {
      const v = analyser && !audio.paused ? data[Math.floor(i * 1.3)] / 255 : 0;
      const n = Math.max(1, Math.round(v * rows)); // stack of 8-bit blocks
      for (let r = 0; r < n; r++) {
        x.fillStyle = r >= rows - 2 ? '#fff3bf' : r >= 6 ? '#ffe08a' : r >= 3 ? '#f5c451' : '#c98a12';
        x.fillRect(i * cw + 2, c.height - (r + 1) * ch + 2, cw - 4, ch - 4);
      }
    }
  };
  loop();
}
function openFs(lyricsFocus = false) {
  if (!current()) return toast('Play something first');
  initAudioGraph();
  if (actx && actx.state === 'suspended') actx.resume();
  $('#fs').hidden = false;
  $('#fs').classList.toggle('show-ly', lyricsFocus);
  loadLyrics(current());
  startViz();
}
const closeFs = () => { $('#fs').hidden = true; };
$('#btn-expand').onclick = () => ($('#fs').hidden ? openFs() : closeFs());
$('#np-cover-btn').onclick = () => openFs();
$('#btn-lyrics').onclick = () => ($('#fs').hidden || !$('#fs').classList.contains('show-ly') ? openFs(true) : closeFs());
$('#fs-close').onclick = closeFs;
$('#fs-artist').addEventListener('click', closeFs);

/* ---------- context menu ---------- */
const menu = $('#menu');
function openMenu(x, y, items) {
  menu.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : it.head ? `<div class="m-head">${esc(it.head)}</div>` : `<button data-mi="${i}" class="${it.danger ? 'danger' : ''}">${it.icon ? ic(it.icon, 16) : ''}${esc(it.label)}</button>`).join('');
  menu.hidden = false;
  const r = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(x, innerWidth - r.width - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(y, innerHeight - r.height - 8))}px`;
  menu.onclick = (e) => { const b = e.target.closest('[data-mi]'); if (!b) return; menu.hidden = true; items[+b.dataset.mi].fn(); };
}
const closeMenu = () => { menu.hidden = true; };
document.addEventListener('mousedown', (e) => { if (!menu.contains(e.target) && !e.target.closest('.more, .menu-trigger')) closeMenu(); });
$('#main').addEventListener('scroll', closeMenu);

function addToPlaylistMenu(x, y, t) {
  const items = [{ head: 'Add to playlist' }, { label: 'New playlist', icon: 'plus', fn: async () => { const n = await askText('New playlist'); if (n) { const p = createPlaylist(n); addToPlaylist(p.id, t); } } }];
  if (lib.playlists.length) items.push('-');
  lib.playlists.forEach((p) => items.push({ label: p.name, icon: 'queue', fn: () => addToPlaylist(p.id, t) }));
  openMenu(x, y, items);
}
function trackMenu(x, y, t, ctx) {
  const items = [
    { label: 'Play next', icon: 'next', fn: () => { if (state.index < 0) return setQueue([t]); state.queue.splice(state.index + 1, 0, t); renderQueue(); toast('Playing next'); } },
    { label: 'Add to queue', icon: 'queue', fn: () => { if (state.index < 0) return setQueue([t]); state.queue.push(t); renderQueue(); toast('Added to queue'); } },
    { label: isLiked(t.id) ? 'Remove from Liked Songs' : 'Save to Liked Songs', icon: isLiked(t.id) ? 'heartfill' : 'heart', fn: () => toggleLike(t) },
    { label: 'Add to playlist…', icon: 'plus', fn: () => addToPlaylistMenu(x, y, t) },
    '-',
    { label: 'Go to artist', icon: 'user', fn: () => { location.hash = artHref(t.artist); } },
    t.album.id ? { label: 'Go to album', icon: 'disc', fn: () => { location.hash = `#/album/${t.album.id}`; } } : null,
  ].filter(Boolean);
  if (ctx?.startsWith('mylist:')) {
    const pid = ctx.slice(7);
    items.push('-', { label: 'Remove from this playlist', icon: 'trash', danger: true, fn: () => { const p = lib.playlists.find((x) => x.id === pid); p.tracks = p.tracks.filter((x) => String(x.id) !== String(t.id)); save(); renderSidebar(); route(); } });
  }
  openMenu(x, y, items);
}

/* ---------- playlists ---------- */
function createPlaylist(name) { const p = { id: uid(), name, tracks: [] }; lib.playlists.unshift(p); save(); renderSidebar(); return p; }
function addToPlaylist(pid, t) {
  const p = lib.playlists.find((x) => x.id === pid); if (!p) return;
  if (p.tracks.some((x) => String(x.id) === String(t.id))) return toast(`Already in ${p.name}`);
  p.tracks.push(t); save(); renderSidebar(); toast(`Added to ${p.name}`);
}
$('#new-pl').onclick = async () => { const n = await askText('Create playlist', `My playlist #${lib.playlists.length + 1}`); if (n) { const p = createPlaylist(n); location.hash = `#/mylist/${p.id}`; } };

function renderSidebar() {
  const likedItem = `<a class="side-item" href="#/liked"><div class="thumb liked">${ic('heartfill', 20)}</div><div style="min-width:0"><div class="tt">Liked Songs</div><div class="ss">Playlist · ${lib.liked.length} songs</div></div></a>`;
  const pls = lib.playlists.map((p) => `<a class="side-item" href="#/mylist/${p.id}"><div class="thumb">${p.tracks[0] ? img(p.tracks[0].album.cover) : ic('queue', 20)}</div><div style="min-width:0"><div class="tt">${esc(p.name)}</div><div class="ss">Playlist · ${p.tracks.length} songs</div></div></a>`).join('');
  const arts = lib.artists.slice(0, 12).map((a) => `<a class="side-item" href="#/artist/${a.id}"><div class="thumb" style="border-radius:50%">${img(a.picture)}</div><div style="min-width:0"><div class="tt">${esc(a.name)}</div><div class="ss">Artist</div></div></a>`).join('');
  const albs = lib.albums.slice(0, 12).map((x) => `<a class="side-item" href="#/album/${x.id}"><div class="thumb">${img(x.cover)}</div><div style="min-width:0"><div class="tt">${esc(x.title)}</div><div class="ss">Album · ${esc(x.artist || '')}</div></div></a>`).join('');
  $('#side-list').innerHTML = likedItem + pls + albs + arts;
}

/* ---------- templates ---------- */
const skeleton = () => `<div class="loader"><span class="coin-spin">${ic('coin', 44)}</span><div class="px-text">LOADING<span class="dots"></span></div></div><div class="sk-row" style="opacity:.45">${'<div class="skeleton sk-card"></div>'.repeat(8)}</div>`;
const fab = (kind, id) => `<span class="fab" data-pk="${kind}" data-pid="${id}">${ic('play', 20)}</span>`;
const card = (href, src, title, sub, { round = false, kind, id } = {}) => `
  <a class="card ${round ? 'round' : ''}" href="${href}">
    <div class="img">${img(src)}${kind ? fab(kind, id) : ''}</div>
    <div class="t">${esc(title)}</div><div class="s">${esc(sub)}</div>
  </a>`;
const albumCard = (a) => card(`#/album/${a.id}`, a.cover, a.title, [a.year, a.artist].filter(Boolean).join(' · '), { kind: 'album', id: a.id });
const artistCard = (a) => card(`#/artist/${a.id}`, a.picture, a.name, 'Artist', { round: true, kind: 'artist', id: a.id });
const playlistCard = (p) => card(`#/playlist/${p.id}`, p.cover, p.title, `${p.tracks || ''} tracks`, { kind: 'playlist', id: p.id });
const trackCard = (t) => `
  <div class="card" data-tid="${t.id}">
    <div class="img">${img(t.album.cover)}<span class="fab">${ic('play', 20)}</span></div>
    <div class="t">${esc(t.title)}</div><div class="s">${esc(t.artist.name)}</div>
  </div>`;
const section = (title, html, right = '') => `<h2>${title}<span>${right}</span></h2>${html}`;
const rowOf = (items, fn) => `<div class="row">${items.map(fn).join('')}</div>`;
const trackRow = (items) => { remember(items); return `<div class="row" data-list="${items.map((t) => t.id).join(',')}">${items.map(trackCard).join('')}</div>`; };

function trackList(list, { numbered = true, ctx = '', noAlbum = false, limit, compact = false } = {}) {
  remember(list);
  const shown = limit ? list.slice(0, limit) : list;
  const html = shown.map((t, i) => compact ? `
    <div class="tr compact ${current() && String(current().id) === String(t.id) ? 'playing' : ''} ${current() && String(current().id) === String(t.id) && !audio.paused ? 'live' : ''}" data-id="${t.id}" data-i="${i}">
      <div class="n"><span class="num">${numbered ? i + 1 : ''}</span><span class="eq"><i></i><i></i><i></i></span><span class="pl">${ic('play', 16)}</span></div>
      <div style="min-width:0"><div class="name">${esc(t.title)}${t.explicit ? '<span class="exp">E</span>' : ''}</div>
        <div class="by"><a href="${artHref(t.artist)}">${esc(t.artist.name)}</a></div></div>
      <div class="d">${fmt(t.duration)}</div>
      <button class="heart icon-btn ${isLiked(t.id) ? 'on' : ''}" title="Like">${ic(isLiked(t.id) ? 'heartfill' : 'heart', 18)}</button>
      <button class="add icon-btn" title="Add to playlist">${ic('addbox', 20)}</button>
      <button class="dl icon-btn" title="Download">${ic('download', 20)}</button>
      <button class="more icon-btn" title="More">${ic('more', 20)}</button>
      <button class="sel" title="Select"></button>
    </div>` : `
    <div class="tr ${noAlbum ? 'noalb' : ''} ${current() && String(current().id) === String(t.id) ? 'playing' : ''} ${current() && String(current().id) === String(t.id) && !audio.paused ? 'live' : ''}" data-id="${t.id}" data-i="${i}">
      <div class="n"><span class="num">${numbered ? i + 1 : ic('play', 14)}</span><span class="eq"><i></i><i></i><i></i></span><span class="pl">${ic('play', 16)}</span></div>
      ${img(t.album.cover)}
      <div style="min-width:0"><div class="name">${esc(t.title)}${t.explicit ? '<span class="exp">E</span>' : ''}</div>
        <div class="by"><a href="${artHref(t.artist)}">${esc(t.artist.name)}</a></div></div>
      <div class="alb">${t.album.id ? `<a href="#/album/${t.album.id}">${esc(t.album.title || '')}</a>` : ''}</div>
      <button class="heart icon-btn ${isLiked(t.id) ? 'on' : ''}" title="Like">${ic(isLiked(t.id) ? 'heartfill' : 'heart', 18)}</button>
      <div class="d">${fmt(t.duration)}</div>
      <button class="more icon-btn" title="More">${ic('more', 20)}</button>
    </div>`).join('');
  const more = limit && list.length > limit ? `<div class="show-more" data-more>Show ${list.length - limit} more</div>` : '';
  return `<div class="tracks" data-list="${list.map((t) => t.id).join(',')}" data-ctx="${ctx}">${html}${more}</div>`;
}
const idsToTracks = (ds) => ds.split(',').map((id) => tracksById.get(id)).filter(Boolean);

/* global click delegation for everything inside #view */
view.addEventListener('click', async (e) => {
  const f = e.target.closest('.fab[data-pk]');
  if (f) { // play an album / playlist / artist straight from its card
    e.preventDefault(); e.stopPropagation();
    try {
      const d = await api(`/api/${f.dataset.pk}/${f.dataset.pid}`);
      const list = f.dataset.pk === 'artist' ? d.top : d.tracks;
      setQueue(list, 0);
    } catch (err) { toast(err.message); }
    return;
  }
  const tc = e.target.closest('.card[data-tid]');
  if (tc) { const l = idsToTracks(tc.closest('.row').dataset.list); setQueue(l, l.findIndex((t) => String(t.id) === tc.dataset.tid)); return; }
  const sm = e.target.closest('[data-more]');
  if (sm) { const tr = sm.closest('.tracks'); const l = idsToTracks(tr.dataset.list); tr.outerHTML = trackList(l, { ctx: tr.dataset.ctx }); return; }
  if (e.target.closest('a')) return;
  const row = e.target.closest('.tr[data-id]');
  if (!row) return;
  const tracksEl = row.closest('.tracks');
  const t = tracksById.get(row.dataset.id);
  if (e.target.closest('.heart')) { toggleLike(t); return; }
  if (e.target.closest('.dl')) { downloadTracks([t]); return; }
  if (e.target.closest('.sel')) { row.classList.toggle('selected'); onSel?.(); return; }
  if (e.target.closest('.add')) { const r = e.target.closest('.add').getBoundingClientRect(); addToPlaylistMenu(r.left - 200, r.bottom + 4, t); return; }
  if (e.target.closest('.more')) { const r = e.target.closest('.more').getBoundingClientRect(); trackMenu(r.left - 200, r.bottom + 4, t, tracksEl.dataset.ctx); return; }
  setQueue(idsToTracks(tracksEl.dataset.list), +row.dataset.i);
});
view.addEventListener('contextmenu', (e) => {
  const row = e.target.closest('.tr[data-id]'); if (!row) return;
  e.preventDefault(); trackMenu(e.clientX, e.clientY, tracksById.get(row.dataset.id), row.closest('.tracks').dataset.ctx);
});
view.addEventListener('dblclick', () => {}); // reserved

/* ---------- views ---------- */
let navToken = 0;
const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Late night vibes' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const errBox = (msg) => `<div class="err"><div class="px-title">GAME OVER</div>${esc(msg)}<br><br>Open <code>/api/health</code> in your browser to see which service is failing (Deezer, yt-dlp or lyrics).<br><br><button class="btn" onclick="route()">CONTINUE? ▶</button></div>`;

async function home() {
  view.innerHTML = skeleton(); setViewTint(null);
  const my = navToken;
  const d = await api('/api/home');
  if (my !== navToken) return;
  remember(d.tracks);
  const quick = [
    `<a class="q" href="#/liked"><div class="ph">${ic('heartfill', 24)}</div><span>Liked Songs</span></a>`,
    ...lib.playlists.slice(0, 3).map((p) => `<a class="q" href="#/mylist/${p.id}">${p.tracks[0] ? img(p.tracks[0].album.cover) : `<div class="ph">${ic('queue', 24)}</div>`}<span>${esc(p.name)}</span></a>`),
    ...d.playlists.slice(0, 5 - Math.min(3, lib.playlists.length)).map((p) => `<a class="q" href="#/playlist/${p.id}">${img(p.cover)}<span>${esc(p.title)}</span></a>`),
  ].slice(0, 6).join('');
  view.innerHTML = `
    <h1>${greeting()}</h1>
    <div class="press-start">PRESS ▶ TO START</div>
    <div class="quick">${quick}</div>
    ${lib.recent.length ? section('Recently played', trackRow(lib.recent.slice(0, 12)), '<a class="more-link" href="#/recent">Show all</a>') : ''}
    ${section('Trending now', trackList(d.tracks.slice(0, 10), { limit: 5 }))}
    ${d.releases.length ? section('New releases', rowOf(d.releases, albumCard)) : ''}
    ${d.playlists.length ? section('Popular playlists', rowOf(d.playlists, playlistCard)) : ''}
    ${d.artists.length ? section('Top artists', rowOf(d.artists, artistCard)) : ''}
    ${d.albums.length ? section('Top albums', rowOf(d.albums, albumCard)) : ''}`;
}

const hue = (id) => (Number(id) * 47) % 360;
async function browse() {
  view.innerHTML = skeleton(); setViewTint(null);
  const my = navToken;
  const d = await api('/api/browse');
  if (my !== navToken) return;
  view.innerHTML = `
    <h1>Browse</h1>
    ${section('Genres', `<div class="grid">${d.genres.map((g) => `<a class="genre-tile" href="#/genre/${g.id}" style="background:linear-gradient(135deg,hsl(${hue(g.id)} 55% 38%),hsl(${(hue(g.id) + 40) % 360} 60% 22%))">${esc(g.name)}${img(g.picture)}</a>`).join('')}</div>`)}
    ${d.releases.length ? section('New releases', rowOf(d.releases, albumCard)) : ''}
    ${d.playlists.length ? section('Charts & playlists', rowOf(d.playlists, playlistCard)) : ''}`;
}

async function albumsPage(g = '0') {
  view.innerHTML = skeleton(); setViewTint(null);
  const my = navToken;
  const d = await api(`/api/albums?genre=${encodeURIComponent(g)}`);
  if (my !== navToken) return;
  const chips = [{ id: 0, name: 'All' }, ...d.genres].map((x) => `<a class="chip ${String(x.id) === String(g) ? 'active' : ''}" href="#/albums/${x.id}">${esc(x.name)}</a>`).join('');
  const grid = (list) => `<div class="grid">${list.map(albumCard).join('')}</div>`;
  const empty = !d.releases.length && !d.top.length;
  view.innerHTML = `
    <h1>Albums</h1>
    <div class="tabs">${chips}</div>
    ${lib.albums.length && String(g) === '0' ? section('Saved albums', rowOf(lib.albums, albumCard)) : ''}
    ${d.releases.length ? section('New releases', grid(d.releases)) : ''}
    ${d.top.length ? section('Top albums', grid(d.top)) : ''}
    ${empty ? '<div class="empty">No albums found for this genre. Try another one.</div>' : ''}`;
}

async function genreView(id) {
  view.innerHTML = skeleton();
  const my = navToken;
  const g = await api(`/api/genre/${id}`);
  if (my !== navToken) return;
  setViewTint(g.picture);
  view.innerHTML = `
    <div class="hero">${img(g.picture, g.name)}<div><div class="kind">Genre</div><h1>${esc(g.name)}</h1><div class="sub">Top charts</div></div></div>
    <div class="actions"><button class="big-play" id="a-play">${ic('play', 26)}</button></div>
    ${g.tracks.length ? section('Top tracks', trackList(g.tracks, { limit: 10 })) : ''}
    ${g.artists.length ? section('Artists', rowOf(g.artists, artistCard)) : ''}
    ${g.albums.length ? section('Albums', rowOf(g.albums, albumCard)) : ''}
    ${g.playlists.length ? section('Playlists', rowOf(g.playlists, playlistCard)) : ''}`;
  $('#a-play').onclick = () => setQueue(g.tracks, 0);
}

let searchData = null;
async function search(q) {
  const input = $('#q');
  if (document.activeElement !== input) input.value = q || '';
  if (!q) {
    setViewTint(null);
    const recent = lib.searches.length ? `${section('Recent searches', `<div class="tabs">${lib.searches.map((s) => `<a class="chip" href="#/search/${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}<span class="chip" id="clr-s">Clear</span></div>`)}` : '';
    view.innerHTML = `<h1>Search</h1><p class="sub">Songs, artists, albums and playlists.</p>${recent}<div id="b"></div>`;
    $('#clr-s')?.addEventListener('click', () => { lib.searches = []; save(); search(''); });
    try {
      const d = await api('/api/browse');
      if (location.hash.startsWith('#/search') && !$('#q').value && $('#b')) $('#b').innerHTML = section('Browse all', `<div class="grid">${d.genres.map((g) => `<a class="genre-tile" href="#/genre/${g.id}" style="background:linear-gradient(135deg,hsl(${hue(g.id)} 55% 38%),hsl(${(hue(g.id) + 40) % 360} 60% 22%))">${esc(g.name)}${img(g.picture)}</a>`).join('')}</div>`);
    } catch { /* optional */ }
    return;
  }
  view.innerHTML = skeleton(); setViewTint(null);
  const my = navToken;
  const d = await api(`/api/search?q=${encodeURIComponent(q)}`);
  if (my !== navToken) return;
  searchData = d;
  if (q.length > 1 && (d.tracks.length || d.artists.length || d.albums.length)) {
    lib.searches = [q, ...lib.searches.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 8); save();
  }
  renderSearch(q, 'all');
}
function renderSearch(q, tab) {
  const d = searchData;
  remember(d.tracks);
  const none = !d.tracks.length && !d.artists.length && !d.albums.length && !d.playlists.length;
  const tabs = ['all', 'songs', 'artists', 'albums', 'playlists'];
  const bar = `<div class="tabs">${tabs.map((t) => `<span class="chip ${t === tab ? 'active' : ''}" data-tab="${t}">${t[0].toUpperCase() + t.slice(1)}</span>`).join('')}</div>`;
  let body = '';
  if (none) body = `<div class="empty">No results for “${esc(q)}”. Try another spelling.</div>`;
  else if (tab === 'all') {
    const topA = d.artists[0], topT = d.tracks[0];
    const useArtist = topA && (!topT || topA.name.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(topA.name.toLowerCase()));
    const topCard = useArtist
      ? `<a class="top-card round" href="#/artist/${topA.id}">${img(topA.picture)}<div class="t">${esc(topA.name)}</div><span class="tag">Artist</span><span class="fab" data-pk="artist" data-pid="${topA.id}">${ic('play', 22)}</span></a>`
      : topT ? `<div class="top-card" data-tid="${topT.id}">${img(topT.album.cover)}<div class="t">${esc(topT.title)}</div><div class="sub">${esc(topT.artist.name)}</div><span class="tag">Song</span><span class="fab">${ic('play', 22)}</span></div>` : '';
    body = `<div class="top-grid"><div><h2 style="margin-top:14px">Top result</h2>${topCard}</div><div><h2 style="margin-top:14px">Songs</h2>${trackList(d.tracks.slice(0, 5), { noAlbum: true })}</div></div>
      ${d.artists.length ? section('Artists', rowOf(d.artists, artistCard)) : ''}
      ${d.albums.length ? section('Albums', rowOf(d.albums, albumCard)) : ''}
      ${d.playlists.length ? section('Playlists', rowOf(d.playlists, playlistCard)) : ''}`;
  } else if (tab === 'songs') body = trackList(d.tracks);
  else if (tab === 'artists') body = `<div class="grid">${d.artists.map(artistCard).join('')}</div>`;
  else if (tab === 'albums') body = `<div class="grid">${d.albums.map(albumCard).join('')}</div>`;
  else body = `<div class="grid">${d.playlists.map(playlistCard).join('')}</div>`;
  view.innerHTML = `<h1>Results for “${esc(q)}”</h1>${bar}${body}`;
  $$('[data-tab]', view).forEach((c) => (c.onclick = () => renderSearch(q, c.dataset.tab)));
  const tt = $('.top-card[data-tid]', view);
  if (tt) tt.onclick = () => setQueue([tracksById.get(tt.dataset.tid)], 0);
}

function followBtn(a) {
  const on = isFollowing(a.id);
  return `<button class="btn ghost ${on ? 'following' : ''}" id="a-follow">${on ? 'Following' : 'Follow'}</button>`;
}
async function artistView(id) {
  view.innerHTML = skeleton();
  const my = navToken;
  const a = await api(`/api/artist/${id}`);
  if (my !== navToken) return;
  setViewTint(a.pictureBig);
  const albums = a.albums.filter((x) => x.type !== 'single' && x.type !== 'ep');
  const singles = a.albums.filter((x) => x.type === 'single' || x.type === 'ep');
  view.innerHTML = `
    <div class="hero round">${img(a.pictureBig, a.name)}<div><div class="kind">Artist</div><h1>${esc(a.name)}</h1><div class="sub">${(a.fans || 0).toLocaleString()} fans</div></div></div>
    <div class="actions">
      <button class="big-play" id="a-play" title="Play">${ic('play', 26)}</button>
      <button class="btn ghost" id="a-shuf">${ic('shuffle', 16)} Shuffle</button>
      ${a.radio.length ? `<button class="btn ghost" id="a-radio">${ic('radio', 16)} Artist radio</button>` : ''}
      ${followBtn(a)}
    </div>
    ${a.top.length ? section('Popular', trackList(a.top, { limit: 5 })) : ''}
    ${albums.length ? section('Discography', rowOf(albums, albumCard)) : ''}
    ${singles.length ? section('Singles & EPs', rowOf(singles, albumCard)) : ''}
    ${a.related.length ? section('Fans also like', rowOf(a.related, artistCard)) : ''}`;
  remember(a.top); remember(a.radio);
  $('#a-play').onclick = () => setQueue(a.top.length ? a.top : a.radio, 0);
  $('#a-shuf').onclick = () => setQueue(a.top.concat(a.radio), 0, { shuffle: true });
  $('#a-radio')?.addEventListener('click', () => { setQueue(a.radio, 0); toast(`Playing ${a.name} radio`); });
  const onFollow = () => {
    if (isFollowing(a.id)) lib.artists = lib.artists.filter((x) => String(x.id) !== String(a.id));
    else lib.artists.unshift({ id: a.id, name: a.name, picture: a.picture });
    save(); renderSidebar();
    $('#a-follow').outerHTML = followBtn(a);
    $('#a-follow').onclick = onFollow;
    toast(isFollowing(a.id) ? `Following ${a.name}` : `Unfollowed ${a.name}`);
  };
  $('#a-follow').onclick = onFollow;
}

async function albumView(id) {
  view.innerHTML = skeleton();
  const my = navToken;
  const a = await api(`/api/album/${id}`);
  if (my !== navToken) return;
  setViewTint(a.coverBig);
  remember(a.tracks);
  const credits = a.credits.length ? a.credits : [{ id: a.artistId, name: a.artist, picture: a.artistPicture }];
  const isSaved = () => lib.albums.some((x) => String(x.id) === String(a.id));
  const saveIc = () => ic(isSaved() ? 'checkcircle' : 'addcircle', 24);
  view.innerHTML = `
  <div class="album-page">
    <div class="album-main">
      <h1 class="album-title">${esc(a.title)}</h1>
      <div class="album-meta">
        <span class="pe">${ic('person', 16)}</span>
        <a href="#/artist/${a.artistId}">${esc(a.artist)}</a><i>•</i>${esc(a.year)}<i>•</i>${a.tracks.length} songs<i>•</i>${fmtLong(a.duration)}
      </div>
      <div class="album-actions">
        <button class="big-play" id="a-play" title="Play">${ic('play', 26)}</button>
        <button class="icon-btn ab" id="a-shuf" title="Shuffle">${ic('shuffle', 22)}</button>
        <button class="icon-btn ab ${isSaved() ? 'on' : ''}" id="a-save" title="Save to library">${saveIc()}</button>
        <button class="icon-btn ab" id="a-queue" title="Add all to queue">${ic('queueadd', 24)}</button>
        <button class="icon-btn ab" id="a-dl" title="Download album">${ic('download', 24)}</button>
        <button class="icon-btn ab" id="a-share" title="Copy link">${ic('share', 22)}</button>
        <button class="icon-btn ab" id="a-more" title="More">${ic('more', 22)}</button>
        <span class="spacer"></span>
        <div class="a-search" id="a-search"><input id="a-filter" placeholder="FILTER SONGS" spellcheck="false" /><button class="icon-btn ab" id="a-sbtn" title="Search in album">${ic('search', 22)}</button></div>
      </div>
      <div class="sel-bar" id="sel-bar" hidden></div>
      <div class="tl-head"><span>#</span><span>TITLE</span><span>DURATION</span><span></span><span></span><span></span><span></span><span></span></div>
      ${trackList(a.tracks, { compact: true })}
      <div class="meta-foot">${esc(a.releaseDate || '')}<br>${a.label ? '© ' + esc(a.label) : ''}</div>
    </div>
    <aside class="album-side">
      ${img(a.coverBig, a.title).replace('<img ', '<img class="album-art" ')}
      ${a.genres.length ? `<div class="genre-chips">${a.genres.map((g) => `<a class="chip" href="#/search/${encodeURIComponent(g)}">${esc(g)}</a>`).join('')}</div>` : ''}
      <div class="credits">${credits.map((c) => `<a class="credit" href="#/artist/${c.id}"><span class="av big">${img(c.picture)}</span><span class="cn" title="${esc(c.role || '')}">${esc(c.name)}</span></a>`).join('')}</div>
    </aside>
  </div>`;
  $('#a-play').onclick = () => setQueue(a.tracks, 0);
  $('#a-shuf').onclick = () => setQueue(a.tracks, 0, { shuffle: true });
  $('#a-save').onclick = (e) => {
    if (isSaved()) { lib.albums = lib.albums.filter((x) => String(x.id) !== String(a.id)); toast('Removed from your library'); }
    else { lib.albums.unshift({ id: a.id, title: a.title, artist: a.artist, cover: a.cover, year: a.year }); toast('Saved to your library'); }
    save(); renderSidebar(); e.currentTarget.classList.toggle('on', isSaved()); e.currentTarget.innerHTML = saveIc();
  };
  $('#a-queue').onclick = () => { if (state.index < 0) setQueue(a.tracks, 0); else { state.queue.push(...a.tracks); renderQueue(); toast(`Added ${a.tracks.length} songs to queue`); } };
  $('#a-dl').onclick = () => downloadTracks(a.tracks);
  // multi-select bar
  const bar = $('#sel-bar');
  onSel = () => {
    const ids = $$('.tr.selected', view).map((r) => r.dataset.id);
    const sel = ids.map((i) => tracksById.get(i));
    bar.hidden = !sel.length;
    if (!sel.length) return;
    bar.innerHTML = `<b>${sel.length} SELECTED</b><button class="btn sm" data-s="play">PLAY</button><button class="btn sm ghost" data-s="queue">QUEUE</button><button class="btn sm ghost" data-s="pl">PLAYLIST</button><button class="btn sm ghost" data-s="dl">DOWNLOAD</button><button class="btn sm ghost" data-s="clear">CLEAR</button>`;
    bar.onclick = (e) => {
      const k = e.target.closest('[data-s]')?.dataset.s; if (!k) return;
      if (k === 'play') setQueue(sel, 0);
      else if (k === 'queue') { if (state.index < 0) setQueue(sel, 0); else { state.queue.push(...sel); renderQueue(); toast(`Added ${sel.length} to queue`); } }
      else if (k === 'dl') downloadTracks(sel);
      else if (k === 'pl') {
        const r = e.target.getBoundingClientRect();
        const items = [{ head: 'Add selected to playlist' }, ...lib.playlists.map((p) => ({ label: p.name, icon: 'queue', fn: () => { sel.forEach((t) => { if (!p.tracks.some((x) => String(x.id) === String(t.id))) p.tracks.push(t); }); save(); renderSidebar(); toast(`Added to ${p.name}`); } }))];
        if (!lib.playlists.length) items.push({ label: 'Create a playlist first (+ in the sidebar)', fn: () => {} });
        openMenu(r.left, r.bottom + 6, items);
      } else if (k === 'clear') { $$('.tr.selected', view).forEach((r) => r.classList.remove('selected')); onSel(); }
    };
  };
  $('#a-share').onclick = async () => { try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch { toast(location.href); } };
  $('#a-more').onclick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    openMenu(r.left, r.bottom + 6, [
      { label: 'Play next', icon: 'next', fn: () => { if (state.index < 0) return setQueue(a.tracks, 0); state.queue.splice(state.index + 1, 0, ...a.tracks); renderQueue(); toast('Playing next'); } },
      { label: 'Add all to a playlist…', icon: 'plus', fn: () => {
        const items = [{ head: 'Add album to playlist' }, ...lib.playlists.map((p) => ({ label: p.name, icon: 'queue', fn: () => { a.tracks.forEach((t) => { if (!p.tracks.some((x) => String(x.id) === String(t.id))) p.tracks.push(t); }); save(); renderSidebar(); toast(`Added to ${p.name}`); } }))];
        if (!lib.playlists.length) items.push({ label: 'Create a playlist first (+ in the sidebar)', fn: () => {} });
        openMenu(r.left, r.bottom + 6, items);
      } },
      '-',
      { label: 'Go to artist', icon: 'user', fn: () => { location.hash = `#/artist/${a.artistId}`; } },
    ]);
  };
  const box = $('#a-search'), inp = $('#a-filter');
  $('#a-sbtn').onclick = () => { box.classList.toggle('open'); if (box.classList.contains('open')) inp.focus(); else { inp.value = ''; inp.dispatchEvent(new Event('input')); } };
  inp.addEventListener('input', () => {
    const v = inp.value.trim().toLowerCase();
    $$('.tracks .tr', view).forEach((r) => { const t = tracksById.get(r.dataset.id); r.style.display = !v || `${t.title} ${t.artist.name}`.toLowerCase().includes(v) ? '' : 'none'; });
  });
}

async function playlistView(id) {
  view.innerHTML = skeleton();
  const my = navToken;
  const p = await api(`/api/playlist/${id}`);
  if (my !== navToken) return;
  setViewTint(p.coverBig);
  view.innerHTML = `
    <div class="hero">${img(p.coverBig, p.title)}<div><div class="kind">Playlist</div><h1>${esc(p.title)}</h1>
      <div class="sub">${esc(p.description || '')}<br>${p.tracks.length} songs${p.fans ? ` · ${p.fans.toLocaleString()} fans` : ''}</div></div></div>
    <div class="actions"><button class="big-play" id="a-play">${ic('play', 26)}</button><button class="btn ghost" id="a-shuf">${ic('shuffle', 16)} Shuffle</button></div>
    ${trackList(p.tracks)}`;
  $('#a-play').onclick = () => setQueue(p.tracks, 0);
  $('#a-shuf').onclick = () => setQueue(p.tracks, 0, { shuffle: true });
}

function simpleListView(title, kind, list, emptyMsg, ctx = '') {
  setViewTint(list[0]?.album.coverBig);
  view.innerHTML = `
    <div class="hero"><div class="mosaic ${list.length ? '' : 'empty'}">${list.length ? list.slice(0, 4).map((t) => img(t.album.cover)).join('') : ic(kind === 'Liked' ? 'heartfill' : 'queue', 64)}</div>
      <div><div class="kind">${kind === 'Liked' ? 'Playlist' : kind}</div><h1>${esc(title)}</h1><div class="sub">${list.length} songs</div></div></div>
    ${list.length ? `<div class="actions"><button class="big-play" id="a-play">${ic('play', 26)}</button><button class="btn ghost" id="a-shuf">${ic('shuffle', 16)} Shuffle</button></div>${trackList(list, { ctx })}` : `<div class="empty">${emptyMsg}</div>`}`;
  $('#a-play')?.addEventListener('click', () => setQueue(list, 0));
  $('#a-shuf')?.addEventListener('click', () => setQueue(list, 0, { shuffle: true }));
}
const likedView = () => simpleListView('Liked Songs', 'Liked', lib.liked, 'Tap the heart on any song to save it here.');
const recentView = () => simpleListView('Recently played', 'History', lib.recent, 'Nothing played yet.');

function myListView(id) {
  const p = lib.playlists.find((x) => x.id === id);
  if (!p) { view.innerHTML = '<div class="empty">Playlist not found.</div>'; return; }
  simpleListView(p.name, 'Playlist', p.tracks, 'This playlist is empty. Use ⋯ on any song → “Add to playlist”.', `mylist:${p.id}`);
  if (p.yt) $('.hero .sub', view).innerHTML += ` · IMPORTED FROM YOUTUBE (${p.ytMatched}/${p.ytTotal} matched with Deezer info)`;
  const act = $('.actions', view) || (() => { const d = document.createElement('div'); d.className = 'actions'; $('.hero', view).after(d); return d; })();
  act.insertAdjacentHTML('beforeend', `<button class="btn ghost" id="a-ren">${ic('edit', 16)} Rename</button><button class="btn ghost" id="a-del">${ic('trash', 16)} Delete</button>`);
  $('#a-ren').onclick = async () => { const n = await askText('Rename playlist', p.name); if (n) { p.name = n; save(); renderSidebar(); route(); } };
  $('#a-del').onclick = () => { if (confirm(`Delete “${p.name}”?`)) { lib.playlists = lib.playlists.filter((x) => x.id !== id); save(); renderSidebar(); location.hash = '#/library'; } };
}

function libraryView() {
  setViewTint(null);
  const plCard = (p) => `<a class="card" href="#/mylist/${p.id}"><div class="img">${p.tracks[0] ? img(p.tracks[0].album.cover) : `<div style="display:grid;place-items:center;height:100%;color:var(--gold)">${ic('queue', 48)}</div>`}</div><div class="t">${esc(p.name)}</div><div class="s">${p.tracks.length} songs</div></a>`;
  view.innerHTML = `
    <h1>Your Library</h1>
    <div class="actions"><button class="btn" id="lib-new">${ic('plus', 16)} New playlist</button></div>
    ${section('Playlists', `<div class="grid">
      <a class="card" href="#/liked"><div class="img" style="background:linear-gradient(135deg,#7a5a10,var(--gold));display:grid;place-items:center;color:#000">${ic('heartfill', 56)}</div><div class="t">Liked Songs</div><div class="s">${lib.liked.length} songs</div></a>
      ${lib.playlists.map(plCard).join('')}</div>`)}
    ${lib.albums.length ? section('Saved albums', rowOf(lib.albums, albumCard)) : ''}
    ${lib.artists.length ? section('Followed artists', rowOf(lib.artists, artistCard)) : ''}
    ${lib.recent.length ? section('Recently played', trackRow(lib.recent.slice(0, 12)), '<a class="more-link" href="#/recent">Show all</a>') : ''}`;
  $('#lib-new').onclick = () => $('#new-pl').click();
}

/* ---------- import a YouTube playlist ---------- */
let importCtl = null;
async function importView(listId) {
  importCtl?.abort();
  const ctl = (importCtl = new AbortController());
  const existing = lib.playlists.find((x) => x.yt === listId);
  if (existing) { toast('Already imported, opening it'); location.replace(`#/mylist/${existing.id}`); return; }
  setViewTint(null);
  $('#q').value = '';
  view.innerHTML = `
    <h1>Importing playlist</h1>
    <div class="import-card">
      <div class="loader" style="padding:6px 0 14px"><span class="coin-spin">${ic('coin', 40)}</span><div class="px-text" id="imp-status">READING YOUTUBE PLAYLIST<span class="dots"></span></div></div>
      <div class="imp-bar"><i id="imp-fill"></i></div>
      <div class="imp-note">Cleaning up titles and matching each song with proper artist, album and cover art…</div>
    </div>
    <div class="imp-list" id="imp-list"></div>`;
  const slots = [];
  let meta = null, got = 0, matched = 0, done = null;
  const status = $('#imp-status'), fill = $('#imp-fill'), list = $('#imp-list');
  try {
    const r = await fetch(`/api/yt-playlist?id=${encodeURIComponent(listId)}`, { signal: ctl.signal });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Import failed');
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = '';
    const handle = (m) => {
      if (m.type === 'error') throw new Error(m.error);
      if (m.type === 'meta') { meta = m; status.innerHTML = `MATCHING 0/${m.count}<span class="dots"></span>`; }
      else if (m.type === 'track') {
        slots[m.i] = m.track; got++; if (!m.track.unmatched) matched++;
        status.innerHTML = `MATCHING ${got}/${meta.count}<span class="dots"></span>`;
        fill.style.setProperty('--p', `${(got / meta.count) * 100}%`);
        list.insertAdjacentHTML('afterbegin', `<div class="imp-row ${m.track.unmatched ? 'warn' : 'ok'}">${img(m.track.album.cover)}
          <div class="mid"><div class="orig">${esc(m.orig)}</div><div class="fmt">→ <b>${esc(m.track.title)}</b> · ${esc(m.track.artist.name)}</div></div>
          <span class="badge">${m.track.unmatched ? 'YT ONLY' : 'MATCHED'}</span></div>`);
      } else if (m.type === 'done') done = m;
    };
    for (;;) {
      const { done: end, value } = await reader.read();
      if (end) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1); if (line) handle(JSON.parse(line)); }
    }
    const seen = new Set();
    const tracks = slots.filter(Boolean).filter((t) => (seen.has(String(t.id)) ? false : seen.add(String(t.id))));
    if (!tracks.length) throw new Error('Nothing could be imported from that playlist.');
    const pl = { id: uid(), name: meta?.title || 'Imported playlist', tracks, yt: listId, ytMatched: done?.matched ?? matched, ytTotal: meta?.count ?? tracks.length };
    lib.playlists.unshift(pl); save(); renderSidebar();
    toast(`Imported ${tracks.length} songs`);
    location.replace(`#/mylist/${pl.id}`);
  } catch (e) {
    if (e.name === 'AbortError') return;
    view.innerHTML = errBox(e.message);
  }
}

/* ---------- router ---------- */
async function route() {
  const [name = '', arg = ''] = location.hash.slice(2).split('/');
  const my = ++navToken;
  $$('.nav-link, .mnav a').forEach((l) => l.classList.toggle('active', l.dataset.route === (name || 'home') || (['liked', 'recent', 'mylist'].includes(name) && l.dataset.route === 'library')));
  $('#main').scrollTo(0, 0);
  closeMenu(); onSel = null;
  if (name !== 'import') importCtl?.abort();
  if (name !== 'search' && document.activeElement !== $('#q')) $('#q').value = '';
  try {
    if (!name) await home();
    else if (name === 'search') await search(decodeURIComponent(arg));
    else if (name === 'browse') await browse();
    else if (name === 'albums') await albumsPage(arg || '0');
    else if (name === 'genre') await genreView(arg);
    else if (name === 'artist') await artistView(arg);
    else if (name === 'album') await albumView(arg);
    else if (name === 'playlist') await playlistView(arg);
    else if (name === 'library') libraryView();
    else if (name === 'liked') likedView();
    else if (name === 'recent') recentView();
    else if (name === 'mylist') myListView(arg);
    else if (name === 'import') await importView(arg);
    else await home();
  } catch (e) {
    if (my === navToken) view.innerHTML = errBox(e.message);
  }
  markPlaying();
}
window.route = route;
window.addEventListener('hashchange', route);
$('#go-back').onclick = () => history.back();
$('#go-fwd').onclick = () => history.forward();

/* search box: debounce while typing, Enter searches immediately */
let st;
const q = $('#q');
const YT_LIST = /youtu(?:be\.com|\.be)\/\S*?[?&]list=([\w-]{10,})/i;
const goSearch = (v) => {
  const yl = v.match(YT_LIST)?.[1]; // a YouTube playlist link → import it
  const target = yl ? `#/import/${yl}` : v ? `#/search/${encodeURIComponent(v)}` : '#/search';
  if (location.hash !== target) location.hash = target;
};
q.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => goSearch(q.value.trim()), 320); });
q.addEventListener('focus', () => { if (!location.hash.startsWith('#/search')) { /* don't navigate until they type */ } });
$('#search-form').addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(st); goSearch(q.value.trim()); });

/* keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeMenu(); if (!$('#fs').hidden) closeFs(); else if (!$('#queue').hidden) $('#queue').hidden = true; return; }
  if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
  if (e.key === '/') { e.preventDefault(); q.focus(); q.select(); }
  else if (e.code === 'Space') { e.preventDefault(); $('#btn-play').click(); }
  else if (e.code === 'ArrowRight' && e.shiftKey) next();
  else if (e.code === 'ArrowLeft' && e.shiftKey) prev();
  else if (e.code === 'ArrowRight') audio.currentTime += 5;
  else if (e.code === 'ArrowLeft') audio.currentTime -= 5;
  else if (e.key.toLowerCase() === 'l' && current()) toggleLike(current());
  else if (e.key.toLowerCase() === 'f') ($('#fs').hidden ? openFs() : closeFs());
  else if (e.key.toLowerCase() === 'm') $('#btn-mute').click();
  else if (e.key.toLowerCase() === 'c') { setCrt(!document.body.classList.contains('crt')); toast(`CRT ${document.body.classList.contains('crt') ? 'ON' : 'OFF'}`); }
});

renderSidebar();
route();
