/**
 * AppShellUpdate
 *
 * Animated "old app shell -> new app shell" illustration for the projects page.
 * Shows the shared borders dissolving, the background tinting to #FBFBFC, and the
 * table panel lifting into its own card with a drop shadow.
 *
 * No dependencies beyond React 18+.
 *
 * - Fills its container's width at 16:9 (internal stage is 1920x1080, scaled to fit).
 * - Autoplays and loops by default; pauses while scrolled out of view.
 * - Respects prefers-reduced-motion by showing the final (new) layout as a still.
 * - Text uses Inter; this component does not load the font (it assumes the app does).
 * - Every frame is a pure function of time, driven by requestAnimationFrame with
 *   direct style writes (no React re-render per frame).
 *
 * Usage:
 *   <AppShellUpdate />
 *   <AppShellUpdate background="#0F5292" />           // solid color
 *   <AppShellUpdate background="transparent" />       // no background
 *   <AppShellUpdate loop={false} style={{ borderRadius: 8 }} />
 *   <AppShellUpdate startDelay={800} />               // hold, then fade in and play
 */
import {useEffect, useRef, type CSSProperties} from 'react';

/** Default backdrop: the Eudia blue gradient used across the "What's new" videos. */
export const DEFAULT_BACKGROUND =
  "radial-gradient(120% 95% at 80% 0%, #2a70b6 0%, #0F5292 58%, #0b3d6e 100%)";

export type AppShellUpdateProps = {
  /** Any CSS background value (gradient, color, image). Default: Eudia blue gradient. */
  background?: string;
  /** Start playing on mount. Default true. */
  autoPlay?: boolean;
  /** Restart when finished. Default true. When false, it ends on the new layout. */
  loop?: boolean;
  /** Playback speed multiplier. Default 1. */
  speed?: number;
  /**
   * Pause before the video appears, in milliseconds. The opening frame stays
   * hidden, then fades in and playback starts. Default 0 (play immediately).
   */
  startDelay?: number;
  /** Fade-in length when startDelay is set, in milliseconds. Default 360. */
  fadeMs?: number;
  /** Called once when a non-looping playback reaches the end. */
  onEnded?: () => void;
  className?: string;
  style?: CSSProperties;
  /** Accessible description of the animation. */
  ariaLabel?: string;
};

// ---------- timeline (seconds) ----------
const T = {
  drift: [0, 0.6], // slow creep in so frame 0 is never a still
  push: [0.55, 1.25], // commit into the close-up
  clean: [1.4, 2.4], // borders dissolve, background tints, list settles
  lift: [2.5, 3.7], // table panel rises, shadow grows, surroundings dim
  pull: [3.9, 4.6], // back out to full view
} as const;
const END_HOLD = 0.5;
const DUR = T.pull[1] + END_HOLD;

// ---------- easing helpers ----------
type Range = readonly [number, number];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, r: Range) => clamp01((t - r[0]) / (r[1] - r[0]));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const eo = (x: number) => 1 - Math.pow(1 - x, 3);
const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eox = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const bell = (x: number) => Math.sin(Math.PI * clamp01(x)); // 0 -> 1 -> 0

// ---------- camera ----------
const BASE = 0.9;
const FULL = { fx: 720, fy: 512, z: 1 };
const CLOSE = { fx: 420, fy: 250, z: 2.1 }; // junction of list, header and table panel

