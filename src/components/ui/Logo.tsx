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
  sm: { iconW: 28, iconH: 32, glowW: 32, glowH: 32, fontSize: '0.75rem'  },
  md: { iconW: 36, iconH: 40, glowW: 40, glowH: 40, fontSize: '0.875rem' },
  lg: { iconW: 48, iconH: 54, glowW: 54, glowH: 54, fontSize: '1.1rem'   },
};

function LogoIcon({ size = 'md' }: { size?: keyof typeof sizeMap }) {
  const { iconW, iconH, glowW, glowH } = sizeMap[size];
  return (
    <div style={{ position: 'relative', width: iconW, height: iconH, flexShrink: 0 }}>
      {/* Glow achter het beeldmerk */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: glowW,
          height: glowH,
          background:
            'radial-gradient(ellipse, rgba(0,250,97,0.6) 0%, rgba(200,33,195,0.4) 50%, transparent 70%)',
          filter: 'blur(10px)',
          borderRadius: '50%',
          zIndex: 0,
        }}
      />
      {/* SVG beeldmerk */}
      <svg
        width={iconW}
        height={iconH}
        viewBox="0 0 465 540"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Groene pijl omhoog */}
        <path
          fill="#00FA61"
          d="M461.62,255.74h-185.33c-2.11,0-3.82-1.56-3.82-3.48v-34.93c0-1.92,1.71-3.48,3.82-3.48h86.76c3.24,0,5.01-3.45,2.93-5.71L235.66,66.49c-1.53-1.66-4.33-1.66-5.86,0L99.47,208.14c-2.08,2.26-.31,5.71,2.93,5.71h80.68c2.11,0,3.82-1.56,3.82-3.48v-38.53c0-.79.3-1.56.84-2.18l38.38-43.51c2.26-2.56,6.8-1.11,6.8,2.18v123.93c0,1.92-1.71,3.48-3.82,3.48H3.83c-3.24,0-5.01-3.45-2.93-5.71L229.8,1.25c1.53-1.66,4.33-1.66,5.86,0l228.9,248.79c2.08,2.26.31,5.71-2.93,5.71Z"
        />
        {/* Magenta pijl omlaag */}
        <path
          fill="#CC2200"
          d="M461.62,283.33H3.83c-3.24,0-5.01,3.45-2.93,5.71l228.9,248.79c1.53,1.66,4.33,1.66,5.86,0l228.9-248.79c2.08-2.26.31-5.71-2.93-5.71ZM365.98,330.93l-130.33,141.65c-1.53,1.66-4.33,1.66-5.86,0l-130.32-141.65c-2.08-2.26-.31-5.71,2.93-5.71h260.65c3.24,0,5.01,3.45,2.93,5.71Z"
        />
      </svg>
    </div>
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
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}
      className={className}
    >
      <LogoIcon size={size} />
      {showText && (
        <span
          className="hidden sm:block"
          style={{
            color: 'white',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          DE GROENE PIJL
        </span>
      )}
    </div>
  );

  if (!linked) return inner;

  return (
    <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
      {inner}
    </Link>
  );
}
