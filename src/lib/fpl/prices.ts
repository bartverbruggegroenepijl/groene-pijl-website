// FPL Price Changes utility
// Voorspelt stijgers en dalers op basis van netto transfer-activiteit,
// identiek aan de LiveFPL-methode.

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

export async function fetchPriceChanges(): Promise<PriceChangesData> {
  try {
    const res = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      // revalidate: 1800 = elke 30 minuten (prijswijzigingen zijn niet vaker relevant)
      { next: { revalidate: 1800 }, headers: FPL_HEADERS },
    );
    if (!res.ok) return { risers: [], fallers: [] };

    const data = await res.json();

    // Team short names lookup
    const teamNames: Record<number, string> = {};
    for (const t of (data.teams as FplTeam[] ?? [])) {
      teamNames[t.id] = t.short_name;
    }

    const risers: PriceChangePlayer[] = [];
    const fallers: PriceChangePlayer[] = [];

    for (const el of (data.elements as FplElement[] ?? [])) {
      const ownershipNum   = parseFloat(el.selected_by_percent ?? '0');
      // Drempel = 1% van het huidig eigendom (LiveFPL methode)
      const drempel        = ownershipNum * 1000 * 0.01;
      const netto          = (el.transfers_in_event ?? 0) - (el.transfers_out_event ?? 0);
      const costChange     = el.cost_change_event ?? 0;
      const isConfirmed    = Math.abs(costChange) >= 1;

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
      };

      // Verwachte STIJGER: netto > drempel EN price nog niet gedaald
      if (netto > drempel && costChange >= 0) {
        risers.push(player);
      }
      // Verwachte DALER: netto < -drempel EN price nog niet gestegen
      else if (netto < -drempel && costChange <= 0) {
        fallers.push(player);
      }
    }

    // Sorteer stijgers op meeste netto transfers (hoogste eerst)
    risers.sort((a, b) => b.netTransfers - a.netTransfers);
    // Sorteer dalers op minste netto transfers (laagste eerst)
    fallers.sort((a, b) => a.netTransfers - b.netTransfers);

    return { risers, fallers };
  } catch {
    return { risers: [], fallers: [] };
  }
}
