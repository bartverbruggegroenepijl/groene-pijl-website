'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateClubShirt(id: string, shirtImageUrl: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('clubs')
    .update({ shirt_image_url: shirtImageUrl })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/clubs');
}
