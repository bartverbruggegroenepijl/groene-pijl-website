'use client';

import { useTransition } from 'react';
import { togglePublishPlayerOfWeek } from '@/lib/player-of-week/actions';

interface PublishPlayerOfWeekButtonProps {
  id: string;
  published: boolean;
}

export default function PublishPlayerOfWeekButton({ id, published }: PublishPlayerOfWeekButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await togglePublishPlayerOfWeek(id, !published);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                  transition-all disabled:opacity-50
                  ${published
                    ? 'bg-[#00A651]/15 text-[#00A651] hover:bg-[#00A651]/25'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                  }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${published ? 'bg-[#00A651]' : 'bg-gray-600'}`} />
      {published ? 'Gepubliceerd' : 'Concept'}
    </button>
  );
}
