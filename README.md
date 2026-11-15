# pixel-garden-skin

A custom "Moonlight" skin for the Video.js v10 player (React + TypeScript + CSS), built on the Scaffold skin.

## Run

```bash
npm install
cp .env.example .env   # then put your Mux playback ID in it
npm run dev
npm run build          # production build in dist/
```

Your films live in `src/videos.ts`: paste each film's Mux link (or playback ID) there. The poster, the
"More Films" thumbnail, the duration, the Timeline and the Transcript are all read from that link.
Without changes the page plays Mux's public demo asset.

## Files

- `src/GardenSkin.tsx` the skin: controls, hotkeys, gestures, error state
- `src/SettingsMenu.tsx` one gear button for quality, speed and captions
- `src/garden-skin.css` skin styles first, page styles second
- `src/GardenArt.tsx` decorative SVG (moon, lantern, column, wall, cat, thumbnails)
- `src/videos.ts` the film list (one Mux link per film)
- `src/muxData.ts` reads duration and captions from a Mux stream
- `src/App.tsx` the page, the player and the timeline/transcript panel
- `src/assets/frame.webp`, `frame-mobile.webp` ornate border images for the player frame

## Customising

The skin supports `--media-accent-color`, `--media-font-family` and `--media-border-radius` on `.garden-skin`.
Optional hand-written chapters go in `chapters` on a film in `videos.ts`. Without them the timeline is built from the video's real duration and captions. The Transcript tab needs auto-generated captions enabled on the Mux asset.

## Accessibility

44px touch targets, visible focus rings, dark gradient under the controls, keyboard shortcuts, and reduced-motion support.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space / K | play / pause |
| ↑ / ↓ | volume +5% / −5% |
| ← / → | seek −5s / +5s (J / L: ±10s) |
| T | theater mode (Esc leaves it) |
| F | fullscreen (Esc leaves it) |
| P (or I) | picture-in-picture |
| S | open the settings menu |
| M / C | mute / captions |

Shortcuts are ignored while typing in the search box.

## Search (Mux)

Typing in the search box looks up videos in your Mux account (title, passthrough, asset ID or playback ID).
Put `VITE_MUX_TOKEN_ID` and `VITE_MUX_TOKEN_SECRET` in `.env` (Mux dashboard → Settings → API Access Tokens,
Mux Video read access). In dev, `vite.config.ts` proxies `/mux-api` to `api.mux.com` because Mux's API has no CORS.
`VITE_` variables are bundled into the page, so for a public deployment keep the token on your own server and set
`VITE_MUX_API_BASE` to a route that forwards to `https://api.mux.com` with the token added.

### Deploying search on Vercel

On Vercel the search goes through `api/mux-assets.js`, a small serverless function that keeps the token on the server.
In Vercel → Settings → Environment Variables add `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` (**without** the `VITE_` prefix),
then redeploy. Do not set the `VITE_MUX_TOKEN_*` variables on Vercel: they would be bundled into the public page.

## Loading indicator

The buffering spinner is the logo of the active theme (moon, sun, flower, phone, gear, play triangle for Midnight).

### Description and tags for Mux videos

Mux has no description field, so the skin reads the asset's `passthrough` (255 characters max): plain text becomes
the description, or use JSON to add tags too:

```bash
curl -X PATCH https://api.mux.com/video/v1/assets/ASSET_ID \
  -u "$MUX_TOKEN_ID:$MUX_TOKEN_SECRET" -H "Content-Type: application/json" \
  -d '{"passthrough":"{\"description\":\"A girl follows the moon to a lost castle.\",\"tags\":[\"Fantasy\",\"Adventure\"]}"}'
```

The title comes from the asset's `meta.title`. Editing needs a token with Mux Video **Write**; the search itself only needs Read.
