import Link from 'next/link';

interface LogoProps {
  /** 'sm' = 28px icon, 'md' = 32px icon (default), 'lg' = 40px icon */
  size?: 'sm' | 'md' | 'lg';
  /** Show the "DE GROENE PIJL" text next to the icon */
  showText?: boolean;
  /** Wrap in a Link to / (default: true) */
  linked?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { w: 22, h: 27, tw: 'w-[22px] h-[27px]', text: 'text-sm' },
  md: { w: 28, h: 35, tw: 'w-7 h-[35px]', text: 'text-base' },
  lg: { w: 36, h: 44, tw: 'w-9 h-11', text: 'text-lg' },
};

function LogoSvg({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = sizeMap[size];
  return (
    <svg
      viewBox="0 0 36 44"
      fill="none"
      className={`${s.tw} flex-shrink-0 transition-all duration-300`}
      style={{ filter: 'drop-shadow(0 0 6px rgba(0,250,97,0.55))' }}
    >
      {/* Green upward triangle */}
      <polygon
        points="18,2 33,27 3,27"
        fill="#00FA61"
        style={{ filter: 'drop-shadow(0 0 5px rgba(0,250,97,0.9))' }}
      />
      {/* Magenta downward arrow */}
      <polygon
        points="10,30 26,30 18,42"
        fill="#C821C3"
        style={{ filter: 'drop-shadow(0 0 5px rgba(200,33,195,0.9))' }}
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
  const s = sizeMap[size];

  const inner = (
    <span className={`flex items-center gap-2.5 group ${className}`}>
      <LogoSvg size={size} />
      {showText && (
        <span
          className={`font-bold ${s.text} tracking-wide text-white hidden sm:block`}
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.06em' }}
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
