// FPL Price Changes utility
// Haalt stijgers en dalers op uit de FPL bootstrap-static API.

import { FPL_HEADERS } from './events';

const POSITION_MAP: Record<number, 'GK' | 'DEF' | 'MID' | 'FWD'> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export interface PriceChangePlayer {
  id: number;
  name: string;           // web_name
  fullName: string;       // first_name + second_name
  team: string;           // team short_name
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  nowCost: number;        // in miljoenen (bijv. 7.5)
  costChangeEvent: number; // prijswijziging in 0.1m eenheden (bijv. 1 = +£0.1m)
  netTransfers: number;   // transfers_in_event - transfers_out_event
  transfersIn: number;
  transfersOut: number;
  ownershipPercent: string; // selected_by_percent
  imageUrl: string;       // FPL spelersfoto URL
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
      { next: { revalidate: 300 }, headers: FPL_HEADERS },
    );
    if (!res.ok) return { risers: [], fallers: [] };

    const data = await res.json();

    // Team short names lookup
    const teamNames: Record<number, string> = {};
    for (const t of (data.teams as FplTeam[] ?? [])) {
      teamNames[t.id] = t.short_name;
    }

    const players: PriceChangePlayer[] = (data.elements as FplElement[] ?? []).map((el) => ({
      id: el.id,
      name: el.web_name,
      fullName: `${el.first_name} ${el.second_name}`.trim(),
      team: teamNames[el.team] ?? '',
      position: POSITION_MAP[el.element_type] ?? 'MID',
      nowCost: el.now_cost / 10,
      costChangeEvent: el.cost_change_event ?? 0,
      netTransfers: (el.transfers_in_event ?? 0) - (el.transfers_out_event ?? 0),
      transfersIn: el.transfers_in_event ?? 0,
      transfersOut: el.transfers_out_event ?? 0,
      ownershipPercent: el.selected_by_percent ?? '0.0',
      imageUrl: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${el.code}.png`,
    }));

    const risers = players
      .filter((p) => p.costChangeEvent > 0)
      .sort((a, b) => b.netTransfers - a.netTransfers);

    const fallers = players
      .filter((p) => p.costChangeEvent < 0)
      .sort((a, b) => a.netTransfers - b.netTransfers);

    return { risers, fallers };
  } catch {
    return { risers: [], fallers: [] };
  }
}
