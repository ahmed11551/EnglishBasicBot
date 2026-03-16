/** Единый набор SVG-иконок в стиле 2026 (stroke, 24x24) */

const baseClass = 'app-icon';

interface IconProps {
  className?: string;
}

function svgProps(props: IconProps = {}) {
  return {
    className: props.className ? `${baseClass} ${props.className}` : baseClass,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

export function IconLightning(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function IconCalendar(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function IconBook(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
    </svg>
  );
}

export function IconFolder(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
    </svg>
  );
}

export function IconFlame(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function IconTarget(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function IconLink(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function IconInfo(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function IconWarning(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconSpeaker(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export function IconCelebrate(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
      <path d="M5 15l1.5 2.5L9 19l-2.5 1.5L5 24l-1.5-3.5L1 19l2.5-1.5L5 15z" />
      <path d="M19 9l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
    </svg>
  );
}

export function IconSparkle(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 3l1.2 3.6L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3z" />
      <path d="M5 17l.8 2.4L8 20l-2.2.8L5 24l-.8-2.2L2 20l2.2-.8L5 17z" />
      <path d="M19 13l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8z" />
    </svg>
  );
}

/** Иконка модуля/темы (универсальная) */
export function IconModule(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v6h-6z" />
      <path d="M4 14h6v6H4z" />
      <path d="M14 14h6v6h-6z" />
    </svg>
  );
}

export function IconCards(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <rect x="2" y="4" width="14" height="16" rx="2" ry="2" />
      <rect x="8" y="8" width="14" height="16" rx="2" ry="2" />
      <line x1="11" y1="12" x2="18" y2="12" />
      <line x1="11" y1="16" x2="16" y2="16" />
    </svg>
  );
}

export function IconPencil(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function IconLetters(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 7V4h16v3" />
      <line x1="9" y1="20" x2="9" y2="7" />
      <line x1="15" y1="20" x2="15" y2="7" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
}

export function IconMic(props: IconProps = {}) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/** Спиннер загрузки */
export function IconSpinner(props: IconProps = {}) {
  const p = { ...props, className: `app-icon-spin ${props.className ?? ''}`.trim() };
  return (
    <svg {...svgProps(p)}>
      <circle cx="12" cy="12" r="10" strokeDasharray="32 56" strokeDashoffset="0" />
    </svg>
  );
}
