'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, AlertCircle, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { upsertSiteSetting, deleteSiteSetting } from '@/lib/settings/actions';

const MAX_SIZE_MB = 5;
const ACCEPTED    = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET      = 'site-assets';

interface HeroImageUploadProps {
  currentUrl: string | null;
}

export default function HeroImageUpload({ currentUrl }: HeroImageUploadProps) {
  const inputRef                   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]  = useState(false);
  const [removing, setRemoving]    = useState(false);
  const [error, setError]          = useState('');
  const [success, setSuccess]      = useState('');
  const [preview, setPreview]      = useState<string | null>(currentUrl);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    if (!ACCEPTED.includes(file.type)) {
      setError('Alleen JPG, PNG of WebP toegestaan.');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Maximaal ${MAX_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();

      // Build unique filename
      const ext  = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
      const path = `hero-image-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = data.publicUrl;

      // Save to site_settings
      startTransition(async () => {
        try {
          await upsertSiteSetting('hero_image', url);
          setPreview(url);
          setSuccess('Hero afbeelding opgeslagen!');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Opslaan mislukt.');
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (!preview) return;
    setError('');
    setSuccess('');
    setRemoving(true);

    try {
      const supabase = createClient();

      // Remove from storage
      const marker = `/object/public/${BUCKET}/`;
      const idx = preview.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(preview.slice(idx + marker.length));
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }

      // Remove from site_settings
      startTransition(async () => {
        try {
          await deleteSiteSetting('hero_image');
          setPreview(null);
          setSuccess('Afbeelding verwijderd.');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Verwijderen mislukt.');
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt.');
    } finally {
      setRemoving(false);
    }
  }

  const isLoading = uploading || removing || isPending;

  return (
    <div className="space-y-4">

      {/* Current image preview */}
      {preview ? (
        <div className="relative">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5">
            <Image src={preview} alt="Hero afbeelding" fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isLoading}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/90 hover:bg-red-500
                       text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            Verwijderen
          </button>
        </div>
      ) : (
        /* Upload dropzone */
        <div
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-white/15
                     hover:border-[#00A651]/50 bg-white/3 hover:bg-[#00A651]/5
                     flex flex-col items-center justify-center gap-3 cursor-pointer
                     transition-all duration-200 group"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-[#00A651]/15
                          flex items-center justify-center transition-colors">
            {isLoading
              ? <Loader2 className="w-6 h-6 text-[#00A651] animate-spin" />
              : <Upload className="w-6 h-6 text-gray-500 group-hover:text-[#00A651] transition-colors" />
            }
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
              {isLoading ? 'Bezig...' : 'Klik om een afbeelding te uploaden'}
            </p>
            <p className="text-xs text-gray-600 mt-1">JPG, PNG of WebP · max {MAX_SIZE_MB} MB</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleFileChange}
        disabled={isLoading}
        className="hidden"
      />

      {/* Upload button (if already has image) */}
      {preview && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10
                     text-gray-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg
                     transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Upload className="w-4 h-4" />
          }
          Andere afbeelding kiezen
        </button>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
                        rounded-lg px-3 py-2.5 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 bg-[#00A651]/10 border border-[#00A651]/30
                        rounded-lg px-3 py-2.5 text-[#00A651] text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}
    </div>
  );
}
