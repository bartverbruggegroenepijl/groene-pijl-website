'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ─── Delete ─────────────────────────────────────────────────

export async function deleteManager(id: string): Promise<void> {
  const supabase = createClient();

  // Fetch avatar_url so we can remove it from storage
  const { data: manager } = await supabase
    .from('managers')
    .select('avatar_url')
    .eq('id', id)
    .single();

  // Delete avatar from player-images bucket if it exists
  if (manager?.avatar_url) {
    const marker = '/object/public/player-images/';
    const idx = manager.avatar_url.indexOf(marker);
    if (idx !== -1) {
      const path = decodeURIComponent(manager.avatar_url.slice(idx + marker.length));
      await supabase.storage.from('player-images').remove([path]);
    }
  }

  const { error } = await supabase
    .from('managers')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/managers');
}

// ─── Update ─────────────────────────────────────────────────

export async function updateManager(id: string, formData: FormData): Promise<void> {
  const supabase = createClient();

  const name          = (formData.get('name')          as string)?.trim()  || null;
  const role          = (formData.get('role')          as string)?.trim()  || null;
  const bio           = (formData.get('bio')           as string)?.trim()  || null;
  const instagram_url = (formData.get('instagram_url') as string)?.trim()  || null;
  const avatar_url    = (formData.get('avatar_url')    as string)?.trim()  || null;

  if (!name) throw new Error('Naam is verplicht.');

  const { error } = await supabase
    .from('managers')
    .update({ name, role, bio, instagram_url, avatar_url })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/managers');
  redirect('/admin/managers');
}
