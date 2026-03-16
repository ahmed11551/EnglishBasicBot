/** Мини-иллюстрация для пустых состояний (стиль Easy Ten) */
export function EmptyStateIllustration() {
  return (
    <svg
      className="empty-state-illo"
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Книги */}
      <g className="empty-state-books">
        <rect x="20" y="32" width="22" height="28" rx="3" fill="var(--color-success-soft)" stroke="var(--color-success)" strokeWidth="1.5" opacity="0.9" />
        <line x1="26" y1="38" x2="36" y2="38" stroke="var(--color-success)" strokeWidth="1" opacity="0.6" />
        <line x1="26" y1="44" x2="34" y2="44" stroke="var(--color-success)" strokeWidth="1" opacity="0.4" />
        <rect x="48" y="28" width="24" height="32" rx="3" fill="var(--color-accent-soft)" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.9" />
        <line x1="54" y1="34" x2="66" y2="34" stroke="var(--color-accent)" strokeWidth="1" opacity="0.6" />
        <line x1="54" y1="40" x2="64" y2="40" stroke="var(--color-accent)" strokeWidth="1" opacity="0.4" />
        <rect x="78" y="35" width="20" height="25" rx="3" fill="var(--color-primary-soft, rgba(0, 40, 104, 0.15))" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.9" />
        <line x1="83" y1="40" x2="91" y2="40" stroke="var(--color-primary)" strokeWidth="1" opacity="0.5" />
      </g>
      {/* Глобус / планета */}
      <circle cx="60" cy="22" r="12" fill="none" stroke="var(--color-ring)" strokeWidth="2" opacity="0.8" />
      <ellipse cx="60" cy="22" rx="12" ry="5" fill="var(--color-surface)" stroke="var(--color-ring)" strokeWidth="1" opacity="0.5" />
      <path d="M48 22 H72 M60 10 V34" stroke="var(--color-ring)" strokeWidth="1" opacity="0.5" />
      {/* Звёздочка / успех */}
      <path
        d="M60 8 L61.5 12 L66 12 L62.5 14.5 L63.5 19 L60 16.5 L56.5 19 L57.5 14.5 L54 12 L58.5 12 Z"
        fill="var(--color-success)"
        opacity="0.9"
      />
    </svg>
  );
}
