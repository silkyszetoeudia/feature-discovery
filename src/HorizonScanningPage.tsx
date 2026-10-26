import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactElement} from 'react';
import PlayButton from './PlayButton';

const ASSET = '/assistant';
const V1 = '/assistant/v1';
const PLAYER = 'https://player.vimeo.com';
const EMBED = `${PLAYER}/video/1230147731?h=27cbfae57e&autoplay=1&autopause=0&loop=0&title=0&byline=0&portrait=0&controls=0&dnt=1&playsinline=1`;
/** Source size from the Vimeo player config (not 16:9). */
const VIDEO_W = 3342;
const VIDEO_H = 2160;
const END_HOLD_SECONDS = 0.35;

/** Surface, then each line, then a still hold. The video row waits for both this hold and a real frame. */
const SURFACE_MS = 250;
const LINE_MS = 360;
const STAGGER_MS = 80;
const HOLD_MS = 400;
const VIDEO_REVEAL_MS = 450;
const READY_FALLBACK_MS = 2500;
const VIDEO_GAP = 28;
const VIDEO_MAX_W = 1200;

const TEXT_BADGE_DELAY_MS = SURFACE_MS;
const TEXT_TITLE_DELAY_MS = SURFACE_MS + STAGGER_MS;
const TEXT_SUB_DELAY_MS = SURFACE_MS + STAGGER_MS * 2;
const TEXT_SETTLED_MS = TEXT_SUB_DELAY_MS + LINE_MS;
const VIDEO_HOLD_MS = TEXT_SETTLED_MS + HOLD_MS;

const DIALOG_W = 1392;
const DIALOG_H = 977;

const AGENTS = [
  {name: 'Redact PII', description: 'Redact sensitive information from documents.', icon: `${ASSET}/file-lock.svg`},
  {name: 'Argument Analysis', description: 'Analyzes argument evolution and inconsistencies.', icon: `${ASSET}/circle-help.svg`},
  {name: 'Case Analysis', description: 'Comprehensive analysis of case documents and themes.', icon: `${ASSET}/briefcase.svg`},
  {name: 'Compare', description: 'Compare and highlight differences between documents.', icon: `${ASSET}/git-compare.svg`},
  {name: 'Witness Analysis', description: 'Analyze testimonies and depositions for inconsistencies.', icon: `${ASSET}/circle-user.svg`},
];

const OUTPUTS = [
  {name: 'Generate Report', owner: 'Me', status: 'In progress', when: '2 days ago', icon: `${ASSET}/pencil-ruler.svg`, statusIcon: `${ASSET}/loader.svg`},
  {name: 'Translate', owner: 'sam.rivera@eudia.com', status: 'Completed', when: 'Jan 6, 2025', icon: `${ASSET}/languages.svg`, statusIcon: `${ASSET}/circle-check.svg`},
  {name: 'Argument Analysis', owner: 'cameron.reed@eudia.com', status: 'Completed', when: 'Jan 6, 2025', icon: `${ASSET}/sheet.svg`, statusIcon: `${ASSET}/circle-check.svg`},
];

const SCOPE_ROWS = [
  [
    ['ai', 'AI Act'],
    ['gdpr', 'GDPR'],
  ],
  [
    ['enforcement', 'Enforcement'],
    ['sec', 'SEC'],
    ['privacy', 'Privacy'],
  ],
] as const;

const SCOPE_CYCLE = ['enforcement', 'gdpr', 'privacy'] as const;
const TABS = ['Daily', 'Weekly', 'Monthly'] as const;

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Glyph({src, width, height}: {src: string; width: number; height: number}): ReactElement {
  return <img src={src} alt="" width={width} height={height} />;
}

function IconButton({src, label}: {src: string; label: string}): ReactElement {
  return (
    <button className="assist-icon-btn" type="button" aria-label={label}>
      <Glyph src={src} width={16} height={16} />
    </button>
  );
}

