import { MuxVideo } from '@videojs/react/media/mux-video';
import { VideoPlayer, usePlayer } from '@videojs/react/video';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SceneThumb, SectionIcon, StarField, ThemeLogo } from './GardenArt';
import type { ThemeId } from './GardenArt';
import { GardenSkin } from './GardenSkin';
import { buildTimeline, formatTime, useMuxDuration, useMuxTranscript } from './muxData';
import type { Cue } from './muxData';
import { muxSearchEnabled, useMuxSearch } from './muxSearch';
import { thumbUrl, toPlaybackId, videos as localVideos } from './videos';
import type { VideoItem } from './videos';
import './garden-skin.css';

const themes = [
  { id: 'purple', label: 'Purple', color: 'linear-gradient(135deg,#d2a8ff,#5a22c8)', night: '#0a031c' },
  { id: 'blue', label: 'Blue', color: 'linear-gradient(135deg,#bfe3ff,#1f7fe8)', night: '#1269d6' },
  { id: 'black', label: 'Black', color: 'linear-gradient(135deg,#6b7390,#12141b)', night: '#12141b' },
  { id: 'white', label: 'White', color: 'linear-gradient(135deg,#ffffff,#c5d2ec)', night: '#eef3fc' },
  { id: 'cyan', label: 'Cyan', color: 'linear-gradient(135deg,#bff1ff,#00a6e8)', night: '#cfe5fa' },
  { id: 'midnight', label: 'Midnight', color: 'linear-gradient(135deg,#a9c8ff,#2a4a8f 60%,#070b14)', night: '#070b14' },
] as const;

function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('garden-theme');
      if (themes.some((t) => t.id === saved)) return saved as ThemeId;
    } catch {
      /* storage can be unavailable */
    }
    return 'purple';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themes.find((t) => t.id === theme)!.night);
    try {
      localStorage.setItem('garden-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

function ThemeSwitcher({ value, onChange }: { value: ThemeId; onChange: (t: ThemeId) => void }) {
  return (
    <div className="g-themes" role="radiogroup" aria-label="Theme colour">
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={value === t.id}
          aria-label={t.label}
          title={t.label}
          className="g-theme-btn"
          onClick={() => onChange(t.id)}
        >
          <span className="g-theme-dot" style={{ background: t.color }} />
        </button>
      ))}
    </div>
  );
}

