import {useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode} from 'react';
import AppShellUpdate from './AppShellUpdate';
import AssistantPage from './AssistantPage';
import DiscoveryV2Page from './DiscoveryV2Page';
import HorizonScanningDay0Page from './HorizonScanningDay0Page';
import HorizonScanningPage from './HorizonScanningPage';
import OpportunitiesPage from './OpportunitiesPage';

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

const ICONS = '/icons';

type ProjectKind = 'general' | 'compliance' | 'ma' | 'litigation';
type TypeFilter = 'favorites' | ProjectKind;
type Ownership = 'all' | 'owned' | 'shared';
type Screen = 'projects' | 'assistant' | 'assistant2' | 'discovery2' | 'discovery3' | 'horizon' | 'horizonDay0' | 'update' | 'frame' | 'opportunities' | 'animation';

const SCREEN_PATH: Record<Screen, string> = {
  assistant: '/assistant',
  assistant2: '/assistant-2',
  discovery2: '/discovery',
  discovery3: '/discovery-v3',
  horizon: '/horizon-scanning',
  horizonDay0: '/horizon-scanning-day0',
  update: '/update-dialog',
  frame: '/frame-shrink',
  projects: '/projects',
  opportunities: '/opportunities',
  animation: '/animation',
};

function screenFromPath(pathname: string): Screen {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const match = (Object.entries(SCREEN_PATH) as Array<[Screen, string]>).find(([, route]) => route === path);
  return match?.[0] ?? 'assistant2';
}

type Project = {
  id: string;
  name: string;
  type: ProjectKind;
  owner: 'me' | 'shared';
  favorite: boolean;
  updatedAt: string;
};

const SEED_PROJECTS: Project[] = [
  {id: 'p7', name: 'P7', type: 'general', owner: 'me', favorite: true, updatedAt: 'Updated just now'},
  {id: 'jl', name: 'JL - Test', type: 'compliance', owner: 'me', favorite: false, updatedAt: 'Updated 1d ago'},
  {id: 'rb', name: 'RB test', type: 'litigation', owner: 'me', favorite: false, updatedAt: 'Updated 2d ago'},
  {id: 'm1', name: 'Project 2', type: 'ma', owner: 'me', favorite: true, updatedAt: 'Updated yesterday'},
  {id: 'm2', name: 'Northstar diligence', type: 'ma', owner: 'me', favorite: false, updatedAt: 'Updated 3d ago'},
  {id: 'm3', name: 'Horizon merger', type: 'ma', owner: 'shared', favorite: false, updatedAt: 'Updated 6d ago'},
  {id: 'm4', name: 'Carve-out playbook', type: 'ma', owner: 'me', favorite: false, updatedAt: 'Updated 2w ago'},
  {id: 'm5', name: 'Bid strategy', type: 'ma', owner: 'shared', favorite: false, updatedAt: 'Updated 9d ago'},
  {id: 'm6', name: 'Integration tracker', type: 'ma', owner: 'me', favorite: false, updatedAt: 'Updated 4d ago'},
  {id: 'l1', name: 'Smith v. Acme', type: 'litigation', owner: 'me', favorite: true, updatedAt: 'Updated 1d ago'},
  {id: 'l2', name: 'Patent dispute 2025', type: 'litigation', owner: 'shared', favorite: false, updatedAt: 'Updated 4d ago'},
  {id: 'l3', name: 'Deposition prep', type: 'litigation', owner: 'me', favorite: false, updatedAt: 'Updated 2d ago'},
  {id: 'l4', name: 'Expert report review', type: 'litigation', owner: 'me', favorite: false, updatedAt: 'Updated 1w ago'},
  {id: 'l5', name: 'Motion to dismiss', type: 'litigation', owner: 'shared', favorite: false, updatedAt: 'Updated 5d ago'},
  {id: 'l6', name: 'Discovery tracker', type: 'litigation', owner: 'me', favorite: false, updatedAt: 'Updated 3d ago'},
  {id: 'l7', name: 'Trial war room', type: 'litigation', owner: 'me', favorite: false, updatedAt: 'Updated 6d ago'},
  {id: 'l8', name: 'Settlement analysis', type: 'litigation', owner: 'shared', favorite: false, updatedAt: 'Updated 2w ago'},
  {id: 'l9', name: 'Privilege log', type: 'litigation', owner: 'me', favorite: false, updatedAt: 'Updated 8d ago'},
];

function Icon({src, size}: {src: string; size: number}) {
  return (
    <span className="proto-icon" style={{width: size, height: size}}>
      <img src={src} alt="" />
    </span>
  );
}

function AskAiIcon(): ReactElement {
  return (
    <span className="proto-ask-ai" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none">
        <path
          className="proto-ask-ai__ring proto-ask-ai__ring--a"
          d="M7.12549 14.2491C4.76186 14.7364 2.6964 14.2564 1.86731 12.8164C0.645494 10.6927 2.56549 7.28908 6.16549 5.20908C9.76549 3.12908 13.6782 3.16544 14.9 5.28908C15.5764 6.45999 15.2928 8.02362 14.2964 9.53635"
          pathLength={1}
        />
        <path
          className="proto-ask-ai__ring proto-ask-ai__ring--b"
          d="M11.3914 2.29278C12.3654 3.97985 10.8342 6.68738 7.97144 8.34022C5.10864 9.99306 1.99828 9.96531 1.02425 8.27824C0.0502192 6.59117 1.58137 3.88364 4.44417 2.2308C7.30697 0.577966 10.4173 0.605715 11.3914 2.29278Z"
          pathLength={1}
        />
        <path
          className="proto-ask-ai__star"
          d="M11.2855 14.9909L10.3691 13.2891L8.72549 12.4309L10.4273 11.5654L11.2855 9.86362L12.1437 11.5291L13.8455 12.4309L12.2164 13.2891L11.2855 14.9909Z"
        />
      </svg>
    </span>
  );
}

