'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Upload, Check, Loader2 } from 'lucide-react';
import { updateClubShirt } from '@/lib/clubs/actions';
import { createClient } from '@/lib/supabase/client';

interface Club {
  id: string;
  name: string;
  short_name: string | null;
  shirt_image_url: string | null;
}

interface ClubsManagerProps {
  clubs: Club[];
}

function ClubCard({ club }: { club: Club }) {
  const [isPending, startTransition] = useTransition();
  const [shirtUrl, setShirtUrl] = useState(club.shirt_image_url ?? '');
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const fileName = `${club.id}-${Date.now()}.${file.name.split('.').pop()}`;

    const { data, error } = await supabase.storage
      .from('club-shirts')
      .upload(fileName, file, { upsert: true });

    if (error) {
      setUploading(false);
      alert('Upload mislukt: ' + error.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('club-shirts')
      .getPublicUrl(data.path);

    setShirtUrl(publicUrl);
    setUploading(false);

    startTransition(async () => {
      await updateClubShirt(club.id, publicUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-4 flex items-center gap-4">
      {/* Shirt preview */}
      <div className="w-14 h-14 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
        {shirtUrl ? (
          <div className="relative w-12 h-12">
            <Image src={shirtUrl} alt={club.name} fill className="object-contain" />
          </div>
        ) : (
          <span className="text-white/20 text-xs font-bold">{club.short_name ?? club.name.slice(0, 3).toUpperCase()}</span>
        )}
      </div>

      {/* Club name */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">{club.name}</p>
        {club.short_name && <p className="text-gray-500 text-xs">{club.short_name}</p>}
      </div>

      {/* Upload button */}
      <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
        saved
          ? 'bg-[#00A651]/15 text-[#00A651] border border-[#00A651]/40'
          : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
      } ${uploading || isPending ? 'opacity-60 cursor-not-allowed' : ''}`}>
        {uploading || isPending ? (
          <><Loader2 size={13} className="animate-spin" /> Uploaden...</>
        ) : saved ? (
          <><Check size={13} /> Opgeslagen</>
        ) : (
          <><Upload size={13} /> Upload shirt</>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading || isPending}
        />
      </label>
    </div>
  );
}

export default function ClubsManager({ clubs }: ClubsManagerProps) {
  if (clubs.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
        <p className="text-gray-500 text-sm">Nog geen clubs in de database. Voer eerst het SQL schema uit.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {clubs.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  );
}
