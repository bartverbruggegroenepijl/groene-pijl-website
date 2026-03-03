import { createClient } from '@/lib/supabase/server';
import { updateBuyTip } from '@/lib/kooptips/actions';
import BuyTipBuilder from '@/components/admin/BuyTipBuilder';
import { notFound } from 'next/navigation';
import type { BuyTip, BuyTipPlayer } from '@/types';

interface BewerkenPageProps {
  params: { id: string };
}

export default async function BewerkenKooptipsPage({ params }: BewerkenPageProps) {
  const supabase = createClient();

  const [{ data: tip, error: tipError }, { data: players }] = await Promise.all([
    supabase
      .from('buy_tips')
      .select('*')
      .eq('id', params.id)
      .single(),
    supabase
      .from('buy_tip_players')
      .select('*')
      .eq('buy_tip_id', params.id),
  ]);

  if (tipError || !tip) {
    notFound();
  }

  const updateBuyTipWithId = updateBuyTip.bind(null, params.id);

  return (
    <BuyTipBuilder
      existingTip={tip as BuyTip}
      existingPlayers={(players ?? []) as BuyTipPlayer[]}
      action={updateBuyTipWithId}
      mode="bewerken"
    />
  );
}
