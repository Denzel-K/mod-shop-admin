'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Upload, FileBox } from 'lucide-react';
import { toast } from 'sonner';
import type { Asset } from '@/types/asset';
import { TopBar } from '@/components/dashboard/TopBar';
import { AssetCard } from '@/components/dashboard/AssetCard';
import { UploadDialog } from '@/components/dashboard/UploadDialog';
import { DeleteConfirm } from '@/components/dashboard/DeleteConfirm';
import { FilterBar, type AssetFilters } from '@/components/dashboard/FilterBar';

export default function Dashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AssetFilters>({});
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.make) params.set('make', filters.make);
      if (filters.model) params.set('model', filters.model);
      if (filters.year) params.set('year', String(filters.year));
      if (filters.assetSource) params.set('assetSource', filters.assetSource);
      if (filters.tag) params.set('tag', filters.tag);
      const qs = params.toString();
      const url = qs ? `/api/assets?${qs}` : '/api/assets';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch assets');
      setAssets(data.assets || []);
      // Persist filters in URL (without full reload)
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch assets');
      console.log('Error: ', error)
    } finally {
      setLoading(false);
    }
  }, [filters, router, pathname, error]);

  useEffect(() => {
    // Initialize filters from current URL on first mount
    const q = searchParams.get('q') || undefined;
    const make = searchParams.get('make') || undefined;
    const model = searchParams.get('model') || undefined;
    const yearStr = searchParams.get('year') || undefined;
    const assetSource = searchParams.get('assetSource') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const initial: AssetFilters = {
      q,
      make,
      model,
      year: yearStr ? Number(yearStr) : undefined,
      assetSource: (assetSource as AssetFilters['assetSource']) || undefined,
      tag,
    };
    // Only set if any param present to avoid unnecessary state update
    if (Object.values(initial).some((v) => v !== undefined)) {
      setFilters(initial);
    }
    // Always fetch on mount
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar onUploadClick={() => { setEditingAsset(null); setShowUpload(true); }} onLogout={handleLogout} />

      {/* Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <FilterBar value={filters} onChange={(f) => { setFilters(f); }} onApply={fetchAssets} />
        {/* Empty/Loading States */}
        {loading ? (
          <div className="min-h-[50vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-slate-800 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-2/3 bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : assets.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
              <FileBox className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-white text-xl font-semibold">No models yet</h2>
            <p className="text-slate-400 mt-1">Upload .glb or .gltf car models with a thumbnail to get started.</p>
            <Button onClick={() => setShowUpload(true)} className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700">
              <Upload className="w-4 h-4 mr-2" /> Upload Model
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {assets.map((asset) => (
              <AssetCard key={asset._id} asset={asset} onEdit={(a) => { setEditingAsset(a); setShowUpload(true); }} onDelete={(id) => setDeletingId(id)} />
            ))}
          </div>
        )}
      </main>

      <UploadDialog
        open={showUpload}
        onClose={() => { if (!isUploading) setShowUpload(false); }}
        onUploaded={() => { setShowUpload(false); fetchAssets(); setEditingAsset(null); }}
        setUploading={setIsUploading}
        asset={editingAsset}
      />

      {deletingId && (
        <DeleteConfirm
          onCancel={() => setDeletingId(null)}
          onConfirm={async () => {
            const id = deletingId; setDeletingId(null);
            if (!id) return;
            const t = toast.loading('Deleting asset…');
            try {
              const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Failed to delete asset');
              }
              toast.success('Asset deleted');
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Delete failed');
            } finally {
              toast.dismiss(t);
              fetchAssets();
            }
          }}
        />
      )}
    </div>
  );
}
