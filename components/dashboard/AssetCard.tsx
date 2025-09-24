"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Asset } from "@/types/asset";

export function AssetCard({ asset, onEdit, onDelete }: { asset: Asset; onEdit: (a: Asset) => void; onDelete: (id: string) => void }) {
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/80 transition-colors shadow-lg shadow-black/20 overflow-hidden">
      <Link href={`/assets/${asset._id}`} className="block">
        <div className="relative aspect-[4/3] bg-slate-900">
          <Image
            src={asset.thumbnailUrl}
            alt={asset.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover"
          />
          <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-cyan-400/30 transition-all" />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-white font-medium truncate" title={asset.name}>{asset.name}</h3>
          <span className="text-[10px] text-slate-400 uppercase border border-slate-700 rounded px-1 py-0.5">{asset.format}</span>
        </div>
      </div>
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-800 bg-slate-900/70">
        <Link
          href={`/assets/${asset._id}`}
          className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800/60"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(asset)}
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800/60 border border-transparent hover:border-slate-700"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(asset._id)}
            className="inline-flex items-center gap-1 text-red-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-red-600/20 border border-transparent hover:border-red-600/40"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