function TimelinePanel({ theme, video, cues }: { theme: ThemeId; video: VideoItem; cues: Cue[] | null }) {
  const store = usePlayer();
  const currentTime = usePlayer((s) => s.currentTime);
  const playerDuration = usePlayer((s) => s.duration);
  const streamDuration = useMuxDuration(video.src);
  const [tab, setTab] = useState<'timeline' | 'transcript'>('timeline');
  const listRef = useRef<HTMLUListElement>(null);

  const duration = Number.isFinite(playerDuration) && playerDuration > 0 ? playerDuration : streamDuration;

  const timeline = useMemo(
    () => video.chapters ?? (duration ? buildTimeline(duration, cues) : []),
    [video.chapters, duration, cues],
  );
  const lines = useMemo(() => (cues ?? []).map((c) => ({ time: c.start, text: c.text })), [cues]);

  const items = tab === 'timeline' ? timeline.map((c) => ({ time: c.time, text: c.label })) : lines;
  const activeIndex = items.reduce((acc, item, i) => (currentTime >= item.time ? i : acc), -1);

  // Keep the current transcript line in view without moving the page.
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (tab !== 'transcript' || !list || !el) return;
    const delta = el.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientHeight / 2;
    list.scrollTo({ top: list.scrollTop + delta, behavior: 'auto' });
  }, [activeIndex, tab]);

  let empty: string | null = null;
  if (items.length === 0) {
    if (tab === 'timeline') empty = 'Loading the timeline…';
    else if (cues === null) empty = 'Loading the transcript…';
    else empty = 'This video has no captions yet. Turn on auto-generated captions for the asset in Mux and the transcript appears here.';
  }

  return (
    <aside className="g-panel" aria-labelledby="panel-title">
      <h2 id="panel-title">
        <SectionIcon theme={theme} kind="panel" />
        Timeline &amp; Transcript
      </h2>
      <div className="g-tabs" role="tablist" aria-label="Panel view">
        {(['timeline', 'transcript'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls="panel-list"
            className="g-pill g-tab"
            onClick={() => setTab(t)}
          >
            {t === 'timeline' ? 'Timeline' : 'Transcript'}
          </button>
        ))}
      </div>
      <ul ref={listRef} id="panel-list" role="tabpanel" aria-labelledby={`tab-${tab}`} className="g-panel-list">
        {empty && <li className="g-panel-empty">{empty}</li>}
        {items.map((item, i) => (
          <li key={`${item.time}-${i}`}>
            <button
              type="button"
              className="g-panel-item"
              aria-current={i === activeIndex ? 'true' : undefined}
              onClick={() => store.seek(item.time)}
            >
              <span className="g-panel-time">{formatTime(item.time)}</span>
              <span>{item.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FilmCard({ video, theme, index, onSelect }: { video: VideoItem; theme: ThemeId; index: number; onSelect: () => void }) {
  const duration = useMuxDuration(video.src);
  const [failed, setFailed] = useState(false);
  return (
    <button type="button" className="g-card" onClick={onSelect} aria-label={`Play ${video.title}`}>
      <span className="g-thumb">
        {failed ? (
          <SceneThumb theme={theme} index={index} />
        ) : (
          <img
            className="g-thumb-art"
            src={thumbUrl(video.src, 554, video.thumbTime)}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
        {duration != null && <span className="g-duration">{formatTime(duration)}</span>}
      </span>
      <span className="g-card-body">
        <span className="g-card-title">
          {video.title}
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="5,3 21,12 5,21" fill="currentColor" />
          </svg>
        </span>
        <span className="g-card-tags">
          {video.tags.map((t) => (
            <span className="g-pill g-pill-sm" key={t}>
              {t}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

function SearchBox({ onPick }: { onPick: (v: VideoItem) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { loading, error, results } = useMuxSearch(query);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = (v: VideoItem) => {
    onPick(v);
    setQuery('');
    setOpen(false);
  };

  const showList = open && query.trim().length > 0;
  let note: string | null = null;
  if (!muxSearchEnabled) note = 'Add VITE_MUX_TOKEN_ID and VITE_MUX_TOKEN_SECRET to .env to search Mux.';
  else if (loading) note = 'Searching Mux…';
  else if (error) note = `Could not reach Mux (${error}).`;
  else if (results.length === 0) note = 'No videos found on Mux.';

  return (
    <div className="g-search-wrap" ref={boxRef}>
      <label className="g-search">
        <span className="g-sr">Search Mux videos</span>
        <input
          type="search"
          placeholder="Search"
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              e.currentTarget.blur();
            }
            if (e.key === 'Enter' && results[0]) pick(results[0]);
          }}
        />
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
      </label>
      {showList && (
        <ul className="g-search-results" role="listbox" aria-label="Mux results">
          {results.map((v) => (
            <li key={v.id} role="option" aria-selected="false">
              <button type="button" className="g-search-item" onClick={() => pick(v)}>
                <img src={thumbUrl(v.src, 160, v.thumbTime)} alt="" loading="lazy" />
                <span>{v.title}</span>
              </button>
            </li>
          ))}
          {note && results.length === 0 && <li className="g-search-note">{note}</li>}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  const [theater, setTheater] = useState(false);
  const [theme, setTheme] = useTheme();
  const [current, setCurrent] = useState(0);
  const [remote, setRemote] = useState<VideoItem[]>([]);
  const videos = useMemo(() => [...localVideos, ...remote], [remote]);
  const video = videos[current] ?? videos[0];
  const { cues } = useMuxTranscript(video.src);

  useEffect(() => {
    document.title = `${video.title} · Pixel Garden skin for Video.js v10`;
  }, [video.title]);

  // A film picked from the Mux search joins the list and starts playing.
  const addAndPlay = (v: VideoItem) => {
    const known = videos.findIndex((x) => x.id === v.id || toPlaybackId(x.src) === toPlaybackId(v.src));
    if (known >= 0) return select(known);
    setRemote((r) => [...r, v]);
    select(videos.length);
  };

  const select = (index: number) => {
    setCurrent(index);
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('player')?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="g-page">
      <StarField />

      <header className="g-nav">
        <a href="#top" className="g-logo" aria-label="Moonlight home">
          <ThemeLogo theme={theme} />
        </a>
        <span className="g-nav-sep" aria-hidden="true" />
        <a href="#player" className="g-nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3.5v17l15-8.5z" fill="currentColor" />
          </svg>
          Video
        </a>
        <span className="g-nav-sep" aria-hidden="true" />
        <a href="https://videojs.org" className="g-nav-link">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1" />
          </svg>
          videojs.org
        </a>
        <ThemeSwitcher value={theme} onChange={setTheme} />

        <SearchBox onPick={addAndPlay} />
      </header>

      <main id="top">
        <VideoPlayer>
          <section className={`g-stage${theater ? ' is-theater' : ''}`} id="player" aria-label="Video player">
            <div className="g-frame">
              <GardenSkin theme={theme} theater={theater} onToggleTheater={() => setTheater((v) => !v)}>
                <MuxVideo key={video.id} source={{ playbackId: toPlaybackId(video.src) }} crossOrigin="anonymous" playsInline />
              </GardenSkin>
            </div>
            <TimelinePanel theme={theme} video={video} cues={cues} />
          </section>
        </VideoPlayer>

        <section className="g-info" aria-labelledby="film-title">
          <h1 id="film-title">{video.title}</h1>
          <div className="g-meta">
            <span className="g-meta-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
              {video.date}
            </span>
            <span className="g-meta-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {video.views}
            </span>
            <span className="g-meta-sep" aria-hidden="true" />
            {video.tags.map((t) => (
              <span className="g-pill" key={t}>
                {t}
              </span>
            ))}
          </div>
          <p>{video.description}</p>
        </section>

        <div className="g-divider" aria-hidden="true">
          <SectionIcon theme={theme} kind="divider" />
        </div>

        <section className="g-films" aria-labelledby="films-title">
          <h2 id="films-title">
            <SectionIcon theme={theme} kind="films" />
            More Films
          </h2>
          <ul className="g-film-grid">
            {videos.map((v, i) =>
              i === current ? null : (
                <li key={v.id}>
                  <FilmCard video={v} theme={theme} index={(i % 4) + 1} onSelect={() => select(i)} />
                </li>
              ),
            )}
          </ul>
        </section>
      </main>

    </div>
  );
}
