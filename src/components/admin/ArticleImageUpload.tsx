'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { uploadArticleImage, deleteArticleImage } from '@/lib/supabase/storage';

const MAX_SIZE_MB = 5;
const ACCEPTED    = ['image/jpeg', 'image/png', 'image/webp'];

interface ArticleImageUploadProps {
  /** Current image URL (controlled) */
  value: string;
  /** Called with the new URL after upload, or empty string after removal */
  onChange: (url: string) => void;
  /** Used as the filename slug */
  title?: string;
}

export default function ArticleImageUpload({
  value,
  onChange,
  title = 'artikel',
}: ArticleImageUploadProps) {
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

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
      const url = await uploadArticleImage(supabase, file, title);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (!value) return;
    setError('');
    const isSupabaseUrl = value.includes('.supabase.co');
    if (isSupabaseUrl) {
      try {
        const supabase = createClient();
        await deleteArticleImage(supabase, value);
      } catch {
        // Ignore delete errors
      }
    }
    onChange('');
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview */}
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Cover preview"
            className="w-full h-44 object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-500/80
                       text-white transition-colors opacity-0 group-hover:opacity-100"
            title="Afbeelding verwijderen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 border border-dashed
                   border-white/20 hover:border-[#00A651]/60 hover:bg-[#00A651]/5
                   rounded-xl py-3 text-sm text-gray-500 hover:text-[#00A651]
                   transition-all disabled:opacity-50 disabled:cursor-wait"
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Uploaden...</>
        ) : (
          <><Upload className="w-4 h-4" /> {value ? 'Andere afbeelding kiezen' : 'Afbeelding uploaden'}</>
        )}
      </button>

      {/* File info */}
      <p className="text-xs text-gray-600 flex items-center gap-1">
        <ImageIcon className="w-3 h-3" />
        JPG, PNG of WebP · max {MAX_SIZE_MB} MB
      </p>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30
                        rounded-lg px-3 py-2 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
