import {useEffect, useState, type FormEvent, type ReactElement} from 'react';
import AppShellUpdate from './AppShellUpdate';

const ASSET = '/assistant';
const V1 = '/assistant/v1';

const AGENTS = [
  {
    name: 'Redact PII',
    description: 'Redact sensitive information from documents.',
    icon: `${ASSET}/file-lock.svg`,
  },
  {
    name: 'Argument Analysis',
    description: 'Analyzes argument evolution and inconsistencies.',
    icon: `${ASSET}/circle-help.svg`,
  },
  {
    name: 'Case Analysis',
    description: 'Comprehensive analysis of case documents and themes.',
    icon: `${ASSET}/briefcase.svg`,
  },
  {
    name: 'Compare',
    description: 'Compare and highlight differences between documents.',
    icon: `${ASSET}/git-compare.svg`,
  },
  {
    name: 'Witness Analysis',
    description: 'Analyze testimonies and depositions for inconsistencies.',
    icon: `${ASSET}/circle-user.svg`,
  },
];

const OUTPUTS = [
  {
    name: 'Generate Report',
    owner: 'Me',
    status: 'In progress',
    when: '2 days ago',
    icon: `${ASSET}/pencil-ruler.svg`,
    statusIcon: `${ASSET}/loader.svg`,
  },
  {
    name: 'Translate',
    owner: 'sam.rivera@eudia.com',
    status: 'Completed',
    when: 'Jan 6, 2025',
    icon: `${ASSET}/languages.svg`,
    statusIcon: `${ASSET}/circle-check.svg`,
  },
  {
    name: 'Argument Analysis',
    owner: 'cameron.reed@eudia.com',
    status: 'Completed',
    when: 'Jan 6, 2025',
    icon: `${ASSET}/sheet.svg`,
    statusIcon: `${ASSET}/circle-check.svg`,
  },
];

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

function RaisedWorkspace(): ReactElement {
  return (
    <span className="disc-art">
      <span className="disc-bar disc-bar--rail" />
      <span className="disc-pill" />
      <img className="disc-dot disc-dot--a" src={`${V1}/dot.svg`} alt="" width={5} height={5} />
      <span className="disc-bar disc-bar--menu" />
      <img className="disc-dot disc-dot--b" src={`${V1}/dot-1.svg`} alt="" width={5} height={5} />
      <span className="disc-bar disc-bar--row-b" />
      <img className="disc-dot disc-dot--c" src={`${V1}/dot-2.svg`} alt="" width={5} height={5} />
      <span className="disc-bar disc-bar--row-c" />
      <span className="disc-panel">
        <span className="disc-chip" />
        <img className="disc-avatar disc-avatar--a" src={`${V1}/avatar.svg`} alt="" width={8} height={8} />
        <span className="disc-bar disc-bar--name-a" />
        <img className="disc-avatar disc-avatar--b" src={`${V1}/avatar.svg`} alt="" width={8} height={8} />
        <span className="disc-bar disc-bar--name-b" />
        <img className="disc-avatar disc-avatar--c" src={`${V1}/avatar.svg`} alt="" width={8} height={8} />
        <span className="disc-bar disc-bar--name-c" />
      </span>
    </span>
  );
}

function Dashboards(): ReactElement {
  return (
    <span className="disc-art">
      <span className="disc-bar disc-bar--title" />
      <span className="disc-bar disc-bar--meta" />
      <span className="disc-tabs" />
      <span className="disc-tab" />
      <span className="disc-rules">
        <span className="disc-bar disc-bar--rules-title" />
        <span className="disc-search" />
        <span className="disc-row">
          <span className="disc-bar disc-bar--sel" />
          <span className="disc-seg disc-seg--g" />
          <span className="disc-seg disc-seg--y" />
          <span className="disc-seg disc-seg--o" />
          <span className="disc-seg disc-seg--r" />
        </span>
        <span className="disc-bar disc-bar--r2" />
        <span className="disc-seg disc-seg--m1" />
        <span className="disc-seg disc-seg--m2" />
        <span className="disc-seg disc-seg--m3" />
        <span className="disc-bar disc-bar--r3" />
        <span className="disc-seg disc-seg--n1" />
        <span className="disc-seg disc-seg--n2" />
        <span className="disc-seg disc-seg--n3" />
        <span className="disc-bar disc-bar--r4" />
        <span className="disc-seg disc-seg--p1" />
        <span className="disc-seg disc-seg--p2" />
        <span className="disc-seg disc-seg--p3" />
      </span>
      <img className="disc-map" src={`${V1}/map-north-america.svg`} alt="" width={84} height={50} />
    </span>
  );
}

function DiscoverStack({onOpen}: {onOpen: () => void}): ReactElement {
  return (
    <button className="disc-discover" type="button" onClick={onOpen}>
      <span className="disc-stack">
        <span className="disc-card disc-card--workspace">
          <RaisedWorkspace />
        </span>
        <span className="disc-card disc-card--dashboards">
          <Dashboards />
        </span>
      </span>
      <span className="disc-caption">
        <span className="disc-caption__title">Notice anything new?</span>
        <span className="disc-caption__sub">Eudia got a fresh look. See what changed.</span>
      </span>
    </button>
  );
}

function Walkthrough({onClose}: {onClose: () => void}): ReactElement {
  return (
    <div className="disc-scrim" role="presentation">
      <div
        className="disc-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disc-dialog-title"
      >
        <div className="disc-dialog__head">
          <p className="disc-eyebrow">
            <Glyph src={`${V1}/sparkles.svg`} width={16} height={16} />
            What’s new
          </p>
          <h2 id="disc-dialog-title">A cleaner, more focused Eudia</h2>
          <p>Your work stands out, with less clutter around it.</p>
        </div>
        <div className="disc-video">
          <AppShellUpdate startDelay={800} />
        </div>
        <button className="disc-gotit" type="button" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

export default function DiscoveryV1Page(): ReactElement {
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
    <div className="proto-card assist disc-v1">
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

      {walkthrough ? <Walkthrough onClose={() => setWalkthrough(false)} /> : null}
    </div>
  );
}
