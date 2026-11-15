/**
 * Your film library. Each entry is one video.
 *
 * `src` is the Mux link for the film. Paste either the playback ID or the full stream link,
 * e.g. 'BV3YZ…' or 'https://stream.mux.com/BV3YZ….m3u8'.
 *
 * Everything shown for a film comes from that link:
 *  - the poster and the "More Films" thumbnail (image.mux.com, at `thumbTime` seconds)
 *  - the duration badge (read from the stream's playlist)
 *  - the Transcript tab (Mux auto-generated captions, if the asset has them)
 *  - the Timeline tab (`chapters` if you list them, otherwise sections built from the real
 *    duration and, when available, the captions)
 *
 * The entries below all point to Mux's public demo asset so the page works out of the box.
 * Replace `src` with each film's own link.
 */
export interface Chapter {
  time: number;
  label: string;
}

export interface VideoItem {
  id: string;
  title: string;
  src: string;
  date: string;
  views: number;
  tags: [string, string];
  description: string;
  /** Second of the video used for the thumbnail. */
  thumbTime?: number;
  /** Optional hand-written chapters. Leave out to build the timeline from the video itself. */
  chapters?: Chapter[];
}

const DEMO = 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM.m3u8';

export const videos: VideoItem[] = [
  {
    id: 'moonlight-journey',
    title: 'Moonlight Journey',
    src: import.meta.env.VITE_MUX_PLAYBACK_ID ?? DEMO,
    date: 'Jan 12, 2025',
    views: 27,
    tags: ['Fantasy', 'Adventure'],
    description:
      'In a world where the moon never fades, a girl embarks on a journey to uncover the truth behind the mysterious castle…',
    thumbTime: 20,
  },
  {
    id: 'purple-dreams',
    title: 'Purple Dreams',
    src: DEMO,
    date: 'Feb 03, 2025',
    views: 18,
    tags: ['Fantasy', 'Adventure'],
    description: 'A quiet castle town wakes under a violet sky, and every dream leaves a trace behind.',
    thumbTime: 90,
  },
  {
    id: 'silent-night',
    title: 'Silent Night',
    src: DEMO,
    date: 'Feb 21, 2025',
    views: 12,
    tags: ['Drama', 'Fantasy'],
    description: 'Cherry blossoms fall in the moonlight while two strangers share one unspoken wish.',
    thumbTime: 180,
  },
  {
    id: 'lonely-room',
    title: 'Lonely Room',
    src: DEMO,
    date: 'Mar 09, 2025',
    views: 9,
    tags: ['Drama', 'Cute'],
    description: 'A small room, a big window, and a cat who knows exactly when to stay close.',
    thumbTime: 300,
  },
  {
    id: 'beyond-the-sky',
    title: 'Beyond the Sky',
    src: DEMO,
    date: 'Mar 30, 2025',
    views: 21,
    tags: ['Adventure', 'Fantasy'],
    description: 'Past the old gate and over the clouds, the road keeps going.',
    thumbTime: 420,
  },
];

/** Accepts a playback ID or any mux stream/image link and returns the playback ID. */
export function toPlaybackId(input: string): string {
  const m = /(?:stream|image)\.mux\.com\/([A-Za-z0-9]+)/.exec(input);
  return m ? m[1] : input.trim();
}

export function thumbUrl(src: string, width: number, time?: number) {
  const id = toPlaybackId(src);
  return `https://image.mux.com/${id}/thumbnail.webp?width=${width}${time != null ? `&time=${time}` : ''}`;
}
