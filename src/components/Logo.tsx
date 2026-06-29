import { cn } from "./ui";

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cn("drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="adf-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a1330" />
          <stop offset="1" stopColor="#050816" />
        </linearGradient>
        <linearGradient id="adf-stroke" x1="10" y1="48" x2="54" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="0.5" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#adf-bg)" stroke="rgba(125,211,252,0.25)" strokeWidth="1.5" />
      {/* Ascending "A" made of growth bars */}
      <path
        d="M20 46 L32 18 L44 46"
        stroke="url(#adf-stroke)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M25.5 36 H38.5" stroke="url(#adf-stroke)" strokeWidth="4.5" strokeLinecap="round" />
      {/* data nodes */}
      <circle cx="32" cy="18" r="2.6" fill="#a5f3fc" />
      <circle cx="20" cy="46" r="2.2" fill="#38bdf8" />
      <circle cx="44" cy="46" r="2.2" fill="#818cf8" />
    </svg>
  );
}

export function Logo({
  size = 40,
  showText = true,
  className,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showText && (
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-cyan-50">
            ADF
          </div>
          <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-cyan-300/60">
            Digital Futurist
          </div>
        </div>
      )}
    </div>
  );
}
