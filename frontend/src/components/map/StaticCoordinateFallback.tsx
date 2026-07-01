type Props = {
  latitud: number;
  longitud: number;
  precision: number;
  className?: string;
  hint?: string;
};

/** Vista mínima offline: marcador y anillo de precisión sin tiles cartográficos. */
export const StaticCoordinateFallback = ({
  latitud,
  longitud,
  precision,
  className = '',
  hint,
}: Props) => {
  const radiusPx = Math.min(72, Math.max(18, precision * 1.8));

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-slate-100 ${className}`}
      role="img"
      aria-label={`Ubicación ${latitud.toFixed(6)}, ${longitud.toFixed(6)}`}
    >
      <svg
        viewBox="0 0 200 140"
        className="h-auto w-full max-w-[280px] px-4"
        aria-hidden
      >
        <rect width="200" height="140" fill="#f1f5f9" rx="8" />
        <line x1="20" y1="70" x2="180" y2="70" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="100" y1="20" x2="100" y2="120" stroke="#cbd5e1" strokeWidth="1" />
        <circle
          cx="100"
          cy="70"
          r={radiusPx}
          fill="rgba(13,148,136,0.15)"
          stroke="rgba(13,148,136,0.45)"
          strokeWidth="1.5"
        />
        <circle cx="100" cy="70" r="5" fill="#0f766e" />
        <circle cx="100" cy="70" r="9" fill="none" stroke="#0f766e" strokeWidth="2" />
      </svg>
      {hint ? (
        <p className="mt-2 max-w-xs px-4 text-center text-xs text-slate-600">{hint}</p>
      ) : null}
    </div>
  );
};
