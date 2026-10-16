import {useEffect, useRef, useState, type ReactElement, type RefObject} from 'react';
import {createPortal} from 'react-dom';

const WASH = '/assistant/dialog-wash.png';
const SPARKLE = '/assistant/dialog-sparkle.svg';
const GENIE_MS = 260;
const FRAME_MS = 500;
const HOLD = 0;
const BANDS = 120;

function collapseAmount(v: number, t: number) {
  if (t <= HOLD) {
    return 0;
  }
  const u = (t - HOLD) / (1 - HOLD);
  const accel = u ** 1.35;
  const far = Math.min(1, accel ** 1.55);
  const near = Math.min(1, accel ** 0.45);
  const k = v * v * (3 - 2 * v);
  return far * (1 - k) + near * k;
}

function bandScale(v: number, t: number) {
  const c = collapseAmount(v, t);
  const bow = Math.sin(v * Math.PI) * Math.sin(Math.min(1, c) * Math.PI) * 0.22;
  return Math.max(0.012, (1 - c) * (1 - bow));
}

function isWash(el: Element) {
  return el.classList.contains('update-dialog__wash');
}

function inlineComputed(source: Element, dest: Element) {
  if (!(source instanceof HTMLElement) || !(dest instanceof HTMLElement)) {
    return;
  }
  const computed = getComputedStyle(source);
  dest.style.cssText = Array.from(computed)
    .map((prop) => `${prop}:${computed.getPropertyValue(prop)}`)
    .join(';');
  const sourceKids = [...source.children].filter((child) => !isWash(child));
  const destKids = [...dest.children].filter((child) => !isWash(child));
  const count = Math.min(sourceKids.length, destKids.length);
  for (let i = 0; i < count; i += 1) {
    inlineComputed(sourceKids[i], destKids[i]);
  }
}

type Sprite = {
  img: HTMLImageElement;
  x: number;
  y: number;
  w: number;
  h: number;
  cover: boolean;
};

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (!sw || !sh || dw <= 0 || dh <= 0) {
    return;
  }
  const scale = Math.max(dw / sw, dh / sh);
  const cropW = dw / scale;
  const cropH = dh / scale;
  ctx.drawImage(img, (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, dx, dy, dw, dh);
}

function clipRounded(ctx: CanvasRenderingContext2D, w: number, h: number, radius: number) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.clip();
}

function releaseRoot(root: HTMLElement | null) {
  if (!root) {
    return;
  }
  root.querySelectorAll('canvas').forEach((canvas) => {
    canvas.style.willChange = 'auto';
    canvas.width = 0;
    canvas.height = 0;
  });
  root.remove();
}

type Raster = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dpr: number;
};

