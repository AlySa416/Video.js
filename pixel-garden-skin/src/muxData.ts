import { useEffect, useState } from 'react';
import { toPlaybackId } from './videos';

/** Reads the real duration and captions of a Mux asset straight from its HLS playlists. */

export interface Cue {
  start: number;
  end: number;
  text: string;
}

interface Meta {
  duration: number | null;
  subtitlesUrl: string | null;
}

const STREAM = 'https://stream.mux.com';
const metaCache = new Map<string, Promise<Meta>>();
const cueCache = new Map<string, Promise<Cue[]>>();

async function getText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function loadMeta(id: string): Promise<Meta> {
  let p = metaCache.get(id);
  if (!p) {
    p = (async () => {
      const master = `${STREAM}/${id}.m3u8`;
      const lines = (await getText(master)).split(/\r?\n/);
      let rendition: string | null = null;
      let subtitlesUrl: string | null = null;
      lines.forEach((line, i) => {
        if (line.startsWith('#EXT-X-STREAM-INF') && !rendition) {
          const next = lines.slice(i + 1).find((l) => l && !l.startsWith('#'));
          if (next) rendition = new URL(next, master).toString();
        }
        if (line.startsWith('#EXT-X-MEDIA') && line.includes('TYPE=SUBTITLES')) {
          const uri = /URI="([^"]+)"/.exec(line)?.[1];
          // Prefer the default track, otherwise the first one listed.
          if (uri && (!subtitlesUrl || line.includes('DEFAULT=YES'))) subtitlesUrl = new URL(uri, master).toString();
        }
      });
      let duration: number | null = null;
      if (rendition) {
        try {
          const playlist = await getText(rendition);
          const total = [...playlist.matchAll(/#EXTINF:([\d.]+)/g)].reduce((sum, m) => sum + parseFloat(m[1]), 0);
          duration = total > 0 ? total : null;
        } catch {
          /* leave the duration unknown */
        }
      }
      return { duration, subtitlesUrl };
    })();
    p.catch(() => metaCache.delete(id));
    metaCache.set(id, p);
  }
  return p;
}

const toSeconds = (s: string) => {
  const parts = s.trim().split(':').map(parseFloat);
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
};

function parseVtt(source: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of source.replace(/\r/g, '').split(/\n\n+/)) {
    const lines = block.split('\n');
    const at = lines.findIndex((l) => l.includes('-->'));
    if (at < 0) continue;
    const [from, to] = lines[at].split('-->');
    const text = lines
      .slice(at + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) cues.push({ start: toSeconds(from), end: toSeconds(to.trim().split(/\s/)[0]), text });
  }
  return cues;
}

function loadCues(id: string): Promise<Cue[]> {
  let p = cueCache.get(id);
  if (!p) {
    p = (async () => {
      const { subtitlesUrl } = await loadMeta(id);
      if (!subtitlesUrl) return [];
      const playlist = await getText(subtitlesUrl);
      const segments = playlist
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => new URL(l, subtitlesUrl).toString());
      const parts = await Promise.all(segments.map(getText));
      const all = parts.flatMap(parseVtt).sort((a, b) => a.start - b.start);
      // Drop immediate repeats (rolling captions).
      return all.filter((c, i) => i === 0 || c.text !== all[i - 1].text);
    })();
    p.catch(() => cueCache.delete(id));
    cueCache.set(id, p);
  }
  return p;
}

/** Duration in seconds of the stream behind `src`, or null while unknown. */
export function useMuxDuration(src: string): number | null {
  const id = toPlaybackId(src);
  const [duration, setDuration] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    setDuration(null);
    loadMeta(id)
      .then((m) => live && setDuration(m.duration))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [id]);
  return duration;
}

/** Captions of the stream behind `src`. `cues` is null while loading, [] when there are none. */
export function useMuxTranscript(src: string): { cues: Cue[] | null } {
  const id = toPlaybackId(src);
  const [cues, setCues] = useState<Cue[] | null>(null);
  useEffect(() => {
    let live = true;
    setCues(null);
    loadCues(id)
      .then((c) => live && setCues(c))
      .catch(() => live && setCues([]));
    return () => {
      live = false;
    };
  }, [id]);
  return { cues };
}

export function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

/** Timeline sections spread over the real duration, titled from the captions when there are any. */
export function buildTimeline(duration: number, cues: Cue[] | null, count = 6) {
  return Array.from({ length: count }, (_, i) => {
    const time = Math.floor((i * duration) / count);
    const cue = cues?.find((c) => c.end > time);
    const words = cue?.text.split(' ').slice(0, 5).join(' ');
    const label = i === 0 ? 'Opening' : words ? `${words}…` : `Part ${i + 1}`;
    return { time, label };
  });
}
