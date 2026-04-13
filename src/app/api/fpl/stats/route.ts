import { NextResponse } from 'next/server';

interface FplApiPlayer {
  id: number;
  code: number;
  photo: string;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  total_points: number;
  event_points: number;
  now_cost: number;
  selected_by_percent: string;
  goals_scored: number;
  assists: number;
  minutes: number;
  clean_sheets: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  saves: number;
  yellow_cards: number;
  red_cards: number;
  points_per_game: string;
  form: string;
  bonus: number;
  bps: number;
  goals_conceded: number;
}

interface FplApiTeam {
  id: number;
  name: string;
  short_name: string;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

const POSITION_MAP: Record<number, 'GK' | 'DEF' | 'MID' | 'FWD'> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export async function GET() {
  try {
    const res = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      next: { revalidate: 300 },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://fantasy.premierleague.com/',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `FPL API error ${res.status}` }, { status: 502 });
    }

    const data = await res.json();

    // Team id → info map
    const teamMap: Record<number, { short: string; full: string }> = {};
    (data.teams as FplApiTeam[]).forEach((t) => {
      teamMap[t.id] = { short: t.short_name, full: t.name };
    });

    // Map players
    const players = (data.elements as FplApiPlayer[]).map((p) => {
      const imageUrl = p.photo
        ? `https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png`
        : null;
      return {
        id: p.id,
        code: p.code,
        name: p.web_name,
        fullName: `${p.first_name} ${p.second_name}`,
        team: teamMap[p.team]?.short ?? '',
        teamFull: teamMap[p.team]?.full ?? '',
        teamId: p.team,
        position: POSITION_MAP[p.element_type] ?? 'FWD',
        imageUrl,
        // Points
        total_points: p.total_points,
        event_points: p.event_points,
        points_per_game: parseFloat(p.points_per_game) || 0,
        form: parseFloat(p.form) || 0,
        // Price / ownership
        price: p.now_cost / 10,
        ownership: parseFloat(p.selected_by_percent) || 0,
        // Minutes
        minutes: p.minutes,
        // Goals / assists
        goals_scored: p.goals_scored,
        assists: p.assists,
        // xStats
        expected_goals: parseFloat(p.expected_goals) || 0,
        expected_assists: parseFloat(p.expected_assists) || 0,
        expected_goal_involvements: parseFloat(p.expected_goal_involvements) || 0,
        expected_goals_conceded: parseFloat(p.expected_goals_conceded) || 0,
        // Defence
        clean_sheets: p.clean_sheets ?? 0,
        saves: p.saves ?? 0,
        goals_conceded: p.goals_conceded ?? 0,
        // Cards
        yellow_cards: p.yellow_cards ?? 0,
        red_cards: p.red_cards ?? 0,
        // Bonus
        bonus: p.bonus ?? 0,
        bps: p.bps ?? 0,
      };
    });

    // Aggregate team stats
    interface TeamAgg {
      id: number;
      name: string;
      fullName: string;
      xG: number;
      xGC: number;
      goals_scored: number;
      goals_conceded: number;
      clean_sheets: number;
      gkMinutes: number;
    }
    const teamAgg: Record<number, TeamAgg> = {};
    const fplTeams = data.teams as FplApiTeam[];
    fplTeams.forEach((t) => {
      teamAgg[t.id] = {
        id: t.id,
        name: t.short_name,
        fullName: t.name,
        xG: 0,
        xGC: 0,
        goals_scored: 0,
        goals_conceded: 0,
        clean_sheets: 0,
        gkMinutes: 0,
      };
    });

    players.forEach((p) => {
      const t = teamAgg[p.teamId];
      if (!t) return;
      t.xG += p.expected_goals;
      t.goals_scored += p.goals_scored;
      // xGC and clean sheets: use GK data only
      if (p.position === 'GK') {
        t.xGC += p.expected_goals_conceded;
        t.goals_conceded += p.goals_conceded;
        if (p.minutes > t.gkMinutes) {
          t.gkMinutes = p.minutes;
          t.clean_sheets = p.clean_sheets;
        }
      }
    });

    const teams = Object.values(teamAgg).map((t) => ({
      id: t.id,
      name: t.name,
      fullName: t.fullName,
      xG: Math.round(t.xG * 100) / 100,
      xGC: Math.round(t.xGC * 100) / 100,
      goals_scored: t.goals_scored,
      goals_conceded: t.goals_conceded,
      clean_sheets: t.clean_sheets,
      minutes: t.gkMinutes,
    }));

    return NextResponse.json(
      { players, teams },
      { headers: { 'Cache-Control': 'no-store, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (err) {
    console.error('FPL stats error:', err);
    return NextResponse.json({ error: 'Kon FPL statistieken niet ophalen' }, { status: 500 });
  }
}