async function rasterizeDialog(
  dialog: HTMLElement,
  urlRef: {current: string | null},
  isCurrent: () => boolean,
): Promise<Raster | null> {
  const origin = dialog.getBoundingClientRect();
  const width = origin.width;
  const height = origin.height;
  if (width < 2 || height < 2) {
    throw new Error('empty dialog');
  }

  const sprites: Sprite[] = [];
  dialog.querySelectorAll('img').forEach((node) => {
    if (!(node instanceof HTMLImageElement) || node.naturalWidth <= 0) {
      return;
    }
    const rect = node.getBoundingClientRect();
    sprites.push({
      img: node,
      x: rect.left - origin.left,
      y: rect.top - origin.top,
      w: rect.width,
      h: rect.height,
      cover: Boolean(node.closest('.update-dialog__wash')),
    });
  });

  const clone = dialog.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  const liveImgs = [...dialog.querySelectorAll('img')];
  [...clone.querySelectorAll('img')].forEach((img, index) => {
    if (img.closest('.update-dialog__wash')) {
      return;
    }
    const live = liveImgs[index];
    const rect = live instanceof HTMLImageElement ? live.getBoundingClientRect() : null;
    const spacer = document.createElement('span');
    spacer.style.display = 'inline-block';
    spacer.style.width = `${rect?.width || Number(img.getAttribute('width')) || 0}px`;
    spacer.style.height = `${rect?.height || Number(img.getAttribute('height')) || 0}px`;
    img.replaceWith(spacer);
  });
  clone.querySelector('.update-dialog__wash')?.remove();
  clone.querySelectorAll('img').forEach((img) => img.remove());
  inlineComputed(dialog, clone);
  clone.style.visibility = 'visible';
  clone.style.animation = 'none';
  clone.style.transform = 'none';
  clone.style.setProperty('background', 'transparent', 'important');
  clone.style.setProperty('box-shadow', 'none', 'important');
  clone.style.margin = '0';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.overflow = 'hidden';
  clone.style.borderRadius = '12px';

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pw = Math.round(width * dpr);
  const ph = Math.round(height * dpr);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', String(pw));
  svg.setAttribute('height', String(ph));
  const foreign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  foreign.setAttribute('width', '100%');
  foreign.setAttribute('height', '100%');
  const wrap = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
  wrap.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const hideImages = document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
  hideImages.textContent = 'img{display:none !important}';
  wrap.append(hideImages);
  const scale = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
  scale.style.width = `${width}px`;
  scale.style.height = `${height}px`;
  scale.style.transformOrigin = '0 0';
  scale.style.transform = `scale(${dpr})`;
  scale.style.background = 'transparent';
  scale.appendChild(clone);
  wrap.appendChild(scale);
  foreign.appendChild(wrap);
  svg.appendChild(foreign);

  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], {type: 'image/svg+xml;charset=utf-8'}));
  urlRef.current = url;
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (!isCurrent()) {
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = pw;
    canvas.height = ph;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('no canvas');
    }
    ctx.save();
    clipRounded(ctx, pw, ph, 12 * dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pw, ph);
    sprites.forEach((sprite) => {
      if (!sprite.cover) {
        return;
      }
      drawCover(ctx, sprite.img, sprite.x * dpr, sprite.y * dpr, sprite.w * dpr, sprite.h * dpr);
    });
    ctx.drawImage(img, 0, 0, pw, ph);
    sprites.forEach((sprite) => {
      if (sprite.cover) {
        return;
      }
      ctx.drawImage(sprite.img, sprite.x * dpr, sprite.y * dpr, sprite.w * dpr, sprite.h * dpr);
    });
    ctx.restore();
    return {canvas, width, height, dpr};
  } finally {
    URL.revokeObjectURL(url);
    if (urlRef.current === url) {
      urlRef.current = null;
    }
  }
}

type Band = {
  el: HTMLCanvasElement;
  y: number;
  srcH: number;
};

function sliceBands(raster: Raster, from: DOMRect): {root: HTMLDivElement; bands: Band[]} {
  const {canvas, width, height, dpr} = raster;
  const root = document.createElement('div');
  root.className = 'update-genie';
  root.setAttribute('aria-hidden', 'true');
  const bands: Band[] = [];
  const pw = canvas.width;

  for (let i = 0; i < BANDS; i += 1) {
    const y0 = (height * i) / BANDS;
    const y1 = (height * (i + 1)) / BANDS;
    const bleed = 1;
    const top = Math.max(0, y0 - (i === 0 ? 0 : bleed));
    const bot = Math.min(height, y1 + (i === BANDS - 1 ? 0 : bleed));
    const srcH = bot - top;
    if (srcH < 0.5) {
      continue;
    }
    const sy = Math.max(0, Math.floor(top * dpr));
    const sy2 = Math.min(canvas.height, Math.ceil(bot * dpr));
    const sh = Math.max(1, sy2 - sy);
    const slice = document.createElement('canvas');
    slice.className = 'update-genie__band';
    slice.width = pw;
    slice.height = sh;
    slice.style.left = `${from.left}px`;
    slice.style.top = `${from.top + top}px`;
    slice.style.width = `${width}px`;
    slice.style.height = `${srcH}px`;
    const ctx = slice.getContext('2d');
    if (!ctx) {
      continue;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, sy, pw, sh, 0, 0, pw, sh);
    root.appendChild(slice);
    bands.push({el: slice, y: top, srcH});
  }

  return {root, bands};
}

type UpdateDialogProps = {
  variant?: 'genie' | 'frame';
  targetRef: RefObject<HTMLButtonElement | null>;
  onDismissed: () => void;
  onArrive: () => void;
};

