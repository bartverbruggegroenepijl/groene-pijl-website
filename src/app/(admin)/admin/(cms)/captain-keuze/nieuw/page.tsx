import { createCaptainPick } from '@/lib/captain/actions';
import CaptainPickBuilder from '@/components/admin/CaptainPickBuilder';

export default function NieuweCaptainKeuzePage() {
  return (
    <CaptainPickBuilder
      action={createCaptainPick}
      mode="nieuw"
    />
  );
}
