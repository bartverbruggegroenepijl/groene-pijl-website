import { fetchPriceChanges } from '@/lib/fpl/prices';
import { fetchGameweekInfo } from '@/lib/fpl/events';
import PrijswijzigingenClient from './PrijswijzigingenClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Prijswijzigingen | De Groene Pijl',
  description: 'Bekijk welke FPL-spelers in prijs zijn gestegen of gedaald deze gameweek.',
};

export default async function PrijswijzigingenPage() {
  const [{ risers, fallers }, gwInfo] = await Promise.all([
    fetchPriceChanges(),
    fetchGameweekInfo(),
  ]);

  const currentGW = gwInfo.currentGW;

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
        <div style={{ marginBottom: 36 }}>
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
            FPL Data{currentGW ? ` · Gameweek ${currentGW}` : ''}
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
            Prijswijzigingen
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
            Spelers die deze gameweek in prijs zijn gestegen of gedaald op basis van transferactiviteit.
          </p>
        </div>

        {/* Client component: tabs + filters + kaarten */}
        <PrijswijzigingenClient
          risers={risers}
          fallers={fallers}
          currentGW={currentGW}
        />
      </div>
    </main>
  );
}
