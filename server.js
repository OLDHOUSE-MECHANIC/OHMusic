import express from 'express';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const YTDLP = process.env.YTDLP_PATH || 'yt-dlp';
const DEEZER = process.env.DEEZER_BASE || 'https://api.deezer.com';
const UA = 'OHMusic/1.0 (personal project)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- tiny TTL cache (failures are never cached) ---------- */
const store = new Map();
const inflight = new Map();
async function cached(key, ttlMs, fn) {
  const hit = store.get(key);
  if (hit && hit.exp > Date.now()) return hit.val;
  if (inflight.has(key)) return inflight.get(key);
  const p = fn()
    .then((val) => {
      store.set(key, { val, exp: Date.now() + ttlMs });
      return val;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/* ---------- Deezer (timeout + one retry) ---------- */
async function deezer(p, params = {}) {
  const url = new URL(DEEZER + p);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return cached(url.toString(), 10 * 60 * 1000, async () => {
    let last;
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': UA } });
        if (!r.ok) throw new Error(`Deezer HTTP ${r.status}`);
        const j = await r.json();
        if (j.error) {
          const e = new Error(j.error.message || 'Deezer error');
          e.quota = /quota/i.test(e.message);
          e.fatal = !e.quota;
          throw e;
        }
        return j;
      } catch (e) {
        last = e;
        if (e.fatal) break;
        await sleep(e.quota ? 1500 : 400);
      }
    }
    throw last;
  });
}

const dataOf = (r) => (r.status === 'fulfilled' ? r.value?.data || [] : []);

/* ---------- shape mappers (keep payloads small) ---------- */
const track = (t, alb) => {
  const a = t.album || alb || {};
  return {
    id: t.id,
    title: t.title_short || t.title,
    artist: { id: t.artist?.id, name: t.artist?.name },
    album: { id: a.id, title: a.title, cover: a.cover_medium || a.cover_big, coverBig: a.cover_xl || a.cover_big },
    duration: t.duration,
    explicit: !!t.explicit_lyrics,
  };
};
const album = (a) => ({
  id: a.id, title: a.title, artist: a.artist?.name, artistId: a.artist?.id,
  cover: a.cover_medium, coverBig: a.cover_xl || a.cover_big,
  type: a.record_type, year: (a.release_date || '').slice(0, 4),
});
const artist = (a) => ({
  id: a.id, name: a.name, picture: a.picture_medium, pictureBig: a.picture_xl || a.picture_big, fans: a.nb_fan,
});
const playlist = (p) => ({
  id: p.id, title: p.title, cover: p.picture_medium, coverBig: p.picture_xl || p.picture_big, tracks: p.nb_tracks,
});

const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (e) {
    console.error(req.path, '→', e.message);
    res.status(502).json({ error: e.message });
  }
};

/* ---------- metadata API ---------- */
app.get('/api/home', wrap(async () => {
  const [chart, pls, rel] = await Promise.allSettled([
    deezer('/chart/0', { limit: 20 }),
    deezer('/chart/0/playlists', { limit: 12 }),
    deezer('/editorial/0/releases', { limit: 20 }),
  ]);
  if (chart.status === 'rejected') throw chart.reason;
  const c = chart.value;
  let albums = dataOf({ status: 'fulfilled', value: c.albums }).map(album);
  let releases = dataOf(rel).map(album);
  if (!albums.length) albums = releases;     // fall back so the rows are never empty
  if (!releases.length) releases = albums;
  return {
    tracks: dataOf({ status: 'fulfilled', value: c.tracks }).map((t) => track(t)),
    albums,
    artists: dataOf({ status: 'fulfilled', value: c.artists }).map(artist),
    playlists: dataOf(pls).map(playlist),
    releases,
  };
}));

app.get('/api/albums', wrap(async (req) => {
  const g = Number(req.query.genre) || 0;
  const [rel, top, gen] = await Promise.allSettled([
    deezer(`/editorial/${g}/releases`, { limit: 50 }),
    deezer(`/chart/${g}/albums`, { limit: 50 }),
    deezer('/genre'),
  ]);
  let releases = dataOf(rel).map(album);
  let topAlbums = dataOf(top).map(album);
  if (!releases.length && !topAlbums.length && g === 0) {
    // last resort: pull albums through search so the page is never blank
    const rs = await Promise.allSettled(['best of', 'greatest hits', 'deluxe', 'live', 'anthology'].map((q) => deezer('/search/album', { q, limit: 20 })));
    const seen = new Set();
    topAlbums = rs.flatMap(dataOf).map(album).filter((a) => !seen.has(a.id) && seen.add(a.id));
  }
  if (!releases.length && !topAlbums.length && rel.status === 'rejected' && top.status === 'rejected') throw rel.reason;
  const have = new Set(releases.map((a) => a.id));
  return {
    genre: g,
    genres: dataOf(gen).filter((x) => x.id !== 0).map((x) => ({ id: x.id, name: x.name })),
    releases,
    top: topAlbums.filter((a) => !have.has(a.id)),
  };
}));

