import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent, type ReactElement, type ReactNode} from 'react';
import UpdateDialog from './UpdateDialog';

const ASSET = '/assistant';

type DiscoverFeature = 'opportunities' | 'compliance' | 'projects';

const DISCOVER: Array<{
  id: DiscoverFeature;
  title: string;
  description: string;
  icon: string;
  iconWidth: number;
  iconHeight: number;
  place: 'left' | 'center' | 'right';
}> = [
  {
    id: 'opportunities',
    title: 'Opportunities',
    description: 'Find contracts that fit your business.',
    icon: `${ASSET}/telescope.svg`,
    iconWidth: 36,
    iconHeight: 36,
    place: 'left',
  },
  {
    id: 'compliance',
    title: 'Marketing Compliance',
    description: 'Check content against your rules before it ships.',
    icon: `${ASSET}/compliance.svg`,
    iconWidth: 36,
    iconHeight: 36,
    place: 'center',
  },
  {
    id: 'projects',
    title: 'Projects',
    description: 'Keep a matter’s files, chats, and team together.',
    icon: `${ASSET}/layout-list.svg`,
    iconWidth: 28.9985,
    iconHeight: 28.9971,
    place: 'right',
  },
];

const AGENTS = [
  {
    name: 'Redact PII',
    description: 'Redact sensitive information from documents.',
    icon: `${ASSET}/file-lock.svg`,
    width: 16,
    height: 16,
  },
  {
    name: 'Argument Analysis',
    description: 'Analyzes argument evolution and inconsistencies.',
    icon: `${ASSET}/circle-help.svg`,
    width: 16,
    height: 16,
  },
  {
    name: 'Case Analysis',
    description: 'Comprehensive analysis of case documents and themes.',
    icon: `${ASSET}/briefcase.svg`,
    width: 16,
    height: 16,
  },
  {
    name: 'Compare',
    description: 'Compare and highlight differences between documents.',
    icon: `${ASSET}/git-compare.svg`,
    width: 16,
    height: 16,
  },
  {
    name: 'Witness Analysis',
    description: 'Analyze testimonies and depositions for inconsistencies.',
    icon: `${ASSET}/circle-user.svg`,
    width: 16,
    height: 16,
  },
];

const OUTPUTS = [
  {
    name: 'Generate Report',
    owner: 'Me',
    status: 'In progress',
    when: '2 days ago',
    icon: `${ASSET}/pencil-ruler.svg`,
    iconWidth: 16,
    iconHeight: 16,
    statusIcon: `${ASSET}/loader.svg`,
    statusWidth: 14,
    statusHeight: 14,
  },
  {
    name: 'Translate',
    owner: 'sam.rivera@eudia.com',
    status: 'Completed',
    when: 'Jan 6, 2025',
    icon: `${ASSET}/languages.svg`,
    iconWidth: 16,
    iconHeight: 16,
    statusIcon: `${ASSET}/circle-check.svg`,
    statusWidth: 14,
    statusHeight: 14,
  },
  {
    name: 'Argument Analysis',
    owner: 'cameron.reed@eudia.com',
    status: 'Completed',
    when: 'Jan 6, 2025',
    icon: `${ASSET}/sheet.svg`,
    iconWidth: 16,
    iconHeight: 16,
    statusIcon: `${ASSET}/circle-check.svg`,
    statusWidth: 14,
    statusHeight: 14,
  },
];

const BURST_X = 110;
const BURST_Y = 70;