function AppIcon({kind, size = 20}: {kind: ProjectKind; size?: number}) {
  const map: Record<ProjectKind, {bg: string; glyph: string}> = {
    general: {bg: assets.generalBg, glyph: assets.generalGlyph},
    compliance: {bg: assets.complianceBg, glyph: assets.complianceGlyph},
    ma: {bg: assets.maBg, glyph: assets.maGlyph},
    litigation: {bg: assets.litigationBg, glyph: assets.litigationGlyph},
  };
  const {bg, glyph} = map[kind];
  return (
    <span
      className={clsx('proto-app-icon', `proto-app-icon--${kind}`)}
      style={{width: size, height: size}}
    >
      <img className="proto-app-icon__bg" src={bg} alt="" />
      <span className="proto-app-icon__glyph-wrap">
        <img src={glyph} alt="" />
      </span>
    </span>
  );
}

const assets = {
  logo: `${ICONS}/logo.svg`,
  panelLeft: `${ICONS}/panel-left.svg`,
  star: `${ICONS}/star.svg`,
  archive: `${ICONS}/archive.svg`,
  search: `${ICONS}/search.svg`,
  plus: `${ICONS}/plus.svg`,
  folderOpen: `${ICONS}/folder-open.svg`,
  generalBg: `${ICONS}/general-bg.svg`,
  generalGlyph: `${ICONS}/general-glyph.svg`,
  complianceBg: `${ICONS}/compliance-bg.svg`,
  complianceGlyph: `${ICONS}/compliance-glyph.svg`,
  maBg: `${ICONS}/ma-bg.svg`,
  maGlyph: `${ICONS}/ma-glyph.svg`,
  litigationBg: `${ICONS}/litigation-bg.svg`,
  litigationGlyph: `${ICONS}/litigation-glyph.svg`,
  emptyGeneralLgBg: `${ICONS}/empty-general-lg-bg.svg`,
  emptyGeneralLgGlyph: `${ICONS}/empty-general-lg-glyph.svg`,
  emptyGeneralSmBg: `${ICONS}/empty-general-sm-bg.svg`,
  emptyGeneralSmGlyph: `${ICONS}/empty-general-sm-glyph.svg`,
  emptyComplianceLgBg: `${ICONS}/empty-compliance-lg-bg.svg`,
  emptyComplianceLgGlyph: `${ICONS}/empty-compliance-lg-glyph.svg`,
  emptyComplianceSmBg: `${ICONS}/empty-compliance-sm-bg.svg`,
  emptyComplianceSmGlyph: `${ICONS}/empty-compliance-sm-glyph.svg`,
  emptyMaLgBg: `${ICONS}/empty-ma-lg-bg.svg`,
  emptyMaLgGlyph: `${ICONS}/empty-ma-lg-glyph.svg`,
  emptyMaSmBg: `${ICONS}/empty-ma-sm-bg.svg`,
  emptyMaSmGlyph: `${ICONS}/empty-ma-sm-glyph.svg`,
  emptyLitigationLgBg: `${ICONS}/empty-litigation-lg-bg.svg`,
  emptyLitigationLgGlyph: `${ICONS}/empty-litigation-lg-glyph.svg`,
  emptyLitigationSmBg: `${ICONS}/empty-litigation-sm-bg.svg`,
  emptyLitigationSmGlyph: `${ICONS}/empty-litigation-sm-glyph.svg`,
} as const;

type LucideName =
  | 'folder'
  | 'folder-open'
  | 'calendar-clock'
  | 'clock'
  | 'library'
  | 'user'
  | 'users'
  | 'unplug'
  | 'bell'
  | 'layout-grid'
  | 'feather'
  | 'circle-help'
  | 'square-plus'
  | 'settings-2'
  | 'chevron-down'
  | 'chevrons-up-down';

type LucideShape =
  | {tag: 'path'; d: string; group?: string}
  | {tag: 'circle'; cx: number; cy: number; r: number; group?: string}
  | {tag: 'rect'; width: number; height: number; x: number; y: number; rx?: number; group?: string};

