import { createBuyTip } from '@/lib/kooptips/actions';
import BuyTipBuilder from '@/components/admin/BuyTipBuilder';

export default function NieuweKooptipsPage() {
  return (
    <BuyTipBuilder
      action={createBuyTip}
      mode="nieuw"
    />
  );
}