const SPARKLES: Array<{d: string; fill: string; x: number; y: number}> = [
  {
    d: 'M54 32L55.5839 38.4161L62 40L55.5839 41.5839L54 48L52.4161 41.5839L46 40L52.4161 38.4161L54 32Z',
    fill: '#2B75BD',
    x: 54,
    y: 40,
  },
  {
    d: 'M165.5 26L166.589 30.4111L171 31.5L166.589 32.5889L165.5 37L164.411 32.5889L160 31.5L164.411 30.4111L165.5 26Z',
    fill: '#1366B6',
    x: 165.5,
    y: 31.5,
  },
  {
    d: 'M38.5 84L39.391 87.609L43 88.5L39.391 89.391L38.5 93L37.609 89.391L34 88.5L37.609 87.609L38.5 84Z',
    fill: '#BBD1EA',
    x: 38.5,
    y: 88.5,
  },
  {
    d: 'M177 80L178.782 87.2181L186 89L178.782 90.7819L177 98L175.218 90.7819L168 89L175.218 87.2181L177 80Z',
    fill: '#2B75BD',
    x: 177,
    y: 89,
  },
  {
    d: 'M121.5 12L122.193 14.807L125 15.5L122.193 16.193L121.5 19L120.807 16.193L118 15.5L120.807 14.807L121.5 12Z',
    fill: '#BBD1EA',
    x: 121.5,
    y: 15.5,
  },
  {
    d: 'M73.5 108L74.193 110.807L77 111.5L74.193 112.193L73.5 115L72.807 112.193L70 111.5L72.807 110.807L73.5 108Z',
    fill: '#1366B6',
    x: 73.5,
    y: 111.5,
  },
  {
    d: 'M151 110L151.99 114.01L156 115L151.99 115.99L151 120L150.01 115.99L146 115L150.01 114.01L151 110Z',
    fill: '#BBD1EA',
    x: 151,
    y: 115,
  },
  {
    d: 'M25 54L25.594 56.406L28 57L25.594 57.594L25 60L24.406 57.594L22 57L24.406 56.406L25 54Z',
    fill: '#1366B6',
    x: 25,
    y: 57,
  },
  {
    d: 'M199 54L199.594 56.406L202 57L199.594 57.594L199 60L198.406 57.594L196 57L198.406 56.406L199 54Z',
    fill: '#BBD1EA',
    x: 199,
    y: 57,
  },
];

const SPARK_DOTS: Array<{cx: number; cy: number; r: number}> = [
  {cx: 61.5, cy: 61.5, r: 1.5},
  {cx: 151.5, cy: 57.5, r: 1.5},
  {cx: 101.25, cy: 119.25, r: 1.25},
  {cx: 185.25, cy: 107.25, r: 1.25},
  {cx: 13, cy: 101, r: 1},
];

function burstStyle(x: number, y: number): CSSProperties {
  const dx = x - BURST_X;
  const dy = y - BURST_Y;
  // Higher stars leave first. Lower ones trail, as if the barrel is pulling them up.
  const height = Math.min(1, Math.max(0, (y - 12) / 108));
  const drift = ((Math.round(Math.abs(dx)) % 5) - 2) * 8;
  const lag = Math.max(0, Math.round(height * 80 + drift));
  const drag = Math.max(0, Math.round(height * 70 + drift));
  return {
    '--vx': `${dx}px`,
    '--vy': `${dy}px`,
    '--star-lag': `${lag}ms`,
    '--drag': `${drag}ms`,
  } as CSSProperties;
}

function Burst({x, y, children}: {x: number; y: number; children: ReactNode}): ReactElement {
  return (
    <g className="opp-star" style={burstStyle(x, y)}>
      {children}
    </g>
  );
}

