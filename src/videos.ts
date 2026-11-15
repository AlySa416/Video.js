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
    id: 'Video.js',
    title: 'Video.js',
    src:'BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM',
    date: 'Jan 12, 2025',
    views: 27,
    tags: ['Video', 'Vjs'],
    description:
      'Creating your video with Video.js',
    thumbTime: 20,
  },
  {
    id: 'Royal-Castle',
    title: 'Royal Castle',
    src: 'vlyOloPWpVWG7tld6BcNKs8qKFWEDPR3o9zrkSm7gIY',
    date: 'Nov 11, 2026',
    views: 18,
    tags: ['Education', 'Historical'],
    description: 'Discover the history of royal castles, their magnificent architecture, royal families, and fascinating stories from the past.',
    thumbTime: 90,
  },
  {
    id: 'eyeglasses-for-every-face',
    title: 'Eye Glasses For Every Face',
    src: 'rTi131xc3QuKrnn02sM5PAXQqMbdEDW46uZTjdWhGesA',
    date: 'Nov 15, 2026',
    views: 12,
    tags: ['Product','Glasses'],
    description: 'Discover stylish and comfortable eyeglasses designed to enhance your look. Made with durable materials, lightweight frames, and clear lenses, they are perfect for everyday use.',
    thumbTime: 180,
  },
  {
    id: 'The Magic of Music',
    title: 'The Magic of Music',
    src: 'GuHjxhcjj01802aymCvr2ytZKSCazvhd62MP2yx2KJN1Q',
    date: 'Nov 15, 2026',
    views: 9,
    tags: ['Music', 'Fantasy'],
    description: 'Every little discovery can lead to something extraordinary. ✨',
    thumbTime: 300,
  },
  {
    id: 'Di Tepi Musi',
    title: 'Di Tepi Musi',
    src: 'GIQ029Xse7qZ01nmhQqPWIB0200te6LoF02Mdi2ZWV9jQ63A',
    date: 'Nov 15, 2026',
    views: 21,
    tags: ['Music', 'Local'],
    description: 'A beautiful song inspired by the Musi River, capturing the peaceful atmosphere, local culture, and memories of Palembang.Lagu indah yang terinspirasi dari Sungai Musi, menggambarkan suasana damai, budaya lokal, dan kenangan Kota Palembang.',
    thumbTime: 420,
  },
  {
    id: 'Advertisement',
    title: 'Advertisement',
    src: 'MFH9g5EKw3wso7z6hJy4zk00OoNa01iz34p4s6fmdk02OU',
    date: 'Nov 15, 2026',
    views: 21,
    tags: ['MUX', 'Advertisement'],
    description: 'MUX Advertisement',
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