// ---------- icons (exported from Figma) ----------
const ICONS: Record<string, string> = {
  "eudia":
    "<svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\"><path d=\"M19.3658 6.46095C19.4223 6.54485 19.4755 6.63144 19.5251 6.72083C21.177 9.69711 18.3816 14.5928 13.2813 17.6558C8.18111 20.719 2.70742 20.7893 1.05547 17.813C0.17995 16.2355 0.553561 14.1189 1.85754 12.0218C1.88856 12.558 2.02512 13.0609 2.27658 13.5139C3.77046 16.2053 8.75383 16.1216 13.4072 13.3269C16.5466 11.4416 18.7336 8.80408 19.3658 6.46095ZM7.29906 6.87789C10.2223 5.12229 13.2684 4.34991 15.647 4.57073C15.0262 6.62297 13.0676 8.91127 10.2933 10.5516C7.14903 12.4107 3.85281 12.9082 1.85754 12.0218C3.01397 10.1622 4.90223 8.31734 7.29906 6.87789ZM5.56372 1.89634C9.55048 -0.460884 13.7809 -0.628272 15.2948 1.43759C13.1788 1.33622 10.5389 2.05402 7.99745 3.58031C4.1277 5.90434 1.70469 9.37129 1.85741 12.0209C1.2015 11.7294 0.686228 11.2884 0.363103 10.6971C-0.942942 8.30698 1.38544 4.36681 5.56372 1.89634ZM15.2948 1.43759C17.0534 1.52183 18.4503 2.1718 19.1283 3.39336C19.6144 4.26913 19.6709 5.3308 19.3658 6.46095C18.6207 5.35256 17.2938 4.72362 15.647 4.57073C15.9613 3.53208 15.9328 2.55388 15.4939 1.75072C15.4341 1.64117 15.3675 1.53683 15.2948 1.43759Z\" fill=\"#122933\"/></svg>",
  "star":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><path d=\"M8.00004 1.33301L10.06 5.50634L14.6667 6.17968L11.3334 9.42634L12.12 14.013L8.00004 11.8463L3.88004 14.013L4.66671 9.42634L1.33337 6.17968L5.94004 5.50634L8.00004 1.33301Z\" fill=\"#E69500\" stroke=\"#E69500\" stroke-width=\"1.33\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
  "general":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><g clip-path=\"url(#CID)\"><path d=\"M16 0H0V16H16V0Z\" fill=\"#B8D1E9\"/><path d=\"M3.35143 8.57778C3.94162 7.44662 5.04328 6.32528 6.51873 5.47444C7.99418 4.6236 9.51386 4.23014 10.7926 4.28424C10.768 4.04817 10.7041 3.82685 10.591 3.62029C10.0696 2.71535 8.71714 2.45469 7.20727 2.8383C6.62201 2.98585 6.01708 3.23176 5.4269 3.57603C3.29734 4.80557 2.16124 6.81709 2.88421 8.07122C3.00224 8.2729 3.16454 8.4401 3.35635 8.57778H3.35143Z\" fill=\"#0F5292\"/><path d=\"M7.59585 11.1402C7.59585 10.7368 7.827 10.368 8.18606 10.186L9.08606 9.73355L9.53854 8.83843C9.72046 8.47451 10.0893 8.24827 10.4976 8.24827C10.9009 8.24827 11.2648 8.46955 11.4517 8.82859L11.8451 9.58603C12.9517 8.35155 13.4189 6.97938 12.878 6.04494C12.0812 4.66294 9.33198 4.69736 6.87779 6.11379C4.42363 7.53022 3.02195 9.89587 3.8187 11.2729C4.19248 11.9221 4.99906 12.2861 6.09089 12.296C6.69583 12.3008 7.34994 12.1976 8.00894 11.996C7.74339 11.7943 7.57618 11.4844 7.58109 11.1402H7.59585Z\" fill=\"#0F5292\"/><path d=\"M10.7974 13.1566L11.3827 12.0894C11.4171 12.0304 11.4614 11.9812 11.5204 11.9516L12.4991 11.4402C12.7401 11.3123 12.7401 10.968 12.4991 10.8451L11.4515 10.2943C11.3926 10.2598 11.3434 10.2106 11.309 10.1516L10.8023 9.17291C10.7384 9.04995 10.6204 8.99091 10.5023 8.99091C10.3843 8.99091 10.2614 9.05483 10.1974 9.17779L9.68591 10.191C9.65151 10.2549 9.60231 10.309 9.53839 10.3385L8.52031 10.85C8.27439 10.9729 8.26951 11.3221 8.52031 11.45L9.48919 11.9566C9.54823 11.9861 9.59735 12.0352 9.63183 12.0943L10.2073 13.1566C10.2712 13.2747 10.3892 13.3336 10.5073 13.3336C10.6253 13.3336 10.7384 13.2747 10.8023 13.1566H10.7974Z\" fill=\"#0F5292\"/></g><defs><clipPath id=\"CID\"><rect width=\"16\" height=\"16\" rx=\"8\" fill=\"white\"/></clipPath></defs></svg>",
  "compliance":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><g clip-path=\"url(#CID)\"><path d=\"M16 0H0V16H16V0Z\" fill=\"#D7D3E6\"/><path d=\"M13.2239 8.58297C13.1172 8.32697 13.1172 8.04425 13.2239 7.78828L13.6292 6.84428C13.7572 6.54561 13.6452 6.19361 13.3626 6.02294L12.4772 5.49494C12.2372 5.35628 12.0719 5.12161 12.0079 4.84961L11.7786 3.84694C11.7039 3.52694 11.4106 3.30828 11.0799 3.34028L10.0559 3.43628C9.77859 3.46294 9.50659 3.37228 9.29859 3.19094L8.52523 2.51361C8.27987 2.29494 7.9119 2.29494 7.66124 2.51361L6.8879 3.19094C6.6799 3.37228 6.4079 3.46294 6.13056 3.43628L5.10656 3.34028C4.78124 3.30828 4.48256 3.52694 4.4079 3.84694L4.17856 4.84961C4.1199 5.12161 3.94924 5.35094 3.70924 5.49494L2.8239 6.02294C2.54124 6.18828 2.42924 6.54028 2.55724 6.84428L2.96256 7.78828C3.06924 8.04425 3.06924 8.32697 2.96256 8.58297L2.55724 9.52697C2.42924 9.82561 2.54124 10.1776 2.8239 10.3482L3.70924 10.8762C3.94924 11.015 4.11456 11.2496 4.17856 11.5216L4.4079 12.5242C4.48256 12.8442 4.7759 13.063 5.10656 13.031L6.13056 12.935C6.4079 12.9082 6.6799 12.999 6.8879 13.1802L7.66124 13.8576C7.90656 14.0762 8.27459 14.0762 8.52523 13.8576L9.29859 13.1802C9.50659 12.999 9.77859 12.9082 10.0559 12.935L11.0799 13.031C11.4052 13.063 11.7039 12.8442 11.7786 12.5242L12.0079 11.5216C12.0666 11.2496 12.2372 11.0202 12.4772 10.8762L13.3626 10.3482C13.6452 10.183 13.7572 9.83097 13.6292 9.52697L13.2239 8.58297ZM7.23536 10.5358L5.3839 8.68425L6.1359 7.93228L7.23456 9.03097L10.0612 6.20428L10.8132 6.95628L7.23536 10.5358Z\" fill=\"#625689\"/></g><defs><clipPath id=\"CID\"><rect width=\"16\" height=\"16\" rx=\"8\" fill=\"white\"/></clipPath></defs></svg>",
  "contracting":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><g clip-path=\"url(#CID)\"><path d=\"M16 0H0V16H16V0Z\" fill=\"#B8D8DE\"/><path d=\"M13.5256 6.61369L9.1736 2.32035C8.9656 2.11235 8.62424 2.11769 8.4216 2.32569L7.85092 2.90169C7.64292 3.10969 7.64825 3.45101 7.85625 3.65369L8.1816 3.97369C7.80292 4.34701 6.72558 5.38169 5.98959 5.80302C5.40825 6.13369 4.61359 6.41635 4.19225 6.55501C4.01092 6.61369 3.87759 6.76835 3.83492 6.95501L2.70959 12.4163C2.68825 12.507 2.80559 12.571 2.86959 12.5017L6.03759 9.2857C5.84559 8.83234 5.97892 8.27234 6.44292 7.96835C6.78959 7.74435 7.25892 7.74435 7.60025 7.96835C8.1816 8.3577 8.24024 9.14698 7.77092 9.61634C7.45625 9.93098 6.99225 10.0057 6.60292 9.8457L3.44025 13.0563C3.37625 13.1257 3.44025 13.2323 3.52559 13.2163L8.9656 12.011C9.15224 11.9683 9.3016 11.835 9.36024 11.6483C9.4936 11.227 9.76024 10.427 10.0856 9.84034C10.4962 9.0937 11.515 8.0057 11.883 7.62169L12.2082 7.94169C12.4162 8.1497 12.7576 8.14434 12.9602 7.93635L13.531 7.36035C13.739 7.15235 13.7336 6.81101 13.5256 6.60835V6.61369Z\" fill=\"#0F6374\"/></g><defs><clipPath id=\"CID\"><rect width=\"16\" height=\"16\" rx=\"8\" fill=\"white\"/></clipPath></defs></svg>",
  "ma":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><g clip-path=\"url(#CID)\"><path d=\"M16 0H0V16H16V0Z\" fill=\"#DFDCD9\"/><path d=\"M6.77273 6.77271H3.90909C3.68409 6.77271 3.5 6.95679 3.5 7.18179V12.0909C3.5 12.3159 3.68409 12.5 3.90909 12.5H8.81816C9.0432 12.5 9.22728 12.3159 9.22728 12.0909V9.22728H7.18182C6.95682 9.22728 6.77273 9.0432 6.77273 8.81816V6.77271Z\" fill=\"#767067\"/><path d=\"M12.0908 3.5H7.18177C6.95677 3.5 6.77268 3.68409 6.77268 3.90909L6.77273 6.77271L8.8181 6.77273C9.04314 6.77273 9.22722 6.95682 9.22722 7.18182L9.22728 9.22728L12.0908 9.22728C12.3159 9.22728 12.4999 9.0432 12.4999 8.81816V3.90909C12.4999 3.68409 12.3159 3.5 12.0908 3.5Z\" fill=\"#767067\"/></g><defs><clipPath id=\"CID\"><rect width=\"16\" height=\"16\" rx=\"8\" fill=\"white\"/></clipPath></defs></svg>",
  "litigation":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><g clip-path=\"url(#CID)\"><path d=\"M16 0H0V16H16V0Z\" fill=\"#B8D8DE\"/><path d=\"M4.12631 7.77748L3.07274 8.83108C2.97575 8.92804 2.97575 9.08525 3.07274 9.18229L5.92091 12.0304C6.0179 12.1274 6.17513 12.1274 6.27211 12.0304L7.32569 10.9768C7.42267 10.8799 7.42267 10.7227 7.32569 10.6256L4.47751 7.77748C4.38053 7.68051 4.2233 7.68051 4.12631 7.77748Z\" fill=\"#0F6374\"/><path d=\"M11.0321 7.34131L12.0857 6.28773C12.1826 6.19075 12.1826 6.03352 12.0857 5.93654L9.2375 3.08836C9.14054 2.99138 8.98326 2.99138 8.8863 3.08836L7.83272 4.14194C7.73574 4.23892 7.73574 4.39615 7.83272 4.49314L10.6809 7.34131C10.7779 7.43829 10.9351 7.43829 11.0321 7.34131Z\" fill=\"#0F6374\"/><path d=\"M12.9331 12.0334L9.25275 8.35321L9.96299 7.64298L7.46481 5.14478L6.75458 5.855L6.51122 5.61163C6.26785 5.36827 5.87549 5.36827 5.63212 5.61163C5.38875 5.855 5.38875 6.24737 5.63212 6.49073L5.87549 6.7341L5.16526 7.44432L7.66347 9.94257L8.37371 9.23233L12.054 12.9175C12.1434 13.007 12.2874 13.007 12.3768 12.9175L12.9331 12.3613C13.0224 12.2718 13.0224 12.1278 12.9331 12.0385V12.0334Z\" fill=\"#0F6374\"/></g><defs><clipPath id=\"CID\"><rect width=\"16\" height=\"16\" rx=\"8\" fill=\"white\"/></clipPath></defs></svg>",
  "search":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><path d=\"M14.0001 14L11.1335 11.1333M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z\" stroke=\"#5C7079\" stroke-width=\"1.33\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
  "plus":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><path d=\"M3.33333 7.99967H12.6667M7.99999 3.33301V12.6663\" stroke=\"white\" stroke-width=\"1.33\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
  "share":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><path d=\"M5.72673 9.00635L10.2801 11.6597M10.2734 4.33968L5.72673 6.99301M14 3.33301C14 4.43758 13.1046 5.33301 12 5.33301C10.8954 5.33301 10 4.43758 10 3.33301C10 2.22844 10.8954 1.33301 12 1.33301C13.1046 1.33301 14 2.22844 14 3.33301ZM6 7.99967C6 9.10424 5.10457 9.99967 4 9.99967C2.89543 9.99967 2 9.10424 2 7.99967C2 6.8951 2.89543 5.99967 4 5.99967C5.10457 5.99967 6 6.8951 6 7.99967ZM14 12.6663C14 13.7709 13.1046 14.6663 12 14.6663C10.8954 14.6663 10 13.7709 10 12.6663C10 11.5618 10.8954 10.6663 12 10.6663C13.1046 10.6663 14 11.5618 14 12.6663Z\" stroke=\"#122933\" stroke-width=\"1.33\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
  "more":
    "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><circle cx=\"8\" cy=\"8\" r=\"0.67\" stroke=\"#122933\" stroke-width=\"1.33\"/><circle cx=\"8\" cy=\"3.33\" r=\"0.67\" stroke=\"#122933\" stroke-width=\"1.33\"/><circle cx=\"8\" cy=\"12.67\" r=\"0.67\" stroke=\"#122933\" stroke-width=\"1.33\"/></svg>",
};

