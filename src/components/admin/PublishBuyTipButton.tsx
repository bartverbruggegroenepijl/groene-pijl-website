'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { togglePublishBuyTip } from '@/lib/kooptips/actions';

interface PublishBuyTipButtonProps {
  id: string;
  published: boolean;
}

export default function PublishBuyTipButton({ id, published: initialPublished }: PublishBuyTipButtonProps) {
  const [published, setPublished]    = useState(initialPublished);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !published;
    setPublished(next);
    startTransition(async () => {
      await togglePublishBuyTip(id, next);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                  font-medium transition-all disabled:opacity-60 cursor-pointer
                  ${published
                    ? 'bg-[#00A651]/15 text-[#00A651] hover:bg-[#00A651]/25'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                  }`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${published ? 'bg-[#00A651]' : 'bg-gray-600'}`} />
      )}
      {published ? 'Gepubliceerd' : 'Concept'}
    </button>
  );
}