function useCycle<T>(items: readonly T[], rest: T, intervalMs: number) {
  const [value, setValue] = useState(rest);
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    setValue(rest);
  };

  const start = () => {
    if (reducedMotion()) return;
    if (timer.current !== null) window.clearInterval(timer.current);
    const restIndex = Math.max(0, items.indexOf(rest));
    let index = (restIndex + 1) % items.length;
    setValue(items[index]);
    timer.current = window.setInterval(() => {
      index = (index + 1) % items.length;
      setValue(items[index]);
    }, intervalMs);
  };

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    },
    [],
  );

  return {value, start, stop};
}

function ScopeCard(): ReactElement {
  const cycle = useCycle(SCOPE_CYCLE, 'enforcement', 760);
  return (
    <span className="hs-card hs-card--scope" onMouseEnter={cycle.start} onMouseLeave={cycle.stop}>
      <span className="hs-art hs-art--scope">
        <span className="hs-tags">
          {SCOPE_ROWS.map((row) => (
            <span className="hs-tag-row" key={row[0][0]}>
              {row.map(([id, label]) => (
                <span className={clsx('hs-chip', cycle.value === id && 'is-on')} key={id}>
                  {label}
                </span>
              ))}
            </span>
          ))}
        </span>
      </span>
      <span className="hs-copy">
        <strong>Your scope, your sources</strong>
        <span>Choose the topics and sources to watch.</span>
      </span>
    </span>
  );
}

function ScheduleCard(): ReactElement {
  const cycle = useCycle(TABS, 'Weekly', 680);
  return (
    <span className="hs-card hs-card--schedule" onMouseEnter={cycle.start} onMouseLeave={cycle.stop}>
      <span className="hs-art hs-art--schedule">
        <span className="hs-tabs" role="presentation">
          {TABS.map((tab) => (
            <span className={clsx('hs-tab', cycle.value === tab && 'is-on')} key={tab}>
              {tab}
            </span>
          ))}
        </span>
      </span>
      <span className="hs-copy">
        <strong>On your schedule</strong>
        <span>Scans run daily, weekly, or monthly, automatically.</span>
      </span>
    </span>
  );
}

/** Last citation finishes at 680ms + a 110ms pop. Then a short hold, then the build starts over. */
const JUDGMENT_PLAY_MS = 790;
const JUDGMENT_PAUSE_MS = 360;

function JudgmentCard(): ReactElement {
  const [build, setBuild] = useState(0);
  const [hot, setHot] = useState(false);

  useEffect(() => {
    if (!hot || reducedMotion()) return;
    let timer = 0;
    let cancelled = false;
    const run = () => {
      setBuild((value) => value + 1);
      timer = window.setTimeout(() => {
        if (!cancelled) run();
      }, JUDGMENT_PLAY_MS + JUDGMENT_PAUSE_MS);
    };
    run();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setBuild(0);
    };
  }, [hot]);

  return (
    <span
      className="hs-card hs-card--judgment"
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
    >
      <span className="hs-art hs-art--judgment">
        <span className={clsx('hs-report', build > 0 && 'is-building')} key={build}>
          <span className="hs-line hs-line--h1" />
          <span className="hs-line hs-line--link" />
          <span className="hs-line hs-line--s1" />
          <span className="hs-line hs-line--s2" />
          <span className="hs-cite hs-cite--1">1</span>
          <span className="hs-line hs-line--h2" />
          <span className="hs-line hs-line--s3" />
          <span className="hs-cite hs-cite--2">2</span>
          <span className="hs-cite hs-cite--3">3</span>
        </span>
      </span>
      <span className="hs-copy">
        <strong>More time for judgment</strong>
        <span>Each update is summarized and sourced.</span>
      </span>
    </span>
  );
}

export function HorizonCardStack(): ReactElement {
  return (
    <span className="hs-stack">
      <ScopeCard />
      <JudgmentCard />
      <ScheduleCard />
    </span>
  );
}

function DiscoverStack({onOpen}: {onOpen: () => void}): ReactElement {
  return (
    <button className="hs-discover" type="button" onClick={onOpen}>
      <HorizonCardStack />
      <span className="disc-caption">
        <span className="disc-caption__title">Explore Horizon Scanning</span>
        <span className="disc-caption__sub">Stay on top of regulatory change.</span>
      </span>
    </button>
  );
}

function useDialogScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const scrim = ref.current;
    if (!scrim) return;
    const update = () => {
      const style = getComputedStyle(scrim);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const width = scrim.clientWidth - padX;
      const height = scrim.clientHeight - padY;
      const next = Math.min(width / DIALOG_W, height / DIALOG_H);
      setScale(next > 0 && Number.isFinite(next) ? next : 1);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scrim);
    return () => observer.disconnect();
  }, []);

  return {ref, scale};
}

type Playback = 'starting' | 'playing' | 'ended' | 'blocked';

type VimeoMessage = {
  event?: string;
  data?: {seconds?: number | string; duration?: number | string};
};

function post(iframe: HTMLIFrameElement | null, method: string, value?: unknown) {
  iframe?.contentWindow?.postMessage(JSON.stringify({method, value}), PLAYER);
}

function clockValue(value: number | string | undefined): number | null {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : null;
}

function HorizonVideo({onReveal, width}: {onReveal: () => void; width: number}): ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playback, setPlayback] = useState<Playback>('starting');
  const holding = useRef(false);
  const armed = useRef(true);
  const durationRef = useRef(0);
  const playbackRef = useRef<Playback>('starting');
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  const setMode = (next: Playback) => {
    playbackRef.current = next;
    setPlayback(next);
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let revealed = false;
    let sawPlay = false;
    let arm = 0;

    const allowReveal = () => {
      if (revealed) return;
      revealed = true;
      onRevealRef.current();
    };

    const markPlaying = () => {
      if (holding.current || playbackRef.current === 'ended') return;
      window.clearTimeout(arm);
      allowReveal();
      if (playbackRef.current !== 'playing') setMode('playing');
    };

    const holdLastFrame = (duration: number, rewind: boolean) => {
      if (holding.current) return;
      holding.current = true;
      armed.current = false;
      window.clearTimeout(arm);
      if (rewind && duration > END_HOLD_SECONDS) post(iframe, 'setCurrentTime', duration - END_HOLD_SECONDS);
      post(iframe, 'pause');
      setMode('ended');
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== PLAYER || event.source !== iframe.contentWindow) return;
      const raw = event.data;
      let data: VimeoMessage | null = null;
      if (typeof raw === 'string') {
        try {
          data = JSON.parse(raw) as VimeoMessage;
        } catch {
          return;
        }
      } else if (raw && typeof raw === 'object') {
        data = raw as VimeoMessage;
      }
      const name = data?.event;
      if (!name || !data) return;
      if (name === 'ready') {
        for (const eventName of ['timeupdate', 'playProgress', 'ended', 'finish', 'play', 'playing', 'loaded']) {
          post(iframe, 'addEventListener', eventName);
        }
        post(iframe, 'play');
        window.clearTimeout(arm);
        arm = window.setTimeout(() => {
          if (holding.current || playbackRef.current === 'playing' || playbackRef.current === 'ended') return;
          setMode('blocked');
          allowReveal();
        }, READY_FALLBACK_MS);
      }
      if (name === 'play' || name === 'playing') {
        if (holding.current) {
          post(iframe, 'pause');
          return;
        }
        sawPlay = true;
        if (name === 'playing') markPlaying();
      }
      if (name === 'loaded' && sawPlay) allowReveal();
      if (name === 'timeupdate' || name === 'playProgress') {
        const seconds = clockValue(data.data?.seconds);
        const duration = clockValue(data.data?.duration);
        if (seconds === null || duration === null || duration <= 0) return;
        durationRef.current = duration;
        if (!holding.current && seconds > 0) markPlaying();
        else if (!holding.current && sawPlay) allowReveal();
        if (seconds < duration - 1) armed.current = true;
        if (!armed.current || holding.current) return;
        if (duration - seconds <= END_HOLD_SECONDS) holdLastFrame(duration, false);
      }
      if (name === 'ended' || name === 'finish') {
        const duration = clockValue(data.data?.duration) ?? durationRef.current;
        holdLastFrame(duration, true);
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  const play = () => {
    const iframe = iframeRef.current;
    holding.current = false;
    armed.current = false;
    post(iframe, 'setCurrentTime', 0);
    post(iframe, 'play');
    setMode('playing');
  };

  const height = (width * VIDEO_H) / VIDEO_W;

  return (
    <div
      className={clsx(
        'disc-video',
        'hs-video',
        playback === 'ended' && 'is-ended',
        playback === 'blocked' && 'is-blocked',
      )}
      style={{aspectRatio: `${VIDEO_W} / ${VIDEO_H}`, width, height}}
    >
      <iframe
        ref={iframeRef}
        src={EMBED}
        title="Horizon Scanning"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {playback === 'ended' || playback === 'blocked' ? <PlayButton onClick={play} /> : null}
    </div>
  );
}

function useFittedVideoWidth() {
  const centerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1064);

  useLayoutEffect(() => {
    const center = centerRef.current;
    const head = headRef.current;
    if (!center || !head) return;

    const update = () => {
      if (center.clientWidth < 40 || center.clientHeight < 40) return;
      const available = center.clientHeight - head.offsetHeight - VIDEO_GAP;
      const byHeight = (available * VIDEO_W) / VIDEO_H;
      const byWidth = Math.min(VIDEO_MAX_W, center.clientWidth);
      const next = Math.max(0, Math.min(byWidth, byHeight));
      setWidth((current) => (Math.abs(current - next) < 0.5 ? current : next));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(center);
    observer.observe(head);
    return () => observer.disconnect();
  }, []);

  return {centerRef, headRef, width};
}

export function HorizonWalkthrough({onClose}: {onClose: () => void}): ReactElement {
  const {ref, scale} = useDialogScale();
  const {centerRef, headRef, width} = useFittedVideoWidth();
  const [holdDone, setHoldDone] = useState(() => reducedMotion());
  const [frameReady, setFrameReady] = useState(false);
  const [actionsOn, setActionsOn] = useState(false);
  const videoOn = holdDone && frameReady;

  useEffect(() => {
    if (holdDone) return;
    const timer = window.setTimeout(() => setHoldDone(true), VIDEO_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [holdDone]);

  useEffect(() => {
    if (!videoOn) return;
    if (reducedMotion()) {
      setActionsOn(true);
      return;
    }
    const timer = window.setTimeout(() => setActionsOn(true), VIDEO_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [videoOn]);

  const timing = {
    '--v2-surface-ms': `${SURFACE_MS}ms`,
    '--v2-badge-delay': `${TEXT_BADGE_DELAY_MS}ms`,
    '--v2-badge-ms': `${LINE_MS}ms`,
    '--v2-title-delay': `${TEXT_TITLE_DELAY_MS}ms`,
    '--v2-title-ms': `${LINE_MS}ms`,
    '--v2-sub-delay': `${TEXT_SUB_DELAY_MS}ms`,
    '--v2-sub-ms': `${LINE_MS}ms`,
    '--v2-reveal-ms': `${VIDEO_REVEAL_MS}ms`,
  } as CSSProperties;

  return (
    <div className="disc-scrim" role="presentation" ref={ref}>
      <div
        className="disc-dialog disc-v2-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hs-dialog-title"
        style={timing}
      >
        <div className="disc-v2-fit" style={{width: DIALOG_W * scale, height: DIALOG_H * scale}}>
          <div
            className="disc-v2-canvas"
            style={{width: DIALOG_W, height: DIALOG_H, transform: `scale(${scale})`, transformOrigin: 'top left'}}
          >
            <div className="disc-v2-stage hs-stage">
              <div className="hs-column">
                <div className="hs-center" ref={centerRef}>
                  <div className="disc-dialog__head" ref={headRef}>
                    <p className="disc-eyebrow disc-v2-piece disc-v2-piece--badge">
                      <Glyph src={`${V1}/sparkles.svg`} width={16} height={16} />
                      What’s new
                    </p>
                    <h2 id="hs-dialog-title" className="disc-v2-piece disc-v2-piece--title">
                      Meet Horizon Scanning
                    </h2>
                    <p className="disc-v2-piece disc-v2-piece--sub">
                      A standing watch over the changes that matter to your business.
                    </p>
                  </div>
                  <div className={videoOn ? 'disc-v2-reveal is-on' : 'disc-v2-reveal'} aria-hidden={videoOn ? undefined : true}>
                    <div className="disc-v2-reveal__clip">
                      <HorizonVideo onReveal={() => setFrameReady(true)} width={width} />
                    </div>
                  </div>
                </div>
                <div className={actionsOn ? 'hs-actions is-on' : 'hs-actions'} aria-hidden={actionsOn ? undefined : true}>
                  <button className="hs-later" type="button" onClick={onClose}>
                    Maybe later
                  </button>
                  <button className="disc-gotit" type="button" onClick={onClose}>
                    Set up a scan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button className="hs-close" type="button" aria-label="Close" onClick={onClose}>
          <img src="/assistant/opp-x.svg" alt="" width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

export default function HorizonScanningPage(): ReactElement {
  const [draft, setDraft] = useState('');
  const [walkthrough, setWalkthrough] = useState(false);
  const canSend = draft.trim().length > 0;

  useEffect(() => {
    if (!walkthrough) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setWalkthrough(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [walkthrough]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <div className="proto-card assist disc-v1 disc-v2 hs">
      <div className="assist__toolbar">
        <div className="assist__toolbar-end">
          <button className="assist-ghost" type="button">
            <Glyph src={`${ASSET}/history.svg`} width={16} height={16} />
            History
          </button>
        </div>
      </div>

      <div className="assist__scroll">
        <div className="assist__column">
          <h1 className="assist__greeting">Ready when you are, Morgan.</h1>

          <form className={canSend ? 'assist-composer is-active' : 'assist-composer'} onSubmit={onSubmit}>
            <textarea
              className="assist-composer__input"
              rows={3}
              placeholder="Ask anything..."
              aria-label="Ask anything"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="assist-composer__actions">
              <IconButton src={`${ASSET}/plus.svg`} label="Add" />
              <div className="assist-composer__tools">
                <button className="assist-ghost assist-ghost--tool" type="button">
                  <Glyph src={`${ASSET}/lightbulb.svg`} width={16} height={16} />
                  Thinking
                  <Glyph src={`${ASSET}/chevron-down.svg`} width={16} height={16} />
                </button>
                <IconButton src={`${ASSET}/library.svg`} label="Prompt library" />
                <IconButton src={`${ASSET}/wand.svg`} label="Improve prompt" />
                <IconButton src={`${ASSET}/mic.svg`} label="Voice" />
                <button className="assist-send" type="submit" disabled={!canSend} aria-label="Send">
                  <Glyph src={`${ASSET}/arrow-up.svg`} width={16} height={16} />
                </button>
              </div>
            </div>
          </form>

          {walkthrough ? null : <DiscoverStack onOpen={() => setWalkthrough(true)} />}

          <section className="assist-block" aria-label="Agents">
            <div className="assist-block__head">
              <h2>Agents</h2>
              <p>Get started with Agents on Eudia</p>
            </div>
            <div className="assist-list">
              {AGENTS.map((agent) => (
                <div className="assist-list__row" key={agent.name}>
                  <Glyph src={agent.icon} width={16} height={16} />
                  <span className="assist-list__name">{agent.name}</span>
                  <span className="assist-list__desc">{agent.description}</span>
                </div>
              ))}
            </div>
            <button className="assist-see-all" type="button">
              See all
            </button>
          </section>

          <section className="assist-block" aria-label="Recent agent outputs">
            <h2 className="assist-block__title">Recent agent outputs</h2>
            <div className="assist-table">
              {OUTPUTS.map((row) => (
                <div className="assist-table__row" key={row.name}>
                  <Glyph src={row.icon} width={16} height={16} />
                  <span className="assist-table__name">{row.name}</span>
                  <span className="assist-table__owner">{row.owner}</span>
                  <span className="assist-table__status">
                    <Glyph src={row.statusIcon} width={14} height={14} />
                    {row.status}
                  </span>
                  <span className="assist-table__when">{row.when}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {walkthrough ? <HorizonWalkthrough onClose={() => setWalkthrough(false)} /> : null}
    </div>
  );
}
