/** Fallback при загрузке lazy-маршрутов (Suspense) */
export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Загрузка">
      <div className="page-loader-spinner" aria-hidden />
      <p className="page-loader-text">Загрузка…</p>
    </div>
  );
}
