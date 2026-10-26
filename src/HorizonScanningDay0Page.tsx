import {useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement} from 'react';
import {HorizonCardStack, HorizonWalkthrough} from './HorizonScanningPage';

/** Calendar day cells, in the 31.1306 × 30.0693 illustration space. */
const CAL_SQUARES = [
  [4.18172, 10.1046],
  [12.6039, 10.1046],
  [21.026, 10.1046],
  [4.18172, 15.8465],
  [12.6039, 15.8465],
  [21.026, 15.8465],
  [4.18172, 21.5933],
  [12.6039, 21.5933],
  [21.026, 21.5933],
] as const;

/** Same star field as Assistant #2 (220×140, burst at 110, 70). */
const STAR_X = 110;
const STAR_Y = 70;

const DAY0_STARS: Array<{d: string; fill: string; x: number; y: number}> = [
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

const DAY0_STAR_DOTS: Array<{cx: number; cy: number; r: number}> = [
  {cx: 61.5, cy: 61.5, r: 1.5},
  {cx: 151.5, cy: 57.5, r: 1.5},
  {cx: 101.25, cy: 119.25, r: 1.25},
  {cx: 185.25, cy: 107.25, r: 1.25},
  {cx: 13, cy: 101, r: 1},
];

function starStyle(x: number, y: number): CSSProperties {
  const dx = x - STAR_X;
  const dy = y - STAR_Y;
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

function Day0Stars(): ReactElement {
  return (
    <svg
      className="hs-day0-stars"
      width="220"
      height="140"
      viewBox="0 0 220 140"
      fill="none"
      overflow="visible"
      aria-hidden="true"
    >
      {DAY0_STARS.map((spark) => (
        <g key={spark.d} className="opp-star" style={starStyle(spark.x, spark.y)}>
          <path d={spark.d} fill={spark.fill} />
        </g>
      ))}
      {DAY0_STAR_DOTS.map((dot) => (
        <g key={`${dot.cx}-${dot.cy}`} className="opp-star" style={starStyle(dot.cx, dot.cy)}>
          <circle cx={dot.cx} cy={dot.cy} r={dot.r} fill="#BBD1EA" />
        </g>
      ))}
    </svg>
  );
}

function Day0Mark(): ReactElement {
  return (
    <span className="hs-day0-mark hs-day0-piece hs-day0-piece--badge" aria-hidden="true">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <g transform="translate(1.274 4.085) scale(1.7656)">
          <path
            d="M27.2032 1.73627H30.6366C30.9105 1.73627 31.1355 1.96125 31.1355 2.23514V29.5753C31.1355 29.8492 30.9105 30.0742 30.6366 30.0742H0.498872C0.224982 30.0742 0 29.8492 0 29.5753V2.23514C0 1.96125 0.224982 1.73627 0.498872 1.73627H3.93229"
            fill="#A1C2E2"
          />
          <path d="M28.9639 8.37812H2.16667V27.7265H28.9639V8.37812Z" fill="white" />
          <path d="M4.93981 0H4.73929C4.29359 0 3.93229 0.361306 3.93229 0.806999V3.8736C3.93229 4.31929 4.29359 4.6806 4.73929 4.6806H4.93981C5.38551 4.6806 5.74681 4.31929 5.74681 3.8736V0.806999C5.74681 0.361306 5.38551 0 4.93981 0Z" fill="#1366B6" />
          <path d="M10.3051 0H10.1046C9.65892 0 9.29761 0.361306 9.29761 0.806999V3.8736C9.29761 4.31929 9.65892 4.6806 10.1046 4.6806H10.3051C10.7508 4.6806 11.1121 4.31929 11.1121 3.8736V0.806999C11.1121 0.361306 10.7508 0 10.3051 0Z" fill="#1366B6" />
          <path d="M15.6656 0H15.465C15.0194 0 14.658 0.361306 14.658 0.806999V3.8736C14.658 4.31929 15.0194 4.6806 15.465 4.6806H15.6656C16.1113 4.6806 16.4726 4.31929 16.4726 3.8736V0.806999C16.4726 0.361306 16.1113 0 15.6656 0Z" fill="#1366B6" />
          <path d="M21.0309 0H20.8304C20.3847 0 20.0234 0.361306 20.0234 0.806999V3.8736C20.0234 4.31929 20.3847 4.6806 20.8304 4.6806H21.0309C21.4766 4.6806 21.8379 4.31929 21.8379 3.8736V0.806999C21.8379 0.361306 21.4766 0 21.0309 0Z" fill="#1366B6" />
          <path d="M26.3913 0H26.1908C25.7451 0 25.3838 0.361306 25.3838 0.806999V3.8736C25.3838 4.31929 25.7451 4.6806 26.1908 4.6806H26.3913C26.837 4.6806 27.1983 4.31929 27.1983 3.8736V0.806999C27.1983 0.361306 26.837 0 26.3913 0Z" fill="#1366B6" />
          <g className="hs-day0-squares">
            {CAL_SQUARES.map(([x, y]) => (
              <rect key={`${x}-${y}`} className="hs-day0-square" x={x} y={y} width="5.9229" height="4.4067" fill="#C8DFF4" />
            ))}
          </g>
        </g>
        <g transform="translate(36.029 30.6)">
          <g className="hs-day0-clock-face">
            <path d="M17.9781 35.9737C8.06408 35.9737 0 27.8917 0 17.9777C0 8.06369 8.06408 0 17.9781 0C27.892 0 35.9561 8.06369 35.9561 17.9777C35.9561 27.8917 27.892 35.9557 17.9781 35.9557V35.9737Z" fill="#1366B6" />
            <path d="M3.87932 19.7758C3.41236 19.7758 2.9454 19.5962 2.60415 19.255C2.28087 18.9137 2.08331 18.4647 2.08331 17.9798C2.08331 17.872 2.10127 17.7463 2.11923 17.6386C2.13719 17.5128 2.17311 17.4051 2.20903 17.2973C2.26291 17.1896 2.31679 17.0818 2.38863 16.992C2.44251 16.8842 2.53231 16.7944 2.60415 16.7226C3.01724 16.2915 3.64584 16.1119 4.22056 16.2197C4.34629 16.2556 4.45405 16.2915 4.56181 16.3275C4.66957 16.3813 4.77733 16.4352 4.86713 16.4891C4.97489 16.561 5.06469 16.6328 5.15449 16.7226C5.22633 16.7944 5.29817 16.8842 5.37001 16.992C5.44185 17.0818 5.49573 17.1896 5.53165 17.2973C5.58553 17.4051 5.62145 17.5128 5.63941 17.6386C5.65737 17.7463 5.67533 17.872 5.67533 17.9798C5.67533 18.2133 5.62145 18.4468 5.53165 18.6802C5.44185 18.8958 5.31613 19.0933 5.15449 19.255C5.06469 19.3448 4.97489 19.4166 4.86713 19.4885C4.77733 19.5423 4.66957 19.5962 4.56181 19.6501C4.45405 19.686 4.34629 19.7219 4.22056 19.7399C4.1128 19.7758 3.98708 19.7758 3.87932 19.7758Z" fill="#A1C2E2" />
            <path d="M32.0767 19.7746C31.8432 19.7746 31.6097 19.7387 31.3942 19.6489C31.1607 19.5591 30.9631 19.4154 30.8015 19.2538C30.4782 18.9125 30.2806 18.4635 30.2806 17.9786C30.2806 17.4937 30.4782 17.0447 30.8015 16.7214C30.9631 16.5418 31.1607 16.4161 31.3942 16.3263C32.0587 16.0569 32.8489 16.2185 33.3518 16.7214C33.6751 17.0447 33.8727 17.5117 33.8727 17.9786C33.8727 18.4456 33.6751 18.9125 33.3518 19.2538C33.0106 19.595 32.5436 19.7746 32.0767 19.7746Z" fill="#A1C2E2" />
            <path d="M17.978 5.69312C17.5111 5.69312 17.0441 5.49556 16.7029 5.17228C16.3796 4.83103 16.182 4.36407 16.182 3.89711C16.182 3.78935 16.182 3.66363 16.2179 3.53791C16.2179 3.43015 16.2718 3.32238 16.3257 3.21462C16.3616 3.10686 16.4155 2.9991 16.4873 2.89134C16.5412 2.80154 16.631 2.71174 16.7029 2.62194C16.8825 2.4603 17.0621 2.33458 17.2956 2.24478C17.6188 2.1011 17.978 2.06518 18.3372 2.13702C18.445 2.15498 18.5528 2.1909 18.6605 2.24478C18.7683 2.2807 18.876 2.33458 18.9838 2.40642C19.0736 2.4603 19.1634 2.5501 19.2532 2.62194C19.325 2.71174 19.4148 2.80154 19.4687 2.89134C19.5406 2.9991 19.5944 3.10686 19.6304 3.21462C19.6843 3.32238 19.7202 3.43015 19.7381 3.53791C19.7561 3.66363 19.7741 3.77139 19.7741 3.89711C19.7741 4.13059 19.7202 4.36407 19.6304 4.57959C19.5406 4.81307 19.4148 4.99268 19.2532 5.17228C19.1634 5.24412 19.0736 5.33392 18.9838 5.3878C18.876 5.45964 18.7683 5.51352 18.6605 5.54944C18.5528 5.60332 18.445 5.63924 18.3372 5.6572C18.2115 5.67516 18.0858 5.69312 17.978 5.69312Z" fill="#A1C2E2" />
            <path d="M17.978 33.8731C17.7446 33.8731 17.5111 33.8192 17.2956 33.7294C17.0621 33.6396 16.8825 33.5139 16.7029 33.3343C16.3796 33.011 16.182 32.5441 16.182 32.0771C16.182 31.6102 16.3796 31.1432 16.7029 30.8019C16.8825 30.6403 17.0621 30.4966 17.2956 30.4068C17.6188 30.2811 17.978 30.2452 18.3372 30.317C18.445 30.335 18.5528 30.3709 18.6605 30.4068C18.7683 30.4607 18.876 30.5146 18.9838 30.5864C19.0736 30.6403 19.1634 30.7121 19.2532 30.8019C19.4148 30.9636 19.5406 31.1611 19.6304 31.3767C19.7202 31.6101 19.7741 31.8436 19.7741 32.0771C19.7741 32.3106 19.7202 32.5441 19.6304 32.7596C19.5406 32.9751 19.4148 33.1727 19.2532 33.3343C19.1634 33.4241 19.0736 33.496 18.9838 33.5678C18.876 33.6217 18.7683 33.6935 18.6605 33.7294C18.5528 33.7654 18.445 33.8013 18.3372 33.8372C18.2115 33.8552 18.0858 33.8731 17.978 33.8731Z" fill="#A1C2E2" />
          </g>
          <g transform="translate(17.978 17.978)">
            <g className="hs-day0-hand hs-day0-hand--minute">
              <rect x="-1.4" y="-9.4" width="2.8" height="10.8" rx="1.4" fill="white" />
            </g>
            <g className="hs-day0-hand hs-day0-hand--hour">
              <rect x="-1.55" y="-6.5" width="3.1" height="7.8" rx="1.55" fill="white" />
            </g>
          </g>
        </g>
      </svg>
      <Day0Stars />
    </span>
  );
}

export default function HorizonScanningDay0Page(): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const [walkthrough, setWalkthrough] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const measure = () => {
      const stage = root.querySelector<HTMLElement>('.hs-day0-stage');
      const panel = root.querySelector<HTMLElement>('.hs-day0-panel');
      const icon = root.querySelector<HTMLElement>('.hs-day0-mark');
      if (!stage || !panel || !icon) return 0;
      const previous = stage.style.transform;
      stage.style.setProperty('transform', 'none', 'important');
      const panelRect = panel.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      stage.style.removeProperty('transform');
      stage.style.transform = previous;
      if (panelRect.height < 200 || iconRect.height < 40) return 0;
      return panelRect.top + panelRect.height / 2 - (iconRect.top + iconRect.height / 2);
    };
    const apply = (shift: number) => {
      if (shift <= 1) return false;
      const next = `${Math.round(shift)}px`;
      if (root.style.getPropertyValue('--hs-day0-shift') === next) return true;
      root.style.setProperty('--hs-day0-shift', next);
      const nodes = [root, ...root.querySelectorAll<HTMLElement>('*')];
      for (const el of nodes) el.style.animation = 'none';
      void root.offsetWidth;
      for (const el of nodes) el.style.animation = '';
      return true;
    };
    if (apply(measure())) return;
    let frame = requestAnimationFrame(() => {
      frame = 0;
      if (!apply(measure())) return;
    });
    const panel = root.querySelector('.hs-day0-panel');
    const observer = new ResizeObserver(() => {
      if (apply(measure())) observer.disconnect();
    });
    if (panel) observer.observe(panel);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!walkthrough) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setWalkthrough(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [walkthrough]);

  return (
    <div className="proto-card hs-day0 disc-v2 hs" ref={rootRef}>
      <header className="proto-page-header">
        <h1 className="proto-page-title">Horizon Scanning</h1>
      </header>
      <div className="proto-body">
        <div className="hs-day0-panel">
          <div className="hs-day0-stage">
          <div className="hs-day0-copy">
            <Day0Mark />
            <h2 className="hs-day0-title hs-day0-piece hs-day0-piece--title">
              Monitor changes, stay ahead.
            </h2>
            <p className="hs-day0-sub hs-day0-piece hs-day0-piece--sub">
              Track regulatory change worldwide and share updates with your team.
            </p>
          </div>
          <div className="hs-day0-rest-slot">
            <div className="hs-day0-rest-sizer" aria-hidden="true">
              <div className="hs-day0-cards">
                <div className="hs-stack" />
              </div>
              <div className="hs-day0-cta-slot">
                <div className="hs-day0-cta-space" />
              </div>
            </div>
            <div className="hs-day0-rest">
              <div className="hs-day0-cards">
                <HorizonCardStack />
              </div>
              <div className="hs-day0-cta-slot">
                <button className="hs-day0-cta" type="button" onClick={() => setWalkthrough(true)}>
                  See how it works
                  <img src="/icons/onboard/arrow-right.svg" alt="" />
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      {walkthrough ? <HorizonWalkthrough onClose={() => setWalkthrough(false)} /> : null}
    </div>
  );
}