type Item = { el: HTMLElement; o: [number, number]; n: [number, number]; phase: "clean" | "lift"; row: number };

/** Builds the scene into `app` and returns a render(t) function. */
function buildScene(app: HTMLDivElement, uid: string) {
  let cid = 0;
  const icon = (name: string) => ICONS[name].replace(/CID/g, `${uid}-c${cid++}`);
  const add = (parent: HTMLElement, css: Partial<CSSStyleDeclaration> = {}, html?: string) => {
    const d = document.createElement("div");
    d.style.position = "absolute";
    d.style.whiteSpace = "nowrap";
    Object.assign(d.style, css);
    if (html) d.innerHTML = html;
    parent.appendChild(d);
    return d;
  };
  const place = (el: HTMLElement, x: number, y: number, w?: number, h?: number) => {
    const s = el.style;
    s.left = `${x}px`;
    s.top = `${y}px`;
    if (w != null) s.width = `${w}px`;
    if (h != null) s.height = `${h}px`;
  };
  const txt = (fs: number, fw: number, color: string, lh: number): Partial<CSSStyleDeclaration> => ({
    fontSize: `${fs}px`, fontWeight: String(fw), color, lineHeight: `${lh}px`,
  });
  const ICON_BOX: Partial<CSSStyleDeclaration> = { width: "16px", height: "16px", lineHeight: "0" };

  const items: Item[] = [];
  const morph = (
    parent: HTMLElement, phase: Item["phase"], o: [number, number], n: [number, number],
    css: Partial<CSSStyleDeclaration> = {}, html?: string, row = -1,
  ) => {
    const el = add(parent, css, html);
    items.push({ el, o, n, phase, row });
    return el;
  };

  // nav (unchanged between layouts)
  add(app, { left: "0px", top: "0px", width: "48px", height: "1024px", background: "#F6F3EF" });
  add(app, { left: "14px", top: "18px", width: "20px", height: "20px", lineHeight: "0" }, icon("eudia"));

  // surfaces
  const container = add(app, { left: "48px", top: "8px", width: "1384px", height: "1008px", borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,.05)", boxSizing: "border-box" });
  const containerLine = add(app, { left: "48px", top: "8px", width: "1384px", height: "1008px", borderRadius: "8px", border: "1px solid #eef0f4", boxSizing: "border-box" });
  const sideSurface = add(app, { left: "68px", top: "72px", width: "256px", height: "928px", borderRadius: "8px", background: "#fff" });
  // old outer border sits above the table panel so its top/right edges show in the old state
  const bodyBorder = add(app, { left: "68px", top: "72px", width: "1344px", height: "928px", borderRadius: "8px", border: "1px solid #eef0f4", boxSizing: "border-box", zIndex: "7", pointerEvents: "none" });
  const dim = add(app, { left: "0px", top: "0px", width: "1440px", height: "1024px", background: "#0b2540", opacity: "0", zIndex: "5" });

  // lifted group: card + table content
  const lift = add(app, { left: "0px", top: "0px", width: "1440px", height: "1024px", zIndex: "6", transformOrigin: "874px 535px" });
  const card = add(lift, { boxSizing: "border-box", background: "#fff" });
  const cardDivider = add(lift, { width: "1px", background: "#eef0f4" });

  // title: identical in both layouts, stays put
  add(app, { left: "68px", top: "24px", ...txt(24, 500, "#122933", 32) }, "All your projects");

  // sidebar list
  morph(app, "clean", [84, 88], [68, 94], txt(16, 600, "#122933", 24)).textContent = "Type";
  const sideActive = add(app, { background: "#dce2e8", borderRadius: "6px" });
  const side: [string, string, string, number][] = [
    ["star", "Favorites", "5", 500], ["general", "General project", "12", 400], ["compliance", "Compliance", "8", 400],
    ["contracting", "Contracting", "6", 400], ["ma", "M&A", "4", 400], ["litigation", "Litigation", "9", 400],
  ];
  side.forEach(([ic, label, count, w], i) => {
    morph(app, "clean", [84, 136 + 34 * i], [64, 152 + 36 * i], ICON_BOX, icon(ic));
    morph(app, "clean", [108, 135 + 34 * i], [88, 151 + 36 * i], txt(14, w, "#122933", 18)).textContent = label;
    morph(app, "clean", [300, 136 + 34 * i], [304, 152 + 36 * i], { ...txt(12, 500, "#122933", 16), transform: "translateX(-100%)" }).textContent = count;
  });

  // toolbar (right aligned; moves with the card)
  morph(lift, "lift", [1066, 82], [1074, 88], { width: "216px", height: "36px", background: "#fff", border: "1px solid #b9c4d2", borderRadius: "8px", boxSizing: "border-box", boxShadow: "0 1px 2px rgba(0,0,0,.05)" });
  morph(lift, "lift", [1078, 92], [1086, 98], ICON_BOX, icon("search"));
  morph(lift, "lift", [1098, 90], [1106, 96], txt(14, 400, "#5c7079", 20)).textContent = "Search";
  morph(lift, "lift", [1298, 82], [1306, 88], { width: "90px", height: "36px", background: "#2b75bd", borderRadius: "8px", boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.1)" });
  morph(lift, "lift", [1308, 92], [1316, 98], ICON_BOX, icon("plus"));
  morph(lift, "lift", [1330, 90], [1338, 96], txt(14, 500, "#fff", 20)).textContent = "Project";

  // table head band + labels
  const head = add(lift, { height: "40px", background: "#f9fafb" });
  ([["Project", 432, 444], ["Owned by", 688, 700], ["Last used", 989.5, 995.5]] as const).forEach(([s, ox, nx]) => {
    morph(lift, "lift", [ox, 138], [nx, 150], txt(14, 500, "#5c7079", 20)).textContent = s;
  });

  // rows
  const rows: [string, string, string, string, string, string, string][] = [
    ["VC", "#d0e0f0", "#0f5292", "Vendor contract review", "48 files • General project", "You", "2 hours ago"],
    ["QR", "#e5e2ee", "#625689", "Q3 regulatory filings", "132 files • Compliance", "maria.lopez@company.com", "Yesterday"],
    ["EA", "#d0e5e9", "#0f6374", "Employment agreements audit", "27 files • Compliance", "james.chen@company.com", "3 days ago"],
    ["AP", "#eae8e6", "#59544d", "Asset purchase due diligence", "215 files • M&A", "You", "1 week ago"],
    ["PD", "#d0e0f0", "#0f5292", "Patent dispute discovery", "86 files • Litigation", "priya.shah@company.com", "2 weeks ago"],
  ];
  rows.forEach(([ini, bg, fg, name, sub, owner, last], i) => {
    const dy = 64 * i;
    morph(lift, "lift", [348, 192 + dy], [360, 204 + dy], ICON_BOX, icon("star"), i);
    morph(lift, "lift", [380, 182 + dy], [392, 194 + dy], { width: "36px", height: "36px", borderRadius: "50%", background: bg, color: fg, fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", justifyContent: "center" }, undefined, i).textContent = ini;
    morph(lift, "lift", [432, 180 + dy], [444, 192 + dy], txt(14, 500, "#122933", 20), undefined, i).textContent = name;
    morph(lift, "lift", [432, 204 + dy], [444, 216 + dy], txt(12, 400, "#5c7079", 16), undefined, i).textContent = sub;
    morph(lift, "lift", [688, 192 + dy], [700, 204 + dy], txt(12, 400, "#5c7079", 16), undefined, i).textContent = owner;
    morph(lift, "lift", [989.5, 192 + dy], [995.5, 204 + dy], txt(12, 400, "#5c7079", 16), undefined, i).textContent = last;
    morph(lift, "lift", [1293, 192 + dy], [1293, 204 + dy], ICON_BOX, icon("share"), i);
    morph(lift, "lift", [1315, 190 + dy], [1315, 202 + dy], txt(14, 500, "#122933", 20), undefined, i).textContent = "Share";
    morph(lift, "lift", [1372, 192 + dy], [1372, 204 + dy], ICON_BOX, icon("more"), i);
  });

  return (t: number, cam: HTMLDivElement, loop: boolean) => {
    // camera: slow drift that flows into a committed push, back out, then a settle on the hold
    const d = eo(seg(t, T.drift)) * 0.04;
    const kIn = eox(seg(t, T.push));
    const kOut = eio(seg(t, T.pull));
    const k = kIn * (1 - kOut);
    let z = Math.exp(lerp(Math.log(FULL.z * (1 + d)), Math.log(CLOSE.z), kIn));
    z = Math.exp(lerp(Math.log(z), Math.log(FULL.z), kOut));
    // Settle finishes as the full view lands. Playback then holds that frame for END_HOLD.
    const hold = eo(seg(t, [T.pull[1] - 0.3, T.pull[1]]));
    cam.style.willChange = t >= T.pull[1] ? "transform" : "auto";
    const fx = lerp(FULL.fx, CLOSE.fx, k);
    const fy = lerp(FULL.fy, CLOSE.fy, k);
    const S = BASE * z * (1 - 0.014 * hold);
    cam.style.transform = `translate(${960 - fx * S}px, ${540 - fy * S}px) scale(${S})`;
    cam.style.opacity = String(loop ? Math.min(eo(seg(t, [0, 0.3])), 1 - eio(seg(t, [DUR - 0.35, DUR]))) : 1);

    // 1. clean-up: borders dissolve, background tints #FFFFFF -> #FBFBFC, list settles
    const c = eio(seg(t, T.clean));
    const g = Math.round(lerp(255, 251, c));
    const gb = Math.round(lerp(255, 252, c));
    container.style.background = `rgb(${g},${g},${gb})`;
    containerLine.style.opacity = String(1 - c);
    bodyBorder.style.opacity = String(1 - c);
    sideSurface.style.opacity = String(1 - c);
    cardDivider.style.opacity = String(1 - c);
    place(sideActive, lerp(76, 56, c), lerp(128, 144, c), lerp(240, 256, c), 32);

    // 2. lift: panel rises with its shadow, content reflows, surroundings dim briefly
    const L = eio(seg(t, T.lift));
    const rise = bell(seg(t, T.lift));
    place(card, lerp(324, 336, L), 72, lerp(1088, 1076, L), lerp(928, 924, L));
    // corners round off just before the lift starts, so the panel rises already rounded
    card.style.borderRadius = `${8 * eio(seg(t, [T.clean[1] - 0.3, T.lift[0]]))}px`;
    card.style.border = `1px solid rgba(238,240,244,${L})`;
    card.style.boxShadow =
      `0 ${lerp(0, 4, L) + 6 * rise}px ${6 + 10 * rise}px -2px rgba(0,0,0,${0.05 * L + 0.04 * rise}), ` +
      `0 ${lerp(0, 10, L) + 12 * rise}px ${15 + 18 * rise}px -3px rgba(0,0,0,${0.1 * L + 0.06 * rise})`;
    place(cardDivider, 324, 72, 1, 928);
    lift.style.transform = `translateY(${-6 * rise}px) scale(${1 + 0.008 * rise})`;
    dim.style.opacity = String(0.06 * rise);
    place(head, lerp(325, 337, L), lerp(128, 140, L), lerp(1087, 1074, L));

    for (const it of items) {
      const p = it.phase === "clean" ? c
        : it.row < 0 ? L
        : eio(seg(t, [T.lift[0] + 0.04 * it.row, T.lift[1] + 0.04 * it.row]));
      place(it.el, lerp(it.o[0], it.n[0], p), lerp(it.o[1], it.n[1], p));
    }
  };
}

export default function AppShellUpdate({
  background = DEFAULT_BACKGROUND,
  autoPlay = true,
  loop = true,
  speed = 1,
  startDelay = 0,
  fadeMs = 360,
  onEnded,
  className,
  style,
  ariaLabel = "Animation: the projects page updates to the new app shell. Borders fade away, the background softens, and the projects table lifts into its own card.",
}: AppShellUpdateProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const uid = useRef(`asu${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    const app = appRef.current, cam = camRef.current, vp = viewportRef.current, st = stageRef.current;
    if (!app || !cam || !vp || !st) return;
    app.replaceChildren();
    const render = buildScene(app, uid);

    // scale the 1920x1080 stage to the container width
    const fit = () => { st.style.transform = `scale(${vp.clientWidth / 1920})`; };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(vp);

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !autoPlay) {
      render(reduced ? DUR - 1 : 0, cam, false);
      return () => { ro.disconnect(); app.replaceChildren(); };
    }

    // play only while on screen
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(vp);

    let raf = 0, t = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000) * speed;
      last = now;
      if (visible) {
        t += dt;
        if (t >= DUR) {
          if (loop) t = t % DUR;
          else {
            render(DUR, cam, false);
            onEndedRef.current?.();
            return;
          }
        }
        render(t, cam, loop);
      }
      if (loop || t < DUR) raf = requestAnimationFrame(tick);
    };
    // Opening frame is faded out at t=0. Hold the first fully visible frame, then play from there.
    const held = startDelay > 0 ? 0.3 : 0;
    render(held, cam, loop);
    if (startDelay > 0) {
      vp.style.transition = "none";
      vp.style.opacity = "0";
    }
    let startTimer = 0;
    const begin = () => {
      t = held;
      last = performance.now();
      if (startDelay > 0) {
        vp.style.transition = `opacity ${fadeMs}ms ease`;
        vp.style.opacity = "1";
      }
      raf = requestAnimationFrame(tick);
    };
    if (startDelay > 0) startTimer = window.setTimeout(begin, startDelay);
    else begin();
    return () => { clearTimeout(startTimer); cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); app.replaceChildren(); };
  }, [autoPlay, fadeMs, loop, speed, startDelay, uid]);

  return (
    <div
      ref={viewportRef}
      className={className}
      role="img"
      aria-label={ariaLabel}
      style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", ...style }}
    >
      <div
        ref={stageRef}
        style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", overflow: "hidden", background }}
      >
        <div ref={camRef} style={{ position: "absolute", left: 0, top: 0, width: 1440, height: 1024, transformOrigin: "0 0" }}>
          <div
            ref={appRef}
            style={{
              position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden", background: "#F6F3EF",
              boxShadow: "0 30px 80px rgba(0,0,0,.28), 0 8px 24px rgba(0,0,0,.16)",
              fontFamily: "Inter, system-ui, sans-serif", color: "#122933", WebkitFontSmoothing: "antialiased",
            }}
          />
        </div>
      </div>
    </div>
  );
}
