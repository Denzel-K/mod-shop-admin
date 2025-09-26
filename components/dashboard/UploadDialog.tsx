"use client";

import { UploadForm } from "@/components/dashboard/UploadForm";
import type { Asset } from "@/types/asset";

export function UploadDialog({
  open,
  onClose,
  onUploaded,
  setUploading,
  asset,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  setUploading: (v: boolean) => void;
  asset?: Asset | null;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-white font-semibold">{asset ? 'Edit Asset' : 'Upload 3D Model'}</h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          <UploadForm onClose={onClose} onUploaded={onUploaded} setUploading={setUploading} asset={asset} />
        </div>
      </div>
    </div>
  );
}
