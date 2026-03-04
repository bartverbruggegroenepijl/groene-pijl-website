'use client';

import { useRef, useState } from 'react';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadPlayerImage, deletePlayerImage } from '@/lib/supabase/storage';

const MAX_SIZE_MB = 2;
const ACCEPTED    = ['image/jpeg', 'image/png', 'image/webp'];

interface PlayerImageUploadProps {
  /** Current image URL (controlled) */
  value: string | null;
  /** Called with the new URL after upload, or null after removal */
  onChange: (url: string | null) => void;
  /** Used as the filename slug */
  playerName?: string;
}

export default function PlayerImageUpload({
  value,
  onChange,
  playerName = 'player',
}: PlayerImageUploadProps) {
  const inputRef              = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset
    setError('');

    // Validate type
    if (!ACCEPTED.includes(file.type)) {
      setError('Alleen JPG, PNG of WebP toegestaan.');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Maximaal ${MAX_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const url = await uploadPlayerImage(supabase, file, playerName);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt.');
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (!value) return;
    setError('');
    // Only delete from Supabase Storage when the URL is actually a Supabase URL.
    // FPL CDN URLs (resources.premierleague.com) are external and must not be deleted.
    const isSupabaseUrl = value.includes('.supabase.co');
    if (isSupabaseUrl) {
      try {
        const supabase = createClient();
        await deletePlayerImage(supabase, value);
      } catch {
        // Ignore delete errors — the URL is already unlinked from the form
      }
    }
    onChange(null);
  }

  // ── Preview state ──────────────────────────────────────────
  if (value) {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Speler foto"
          className="w-8 h-8 rounded-full object-cover border border-white/15 flex-shrink-0"
        />
        {/* Remove */}
        <button
          type="button"
          onClick={handleRemove}
          title="Foto verwijderen"
          className="p-1 text-gray-600 hover:text-red-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // ── Upload state ───────────────────────────────────────────
  return (
    <div className="flex-shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Foto uploaden"
        className={`p-2 rounded-lg transition-all
          ${uploading
            ? 'text-gray-600 cursor-wait'
            : 'text-gray-600 hover:text-[#00A651] hover:bg-[#00A651]/10'
          }`}
      >
        {uploading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Camera className="w-4 h-4" />
        }
      </button>

      {error && (
        <div className="absolute z-10 mt-1 flex items-center gap-1.5
                        bg-red-500/10 border border-red-500/30 rounded-lg
                        px-2.5 py-1.5 text-red-400 text-xs whitespace-nowrap">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
