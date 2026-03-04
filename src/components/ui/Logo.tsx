import Link from 'next/link';

interface LogoProps {
  /** Icon size: 'sm' | 'md' (default) | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  /** Show the "DE GROENE PIJL" text next to the icon */
  showText?: boolean;
  /** Wrap in a Link to / (default: true) */
  linked?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { iconW: 24, iconH: 34, fontSize: '0.75rem' },
  md: { iconW: 30, iconH: 42, fontSize: '0.875rem' },
  lg: { iconW: 40, iconH: 56, fontSize: '1.1rem' },
};

/**
 * De Groene Pijl icon:
 * — Green outline △ on top   (#00FA61, neon glow)
 * — Magenta outline ▽ below  (#C821C3, neon glow)
 * Both triangles are hollow (stroke only, very subtle fill)
 */
function LogoIcon({ size = 'md' }: { size?: keyof typeof sizeMap }) {
  const { iconW, iconH } = sizeMap[size];
  return (
    <svg
      width={iconW}
      height={iconH}
      viewBox="0 0 40 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Green upward triangle — outline + neon glow */}
      <polygon
        points="20,2 38,26 2,26"
        fill="rgba(0,250,97,0.07)"
        stroke="#00FA61"
        strokeWidth="2.8"
        strokeLinejoin="round"
        style={{
          filter:
            'drop-shadow(0 0 3px #00FA61) drop-shadow(0 0 8px rgba(0,250,97,0.65))',
        }}
      />
      {/* Magenta downward triangle — outline + neon glow */}
      <polygon
        points="3,32 37,32 20,54"
        fill="rgba(200,33,195,0.07)"
        stroke="#C821C3"
        strokeWidth="2.8"
        strokeLinejoin="round"
        style={{
          filter:
            'drop-shadow(0 0 3px #C821C3) drop-shadow(0 0 8px rgba(200,33,195,0.65))',
        }}
      />
    </svg>
  );
}

export default function Logo({
  size = 'md',
  showText = true,
  linked = true,
  className = '',
}: LogoProps) {
  const { fontSize } = sizeMap[size];

  const inner = (
    <span className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      <LogoIcon size={size} />
      {showText && (
        <span
          className="font-bold text-white hidden sm:block"
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize,
            letterSpacing: '0.08em',
          }}
        >
          DE GROENE PIJL
        </span>
      )}
    </span>
  );

  if (!linked) return inner;

  return (
    <Link href="/" className="shrink-0">
      {inner}
    </Link>
  );
}
