'use client'

interface HeroSectionProps {
  currentGameweek?: number
  latestEpisodeUrl?: string
}

export default function HeroSection({ currentGameweek, latestEpisodeUrl }: HeroSectionProps) {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1361 0%, #1F0E84 40%, #2D1B69 70%, #0d1a3a 100%)',
      }}
    >
      {/* Spelersafbeelding */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-players.webp"
        alt="FPL spelers"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          height: '100%',
          width: '75%',
          objectFit: 'cover',
          objectPosition: 'right center',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Gradient fade links */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '45%',
          background: 'linear-gradient(to right, #1F0E84 0%, #1F0E84 20%, rgba(31,14,132,0.9) 60%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />
      {/* Gradient fade rechts */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '8%',
          background: 'linear-gradient(to left, #1F0E84 0%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* Groene/magenta glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 80% 50%, rgba(0,250,97,0.13) 0%, rgba(200,33,195,0.09) 45%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Decoratieve driehoeken */}
      <svg
        style={{
          position: 'absolute',
          right: '6%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 380,
          height: 420,
          opacity: 0.07,
          zIndex: 1,
          pointerEvents: 'none',
        }}
        viewBox="0 0 200 220"
      >
        <polygon points="100,5 195,175 5,175" fill="none" stroke="#00FA61" strokeWidth="2.5" />
        <polygon points="100,215 195,45 5,45" fill="none" stroke="#C821C3" strokeWidth="2.5" />
      </svg>

      {/* Tekst content links */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 1440,
          margin: '0 auto',
          padding: '80px 64px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Badge */}
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '6px 18px',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.15em',
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          DE ENIGE NEDERLANDSE FPL PODCAST
        </span>

        {/* H1 */}
        <h1
          style={{
            fontSize: 'clamp(42px, 5.5vw, 76px)',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.02,
            margin: 0,
            maxWidth: '44%',
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          DE PLEK VOOR
          <br />
          NEDERLANDSE
          <br />
          FPL MANAGERS
        </h1>

        {/* Groene subtitel */}
        <p
          style={{
            color: '#00FA61',
            fontSize: 18,
            fontWeight: 600,
            margin: 0,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          Fantasy Premier League podcast
        </p>

        {/* Body */}
        <p
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 15,
            maxWidth: 420,
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          Wekelijkse analyse, captainkeuzes en discussies om jouw
          FPL-team aan een groene pijl te helpen.
        </p>

        {/* Knoppen */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
          <a
            href={latestEpisodeUrl || '#afleveringen'}
            target={latestEpisodeUrl ? '_blank' : undefined}
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 26px',
              borderRadius: 25,
              background: '#00FA61',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              fontFamily: 'Montserrat, sans-serif',
              boxShadow: '0 0 20px rgba(0,250,97,0.4)',
            }}
          >
            🎙️ Luister nieuwste aflevering
          </a>
          <a
            href="#captain-pick"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '13px 26px',
              borderRadius: 25,
              border: '2px solid rgba(255,255,255,0.6)',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              background: 'transparent',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Bekijk captain advies
          </a>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: 32,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            marginTop: 8,
          }}
        >
          <div>
            <div style={{ color: '#00FA61', fontWeight: 700, fontSize: 17, fontFamily: 'Montserrat, sans-serif' }}>
              GW{currentGameweek || 29}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Elke week content</div>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>4</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Managers</div>
          </div>
          <div>
            <div style={{ fontSize: 18 }}>🎙️</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Spotify Podcast</div>
          </div>
        </div>
      </div>
    </section>
  )
}