app.get('/api/browse', wrap(async () => {
  const [g, rel, pls] = await Promise.allSettled([
    deezer('/genre'),
    deezer('/editorial/0/releases', { limit: 20 }),
    deezer('/chart/0/playlists', { limit: 12 }),
  ]);
  if (g.status === 'rejected') throw g.reason;
  return {
    genres: dataOf(g).filter((x) => x.id !== 0).map((x) => ({ id: x.id, name: x.name, picture: x.picture_medium })),
    releases: dataOf(rel).map(album),
    playlists: dataOf(pls).map(playlist),
  };
}));

app.get('/api/genre/:id', wrap(async (req) => {
  const id = req.params.id;
  const [chart, genres, rel] = await Promise.allSettled([
    deezer(`/chart/${id}`, { limit: 30 }),
    deezer('/genre'),
    deezer(`/genre/${id}/artists`),
  ]);
  if (chart.status === 'rejected') throw chart.reason;
  const c = chart.value;
  const g = dataOf(genres).find((x) => String(x.id) === String(id));
  return {
    id, name: g?.name || 'Genre', picture: g?.picture_xl || g?.picture_big,
    tracks: (c.tracks?.data || []).map((t) => track(t)),
    albums: (c.albums?.data || []).map(album),
    artists: (c.artists?.data?.length ? c.artists.data : dataOf(rel)).map(artist),
    playlists: (c.playlists?.data || []).map(playlist),
  };
}));

app.get('/api/search', wrap(async (req) => {
  const q = String(req.query.q || '').trim();
  const empty = { tracks: [], albums: [], artists: [], playlists: [] };
  if (!q) return empty;
  const rs = await Promise.allSettled([
    deezer('/search', { q, limit: 30 }),
    deezer('/search/artist', { q, limit: 12 }),
    deezer('/search/album', { q, limit: 16 }),
    deezer('/search/playlist', { q, limit: 12 }),
  ]);
  if (rs.every((r) => r.status === 'rejected')) throw rs[0].reason;
  return {
    tracks: dataOf(rs[0]).map((x) => track(x)),
    artists: dataOf(rs[1]).map(artist),
    albums: dataOf(rs[2]).map(album),
    playlists: dataOf(rs[3]).map(playlist),
  };
}));

app.get('/api/artist/:id', wrap(async (req) => {
  const id = req.params.id;
  const a = await deezer(`/artist/${id}`);
  const rs = await Promise.allSettled([
    deezer(`/artist/${id}/top`, { limit: 10 }),
    deezer(`/artist/${id}/albums`, { limit: 50 }),
    deezer(`/artist/${id}/related`, { limit: 12 }),
    deezer(`/artist/${id}/radio`, { limit: 30 }),
  ]);
  return {
    ...artist(a),
    top: dataOf(rs[0]).map((x) => track(x)),
    albums: dataOf(rs[1]).map(album),
    related: dataOf(rs[2]).map(artist),
    radio: dataOf(rs[3]).map((x) => track(x)),
  };
}));

app.get('/api/album/:id', wrap(async (req) => {
  const a = await deezer(`/album/${req.params.id}`);
  return {
    ...album(a),
    artistId: a.artist?.id,
    label: a.label, releaseDate: a.release_date, duration: a.duration, fans: a.fans,
    artistPicture: a.artist?.picture_medium,
    genres: (a.genres?.data || []).map((g) => g.name),
    credits: (a.contributors || []).map((c) => ({ id: c.id, name: c.name, picture: c.picture_medium, role: c.role })),
    tracks: (a.tracks?.data || []).map((x) => track(x, a)),
  };
}));

app.get('/api/playlist/:id', wrap(async (req) => {
  const p = await deezer(`/playlist/${req.params.id}`);
  return {
    ...playlist(p), description: p.description, fans: p.fans,
    tracks: (p.tracks?.data || []).map((x) => track(x)),
  };
}));

