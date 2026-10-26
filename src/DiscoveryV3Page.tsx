import {useEffect, useRef, useState, type ReactElement} from 'react';

const DIALOG_W = 1392;
const DIALOG_H = 977;
const PAUSE_MS = 700;
const OLD_MS = 420;
const BEAT_MS = 1100;

type Phase = 'empty' | 'old' | 'both';

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

export function V3Walkthrough({onClose}: {onClose: () => void}): ReactElement {
  const [phase, setPhase] = useState<Phase>('empty');
  const {ref: scrimRef, scale} = useDialogScale();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setPhase('both');
      return;
    }
    const oldTimer = window.setTimeout(() => setPhase('old'), PAUSE_MS);
    const bothTimer = window.setTimeout(() => setPhase('both'), PAUSE_MS + OLD_MS + BEAT_MS);
    return () => {
      window.clearTimeout(oldTimer);
      window.clearTimeout(bothTimer);
    };
  }, []);

  return (
    <div className="disc-scrim" role="presentation" ref={scrimRef}>
      <div className="disc-dialog disc-v2-dialog" role="dialog" aria-modal="true" aria-labelledby="disc-v3-title">
        <button className="disc-v3-close" type="button" aria-label="Close" onClick={onClose}>
          <img src="/assistant/opp-x.svg" alt="" />
        </button>
        <div className="disc-v2-fit" style={{width: DIALOG_W * scale, height: DIALOG_H * scale}}>
          <div
            className="disc-v2-canvas"
            style={{
              width: DIALOG_W,
              height: DIALOG_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <div className="disc-v2-stage">
              <div className="disc-v2-body">
                <div className="disc-dialog__head">
                  <p className="disc-eyebrow">
                    <img src="/assistant/v1/sparkles.svg" alt="" width={16} height={16} />
                    What’s new
                  </p>
                  <h2 id="disc-v3-title">A cleaner, more focused Eudia</h2>
                </div>
                <div className={`disc-v3-stage is-${phase}`}>
                  <div className="disc-v3-compare">
                    <div className="disc-v3-col disc-v3-col--old">
                      <p className="disc-v3-label">Old layout</p>
                      <img src="/discovery-v3/old-layout.png" alt="" width={529} height={356} />
                    </div>
                    <div className="disc-v3-col disc-v3-col--new">
                      <p className="disc-v3-label">New layout</p>
                      <img src="/discovery-v3/new-layout.png" alt="" width={529} height={356} />
                      <div className="disc-v3-caption">
                        <strong>Easier to focus</strong>
                        <span>Your work now stands out on the page.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button className="disc-gotit" type="button" onClick={onClose}>
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

