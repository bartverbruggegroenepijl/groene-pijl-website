import { createClient } from '@/lib/supabase/server';
import { updateManager } from '@/lib/managers/actions';
import ManagerForm from '@/components/admin/ManagerForm';
import { notFound } from 'next/navigation';
import type { Manager } from '@/types';

interface BewerkenPageProps {
  params: { id: string };
}

export default async function ManagerBewerkenPage({ params }: BewerkenPageProps) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('managers')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const action = updateManager.bind(null, params.id);

  return (
    <ManagerForm
      manager={data as Manager}
      action={action}
    />
  );
}