/* ---------- lyrics (LRCLIB: free, no key, has time-synced lyrics) ---------- */
app.get('/api/lyrics', async (req, res) => {
  const artist = String(req.query.artist || '');
  const title = String(req.query.title || '');
  const albumName = String(req.query.album || '');
  const duration = Number(req.query.duration) || 0;
  if (!title) return res.json({ synced: null, plain: null });
  const key = `lyr|${artist}|${title}`.toLowerCase();
  try {
    const val = await cached(key, 24 * 3600 * 1000, async () => {
      const headers = { 'User-Agent': UA };
      const get = new URL('https://lrclib.net/api/get');
      get.searchParams.set('artist_name', artist);
      get.searchParams.set('track_name', title);
      if (albumName) get.searchParams.set('album_name', albumName);
      if (duration) get.searchParams.set('duration', String(duration));
      let r = await fetch(get, { headers, signal: AbortSignal.timeout(10000) });
      let j = r.ok ? await r.json() : null;
      if (!j) {
        const s = new URL('https://lrclib.net/api/search');
        s.searchParams.set('track_name', title);
        s.searchParams.set('artist_name', artist);
        r = await fetch(s, { headers, signal: AbortSignal.timeout(10000) });
        const list = r.ok ? await r.json() : [];
        j = list.find((x) => x.syncedLyrics) || list.find((x) => x.plainLyrics) || null;
      }
      return { synced: j?.syncedLyrics || null, plain: j?.plainLyrics || null };
    });
    res.json(val);
  } catch (e) {
    res.json({ synced: null, plain: null });
  }
});

