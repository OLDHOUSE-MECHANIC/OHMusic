# OHMusic

A retro 8-bit, gold-and-dark music streaming app. Node/Express backend, plain JS frontend (no build step).

- Metadata, cover art, artist photos, charts, genres: Deezer public API (no key needed)
- Audio: the backend finds the best YouTube match with yt-dlp and proxies the stream (seeking works)
- Time-synced lyrics: LRCLIB (free, no key)

For personal use only.

## Run
1. Install Node 18+ and yt-dlp (`pip install -U yt-dlp` or `brew install yt-dlp`)
2. `npm install`
3. `npm start` → http://localhost:3000

If yt-dlp isn't on your PATH: `YTDLP_PATH=/path/to/yt-dlp npm start`.
yt-dlp breaks when YouTube changes things; run `yt-dlp -U` if playback stops.

**Something not loading?** Open http://localhost:3000/api/health. It tells you which service
(Deezer, yt-dlp or lyrics) is failing from your machine.

## Features
- Home with quick picks, recently played, trending, new releases, playlists, top artists
- Search with tabs (songs / artists / albums / playlists), top result and recent searches
- Albums page (new releases, top albums, filter by genre), browse by genre, artist pages (popular, discography, singles, related, artist radio, follow), album and playlist pages
- Your own playlists, Liked Songs and Recently played (saved in your browser)
- Album page: art, genre chips and artist credits on the right; per-row like / add / download / select, bulk actions, filter, download album
- **Paste a YouTube playlist link into the search box** to import it as a playlist: titles are cleaned ("(Official Video)", "[Lyrics]", "- Topic" etc.), split into artist / title, and matched on Deezer for proper album, cover art and duration. Songs that don't match keep their YouTube thumbnail. Each imported song plays the exact video from your playlist. Up to 300 songs per import; the playlist must be public or unlisted.
- Right-click or ⋯ menu on any song: play next, add to queue, like, add to playlist, go to artist/album
- Full-screen player with synced lyrics (click a line to seek) and a pixel equalizer
- Queue panel, shuffle, repeat (off / all / one), media keys, artwork-based colour theming
- Retro layer: pixel fonts, coin HUD (+1 coin the first time you ever play a song, 10 coins = level up), CRT scanlines, pixel cursors

## Keyboard
| Key | Action |
| --- | --- |
| Space | Play / pause |
| Shift + ← / → | Previous / next |
| ← / → | Seek 5s |
| / | Focus search |
| L | Like current song |
| F | Full-screen player |
| M | Mute |
| C | Toggle CRT scanlines |
| Esc | Close panels |

## Files
- `server.js`: API routes, yt-dlp resolver and streaming proxy, caching, lyrics, image proxy, health check
- `public/app.js`: router, views, player, playlists, lyrics, pixel sprites
- `public/style.css`: layout and the retro layer
- `public/index.html`: app shell

The pixel fonts (Press Start 2P, VT323) load from Google Fonts, so they need an internet connection.
