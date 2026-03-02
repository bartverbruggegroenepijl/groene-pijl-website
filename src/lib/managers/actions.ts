'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