/* ---------- image proxy (so the browser can read pixels for colour theming) ---------- */
app.get('/api/img', async (req, res) => {
  try {
    const u = new URL(String(req.query.u || ''));
    if (u.protocol !== 'https:' || !(u.hostname === 'dzcdn.net' || u.hostname.endsWith('.dzcdn.net'))) {
      return res.status(400).send('host not allowed');
    }
    const up = await fetch(u, { signal: AbortSignal.timeout(10000) });
    if (!up.ok) return res.status(502).end();
    res.setHeader('Content-Type', up.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    Readable.fromWeb(up.body).pipe(res);
  } catch {
    res.status(400).end();
  }
});

/* ---------- audio: resolve via yt-dlp, then proxy with range support ---------- */
const BAD = /(live|cover|karaoke|reaction|remix|instrumental|slowed|reverb|sped up|8d|nightcore|tutorial|lesson)/i;

function pickBest(entries, want) {
  const wantBad = BAD.exec(`${want.title} ${want.artist}`)?.[0]?.toLowerCase();
  let best = null;
  for (const e of entries) {
    if (!e?.id) continue;
    const title = e.title || '';
    const chan = e.channel || e.uploader || '';
    let score = 0;
    if (want.duration && e.duration) {
      const d = Math.abs(e.duration - want.duration);
      score -= d <= 3 ? 0 : d <= 10 ? 5 : Math.min(d, 60);
    }
    const m = BAD.exec(title)?.[0]?.toLowerCase();
    if (m && m !== wantBad) score -= 25;
    if (/- topic$/i.test(chan)) score += 12;
    if (/official audio|audio/i.test(title)) score += 4;
    if (title.toLowerCase().includes(want.title.toLowerCase())) score += 4;
    if (chan.toLowerCase().includes(want.artist.toLowerCase())) score += 4;
    if (!best || score > best.score) best = { e, score };
  }
  return best?.e;
}

const ytKey = (p) => `yt|${p.artist}|${p.title}|${p.vid || ''}`.toLowerCase();

async function resolveAudio(p) {
  return cached(ytKey(p), 90 * 60 * 1000, async () => {
    let id = p.vid, matched = null;
    if (!id) {
      const { stdout } = await run(
        YTDLP,
        ['--flat-playlist', '--dump-json', '--no-warnings', `ytsearch6:${p.artist} - ${p.title} audio`],
        { maxBuffer: 20 * 1024 * 1024, timeout: 30000 }
      );
      const entries = stdout.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
      const pick = pickBest(entries, p);
      if (!pick) throw new Error('No YouTube match found');
      id = pick.id; matched = pick.title;
    }
    const { stdout: out } = await run(
      YTDLP,
      ['-f', 'bestaudio[ext=m4a]/bestaudio', '-g', '--no-playlist', '--no-warnings', `https://www.youtube.com/watch?v=${id}`],
      { timeout: 30000 }
    );
    const url = out.trim().split('\n')[0];
    if (!url) throw new Error('yt-dlp returned no URL');
    return { url, videoId: id, matched };
  });
}

const params = (req) => ({
  artist: String(req.query.artist || ''),
  title: String(req.query.title || ''),
  duration: Number(req.query.duration) || 0,
  vid: /^[\w-]{6,15}$/.test(String(req.query.vid || '')) ? String(req.query.vid) : '',
});

app.get('/api/prefetch', (req, res) => {
  const p = params(req);
  if (p.title) resolveAudio(p).catch(() => {});
  res.status(204).end();
});

app.get('/api/stream', async (req, res) => {
  const p = params(req);
  if (!p.title) return res.status(400).send('missing title');
  const ctrl = new AbortController();
  res.on('close', () => ctrl.abort());
  try {
    const info = await resolveAudio(p);
    const headers = {};
    if (req.headers.range) headers.Range = req.headers.range;
    const up = await fetch(info.url, { headers, signal: ctrl.signal });
    if (!up.ok && up.status !== 206) {
      store.delete(ytKey(p)); // stale URL → re-resolve next time
      return res.status(502).send(`upstream ${up.status}`);
    }
    res.status(up.status);
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const v = up.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    Readable.fromWeb(up.body).on('error', () => res.end()).pipe(res);
  } catch (e) {
    if (e.name === 'AbortError') return;
    console.error('stream error:', e.message.split('\n')[0]);
    if (!res.headersSent) res.status(502).send(e.message.split('\n')[0]);
  }
});

/* ---------- import a YouTube playlist: clean titles → match on Deezer → stream NDJSON ---------- */
const NOISE_BRACKETS = /\s*[\(\[\{【][^\)\]\}】]*?(official|video|audio|lyric|visuali[sz]er|\bhd\b|\b4k\b|\bhq\b|remaster|music video|\bmv\b|m\/v|explicit|clip|full album|prod\.)[^\)\]\}】]*?[\)\]\}】]\s*/gi;
const TRAIL_SEP = /\s*[-–—|:]\s*(official\s+)?(music\s+)?(video|audio|lyric\s*video|lyrics|visuali[sz]er)\b.*$/i;
const TRAIL_OFFICIAL = /\s+official\s+(music\s+)?(video|audio|lyrics?)\b.*$/i;
function cleanTitle(t) {
  let s = String(t || '');
  for (let i = 0; i < 3; i++) s = s.replace(NOISE_BRACKETS, ' ');
  s = s.replace(TRAIL_SEP, '').replace(TRAIL_OFFICIAL, '');
  s = s.replace(/\s+/g, ' ').replace(/^[-–—|:\s]+|[-–—|:\s]+$/g, '').trim();
  return s || String(t || '').trim();
}
function parseEntry(e) {
  const rawCh = e.channel || e.uploader || '';
  const topic = /\s-\s*Topic$/i.test(rawCh);
  const ch = rawCh.replace(/\s-\s*Topic$/i, '').replace(/\s*(VEVO|Official|Music)$/i, '').trim();
  let title = cleanTitle(e.title);
  let artist = ch, guess = !topic; // artist taken from the uploader is only a guess
  if (!topic) {
    const m = title.match(/^(.{1,80}?)\s+[-–—]\s+(.+)$/);
    if (m) { artist = m[1].trim(); title = m[2].trim(); guess = false; }
  }
  title = title.replace(/^["“'‘]+|["”'’]+$/g, '').trim();
  return { artist, title, guess };
}
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[\(\[]?\b(feat|ft)\b\.?.*$/, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const toks = (s) => new Set(norm(s).split(' ').filter(Boolean));
const jac = (a, b) => {
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let i = 0; for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
};
const artistSim = (a, b) => {
  const x = norm(a), y = norm(b);
  if (!x || !y) return 0;
  return x.includes(y) || y.includes(x) ? 1 : jac(a, b);
};
function scoreMatch(want, t) {
  const ts = jac(want.title, t.title_short || t.title);
  const as = want.artist ? artistSim(want.artist, t.artist?.name) : 0.5;
  const dd = want.duration && t.duration ? Math.abs(want.duration - t.duration) : null;
  const dscore = dd === null ? 0 : dd <= 5 ? 0.2 : dd <= 15 ? 0.1 : dd > 60 ? -0.2 : 0;
  const ok = ts >= 0.5 && (as >= 0.35 || (want.guess && ts >= 0.8 && dd !== null && dd <= 8));
  return { ok, score: ts * 0.6 + as * 0.3 + dscore + (ts >= 0.99 ? 0.1 : 0) };
}
async function matchDeezer(want) {
  const q1 = `artist:"${want.artist.replace(/"/g, '')}" track:"${want.title.replace(/"/g, '')}"`;
  const qs = want.artist ? [q1, `${want.artist} ${want.title}`] : [want.title];
  let best = null;
  for (const q of qs) {
    try {
      const r = await deezer('/search', { q, limit: 6 });
      for (const t of r.data || []) {
        const m = scoreMatch(want, t);
        if (m.ok && (!best || m.score > best.score)) best = { t, score: m.score };
      }
      if (best && best.score >= 0.8) break;
    } catch { /* try next query */ }
  }
  return best?.t || null;
}
async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
}

app.get('/api/yt-playlist', async (req, res) => {
  let id = String(req.query.id || '');
  const m = String(req.query.url || '').match(/[?&]list=([\w-]{10,})/);
  if (!id && m) id = m[1];
  if (!/^[\w-]{10,64}$/.test(id)) return res.status(400).json({ error: 'That does not look like a YouTube playlist link.' });
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  let gone = false;
  res.on('close', () => { gone = true; });
  const send = (o) => { if (!gone) res.write(JSON.stringify(o) + '\n'); };
  try {
    const { stdout } = await run(
      YTDLP,
      ['--flat-playlist', '--dump-single-json', '--no-warnings', '--playlist-end', '300', `https://www.youtube.com/playlist?list=${id}`],
      { maxBuffer: 100 * 1024 * 1024, timeout: 120000 }
    );
    const pl = JSON.parse(stdout);
    const entries = (pl.entries || []).filter((e) => e && e.id && e.title && !/^\[(private|deleted) video\]$/i.test(e.title));
    if (!entries.length) throw new Error('No playable videos found. Is the playlist private?');
    send({ type: 'meta', title: pl.title || 'Imported playlist', count: entries.length });
    let matched = 0;
    await pool(entries, 2, async (e, i) => {
      if (gone) return;
      const want = { ...parseEntry(e), duration: e.duration || 0 };
      let dz = null;
      if (want.title) dz = await matchDeezer(want);
      const thumb = `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg`;
      let tr;
      if (dz) { tr = { ...track(dz), vid: e.id }; matched++; }
      else tr = {
        id: `yt_${e.id}`, title: want.title || e.title, artist: { id: null, name: want.artist || 'Unknown artist' },
        album: { id: null, title: '', cover: thumb, coverBig: thumb }, duration: e.duration || 0, vid: e.id, unmatched: true,
      };
      send({ type: 'track', i, track: tr, orig: e.title });
      await sleep(100); // stay under Deezer's rate limit
    });
    send({ type: 'done', matched, total: entries.length });
  } catch (e) {
    console.error('yt-playlist error:', e.message.split('\n')[0]);
    send({ type: 'error', error: e.message.split('\n')[0].replace(/^ERROR:\s*/, '') });
  } finally {
    res.end();
  }
});

/* ---------- download a track as a file (personal use) ---------- */
app.get('/api/download', async (req, res) => {
  const p = params(req);
  if (!p.title) return res.status(400).send('missing title');
  try {
    const info = await resolveAudio(p);
    const up = await fetch(info.url, { signal: AbortSignal.timeout(120000) });
    if (!up.ok) { store.delete(ytKey(p)); return res.status(502).send(`upstream ${up.status}`); }
    const type = up.headers.get('content-type') || 'audio/mp4';
    const ext = /webm/.test(type) ? 'webm' : /mpeg/.test(type) ? 'mp3' : 'm4a';
    const name = `${p.artist} - ${p.title}`.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120);
    res.setHeader('Content-Type', type);
    const len = up.headers.get('content-length');
    if (len) res.setHeader('Content-Length', len);
    res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/[^\x20-\x7e]/g, '_')}.${ext}"; filename*=UTF-8''${encodeURIComponent(name)}.${ext}`);
    Readable.fromWeb(up.body).on('error', () => res.end()).pipe(res);
  } catch (e) {
    console.error('download error:', e.message.split('\n')[0]);
    if (!res.headersSent) res.status(502).send(e.message.split('\n')[0]);
  }
});

/* ---------- health check: open http://localhost:3000/api/health to diagnose ---------- */
app.get('/api/health', async (_req, res) => {
  const out = {};
  const t = async (name, fn) => {
    try { out[name] = { ok: true, info: await fn() }; } catch (e) { out[name] = { ok: false, error: String(e.message).split('\n')[0] }; }
  };
  await Promise.all([
    t('deezer', async () => (await deezer('/chart/0', { limit: 1 })).tracks.data[0]?.title),
    t('yt-dlp', async () => (await run(YTDLP, ['--version'], { timeout: 8000 })).stdout.trim()),
    t('lrclib', async () => (await fetch('https://lrclib.net/api/search?track_name=hello', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) })).status),
  ]);
  res.json(out);
});

app.listen(PORT, () => console.log(`OHMusic running → http://localhost:${PORT}   (diagnostics: /api/health)`));
