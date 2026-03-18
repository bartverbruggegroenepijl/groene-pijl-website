// FPL Price Changes utility
// Voorspelt stijgers en dalers op basis van netto transfer-activiteit.
// Formule gebaseerd op FPL eigendom en transfer-drempel.

import { FPL_HEADERS } from './events';

const POSITION_MAP: Record<number, 'GK' | 'DEF' | 'MID' | 'FWD'> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export interface PriceChangePlayer {
  id: number;
  name: string;              // web_name
  fullName: string;          // first_name + second_name
  team: string;              // team short_name
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  nowCost: number;           // in miljoenen (bijv. 7.5)
  costChangeEvent: number;   // bevestigde prijswijziging dit GW (0.1m eenheden)
  netTransfers: number;      // transfers_in_event - transfers_out_event
  transfersIn: number;
  transfersOut: number;
  ownershipPercent: string;  // selected_by_percent
  imageUrl: string;
  status: 'confirmed' | 'expected';
  drempel: number;           // drempelwaarde voor debug
  // 'confirmed' = prijs IS al veranderd (cost_change_event !== 0)
  // 'expected'  = prijs nog niet veranderd maar verwacht op basis van netto transfers
}

export interface PriceChangesData {
  risers: PriceChangePlayer[];
  fallers: PriceChangePlayer[];
}

/** Formatteer netto transfers naar leesbare string: +245.3K, -1.2M, etc. */
export function formatNetTransfers(net: number): string {
  const abs = Math.abs(net);
  const sign = net >= 0 ? '+' : '-';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs}`;
}

interface FplElement {
  id: number;
  code: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: number;
  now_cost: number;
  cost_change_event: number;
  transfers_in_event: number;
  transfers_out_event: number;
  selected_by_percent: string;
}

interface FplTeam {
  id: number;
  short_name: string;
}

// Totaal aantal FPL spelers (benadering)
const FPL_TOTAL_PLAYERS = 8_000_000;
// Drempel: 5% van eigendom moet netto transfers zijn voor prijswijziging
const DREMPEL_FACTOR = 0.05;
// Minimum absolute netto transfers — filtert laag-eigendom spelers met kleine drempel eruit
const MIN_NETTO = 40_000;

export async function fetchPriceChanges(): Promise<PriceChangesData> {
  try {
    const res = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      { next: { revalidate: 1800 }, headers: FPL_HEADERS },
    );
    if (!res.ok) return { risers: [], fallers: [] };

    const data = await res.json();

    // Team short names lookup
    const teamNames: Record<number, string> = {};
    for (const t of (data.teams as FplTeam[] ?? [])) {
      teamNames[t.id] = t.short_name;
    }

    const allPlayers: Array<{
      el: FplElement;
      netto: number;
      drempel: number;
    }> = [];

    for (const el of (data.elements as FplElement[] ?? [])) {
      const ownershipNum    = parseFloat(el.selected_by_percent ?? '0');
      // Correcte drempel: 0.3% van het aantal eigenaren
      const eigendom_aantal = (ownershipNum / 100) * FPL_TOTAL_PLAYERS;
      const drempel         = eigendom_aantal * DREMPEL_FACTOR;
      const netto           = (el.transfers_in_event ?? 0) - (el.transfers_out_event ?? 0);

      allPlayers.push({ el, netto, drempel });
    }

    // ── DEBUG: top 20 spelers op absolute netto transfers ──────────────────
    const top20 = [...allPlayers]
      .sort((a, b) => Math.abs(b.netto) - Math.abs(a.netto))
      .slice(0, 20);

    console.log('[FPL prices] Top 20 spelers op netto transfers:');
    top20.forEach(({ el, netto, drempel }, i) => {
      const ownership = parseFloat(el.selected_by_percent ?? '0');
      const kwalificeert = netto >= drempel && netto > 0
        ? '↑ STIJGER'
        : netto <= -drempel && netto < 0
          ? '↓ DALER'
          : '—';
      console.log(
        `  ${String(i + 1).padStart(2)}. ${el.web_name.padEnd(20)} ` +
        `netto=${String(netto).padStart(7)}  drempel=${String(Math.round(drempel)).padStart(5)}  ` +
        `bezit=${String(ownership.toFixed(1)).padStart(5)}%  ` +
        `cost_chg=${el.cost_change_event}  ${kwalificeert}`,
      );
    });
    // ───────────────────────────────────────────────────────────────────────

    const risers: PriceChangePlayer[] = [];
    const fallers: PriceChangePlayer[] = [];

    for (const { el, netto, drempel } of allPlayers) {
      const costChange  = el.cost_change_event ?? 0;
      const isConfirmed = Math.abs(costChange) >= 1;

      const player: PriceChangePlayer = {
        id:               el.id,
        name:             el.web_name,
        fullName:         `${el.first_name} ${el.second_name}`.trim(),
        team:             teamNames[el.team] ?? '',
        position:         POSITION_MAP[el.element_type] ?? 'MID',
        nowCost:          el.now_cost / 10,
        costChangeEvent:  costChange,
        netTransfers:     netto,
        transfersIn:      el.transfers_in_event ?? 0,
        transfersOut:     el.transfers_out_event ?? 0,
        ownershipPercent: el.selected_by_percent ?? '0.0',
        imageUrl:         `https://resources.premierleague.com/premierleague/photos/players/110x140/p${el.code}.png`,
        status:           isConfirmed ? 'confirmed' : 'expected',
        drempel:          Math.round(drempel),
      };

      // STIJGER: netto boven drempel én boven absoluut minimum
      if (netto >= drempel && netto >= MIN_NETTO) {
        risers.push(player);
      }
      // DALER: netto onder negatieve drempel én onder absoluut minimum
      else if (netto <= -drempel && netto <= -MIN_NETTO) {
        fallers.push(player);
      }
    }

    // Sorteer stijgers op meeste netto transfers (hoogste eerst)
    risers.sort((a, b) => b.netTransfers - a.netTransfers);
    // Sorteer dalers op minste netto transfers (laagste eerst)
    fallers.sort((a, b) => a.netTransfers - b.netTransfers);

    console.log(`[FPL prices] Resultaat: ${risers.length} stijgers, ${fallers.length} dalers`);

    return { risers, fallers };
  } catch (err) {
    console.error('[FPL prices] Fetch mislukt:', err);
    return { risers: [], fallers: [] };
  }
}