function OpportunitiesMark(): ReactElement {
  return (
    <svg
      className="opp-welcome__mark"
      width="220"
      height="140"
      viewBox="0 0 220 140"
      fill="none"
      overflow="visible"
      aria-hidden="true"
    >
      <circle className="opp-welcome__glow" cx="110" cy="70" r="70" fill="url(#opp-glow)" />
      <g className="opp-welcome__scope">
        <g className="opp-welcome__stand">
          <path
            d="M116 83.5001L111.343 74.1851M104 83.5001L108.657 74.1851M113 71.5C113 73.1569 111.657 74.5 110 74.5C108.343 74.5 107 73.1569 107 71.5C107 69.8431 108.343 68.5 110 68.5C111.657 68.5 113 69.8431 113 71.5Z"
            stroke="url(#opp-telescope)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g className="opp-welcome__barrel">
          <path
            d="M107.097 70.7394L97.8274 72.7164C97.4675 72.7944 97.0914 72.7277 96.7804 72.5307C96.4694 72.3336 96.2484 72.0221 96.1654 71.6634L95.3599 68.4384C95.2652 68.0498 95.3189 67.6399 95.5107 67.2889C95.7024 66.9379 96.0182 66.6711 96.3964 66.5409L116.652 59.8809M112.34 69.6205L118.838 68.2345M101.237 64.9496L102.908 71.6336M116.727 60.9102C116.535 60.1384 116.656 59.3216 117.065 58.6395C117.475 57.9574 118.138 57.4657 118.91 57.2727L120.545 56.8647C120.931 56.7685 121.339 56.8293 121.68 57.0337C122.02 57.2382 122.266 57.5696 122.363 57.9552L124.635 67.0452C124.732 67.4311 124.671 67.8395 124.467 68.1808C124.262 68.522 123.931 68.768 123.545 68.8647L121.91 69.2727C121.138 69.4655 120.321 69.3439 119.639 68.9346C118.957 68.5253 118.465 67.8619 118.272 67.0902L116.727 60.9102Z"
            stroke="url(#opp-telescope)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
      {SPARKLES.map((spark) => (
        <Burst key={spark.d} x={spark.x} y={spark.y}>
          <path d={spark.d} fill={spark.fill} />
        </Burst>
      ))}
      {SPARK_DOTS.map((dot) => (
        <Burst key={`${dot.cx}-${dot.cy}`} x={dot.cx} y={dot.cy}>
          <circle cx={dot.cx} cy={dot.cy} r={dot.r} fill="#BBD1EA" />
        </Burst>
      ))}
      <defs>
        <radialGradient id="opp-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(110 70) scale(70)">
          <stop stopColor="#BBD1EA" stopOpacity="0.55" />
          <stop offset="1" stopColor="#BBD1EA" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="opp-telescope" x1="124.68" y1="58.7534" x2="97.9306" y2="86.0628" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1366B6" />
          <stop offset="1" stopColor="#0A335B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const CHOICES = [
  {
    title: 'Thermal Protection Systems for Reentry Vehicles',
    meta: 'Sample · AFRL',
    icon: `${ASSET}/opp-rocket.svg`,
  },
  {
    title: 'Cloud Migration Support Services',
    meta: 'Sample · DHS',
    icon: `${ASSET}/opp-cloud.svg`,
  },
  {
    title: 'Medical Center Facility Maintenance',
    meta: 'Sample · VA',
    icon: `${ASSET}/opp-hospital.svg`,
  },
];

const PROPOSAL_LINES = ['100%', '526px', '543px', '336px', null, '100%', '504px', '532px'] as const;

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** Barrel tilt length. The tag starts after it; words start after the tag finishes. */
const TILT_MS = 480;
const EYEBROW_AFTER_TILT_MS = 80;
const WORD_MS = 320;
const WORD_STAGGER_MS = 70;
/** Pause after the last headline word finishes, before the subtext. */
const HOLD_AFTER_HEADLINE_MS = 700;
const LINE_MS = 360;
const LINE_STAGGER_MS = 140;
/** Pause after the last subtext line finishes, before the tiles. */
const HOLD_AFTER_SUBTEXT_MS = 700;
const TILE_MS = 520;
const TILE_STAGGER_MS = 140;

const HEADLINE_WORDS = ['Welcome', 'to', 'Opportunities'] as const;
const SUBTEXT_LINES = [
  'Pick a sample contract and see how Eudia matches',
  'it to your business and drafts the proposal.',
] as const;

const eyebrowStartMs = TILT_MS + EYEBROW_AFTER_TILT_MS;
const wordsStartMs = eyebrowStartMs + WORD_MS;
const lastWordStartMs = wordsStartMs + (HEADLINE_WORDS.length - 1) * WORD_STAGGER_MS;
const linesStartMs = lastWordStartMs + WORD_MS + HOLD_AFTER_HEADLINE_MS;
const lastLineStartMs = linesStartMs + (SUBTEXT_LINES.length - 1) * LINE_STAGGER_MS;
const tilesStartMs = lastLineStartMs + LINE_MS + HOLD_AFTER_SUBTEXT_MS;

/** Assistant #2: stars are in when the barrel settles, then they follow the rise closely. */
const ALT_EYEBROW_MS = 1880;
const ALT_WORDS_MS = 2200;
const ALT_LINES_MS = 2480;
const ALT_TILES_MS = 3480;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function SampleChoice({
  choice,
  selected,
  staticCard,
  chosen,
  onClick,
}: {
  choice: (typeof CHOICES)[number];
  selected?: boolean;
  staticCard?: boolean;
  chosen?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}): ReactElement {
  const className = [
    'opp-choice',
    selected ? 'is-selected' : '',
    staticCard ? 'is-static' : '',
    chosen ? 'is-chosen' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const body = (
    <>
      <span className="opp-choice__top">
        <Glyph src={choice.icon} width={16} height={16} />
        <span className="opp-choice__title">{choice.title}</span>
      </span>
      <span className="opp-choice__meta">{choice.meta}</span>
    </>
  );
  if (staticCard) return <div className={className}>{body}</div>;
  return (
    <button className={className} type="button" onClick={onClick}>
      {body}
    </button>
  );
}

function OpportunitiesWelcome({
  onExit,
  onFind,
  alt = false,
}: {
  onExit: () => void;
  onFind?: () => void;
  alt?: boolean;
}): ReactElement {
  const [choicesOn, setChoicesOn] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [chatOn, setChatOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const originRef = useRef<DOMRect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setChoicesOn(true);
      return () => {
        if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      };
    }
    const openTimer = window.setTimeout(() => setChoicesOn(true), alt ? ALT_TILES_MS : tilesStartMs);
    return () => {
      window.clearTimeout(openTimer);
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    };
  }, [alt]);

  const onChoose = (event: MouseEvent<HTMLButtonElement>) => {
    if (leaving || chatOn) return;
    originRef.current = event.currentTarget.getBoundingClientRect();
    if (prefersReducedMotion()) {
      setChatOn(true);
      return;
    }
    setLeaving(true);
    leaveTimer.current = window.setTimeout(() => setChatOn(true), 250);
  };

  const onAgain = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    setChatOn(false);
    setLeaving(false);
    setBeat(0);
    originRef.current = null;
  };

  useLayoutEffect(() => {
    if (!chatOn) return;
    if (prefersReducedMotion()) {
      setBeat(3);
      threadRef.current?.focus({preventScroll: true});
      return;
    }
    const bubble = bubbleRef.current;
    const origin = originRef.current;
    let settle: Animation | undefined;
    if (bubble && origin) {
      const next = bubble.getBoundingClientRect();
      const dx = origin.left + origin.width / 2 - (next.left + next.width / 2);
      const dy = origin.top + origin.height / 2 - (next.top + next.height / 2);
      settle = bubble.animate(
        [{transform: `translate(${dx}px, ${dy}px)`}, {transform: 'translate(0, 0)'}],
        {duration: 420, easing: EASE, fill: 'both'},
      );
    }
    threadRef.current?.focus({preventScroll: true});
    const timers = [700, 1350, 2000].map((delay, index) =>
      window.setTimeout(() => setBeat(index + 1), delay),
    );
    return () => {
      settle?.cancel();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [chatOn]);

  useEffect(() => {
    if (!chatOn || beat < 1) return;
    const node = threadRef.current?.querySelector<HTMLElement>(`[data-beat="${beat}"]`);
    node?.scrollIntoView({block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
  }, [beat, chatOn]);

  const first = CHOICES[0];

  return (
    <div
      className="opp-welcome"
      style={
        {
          '--opp-eyebrow-start': `${alt ? ALT_EYEBROW_MS : eyebrowStartMs}ms`,
          '--opp-words-start': `${alt ? ALT_WORDS_MS : wordsStartMs}ms`,
          '--opp-word-ms': `${WORD_MS}ms`,
          '--opp-word-stagger': `${WORD_STAGGER_MS}ms`,
          '--opp-lines-start': `${alt ? ALT_LINES_MS : linesStartMs}ms`,
          '--opp-line-ms': `${LINE_MS}ms`,
          '--opp-line-stagger': `${LINE_STAGGER_MS}ms`,
          '--opp-tiles-start': `${alt ? ALT_TILES_MS : tilesStartMs}ms`,
          '--opp-tile-ms': `${TILE_MS}ms`,
          '--opp-tile-stagger': `${TILE_STAGGER_MS}ms`,
        } as CSSProperties
      }
    >
      <img className="opp-welcome__bg" src={`${ASSET}/eudia-bg-light.jpg`} alt="" />
      <div className="opp-welcome__veil" />
      <div className="opp-welcome__bar">
        {chatOn ? (
          <div className="opp-crumb">
            <Glyph src={`${ASSET}/opp-telescope-nav.svg`} width={16} height={16} />
            <span className="opp-crumb__brand">Opportunities</span>
            <span className="opp-crumb__step">Walkthrough</span>
          </div>
        ) : (
          <span />
        )}
        <button className="assist-ghost" type="button" onClick={onExit}>
          <Glyph src={`${ASSET}/opp-x.svg`} width={16} height={16} />
          Exit
        </button>
      </div>
      <div className={`opp-welcome__stage${choicesOn ? ' is-open' : ''}${chatOn ? ' is-chat' : ''}`}>
        <div className={`opp-welcome__pane${leaving && !chatOn ? ' is-leaving' : ''}`} aria-hidden={chatOn || undefined}>
          <div className="opp-welcome__hero">
            <OpportunitiesMark />
            <div className="opp-welcome__copy">
              <p className="opp-welcome__eyebrow">New in Eudia</p>
              <h1 className="opp-welcome__title">
                {HEADLINE_WORDS.map((word, index) => (
                  <span key={word} className="opp-welcome__word">
                    {index < HEADLINE_WORDS.length - 1 ? `${word} ` : word}
                  </span>
                ))}
              </h1>
              <p className="opp-welcome__sub">
                {SUBTEXT_LINES.map((line) => (
                  <span key={line} className="opp-welcome__line">
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <div className="opp-welcome__choices" inert={choicesOn ? undefined : true}>
            <div className="opp-welcome__choices-row">
              {CHOICES.map((choice, index) => (
                <SampleChoice
                  key={choice.title}
                  choice={choice}
                  chosen={leaving && index === 0}
                  onClick={index === 0 ? onChoose : undefined}
                />
              ))}
            </div>
          </div>
        </div>
        {chatOn ? (
          <div className="opp-chat">
            <div className="opp-thread" ref={threadRef} role="log" aria-live="polite" tabIndex={-1}>
              <div className="opp-msg opp-chat__recap">
                <span className="opp-msg__avatar">
                  <Glyph src={`${ASSET}/eudia-mark.svg`} width={16} height={16} />
                </span>
                <div className="opp-msg__body">
                  <p className="opp-msg__text">Eudia finds contracts that fit your business. Pick an example.</p>
                  <div className="opp-welcome__choices-row">
                    {CHOICES.map((choice, index) => (
                      <SampleChoice key={choice.title} choice={choice} staticCard selected={index === 0} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="opp-user">
                <div className="opp-user__bubble" ref={bubbleRef}>
                  {first.title}
                </div>
              </div>
              {beat >= 1 ? (
                <div className="opp-msg opp-beat" data-beat="1">
                  <span className="opp-msg__avatar">
                    <Glyph src={`${ASSET}/eudia-mark.svg`} width={16} height={16} />
                  </span>
                  <div className="opp-msg__body">
                    <div className="opp-follow">
                      <p className="opp-msg__text">Here&apos;s the opportunity and a draft proposal.</p>
                      <article className="opp-opportunity">
                        <header className="opp-opportunity__head">
                          <p className="opp-opportunity__label">
                            <Glyph src={`${ASSET}/opp-telescope-label.svg`} width={16} height={16} />
                            <span>Opportunities</span>
                          </p>
                          <h2>{first.title}</h2>
                        </header>
                        <div className="opp-opportunity__stats">
                          <div>
                            <p>Due</p>
                            <strong>Nov 14, 2026</strong>
                          </div>
                          <div>
                            <p>Est. value</p>
                            <strong>$2.4M</strong>
                          </div>
                        </div>
                        <div className="opp-opportunity__match">
                          <p>AFRL · Aerospace Systems Directorate</p>
                          <p>Matches your Thermal Protection offering</p>
                        </div>
                      </article>
                    </div>
                    {beat >= 2 ? (
                      <article className="opp-proposal opp-beat" data-beat="2">
                        <header className="opp-proposal__head">Proposal draft</header>
                        <div className="opp-proposal__doc">
                          <h2>{first.title}</h2>
                          <h3>1. Introduction</h3>
                          <p>
                            Our team proposes a lightweight thermal protection system that keeps reentry vehicles
                            within safe temperature limits, built on our flight-tested materials.
                          </p>
                          <div className="opp-proposal__lines">
                            {PROPOSAL_LINES.map((width, index) =>
                              width ? (
                                <span key={`${width}-${index}`} style={{width}} />
                              ) : (
                                <span key={`gap-${index}`} className="opp-proposal__gap" />
                              ),
                            )}
                          </div>
                        </div>
                        <div className="opp-proposal__fade" />
                      </article>
                    ) : null}
                    {beat >= 3 ? (
                      <div className="opp-chips opp-beat" data-beat="3">
                        <button type="button" onClick={onFind}>
                          Find opportunities
                        </button>
                        <button type="button" onClick={onAgain}>
                          Try another example
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            <form className="opp-composer" onSubmit={(event) => event.preventDefault()}>
              <button className="opp-composer__plus" type="button" aria-label="Add">
                <Glyph src={`${ASSET}/plus.svg`} width={16} height={16} />
              </button>
              <input
                className="opp-composer__input"
                placeholder="Ask anything about Opportunities"
                aria-label="Ask anything about Opportunities"
              />
              <button className="opp-composer__send" type="submit" disabled aria-label="Send">
                <Glyph src={`${ASSET}/arrow-up.svg`} width={16} height={16} />
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Glyph({src, width, height}: {src: string; width: number; height: number}) {
  return <img src={src} alt="" width={width} height={height} />;
}

function IconButton({src, label}: {src: string; label: string}) {
  return (
    <button className="assist-icon-btn" type="button" aria-label={label}>
      <Glyph src={src} width={16} height={16} />
    </button>
  );
}

export default function AssistantPage({
  updateDialog = false,
  frameShrink = false,
  alt = false,
  onFind,
}: {
  updateDialog?: boolean;
  frameShrink?: boolean;
  alt?: boolean;
  onFind?: () => void;
}): ReactElement {
  const testDialog = updateDialog || frameShrink;
  const [draft, setDraft] = useState('');
  const [exploreOpen, setExploreOpen] = useState(!testDialog);
  const [feature, setFeature] = useState<'opportunities' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(testDialog);
  const [receiving, setReceiving] = useState(false);
  const sparkleRef = useRef<HTMLButtonElement>(null);
  const canSend = draft.trim().length > 0;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  const shell = ['proto-card', 'assist', testDialog ? 'assist--update' : '', alt ? 'assist--alt' : '']
    .filter(Boolean)
    .join(' ');

  if (feature === 'opportunities') {
    return (
      <div className={shell}>
        <OpportunitiesWelcome alt={alt} onExit={() => setFeature(null)} onFind={onFind} />
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="assist__toolbar">
        <div className={testDialog ? 'assist__toolbar-end assist__toolbar-end--update' : 'assist__toolbar-end'}>
          {testDialog ? (
            <button
              ref={sparkleRef}
              className={receiving ? 'assist-update-btn is-receiving' : 'assist-update-btn'}
              type="button"
              aria-label="What’s new"
              onClick={() => setDialogOpen(true)}
              onAnimationEnd={() => setReceiving(false)}
            >
              <img src={`${ASSET}/dialog-sparkle.svg`} alt="" width={16} height={16} />
            </button>
          ) : exploreOpen ? null : (
            <button className="assist-ghost assist-whats-new" type="button" onClick={() => setExploreOpen(true)}>
              <span className="assist-whats-new__icon">
                <Glyph src={`${ASSET}/sparkle.svg`} width={16} height={16} />
                <img
                  className="assist-whats-new__dot"
                  src={`${ASSET}/unexplored-dot.svg`}
                  alt=""
                  width={11}
                  height={11}
                />
              </span>
              What’s new
            </button>
          )}
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

          {testDialog ? null : (
          <div className={exploreOpen ? 'assist-explore-slot' : 'assist-explore-slot is-closed'}>
            <section className="assist-explore" aria-label="Explore Eudia" inert={!exploreOpen}>
              <div className="assist-explore__head">
                <h2>Explore Eudia</h2>
                <p>See what you can do with Eudia</p>
                <button
                  className="assist-explore__close"
                  type="button"
                  aria-label="Hide Explore Eudia"
                  onClick={() => setExploreOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.33"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="assist-stack">
                {DISCOVER.map((card) => (
                  <button
                    key={card.id}
                    className={`assist-card assist-card--${card.place}`}
                    type="button"
                    onClick={card.id === 'opportunities' ? () => setFeature('opportunities') : undefined}
                  >
                    <span className="assist-card__banner">
                      <img className="assist-card__wash" src={`${ASSET}/card-banner.png`} alt="" />
                      <span className="assist-card__thumb">
                        <Glyph src={card.icon} width={card.iconWidth} height={card.iconHeight} />
                      </span>
                    </span>
                    <span className="assist-card__copy">
                      <span className="assist-card__title">{card.title}</span>
                      <span className="assist-card__desc">{card.description}</span>
                    </span>
                    <span className="assist-card__shade" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          </div>
          )}

          <section className="assist-block" aria-label="Agents">
            <div className="assist-block__head">
              <h2>Agents</h2>
              <p>Get started with Agents on Eudia</p>
            </div>
            <div className="assist-list">
              {AGENTS.map((agent) => (
                <div className="assist-list__row" key={agent.name}>
                  <Glyph src={agent.icon} width={agent.width} height={agent.height} />
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
                  <Glyph src={row.icon} width={row.iconWidth} height={row.iconHeight} />
                  <span className="assist-table__name">{row.name}</span>
                  <span className="assist-table__owner">{row.owner}</span>
                  <span className="assist-table__status">
                    <Glyph src={row.statusIcon} width={row.statusWidth} height={row.statusHeight} />
                    {row.status}
                  </span>
                  <span className="assist-table__when">{row.when}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {testDialog && dialogOpen ? (
        <UpdateDialog
          variant={frameShrink ? 'frame' : 'genie'}
          targetRef={sparkleRef}
          onArrive={() => setReceiving(true)}
          onDismissed={() => setDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}