const LUCIDE_SHAPES: Record<LucideName, LucideShape[]> = {
  folder: [
    {tag: 'path', d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'},
  ],
  'folder-open': [
    {tag: 'path', d: 'm6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2'},
  ],
  'calendar-clock': [
    {tag: 'path', d: 'M16 2v4', group: 'proto-hs-calendar'},
    {tag: 'path', d: 'M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5', group: 'proto-hs-calendar'},
    {tag: 'path', d: 'M3 10h5', group: 'proto-hs-calendar'},
    {tag: 'path', d: 'M8 2v4', group: 'proto-hs-calendar'},
    {tag: 'circle', cx: 16, cy: 16, r: 6, group: 'proto-hs-clock'},
    {tag: 'path', d: 'M16 14v2.2l1.6 1', group: 'proto-hs-clock'},
  ],
  clock: [
    {tag: 'circle', cx: 12, cy: 12, r: 10, group: 'proto-clock-face'},
    {tag: 'path', d: 'M12 12V6', group: 'proto-clock-minute'},
    {tag: 'path', d: 'M12 12L16 14', group: 'proto-clock-hour'},
  ],
  library: [
    {tag: 'path', d: 'M4 4v16', group: 'proto-lib-book-a'},
    {tag: 'path', d: 'M8 8v12', group: 'proto-lib-book-b'},
    {tag: 'path', d: 'M12 6v14', group: 'proto-lib-book-c'},
    {tag: 'path', d: 'm16 6 4 14', group: 'proto-lib-fall'},
  ],
  user: [
    {tag: 'path', d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', group: 'proto-user-body'},
    {tag: 'circle', cx: 12, cy: 7, r: 4, group: 'proto-user-head'},
  ],
  users: [
    {tag: 'path', d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', group: 'proto-users-front'},
    {tag: 'circle', cx: 9, cy: 7, r: 4, group: 'proto-users-front'},
    {tag: 'path', d: 'M16 3.128a4 4 0 0 1 0 7.744', group: 'proto-users-back'},
    {tag: 'path', d: 'M22 21v-2a4 4 0 0 0-3-3.87', group: 'proto-users-back'},
  ],
  unplug: [
    {tag: 'path', d: 'm2 22 3-3', group: 'proto-plug-a'},
    {tag: 'path', d: 'M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z', group: 'proto-plug-a'},
    {tag: 'path', d: 'M7.5 13.5 10 11', group: 'proto-plug-a'},
    {tag: 'path', d: 'M10.5 16.5 13 14', group: 'proto-plug-a'},
    {tag: 'path', d: 'm19 5 3-3', group: 'proto-plug-b'},
    {tag: 'path', d: 'm12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z', group: 'proto-plug-b'},
  ],
  bell: [
    {tag: 'path', d: 'M10.268 21a2 2 0 0 0 3.464 0'},
    {tag: 'path', d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'},
  ],
  'layout-grid': [
    {tag: 'rect', width: 7, height: 7, x: 3, y: 3, rx: 1, group: 'proto-dash-tl'},
    {tag: 'rect', width: 7, height: 7, x: 14, y: 3, rx: 1, group: 'proto-dash-tr'},
    {tag: 'rect', width: 7, height: 7, x: 14, y: 14, rx: 1, group: 'proto-dash-br'},
    {tag: 'rect', width: 7, height: 7, x: 3, y: 14, rx: 1, group: 'proto-dash-bl'},
  ],
  feather: [
    {tag: 'path', d: 'M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z', group: 'proto-feather-body'},
    {tag: 'path', d: 'M16 8 2 22', group: 'proto-feather-quill'},
    {tag: 'path', d: 'M17.5 15H9', group: 'proto-feather-barb'},
  ],
  'circle-help': [
    {tag: 'circle', cx: 12, cy: 12, r: 10, group: 'proto-help-ring'},
    {tag: 'path', d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', group: 'proto-help-mark'},
    {tag: 'path', d: 'M12 17h.01', group: 'proto-help-mark'},
  ],
  'square-plus': [
    {tag: 'rect', width: 18, height: 18, x: 3, y: 3, rx: 2, group: 'proto-plus-box'},
    {tag: 'path', d: 'M8 12h8', group: 'proto-plus-mark'},
    {tag: 'path', d: 'M12 8v8', group: 'proto-plus-mark'},
  ],
  'settings-2': [
    {tag: 'path', d: 'M14 17H5', group: 'proto-set-track'},
    {tag: 'path', d: 'M19 7h-9', group: 'proto-set-track'},
    {tag: 'circle', cx: 7, cy: 7, r: 3, group: 'proto-set-knob-a'},
    {tag: 'circle', cx: 17, cy: 17, r: 3, group: 'proto-set-knob-b'},
  ],
  'chevron-down': [{tag: 'path', d: 'm6 9 6 6 6-6'}],
  'chevrons-up-down': [
    {tag: 'path', d: 'm7 15 5 5 5-5'},
    {tag: 'path', d: 'm7 9 5-5 5 5'},
  ],
};

const LUCIDE_MOTION_CLASS: Partial<Record<LucideName, string>> = {
  'calendar-clock': 'proto-hs-icon',
  clock: 'proto-clock-icon',
  'settings-2': 'proto-settings-icon',
  library: 'proto-library-icon',
  user: 'proto-user-icon',
  users: 'proto-users-icon',
  unplug: 'proto-unplug-icon',
  bell: 'proto-stroke-icon--tilt',
  'layout-grid': 'proto-dash-icon',
  feather: 'proto-feather-icon',
  'circle-help': 'proto-help-icon',
  'square-plus': 'proto-feedback-icon',
};

const LUCIDE_DRAW_GROUPS = new Set<string>(['proto-feather-body', 'proto-feather-quill', 'proto-feather-barb']);

function lucideGroups(shapes: LucideShape[]): string[] {
  const groups: string[] = [];
  for (const shape of shapes) {
    if (shape.group && !groups.includes(shape.group)) {
      groups.push(shape.group);
    }
  }
  return groups;
}

function lucideShapeNode(shape: LucideShape, key: number, draw: boolean): ReactElement {
  const className = draw ? 'proto-stroke-icon__path' : undefined;
  const pathLength = draw ? 1 : undefined;
  if (shape.tag === 'path') {
    return <path key={key} className={className} d={shape.d} pathLength={pathLength} />;
  }
  if (shape.tag === 'circle') {
    return (
      <circle
        key={key}
        className={className}
        cx={shape.cx}
        cy={shape.cy}
        r={shape.r}
        pathLength={pathLength}
      />
    );
  }
  return (
    <rect
      key={key}
      className={className}
      width={shape.width}
      height={shape.height}
      x={shape.x}
      y={shape.y}
      rx={shape.rx}
      pathLength={pathLength}
    />
  );
}

function LucideIcon({
  name,
  size,
  draw = true,
}: {
  name: LucideName;
  size: number;
  draw?: boolean;
}): ReactElement {
  const shapes = LUCIDE_SHAPES[name];
  const groups = lucideGroups(shapes);
  const motionClass = LUCIDE_MOTION_CLASS[name];

  return (
    <span
      className={clsx('proto-stroke-icon proto-stroke-icon--lucide', motionClass)}
      style={{width: size, height: size}}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none">
        {groups.length > 0
          ? groups.map((group) => (
              <g key={group} className={group}>
                {shapes
                  .filter((shape) => shape.group === group)
                  .map((shape, index) => lucideShapeNode(shape, index, LUCIDE_DRAW_GROUPS.has(group)))}
              </g>
            ))
          : shapes.map((shape, index) => lucideShapeNode(shape, index, name === 'bell' ? false : draw))}
      </svg>
    </span>
  );
}

type FigmaNavPart = {
  d?: string;
  className?: string;
  draw?: boolean;
  group?: string;
  circle?: {cx: number; cy: number; r: number};
};

const FIGMA_NAV_ICONS: Record<
  'graduation-cap' | 'area-chart' | 'telescope' | 'layout-list',
  {viewBox: string; strokeWidth: number; d?: string; parts?: FigmaNavPart[]}
> = {
  'graduation-cap': {
    viewBox: '0 0 14.8435 10.8335',
    strokeWidth: 1.237,
    d: 'M14.0827 4.0835V8.0835M3.41602 5.75016V8.0835C3.41602 8.61393 3.83744 9.12264 4.58759 9.49771C5.33773 9.87278 6.35515 10.0835 7.41602 10.0835C8.47688 10.0835 9.4943 9.87278 10.2444 9.49771C10.9946 9.12264 11.416 8.61393 11.416 8.0835V5.75016M13.6959 4.69824C13.8152 4.64559 13.9165 4.55908 13.9872 4.44944C14.0578 4.3398 14.0948 4.21183 14.0934 4.0814C14.0921 3.95096 14.0525 3.82379 13.9796 3.71563C13.9067 3.60747 13.8036 3.52308 13.6832 3.4729L7.96921 0.870238C7.79551 0.791004 7.60681 0.75 7.41588 0.75C7.22496 0.75 7.03626 0.791004 6.86255 0.870238L1.14921 3.47024C1.03053 3.52222 0.929559 3.60766 0.858659 3.71612C0.787759 3.82457 0.75 3.95133 0.75 4.08091C0.75 4.21048 0.787759 4.33724 0.858659 4.44569C0.929559 4.55415 1.03053 4.63959 1.14921 4.69157L6.86255 7.2969C7.03626 7.37614 7.22496 7.41714 7.41588 7.41714C7.60681 7.41714 7.79551 7.37614 7.96921 7.2969L13.6959 4.69824Z',
  },
  'area-chart': {
    viewBox: '0 0 13.5 13.5',
    strokeWidth: 1.125,
    parts: [
      {d: 'M0.75 0.75V12.75H12.75'},
      {d: 'M3.41667 6.75V10.0833H11.4167V4.08333'},
      {
        d: 'M3.41667 6.75L5.41667 4.75L8.08333 7.41667L11.4167 4.08333',
        className: 'proto-ih-line proto-stroke-icon__path',
        draw: true,
      },
    ],
  },
  telescope: {
    viewBox: '0 0 14.5516 13.3579',
    strokeWidth: 1.213,
    parts: [
      {
        d: 'M9.9437 12.6078L7.8737 8.46778M4.61035 12.6078L6.68035 8.46778M8.61035 7.27442C8.61035 8.0108 8.0134 8.60775 7.27702 8.60775C6.54064 8.60775 5.94369 8.0108 5.94369 7.27442C5.94369 6.53804 6.54064 5.94108 7.27702 5.94108C8.0134 5.94108 8.61035 6.53804 8.61035 7.27442Z',
      },
      {
        d: 'M3.38249 4.36312L4.12516 7.33379M5.98696 6.93635L1.86696 7.81502C1.70704 7.84973 1.53988 7.82008 1.40165 7.7325C1.26341 7.64492 1.16521 7.50644 1.12829 7.34702L0.77029 5.91369C0.7282 5.74099 0.752101 5.55881 0.837312 5.40281C0.922523 5.24682 1.0629 5.12826 1.23096 5.07035L10.2336 2.11035M8.31706 6.43908L11.2051 5.82308M10.267 2.56783C10.1813 2.22482 10.2353 1.86181 10.4172 1.55864C10.5991 1.25547 10.894 1.03696 11.237 0.95116L11.9636 0.769827C12.1351 0.727067 12.3164 0.754092 12.4679 0.844967C12.6194 0.935842 12.7287 1.08314 12.7716 1.25449L13.7816 5.29449C13.8246 5.466 13.7977 5.64755 13.7068 5.7992C13.6159 5.95085 13.4685 6.06019 13.297 6.10316L12.5703 6.28449C12.2273 6.37019 11.8643 6.31615 11.5611 6.13425C11.258 5.95234 11.0394 5.65748 10.9536 5.31449L10.267 2.56783Z',
        group: 'proto-opp-barrel',
      },
    ],
  },
  'layout-list': {
    viewBox: '0 0 13.5 13.5',
    strokeWidth: 1.125,
    parts: [
      {d: 'M8.08333 1.41667H12.75', className: 'proto-stroke-icon__path proto-list-line', draw: true},
      {d: 'M8.08333 4.75H12.75', className: 'proto-stroke-icon__path proto-list-line', draw: true},
      {d: 'M8.08333 8.75H12.75', className: 'proto-stroke-icon__path proto-list-line', draw: true},
      {d: 'M8.08333 12.0833H12.75', className: 'proto-stroke-icon__path proto-list-line', draw: true},
      {circle: {cx: 3.083335, cy: 3.083335, r: 2.333335}},
      {circle: {cx: 3.083335, cy: 10.416665, r: 2.333335}},
    ],
  },
};

function FigmaNavIcon({name}: {name: keyof typeof FIGMA_NAV_ICONS}): ReactElement {
  const icon = FIGMA_NAV_ICONS[name];
  const parts = icon.parts ?? [{d: icon.d ?? '', className: 'proto-stroke-icon__path', draw: true}];
  return (
    <span
      className={clsx(
        'proto-stroke-icon',
        name === 'graduation-cap' && 'proto-cap-icon',
        name === 'telescope' && 'proto-opp-icon',
      )}
      style={{width: 16, height: 16}}
      aria-hidden="true"
    >
      <svg viewBox={icon.viewBox} fill="none">
        {parts.map((part, index) => {
          const shape = part.circle ? (
            <circle
              key={part.group ? undefined : index}
              cx={part.circle.cx}
              cy={part.circle.cy}
              r={part.circle.r}
              className={part.className}
              strokeWidth={icon.strokeWidth}
            />
          ) : (
            <path
              key={part.group ? undefined : index}
              className={part.className}
              d={part.d}
              pathLength={part.draw ? 1 : undefined}
              strokeWidth={icon.strokeWidth}
            />
          );
          return part.group ? (
            <g key={index} className={part.group}>
              {shape}
            </g>
          ) : (
            shape
          );
        })}
      </svg>
    </span>
  );
}

function NavButton({
  active,
  sub,
  nested,
  sketch,
  children,
  expanded,
  onClick,
}: {
  active?: boolean;
  sub?: boolean;
  nested?: boolean;
  sketch?: boolean;
  children: ReactNode;
  expanded?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={clsx(
        'proto-nav-btn',
        sub && 'proto-nav-btn--sub',
        nested && 'proto-nav-btn--nested',
        sketch && 'proto-nav-btn--sketch',
        active && 'is-active',
      )}
      type="button"
      aria-expanded={expanded}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function EmptyTile({
  className,
  size,
  bg,
  glyph,
  kind,
  style,
}: {
  className: string;
  size: number;
  bg: string;
  glyph: string;
  kind: ProjectKind;
  style: CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <span className="proto-float__motion">
        <span
          className={clsx('proto-app-icon', `proto-app-icon--${kind}`)}
          style={{width: size, height: size}}
        >
          <img className="proto-app-icon__bg" src={bg} alt="" />
          <span className="proto-app-icon__glyph-wrap">
            <img src={glyph} alt="" />
          </span>
        </span>
      </span>
    </div>
  );
}

const EMPTY_TILES: Array<{
  className: string;
  size: number;
  kind: ProjectKind;
  bg: keyof typeof assets;
  glyph: keyof typeof assets;
  left: string;
  top: string;
}> = [
  {
    className: 'proto-float proto-float--lg',
    size: 36,
    kind: 'general',
    bg: 'emptyGeneralLgBg',
    glyph: 'emptyGeneralLgGlyph',
    left: '20.6%',
    top: '32.6%',
  },
  {
    className: 'proto-float proto-float--sm',
    size: 23,
    kind: 'general',
    bg: 'emptyGeneralSmBg',
    glyph: 'emptyGeneralSmGlyph',
    left: '75%',
    top: '57.1%',
  },
  {
    className: 'proto-float proto-float--sm',
    size: 23,
    kind: 'compliance',
    bg: 'emptyComplianceSmBg',
    glyph: 'emptyComplianceSmGlyph',
    left: '24.7%',
    top: '58.8%',
  },
  {
    className: 'proto-float proto-float--sm',
    size: 23,
    kind: 'litigation',
    bg: 'emptyLitigationSmBg',
    glyph: 'emptyLitigationSmGlyph',
    left: '62.5%',
    top: '28.6%',
  },
  {
    className: 'proto-float proto-float--lg',
    size: 36,
    kind: 'compliance',
    bg: 'emptyComplianceLgBg',
    glyph: 'emptyComplianceLgGlyph',
    left: '73.9%',
    top: '24.7%',
  },
  {
    className: 'proto-float proto-float--lg',
    size: 36,
    kind: 'litigation',
    bg: 'emptyLitigationLgBg',
    glyph: 'emptyLitigationLgGlyph',
    left: '30.8%',
    top: '65.4%',
  },
  {
    className: 'proto-float proto-float--lg',
    size: 36,
    kind: 'ma',
    bg: 'emptyMaLgBg',
    glyph: 'emptyMaLgGlyph',
    left: '67.1%',
    top: '63.6%',
  },
  {
    className: 'proto-float proto-float--sm',
    size: 23,
    kind: 'ma',
    bg: 'emptyMaSmBg',
    glyph: 'emptyMaSmGlyph',
    left: '33.2%',
    top: '20.6%',
  },
];

function EmptyCanvas({
  burst,
  title,
  ctaLabel,
  tiles,
  onCreate,
}: {
  burst: boolean;
  title: string;
  ctaLabel: string;
  tiles: typeof EMPTY_TILES;
  onCreate: () => void;
}) {
  const folderRef = useRef<HTMLDivElement>(null);
  const floatsRef = useRef<HTMLDivElement>(null);
  const [folderOpen, setFolderOpen] = useState(!burst);
  const [tilesOut, setTilesOut] = useState(!burst);
  const [drifting, setDrifting] = useState(!burst);

  useLayoutEffect(() => {
    const folder = folderRef.current;
    const floats = floatsRef.current;
    if (!burst || !folder || !floats) {
      return;
    }
    const folderBox = folder.getBoundingClientRect();
    const field = floats.getBoundingClientRect();
    const x = ((folderBox.left + folderBox.width / 2 - field.left) / field.width) * 100;
    const y = ((folderBox.top + folderBox.height / 2 - field.top) / field.height) * 100;
    floats.style.setProperty('--origin-x', `${x}%`);
    floats.style.setProperty('--origin-y', `${y}%`);
  }, [burst, folderOpen]);

  useEffect(() => {
    if (!burst) {
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setFolderOpen(true);
      setTilesOut(true);
      setDrifting(true);
      return;
    }
    setFolderOpen(false);
    setTilesOut(false);
    setDrifting(false);
    const open = window.setTimeout(() => setFolderOpen(true), 560);
    const burstOut = window.setTimeout(() => setTilesOut(true), 820);
    const drift = window.setTimeout(() => setDrifting(true), 2000);
    return () => {
      window.clearTimeout(open);
      window.clearTimeout(burstOut);
      window.clearTimeout(drift);
    };
  }, [burst]);

  return (
    <>
      <div
        ref={floatsRef}
        className={clsx(
          'proto-floats',
          burst && 'is-burst',
          tilesOut && 'is-out',
          drifting && 'is-drifting',
        )}
        aria-hidden="true"
      >
        {tiles.map((tile) => (
          <EmptyTile
            key={`${tile.left}-${tile.top}`}
            className={tile.className}
            size={tile.size}
            kind={tile.kind}
            bg={assets[tile.bg]}
            glyph={assets[tile.glyph]}
            style={
              {
                ...(burst
                  ? {'--end-left': tile.left, '--end-top': tile.top}
                  : {left: tile.left, top: tile.top}),
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className={clsx('proto-empty', burst && 'is-burst', folderOpen && 'is-open')}>
        {burst ? (
          <div
            ref={folderRef}
            className={clsx('proto-empty__folder', folderOpen && 'is-open')}
            aria-hidden="true"
          >
            <span className="proto-empty__folder-closed">
              <LucideIcon name="folder" size={36} />
            </span>
            <span className="proto-empty__folder-opened">
              <LucideIcon name="folder-open" size={36} />
            </span>
          </div>
        ) : (
          <Icon src={assets.folderOpen} size={36} />
        )}
        <div className="proto-empty__text">
          <p className="proto-empty__copy">{title}</p>
        </div>
        <button className="proto-btn" type="button" onClick={onCreate}>
          <Icon src={assets.plus} size={16} />
          {ctaLabel}
        </button>
      </div>
    </>
  );
}

export default function AllProjectsApp(): ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('general');
  const [ownership, setOwnership] = useState<Ownership>('all');
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState<ProjectKind>('general');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [screen, setScreenState] = useState<Screen>(() => screenFromPath(window.location.pathname));
  const [floatUiOpen, setFloatUiOpen] = useState(() => {
    const initial = screenFromPath(window.location.pathname);
    return initial === 'discovery2' || initial === 'discovery3';
  });
  const [oldOpen, setOldOpen] = useState(() => {
    const initial = screenFromPath(window.location.pathname);
    return (
      initial === 'assistant2' ||
      initial === 'discovery2' ||
      initial === 'discovery3' ||
      initial === 'update'
    );
  });
  const [assistantKey] = useState(0);
  const [assistantAltKey, setAssistantAltKey] = useState(0);
  const [discovery2Key, setDiscovery2Key] = useState(0);
  const [discovery3Key, setDiscovery3Key] = useState(0);
  const [horizonKey, setHorizonKey] = useState(0);
  const [horizonDay0Key, setHorizonDay0Key] = useState(0);
  const [updateKey, setUpdateKey] = useState(0);
  const [frameKey] = useState(0);

  const setScreen = (next: Screen) => {
    const path = SCREEN_PATH[next];
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setScreenState(next);
  };

  useEffect(() => {
    const path = SCREEN_PATH[screenFromPath(window.location.pathname)];
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path);
    }
    const onPop = () => setScreenState(screenFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (screen === 'discovery2' || screen === 'discovery3') {
      setFloatUiOpen(true);
    }
  }, [screen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDialogOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      if (typeFilter === 'favorites' && !project.favorite) {
        return false;
      }
      if (typeFilter !== 'favorites' && project.type !== typeFilter) {
        return false;
      }
      if (ownership === 'owned' && project.owner !== 'me') {
        return false;
      }
      if (ownership === 'shared' && project.owner !== 'shared') {
        return false;
      }
      if (q && !project.name.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [ownership, projects, query, typeFilter]);

  const openCreate = () => {
    setDraftName('');
    setDraftType(typeFilter === 'favorites' ? 'general' : typeFilter);
    setDialogOpen(true);
  };

  const createProject = () => {
    const name = draftName.trim();
    if (!name) {
      return;
    }
    const next: Project = {
      id: `new-${Date.now()}`,
      name,
      type: draftType,
      owner: 'me',
      favorite: typeFilter === 'favorites',
      updatedAt: 'Updated just now',
    };
    setProjects((current) => [next, ...current]);
    setTypeFilter(draftType);
    setOwnership('all');
    setQuery('');
    setSelectedId(next.id);
    setDialogOpen(false);
  };

  const toggleFavorite = (id: string) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === id ? {...project, favorite: !project.favorite} : project,
      ),
    );
  };

  const typeLabel: Record<TypeFilter, string> = {
    favorites: 'Favorites',
    general: 'General projects',
    compliance: 'Compliance',
    ma: 'M&A',
    litigation: 'Litigation',
  };

  if (screen === 'animation') {
    return (
      <div className="proto-anim-page">
        <AppShellUpdate style={{width: 'min(100cqw, calc(100cqh * 16 / 9))'}} />
      </div>
    );
  }

  return (
    <div className={clsx('proto-app', collapsed && 'proto-app--collapsed')}>
      <aside className="proto-sidebar">
        <div className="proto-sidebar__header">
          <div className="proto-sidebar__top">
            <div className="proto-sidebar__brand">
              <div className="proto-sidebar__logo">
                <img src={assets.logo} alt="EUDIA" />
              </div>
            </div>
            <button
              className="proto-icon-btn"
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed((value) => !value)}
            >
              <Icon src={assets.panelLeft} size={16} />
            </button>
          </div>
        </div>

        <div className="proto-sidebar__main">
          <div className="proto-nav-group">
            <NavButton expanded={oldOpen} onClick={() => setOldOpen((open) => !open)}>
              <LucideIcon name={oldOpen ? 'folder-open' : 'folder'} size={16} draw={false} />
              <span className="proto-nav-btn__label">OLD</span>
              <span className={clsx('proto-nav-btn__chevron', oldOpen && 'is-open')}>
                <LucideIcon name="chevron-down" size={16} draw={false} />
              </span>
            </NavButton>
            {oldOpen ? (
              <>
                <NavButton
                  sub
                  expanded={floatUiOpen}
                  onClick={() => setFloatUiOpen((open) => !open)}
                >
                  <img src="/assistant/dialog-sparkle.svg" alt="" width={16} height={16} />
                  <span className="proto-nav-btn__label">FloatUI-DisFeat</span>
                  <span className={clsx('proto-nav-btn__chevron', floatUiOpen && 'is-open')}>
                    <LucideIcon name="chevron-down" size={16} draw={false} />
                  </span>
                </NavButton>
                {floatUiOpen ? (
                  <>
                    <NavButton
                      nested
                      active={screen === 'discovery2'}
                      onClick={() => {
                        setScreen('discovery2');
                        setDiscovery2Key((value) => value + 1);
                      }}
                    >
                      <img src="/assistant/dialog-sparkle.svg" alt="" width={16} height={16} />
                      <span className="proto-nav-btn__label">Discovery V2</span>
                    </NavButton>
                    <NavButton
                      nested
                      active={screen === 'discovery3'}
                      onClick={() => {
                        setScreen('discovery3');
                        setDiscovery3Key((value) => value + 1);
                      }}
                    >
                      <img src="/assistant/dialog-sparkle.svg" alt="" width={16} height={16} />
                      <span className="proto-nav-btn__label">Discovery v3</span>
                    </NavButton>
                  </>
                ) : null}
                <NavButton
                  sub
                  active={screen === 'assistant2'}
                  onClick={() => {
                    setScreen('assistant2');
                    setAssistantAltKey((value) => value + 1);
                  }}
                >
                  <AskAiIcon />
                  <span className="proto-nav-btn__label">Assistant #2</span>
                </NavButton>
                <NavButton
                  sub
                  active={screen === 'update'}
                  onClick={() => {
                    setScreen('update');
                    setUpdateKey((value) => value + 1);
                  }}
                >
                  <img src="/assistant/dialog-sparkle.svg" alt="" width={16} height={16} />
                  <span className="proto-nav-btn__label">Update Dialog</span>
                </NavButton>
              </>
            ) : null}
            <NavButton
              active={screen === 'horizon'}
              onClick={() => {
                setScreen('horizon');
                setHorizonKey((value) => value + 1);
              }}
            >
              <AskAiIcon />
              <span className="proto-nav-btn__label">Horizon Scanning DisFeat</span>
            </NavButton>
            <NavButton
              active={screen === 'horizonDay0'}
              onClick={() => {
                setScreen('horizonDay0');
                setHorizonDay0Key((value) => value + 1);
              }}
            >
              <LucideIcon name="calendar-clock" size={16} draw={false} />
              <span className="proto-nav-btn__label">Horizon Scanning Day0</span>
            </NavButton>
          </div>

          <div className="proto-nav-group">
            <NavButton active={screen === 'projects'} onClick={() => setScreen('projects')}>
              <FigmaNavIcon name="layout-list" />
              <span className="proto-nav-btn__label">All projects</span>
            </NavButton>
          </div>

        </div>
        <div className="proto-sidebar__footer">
          <button className="proto-user" type="button">
            <span className="proto-avatar">SS</span>
            <span className="proto-user__meta">
              <span className="proto-user__name">Silky Szeto</span>
            </span>
            <LucideIcon name="chevrons-up-down" size={16} draw={false} />
          </button>
        </div>
      </aside>

      <main className="proto-main">
        {screen === 'assistant' ? (
          <AssistantPage key={assistantKey} onFind={() => setScreen('opportunities')} />
        ) : screen === 'assistant2' ? (
          <AssistantPage key={assistantAltKey} alt onFind={() => setScreen('opportunities')} />
        ) : screen === 'discovery2' ? (
          <DiscoveryV2Page key={discovery2Key} />
        ) : screen === 'discovery3' ? (
          <DiscoveryV2Page key={discovery3Key} variant="v3" />
        ) : screen === 'horizon' ? (
          <HorizonScanningPage key={horizonKey} />
        ) : screen === 'horizonDay0' ? (
          <HorizonScanningDay0Page key={horizonDay0Key} />
        ) : screen === 'opportunities' ? (
          <OpportunitiesPage />
        ) : screen === 'update' ? (
          <AssistantPage key={updateKey} updateDialog />
        ) : screen === 'frame' ? (
          <AssistantPage key={frameKey} frameShrink />
        ) : (
        <div className="proto-card">
          <header className="proto-page-header">
            <h1 className="proto-page-title">All your projects</h1>
          </header>
          <div className="proto-body">
            <div className="proto-split">
              <nav className="proto-types" aria-label="Project type">
                <div className="proto-types__header">
                  <p>Type</p>
                </div>
                <div className="proto-types__list">
                  <button
                    className={clsx('proto-type-btn', typeFilter === 'favorites' && 'is-active')}
                    type="button"
                    onClick={() => setTypeFilter('favorites')}
                  >
                    <Icon src={assets.star} size={16} />
                    <span className="proto-type-btn__label">Favorites</span>
                  </button>
                  <button
                    className={clsx('proto-type-btn', typeFilter === 'general' && 'is-active')}
                    type="button"
                    onClick={() => setTypeFilter('general')}
                  >
                    <AppIcon kind="general" />
                    <span className="proto-type-btn__label">General projects</span>
                  </button>
                  <button
                    className={clsx('proto-type-btn', typeFilter === 'compliance' && 'is-active')}
                    type="button"
                    onClick={() => setTypeFilter('compliance')}
                  >
                    <AppIcon kind="compliance" />
                    <span className="proto-type-btn__label">Compliance</span>
                  </button>
                  <button
                    className={clsx('proto-type-btn', typeFilter === 'ma' && 'is-active')}
                    type="button"
                    onClick={() => setTypeFilter('ma')}
                  >
                    <AppIcon kind="ma" />
                    <span className="proto-type-btn__label">M&A</span>
                  </button>
                  <button
                    className={clsx('proto-type-btn', typeFilter === 'litigation' && 'is-active')}
                    type="button"
                    onClick={() => setTypeFilter('litigation')}
                  >
                    <AppIcon kind="litigation" />
                    <span className="proto-type-btn__label">Litigation</span>
                  </button>
                </div>
              </nav>

              <section className="proto-workspace">
                <div className="proto-workspace__header">
                  <div className="proto-workspace__tabs-wrap">
                    <div className="proto-tabs" role="tablist" aria-label="Ownership">
                      <button
                        className={clsx('proto-tab', ownership === 'all' && 'is-active')}
                        type="button"
                        onClick={() => setOwnership('all')}
                      >
                        All
                      </button>
                      <button
                        className={clsx('proto-tab', ownership === 'owned' && 'is-active')}
                        type="button"
                        onClick={() => setOwnership('owned')}
                      >
                        <Icon src={assets.archive} size={16} />
                        Owned by me
                      </button>
                      <button
                        className={clsx('proto-tab', ownership === 'shared' && 'is-active')}
                        type="button"
                        onClick={() => setOwnership('shared')}
                      >
                        Shared with me
                      </button>
                    </div>
                  </div>
                  <div className="proto-actions">
                    {visible.length > 0 || query.trim() ? (
                      <>
                        <label className="proto-search">
                          <Icon src={assets.search} size={16} />
                          <input
                            type="search"
                            placeholder="Search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            aria-label="Search projects"
                          />
                        </label>
                        <button className="proto-btn" type="button" onClick={openCreate}>
                          <Icon src={assets.plus} size={16} />
                          Project
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="proto-workspace__body">
                  {visible.length === 0 ? (
                    <EmptyCanvas
                      key={`${typeFilter}-${ownership}-${query}`}
                      burst={typeFilter === 'compliance'}
                      title="No projects found"
                      ctaLabel="Project"
                      tiles={EMPTY_TILES}
                      onCreate={openCreate}
                    />
                  ) : (
                    <div className="proto-list">
                      {visible.map((project) => (
                        <div
                          key={project.id}
                          className="proto-list-row"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedId(project.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedId(project.id);
                            }
                          }}
                          style={
                            selectedId === project.id
                              ? {background: 'var(--base-sec-sidebar-active)'}
                              : undefined
                          }
                        >
                          <AppIcon kind={project.type} />
                          <span className="proto-list-row__name">{project.name}</span>
                          <span className="proto-list-row__meta">
                            {project.owner === 'me' ? 'John Doe' : 'Shared'}
                          </span>
                          <span className="proto-list-row__meta">{project.updatedAt}</span>
                          <button
                            className={clsx('proto-star', project.favorite && 'is-on')}
                            type="button"
                            aria-label={
                              project.favorite ? 'Remove from favorites' : 'Add to favorites'
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleFavorite(project.id);
                            }}
                          >
                            <Icon src={assets.star} size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {dialogOpen && (
                    <div className="proto-overlay" onClick={() => setDialogOpen(false)}>
                      <form
                        className="proto-dialog"
                        onClick={(event) => event.stopPropagation()}
                        onSubmit={(event) => {
                          event.preventDefault();
                          createProject();
                        }}
                      >
                        <h2>New project</h2>
                        <div className="proto-field">
                          <label htmlFor="proto-project-name">Name</label>
                          <input
                            id="proto-project-name"
                            autoFocus
                            value={draftName}
                            onChange={(event) => setDraftName(event.target.value)}
                            placeholder={`${typeLabel[draftType]} name`}
                          />
                        </div>
                        <div className="proto-field">
                          <span>Type</span>
                          <div className="proto-type-picks">
                            {(
                              [
                                ['general', 'General'],
                                ['compliance', 'Compliance'],
                                ['ma', 'M&A'],
                                ['litigation', 'Litigation'],
                              ] as const
                            ).map(([kind, label]) => (
                              <button
                                key={kind}
                                className={clsx(
                                  'proto-type-pick',
                                  draftType === kind && 'is-active',
                                )}
                                type="button"
                                onClick={() => setDraftType(kind)}
                              >
                                <AppIcon kind={kind} />
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="proto-dialog__actions">
                          <button
                            className="proto-btn proto-btn--ghost"
                            type="button"
                            onClick={() => setDialogOpen(false)}
                          >
                            Cancel
                          </button>
                          <button className="proto-btn" type="submit">
                            <Icon src={assets.plus} size={16} />
                            Project
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
