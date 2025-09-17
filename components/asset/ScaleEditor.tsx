'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';

export default function ScaleEditor({ id, initialScale, inlineReadOnlyInitially = false }: { id: string; initialScale: number; inlineReadOnlyInitially?: boolean }) {
  const [value, setValue] = useState<string>(String(initialScale));
  const [isEditing, setIsEditing] = useState<boolean>(inlineReadOnlyInitially ? false : true);
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
      setIsEditing(false);
    } catch {
      // optionally show a toast
    }
  };

  if (!isEditing) {
    return (
      <span className="inline-flex items-center gap-2 text-slate-200">
        <span className="tabular-nums">{value}</span>
        <button
          type="button"
          aria-label="Edit scale"
          className="p-1 rounded hover:bg-slate-800/70 border border-transparent hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </span>
    );
  }

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
      {inlineReadOnlyInitially && (
        <Button size="sm" variant="outline" className="h-7 px-2 bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      )}
    </span>
  );
}
