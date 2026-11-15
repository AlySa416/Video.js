import { useMemo } from 'react';

export type ThemeId = 'purple' | 'blue' | 'black' | 'white' | 'cyan' | 'midnight';

const thumbs = import.meta.glob('./assets/thumbs/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** Purely decorative artwork for the page around the player. Everything is inline SVG/CSS. */

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function StarField({ count = 90 }: { count?: number }) {
  const shadow = useMemo(() => {
    const rnd = mulberry(7);
    return Array.from({ length: count }, () => {
      const x = Math.round(rnd() * 100);
      const y = Math.round(rnd() * 100);
      const spread = rnd() > 0.8 ? 1 : 0;
      return `${x}vw ${y}vh 0 ${spread}px rgb(233 217 255 / ${0.4 + rnd() * 0.6})`;
    }).join(',');
  }, [count]);
  return <div className="g-stars" aria-hidden="true" style={{ boxShadow: shadow }} />;
}

export function MoonLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Moonlight">
      <defs>
        <radialGradient id="moonGlow" cx="35%" cy="35%" r="75%">
          <stop offset="0" style={{ stopColor: 'var(--g-logo-1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--g-logo-2)' }} />
        </radialGradient>
      </defs>
      <path d="M40 5a27 27 0 1 0 19 41A22 22 0 1 1 40 5z" fill="url(#moonGlow)" />
    </svg>
  );
}

/** Rounded play triangle, the logo of the Midnight theme. */
export function PlayLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Play">
      <path d="M17 9.5v45a3 3 0 0 0 4.6 2.5l36-22.5a3 3 0 0 0 0-5L21.6 7A3 3 0 0 0 17 9.5z" fill="#7fb0ff" />
    </svg>
  );
}

export function Sparkle({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="g-sparkle">
      <path d="M8 0l1.6 6.4L16 8l-6.4 1.6L8 16l-1.6-6.4L0 8l6.4-1.6z" fill="currentColor" />
    </svg>
  );
}

/** Film thumbnails, one set per theme (cropped from the theme artwork). */
export function SceneThumb({ theme, index }: { theme: ThemeId; index: number }) {
  const src = thumbs[`./assets/thumbs/${theme}-${index}.webp`];
  // Midnight has no artwork thumbnails: a plain dark tile stands in until the Mux thumbnail loads.
  if (!src) return <span className="g-thumb-art g-thumb-blank" aria-hidden="true" />;
  return <img className="g-thumb-art" src={src} alt="" loading="lazy" draggable={false} />;
}

function Flower({ x, y, s = 1, r = 0, petal, center }: { x: number; y: number; s?: number; r?: number; petal: string; center: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-10" rx="6.5" ry="10.5" fill={petal} transform={`rotate(${a})`} />
      ))}
      <circle r="4" fill={center} />
    </g>
  );
}

export function ThemeLogo({ theme, size = 56 }: { theme: ThemeId; size?: number }) {
  if (theme === 'purple') return <MoonLogo size={size} />;
  if (theme === 'midnight') return <PlayLogo size={size} />;
  if (theme === 'blue')
    return (
      <svg width={size + 24} height={size + 24} viewBox="-40 -40 80 80" role="img" aria-label="Sun" style={{ margin: -12 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <polygon key={i} points="-4,-24 0,-38 4,-24" fill="#fff" transform={`rotate(${i * 30})`} />
        ))}
        <circle r="19" fill="#fff" />
      </svg>
    );
  if (theme === 'black')
    return (
      <svg width={size + 8} height={size + 8} viewBox="-32 -32 64 64" role="img" aria-label="Flower">
        <Flower x={0} y={0} s={1.9} petal="#8eb1ff" center="#dfe8ff" />
      </svg>
    );
  if (theme === 'white')
    return (
      <svg width={size * 0.6} height={size} viewBox="0 0 30 50" role="img" aria-label="Phone">
        <rect x="2" y="2" width="26" height="46" rx="5" fill="#fff" stroke="#1b2a55" strokeWidth="3" />
        <rect x="11" y="5" width="8" height="2.5" rx="1.2" fill="#1b2a55" />
        <circle cx="15" cy="42" r="2" fill="#1b2a55" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="-32 -32 64 64" role="img" aria-label="Gear">
      <circle r="22" fill="none" stroke="#3b9cf0" strokeWidth="10" strokeDasharray="8.6 8.6" />
      <circle r="19" fill="#3b9cf0" />
      <circle r="11" fill="#e8f6ff" />
      <circle r="6" fill="#0f4fb0" />
    </svg>
  );
}

/** Small icon placed before section headings. The icon differs per theme. */
export function SectionIcon({ theme, kind }: { theme: ThemeId; kind: 'films' | 'panel' | 'divider' }) {
  if (theme === 'midnight') {
    if (kind === 'divider') return null;
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="g-sec-icon">
        <path d="M6 3.8v16.4a1.2 1.2 0 0 0 1.8 1l13-8.2a1.2 1.2 0 0 0 0-2l-13-8.2A1.2 1.2 0 0 0 6 3.8z" fill="currentColor" />
      </svg>
    );
  }
  if (theme === 'black')
    return (
      <svg width={kind === 'divider' ? 28 : 26} height={kind === 'divider' ? 28 : 26} viewBox="-16 -16 32 32" aria-hidden="true" className="g-sec-icon">
        <Flower x={0} y={0} s={1} petal="#8eb1ff" center="#dfe8ff" />
      </svg>
    );
  if (theme === 'cyan' && kind === 'panel')
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="g-sec-icon">
        <rect x="3" y="12" width="4" height="9" fill="currentColor" />
        <rect x="10" y="4" width="4" height="17" fill="currentColor" />
        <rect x="17" y="9" width="4" height="12" fill="currentColor" />
      </svg>
    );
  if (kind === 'panel') return null;
  if (theme === 'purple' && kind === 'films')
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="g-sec-icon">
        <polygon points="0,3 14,3 7,12" fill="currentColor" />
      </svg>
    );
  return <Sparkle size={kind === 'divider' ? 18 : 20} />;
}

