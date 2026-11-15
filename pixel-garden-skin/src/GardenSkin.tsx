import {
  BufferingIndicator,
  CaptionsButton,
  Container,
  Controls,
  ErrorDialog,
  FullscreenButton,
  Gesture,
  Hotkey,
  MuteButton,
  PiPButton,
  PlayButton,
  Poster,
  Slider,
  StatusAnnouncer,
  Time,
  TimeSlider,
  VolumePopover,
  VolumeSlider,
} from '@videojs/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeLogo } from './GardenArt';
import type { ThemeId } from './GardenArt';
import { SettingsMenu } from './SettingsMenu';
import './garden-skin.css';

const svg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className: 'g-icon',
};

const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="g-icon g-icon-play" fill="currentColor">
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);
const PauseGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="g-icon g-icon-pause" fill="currentColor">
    <rect x="6" y="4.5" width="4.4" height="15" rx="1" />
    <rect x="13.6" y="4.5" width="4.4" height="15" rx="1" />
  </svg>
);
const VolumeGlyph = () => (
  <>
    <svg {...svg} className="g-icon g-icon-vol">
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8.5 8.5 0 0 1 0 12" />
    </svg>
    <svg {...svg} className="g-icon g-icon-muted">
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M17 9l5 6M22 9l-5 6" />
    </svg>
  </>
);
const CaptionsGlyph = () => (
  <svg {...svg}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M10 10.2a2.2 2.2 0 1 0 0 3.6M17 10.2a2.2 2.2 0 1 0 0 3.6" strokeWidth="1.8" />
  </svg>
);
const TheaterGlyph = () => (
  <svg {...svg}>
    <rect x="3" y="6.5" width="18" height="11" rx="2" />
  </svg>
);
const PipGlyph = () => (
  <svg {...svg}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <rect x="12" y="11.5" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
  </svg>
);
const FullscreenGlyph = () => (
  <>
    <svg {...svg} className="g-icon g-icon-enter">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
    <svg {...svg} className="g-icon g-icon-exit">
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
    </svg>
  </>
);

export interface GardenSkinProps {
  children?: ReactNode;
  className?: string;
  /** Wide "theater" layout, controlled by the page that hosts the player. */
  theater?: boolean;
  onToggleTheater?: () => void;
  /** Current page theme; the loading indicator uses that theme's logo. */
  theme?: ThemeId;
}

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  return !!t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
};

/** Keyboard shortcuts that the built-in Hotkey actions do not cover: volume, theater, settings, Esc. */
function useExtraHotkeys(theater: boolean | undefined, onToggleTheater: (() => void) | undefined, flash: (msg: string) => void) {
  const state = useRef({ theater, onToggleTheater, flash });
  state.current = { theater, onToggleTheater, flash };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      const root = document.querySelector<HTMLElement>('.garden-skin');
      const media = root?.querySelector<HTMLMediaElement>('video, mux-video, hls-video');
      const { theater, onToggleTheater, flash } = state.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown': {
          if (!media) return;
          e.preventDefault();
          const next = Math.min(1, Math.max(0, Math.round((media.volume + (e.key === 'ArrowUp' ? 0.05 : -0.05)) * 100) / 100));
          media.volume = next;
          if (next > 0) media.muted = false;
          flash(`Volume ${Math.round(next * 100)}%`);
          break;
        }
        case 't':
        case 'T':
          if (!onToggleTheater) return;
          e.preventDefault();
          onToggleTheater();
          flash(theater ? 'Theater mode off' : 'Theater mode on');
          break;
        case 's':
        case 'S':
          e.preventDefault();
          root?.querySelector<HTMLButtonElement>('.g-settings-btn')?.click();
          break;
        case 'Escape':
          // The browser already leaves fullscreen on Esc; without fullscreen, Esc also closes theater mode.
          if (theater && !document.fullscreenElement && onToggleTheater) onToggleTheater();
          break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}

