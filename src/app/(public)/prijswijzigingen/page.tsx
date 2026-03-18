import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Prijswijzigingen | De Groene Pijl',
  description: 'Bekijk welke FPL-spelers in prijs zijn gestegen of gedaald deze gameweek.',
};

export default function PrijswijzigingenPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0D0B2A 0%, #1F0E84 40%, #0D0B2A 100%)',
        paddingTop: 80,
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Terug link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.5)',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: 32,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          <ArrowLeft size={14} />
          Terug naar home
        </Link>

        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              color: '#00FA61',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              marginBottom: 10,
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            FPL Data
          </span>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: '#ffffff',
              fontFamily: 'Montserrat, sans-serif',
              lineHeight: 1.1,
              borderLeft: '4px solid #00FA61',
              paddingLeft: 16,
              marginBottom: 12,
            }}
          >
            Verwachte Prijswijzigingen
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 15,
              fontFamily: 'Montserrat, sans-serif',
              paddingLeft: 20,
              maxWidth: 520,
            }}
          >
            Bekijk de meest nauwkeurige voorspelling op LiveFPL.
          </p>
        </div>

        {/* Clean blok */}
        <div
          style={{
            borderRadius: 16,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '48px 32px',
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
              marginBottom: 32,
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
              padding: '16px 32px',
              borderRadius: 14,
              background: '#00FA61',
              color: '#000',
              fontSize: 16,
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Bekijk prijswijzigingen op LiveFPL →
          </a>
        </div>

      </div>
    </main>
  );
}