export default function UpdateDialog({
  variant = 'genie',
  targetRef,
  onDismissed,
  onArrive,
}: UpdateDialogProps): ReactElement {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const flying = useRef(false);
  const rafRef = useRef(0);
  const genieRootRef = useRef<HTMLDivElement | null>(null);
  const snapshotUrlRef = useRef<string | null>(null);
  const generation = useRef(0);
  const dismissRef = useRef<() => void>(() => {});

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      generation.current += 1;
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(rafRef.current);
      releaseRoot(genieRootRef.current);
      genieRootRef.current = null;
      if (snapshotUrlRef.current) {
        URL.revokeObjectURL(snapshotUrlRef.current);
        snapshotUrlRef.current = null;
      }
    };
  }, []);

  const dismiss = () => {
    if (flying.current) {
      return;
    }
    const dialog = dialogRef.current;
    const target = targetRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!dialog || !target || reduce) {
      onDismissed();
      return;
    }

    flying.current = true;
    setLeaving(true);

    if (variant === 'frame') {
      const from = dialog.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const scale = Math.max(0.05, Math.min(to.width / from.width, to.height / from.height));
      dialog.classList.add('is-frame-flight');
      dialog.style.transformOrigin = 'center center';
      const started = performance.now();
      let arrived = false;
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / FRAME_MS);
        const u = t * t;
        dialog.style.transform = `translate3d(${dx * u}px, ${dy * u}px, 0) scale(${1 + (scale - 1) * u})`;
        dialog.style.opacity = String(Math.max(0, 1 - u));
        if (!arrived && t >= 0.78) {
          arrived = true;
          onArrive();
        }
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          dialog.style.willChange = 'auto';
          onDismissed();
        }
      };
      rafRef.current = requestAnimationFrame(step);
      return;
    }

    const from = dialog.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const targetPt = {x: to.left + to.width / 2 - from.left, y: to.top + to.height / 2 - from.top};
    const id = generation.current + 1;
    generation.current = id;

    void (async () => {
      let raster: Raster | null;
      try {
        raster = await rasterizeDialog(dialog, snapshotUrlRef, () => generation.current === id && dialog.isConnected);
      } catch {
        if (generation.current === id) {
          onDismissed();
        }
        return;
      }
      if (!raster || generation.current !== id || !dialog.isConnected) {
        if (raster) {
          raster.canvas.width = 0;
          raster.canvas.height = 0;
        }
        return;
      }

      const {root, bands} = sliceBands(raster, from);
      raster.canvas.width = 0;
      raster.canvas.height = 0;
      if (!bands.length || generation.current !== id) {
        releaseRoot(root);
        if (generation.current === id) {
          onDismissed();
        }
        return;
      }

      document.body.appendChild(root);
      genieRootRef.current = root;
      dialog.style.visibility = 'hidden';

      const height = from.height;
      let arrived = false;
      const started = performance.now();

      const frame = (now: number) => {
        if (generation.current !== id) {
          return;
        }
        const t = Math.min(1, (now - started) / GENIE_MS);
        const fadeT = Math.min(1, t / 0.72);
        const fade = fadeT * fadeT * (3 - 2 * fadeT);
        root.style.opacity = String(Math.max(0, 1 - fade));
        root.style.setProperty('--genie-fade', String(fade));
        for (let i = 0; i < bands.length; i += 1) {
          const band = bands[i];
          const midV = 1 - (band.y + band.srcH / 2) / height;
          const scale = bandScale(midV, t);
          const top = band.y + (targetPt.y - band.y) * collapseAmount(1 - band.y / height, t);
          const bot =
            band.y + band.srcH + (targetPt.y - (band.y + band.srcH)) * collapseAmount(1 - (band.y + band.srcH) / height, t);
          const scaleY = Math.max(0.012, (bot - top) / band.srcH);
          const tx = targetPt.x * (1 - scale);
          const ty = top - band.y;
          band.el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale}, ${scaleY})`;
        }
        if (!arrived && t >= 0.78) {
          arrived = true;
          onArrive();
        }
        if (t < 1) {
          rafRef.current = requestAnimationFrame(frame);
        } else {
          releaseRoot(root);
          if (genieRootRef.current === root) {
            genieRootRef.current = null;
          }
          onDismissed();
        }
      };

      rafRef.current = requestAnimationFrame(frame);
    })();
  };

  dismissRef.current = dismiss;

  return createPortal(
    <div
      className={[
        'update-layer',
        leaving ? 'is-leaving' : '',
        variant === 'genie' ? 'is-genie' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="update-scrim" />
      <div
        ref={dialogRef}
        className="update-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-dialog-title"
      >
        <div className="update-dialog__wash" aria-hidden="true">
          <img src={WASH} alt="" />
        </div>
        <div className="update-dialog__copy">
          <p className="update-dialog__eyebrow">
            <img src={SPARKLE} alt="" width={16} height={16} />
            What’s new
          </p>
          <h2 id="update-dialog-title">Same Eudia, fresh new look</h2>
          <p>
            We’ve simplified the layout so what matters stands out.
            <br />
            Everything is still right where you left it.
          </p>
        </div>
        <div className="update-dialog__stage" aria-hidden="true" />
        <button className="update-dialog__got" type="button" onClick={dismiss} autoFocus>
          Got it
        </button>
      </div>
    </div>,
    document.body,
  );
}
