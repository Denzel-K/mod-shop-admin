'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function ScaleEditor({ id, initialScale }: { id: string; initialScale: number }) {
  const [value, setValue] = useState<string>(String(initialScale));
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = async () => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return;
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scale: n }),
      });
      if (!res.ok) throw new Error('Failed to update');
      startTransition(() => router.refresh());
    } catch {
      // optionally show a toast
    }
  };

  return (
    <span className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type="number"
        step="0.0001"
        min="0.0001"
        className="h-7 w-24 bg-slate-800/60 border-slate-700 text-white"
      />
      <Button size="sm" className="h-7 px-3 bg-cyan-600 hover:bg-cyan-500" disabled={pending} onClick={save}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </span>
  );
}
