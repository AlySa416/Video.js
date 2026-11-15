import { useEffect, useState } from 'react';
import type { VideoItem } from './videos';

/**
 * Pulls films from your Mux account (api.mux.com) while you type in the search box.
 *
 * Needs an access token: Mux dashboard → Settings → API Access Tokens (Mux Video: read).
 * Put VITE_MUX_TOKEN_ID and VITE_MUX_TOKEN_SECRET in .env.
 * Anything prefixed VITE_ ends up in the browser bundle, so for a public site, put the token on your own
 * server and point VITE_MUX_API_BASE at it instead (see README).
 */

const TOKEN_ID = import.meta.env.VITE_MUX_TOKEN_ID as string | undefined;
const TOKEN_SECRET = import.meta.env.VITE_MUX_TOKEN_SECRET as string | undefined;
// In dev, vite.config.ts proxies /mux-api to https://api.mux.com (Mux's API does not allow browser CORS).
const API_BASE = (import.meta.env.VITE_MUX_API_BASE as string | undefined) ?? '/mux-api';

export const muxSearchEnabled = Boolean(TOKEN_ID && TOKEN_SECRET) || Boolean(import.meta.env.VITE_MUX_API_BASE);

interface MuxAsset {
  id: string;
  created_at: string;
  duration?: number;
  status: string;
  passthrough?: string;
  meta?: { title?: string; creator_id?: string; external_id?: string };
  playback_ids?: { id: string; policy: string }[];
}

let assetsPromise: Promise<MuxAsset[]> | null = null;

function loadAssets(): Promise<MuxAsset[]> {
  if (!assetsPromise) {
    const headers: Record<string, string> = {};
    if (TOKEN_ID && TOKEN_SECRET) headers.Authorization = `Basic ${btoa(`${TOKEN_ID}:${TOKEN_SECRET}`)}`;
    assetsPromise = fetch(`${API_BASE}/video/v1/assets?limit=100`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Mux API ${res.status}`);
        return ((await res.json()) as { data: MuxAsset[] }).data;
      })
      .catch((err) => {
        assetsPromise = null; // allow a retry on the next keystroke
        throw err;
      });
  }
  return assetsPromise;
}

const titleOf = (a: MuxAsset) => a.meta?.title || a.passthrough || a.id;

function toVideo(a: MuxAsset): VideoItem | null {
  const pid = a.playback_ids?.find((p) => p.policy === 'public')?.id;
  if (!pid || a.status !== 'ready') return null;
  const created = new Date(a.created_at);
  return {
    id: `mux-${a.id}`,
    title: titleOf(a),
    src: pid,
    date: created.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    views: 0,
    tags: ['Mux', 'Video'],
    description: `Loaded from your Mux account (asset ${a.id}).`,
    thumbTime: a.duration ? Math.floor(a.duration / 4) : undefined,
  };
}

/** Searches the Mux assets by title / passthrough / asset id / playback id. */
export async function searchMux(query: string): Promise<VideoItem[]> {
  const q = query.trim().toLowerCase();
  const assets = await loadAssets();
  return assets
    .filter((a) => `${titleOf(a)} ${a.id} ${a.playback_ids?.map((p) => p.id).join(' ') ?? ''}`.toLowerCase().includes(q))
    .map(toVideo)
    .filter((v): v is VideoItem => v !== null)
    .slice(0, 8);
}

export type SearchState = { loading: boolean; error: string | null; results: VideoItem[] };

/** Debounced Mux search; empty query clears the results. */
export function useMuxSearch(query: string): SearchState {
  const [state, setState] = useState<SearchState>({ loading: false, error: null, results: [] });
  useEffect(() => {
    const q = query.trim();
    if (!q || !muxSearchEnabled) {
      setState({ loading: false, error: null, results: [] });
      return;
    }
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    const t = window.setTimeout(() => {
      searchMux(q)
        .then((results) => live && setState({ loading: false, error: null, results }))
        .catch((e: Error) => live && setState({ loading: false, error: e.message, results: [] }));
    }, 350);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [query]);
  return state;
}
