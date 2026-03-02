'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { togglePublishTeam } from '@/lib/team/actions';

interface PublishToggleButtonProps {
  id: string;
  published: boolean;
}

export default function PublishToggleButton({ id, published }: PublishToggleButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await togglePublishTeam(id, !published);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  transition-all disabled:opacity-60 cursor-pointer
                  ${published
                    ? 'bg-[#00A651]/15 text-[#00A651] hover:bg-[#00A651]/25'
                    : 'bg-white/8 text-gray-400 hover:bg-white/12'
                  }`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${published ? 'bg-[#00A651]' : 'bg-gray-500'}`} />
      )}
      {published ? 'Gepubliceerd' : 'Concept'}
    </button>
  );
}
