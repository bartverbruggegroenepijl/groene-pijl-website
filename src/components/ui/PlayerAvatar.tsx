'use client';

import { useState } from 'react';

interface Props {
  imageUrl: string | null;
  name: string;
  /** Breedte in px voor de container. Default: 100%. */
  width?: number | string;
  /** Hoogte in px voor de container. Default: 100%. */
  height?: number | string;
  objectPosition?: string;
  /** Extra inline styles voor de container */
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Toont een spelersfoto. Bij een laadFout (onError) of ontbrekende URL
 * wordt een initialen-placeholder getoond in de Groene Pijl huisstijl.
 */
export default function PlayerAvatar({
  imageUrl,
  name,
  width = '100%',
  height = '100%',
  objectPosition = '50% 10%',
  style,
  className,
}: Props) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  if (!imageUrl || failed) {
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1F0E84 0%, #2d1b69 100%)',
          borderRadius: 'inherit',
        }}
        className={className}
      >
        <span
          style={{
            color: '#00FA61',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 800,
            fontSize: typeof width === 'number' ? Math.round(width * 0.3) : '1.5rem',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {initials || '?'}
        </span>
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={name}
        onError={() => setFailed(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition,
          display: 'block',
        }}
      />
    </div>
  );
}
