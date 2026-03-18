// PrijswijzigingenSection — homepage blok
// Verwijst door naar LiveFPL voor nauwkeurige real-time prijswijzigingen.

export default function PrijswijzigingenSection() {
  return (
    <section
      className="py-20 px-4"
      style={{
        backgroundImage: "url('/gradient-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderTop: '2px solid rgba(0,250,97,0.18)',
      }}
    >
      <div className="max-w-8xl mx-auto">

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-2">
            FPL Data
          </span>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight border-l-4 pl-4"
            style={{ color: '#ffffff', borderColor: '#00FA61' }}
          >
            Verwachte Prijswijzigingen
          </h2>
        </div>

        {/* Clean blok */}
        <div
          style={{
            borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '40px 32px',
            textAlign: 'center',
            maxWidth: 620,
            margin: '0 auto',
          }}
        >
          <p
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: 16,
              fontFamily: 'Montserrat, sans-serif',
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            Wil je weten welke spelers vanavond in prijs stijgen of dalen? LiveFPL biedt de meest nauwkeurige real-time prijsvoorspellingen.
          </p>
          <a
            href="https://www.livefpl.net/prices"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 12,
              background: '#00FA61',
              color: '#000',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Bekijk prijswijzigingen op LiveFPL →
          </a>
        </div>

      </div>
    </section>
  );
}
