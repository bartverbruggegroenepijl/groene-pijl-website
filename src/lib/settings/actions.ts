'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Upsert a single setting ─────────────────────────────────

export async function upsertSiteSetting(key: string, value: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin/instellingen');
}

// ─── Delete a setting ────────────────────────────────────────

export async function deleteSiteSetting(key: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('site_settings')
    .delete()
    .eq('key', key);

  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/admin/instellingen');
}