export function GardenSkin({ children, className, theater, onToggleTheater, theme = 'purple' }: GardenSkinProps) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>();
  const flash = (msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 1100);
  };
  useExtraHotkeys(theater, onToggleTheater, flash);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Container
      // Scaffold's data attributes keep its layout rules for menus and popups working under our styles.
      className={`media-skin media-container media-video garden-skin ${className ?? ''}`}
      data-theme="scaffold"
      data-preset="video"
    >
      {children}

      <Poster.Root className="g-poster">
        <Poster.Image className="g-poster-image" />
      </Poster.Root>

      <BufferingIndicator className="g-buffering">
        <span className="g-buffering-logo" aria-hidden>
          <ThemeLogo theme={theme} size={48} />
        </span>
      </BufferingIndicator>

      <div className="g-toast" role="status" aria-live="polite" data-visible={toast ? '' : undefined}>
        {toast}
      </div>

      <PlayButton
        className="g-center-play"
        render={<button type="button" tabIndex={-1} />}
      >
        <PlayGlyph />
      </PlayButton>

      <Controls.Root>
        <Controls.Backdrop className="g-backdrop" />
        <Controls.Content className="g-controls">
          <TimeSlider.Root className="g-seek" thumbAlignment="edge">
            <Slider.Track className="g-seek-track">
              <Slider.Buffer className="g-seek-buffer" />
              <Slider.Fill className="g-seek-fill" />
            </Slider.Track>
            <Slider.Thumb className="g-seek-thumb" />
            <Slider.Preview className="g-seek-preview">
              <Slider.Value type="pointer" className="g-seek-preview-time" />
            </Slider.Preview>
          </TimeSlider.Root>

          <div className="g-row">
            <Controls.Group className="g-group" aria-label="Playback controls">
              <PlayButton className="g-btn" render={<button type="button" />}>
                <PlayGlyph />
                <PauseGlyph />
              </PlayButton>

              <VolumePopover.Root openOnHover delay={200} closeDelay={100} side="top">
                <VolumePopover.Trigger render={<MuteButton className="g-btn" render={<button type="button" />} />}>
                  <VolumeGlyph />
                </VolumePopover.Trigger>
                <VolumePopover.Popup className="media-popup media-popup-safe-area g-volume-popup">
                  <VolumeSlider.Root className="g-volume" orientation="vertical" thumbAlignment="edge">
                    <Slider.Track className="g-volume-track">
                      <Slider.Fill className="g-volume-fill" />
                    </Slider.Track>
                    <Slider.Thumb className="g-volume-thumb" />
                  </VolumeSlider.Root>
                </VolumePopover.Popup>
              </VolumePopover.Root>

              <Time.Group className="g-time">
                <Time.Value type="current" />
                <Time.Separator className="g-time-sep" />
                <Time.Value type="duration" />
              </Time.Group>
            </Controls.Group>

            <Controls.Group className="g-group" aria-label="Player options">
              <CaptionsButton className="g-btn g-captions" render={<button type="button" />}>
                <CaptionsGlyph />
              </CaptionsButton>
              <SettingsMenu />
              <PiPButton className="g-btn g-pip" render={<button type="button" />}>
                <PipGlyph />
              </PiPButton>
              {onToggleTheater && (
                <button
                  type="button"
                  className="g-btn g-theater"
                  aria-label={theater ? 'Exit theater mode' : 'Theater mode'}
                  aria-pressed={!!theater}
                  onClick={onToggleTheater}
                >
                  <TheaterGlyph />
                </button>
              )}
              <FullscreenButton className="g-btn" render={<button type="button" />}>
                <FullscreenGlyph />
              </FullscreenButton>
            </Controls.Group>
          </div>
        </Controls.Content>
      </Controls.Root>

      <Hotkey keys="Space" action="togglePaused" />
      <Hotkey keys="k" action="togglePaused" />
      <Hotkey keys="m" action="toggleMuted" />
      <Hotkey keys="f" action="toggleFullscreen" />
      <Hotkey keys="c" action="toggleSubtitles" />
      <Hotkey keys="p" action="togglePictureInPicture" />
      <Hotkey keys="i" action="togglePictureInPicture" />
      <Hotkey keys="ArrowLeft" action="seekStep" value={-5} />
      <Hotkey keys="ArrowRight" action="seekStep" value={5} />
      <Hotkey keys="j" action="seekStep" value={-10} />
      <Hotkey keys="l" action="seekStep" value={10} />

      <Gesture type="tap" action="togglePaused" pointer="mouse" region="center" />
      <Gesture type="tap" action="toggleControls" pointer="touch" />
      <Gesture type="doubletap" action="seekStep" value={-10} region="left" />
      <Gesture type="doubletap" action="toggleFullscreen" region="center" />
      <Gesture type="doubletap" action="seekStep" value={10} region="right" />

      <StatusAnnouncer />

      <ErrorDialog.Root>
        <ErrorDialog.Popup className="g-error">
          <ErrorDialog.Title className="g-error-title" />
          <ErrorDialog.Description className="g-error-text" />
          <ErrorDialog.Close className="g-btn g-error-close" />
        </ErrorDialog.Popup>
      </ErrorDialog.Root>
    </Container>
  );
}
