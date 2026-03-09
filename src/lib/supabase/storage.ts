import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'player-images';

// ─── Helpers ────────────────────────────────────────────────

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getExtension(file: File): string {
  const mime = file.type;
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png')  return 'png';
  if (mime === 'image/webp') return 'webp';
  // Fallback: use file name extension
  const parts = file.name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
}

/**
 * Extracts the storage path from a full Supabase Storage public URL.
 * Example:
 *   https://<project>.supabase.co/storage/v1/object/public/player-images/salah-1234.jpg
 *   → salah-1234.jpg
 */
function pathFromUrl(url: string): string {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return '';
  return decodeURIComponent(url.slice(idx + marker.length));
}

// ─── Upload ──────────────────────────────────────────────────

/**
 * Upload a player image to the "player-images" bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadPlayerImage(
  supabase: SupabaseClient,
  file: File,
  playerName: string
): Promise<string> {
  const slug   = toSlug(playerName || 'player');
  const ext    = getExtension(file);
  const path   = `${slug}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert:      false,
    });

  if (error) throw new Error(error.message);

  return getPlayerImageUrl(supabase, path);
}

// ─── Delete ──────────────────────────────────────────────────

/**
 * Delete a player image by its public URL.
 */
export async function deletePlayerImage(
  supabase: SupabaseClient,
  url: string
): Promise<void> {
  const path = pathFromUrl(url);
  if (!path) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw new Error(error.message);
}

// ─── Get URL ─────────────────────────────────────────────────

/**
 * Returns the public URL for a given storage path.
 */
export function getPlayerImageUrl(
  supabase: SupabaseClient,
  path: string
): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Article images ──────────────────────────────────────────

const ARTICLE_BUCKET = 'article-images';

/**
 * Upload an article cover image to the "article-images" bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadArticleImage(
  supabase: SupabaseClient,
  file: File,
  title: string
): Promise<string> {
  const slug = toSlug(title || 'artikel');
  const ext  = getExtension(file);
  const path = `${slug}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(ARTICLE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert:      false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(ARTICLE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete an article image by its public URL.
 */
export async function deleteArticleImage(
  supabase: SupabaseClient,
  url: string
): Promise<void> {
  const marker = `/object/public/${ARTICLE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + marker.length));

  const { error } = await supabase.storage
    .from(ARTICLE_BUCKET)
    .remove([path]);

  if (error) throw new Error(error.message);
}
