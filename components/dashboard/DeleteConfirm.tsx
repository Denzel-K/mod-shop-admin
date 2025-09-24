"use client";

import { Button } from "@/components/ui/button";

export function DeleteConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <h4 className="text-white font-semibold mb-3">Delete asset?</h4>
        <p className="text-slate-400 text-sm mb-5">This will permanently remove the asset and its files.</p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" className="bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={onCancel}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-500" onClick={() => void onConfirm()}>Yes, delete</Button>
        </div>
      </div>
    </div>
  );
}
