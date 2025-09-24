'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Upload, FileBox } from 'lucide-react';
import { toast } from 'sonner';
import type { Asset } from '@/types/asset';
import { TopBar } from '@/components/dashboard/TopBar';
import { AssetCard } from '@/components/dashboard/AssetCard';
import { UploadDialog } from '@/components/dashboard/UploadDialog';
import { DeleteConfirm } from '@/components/dashboard/DeleteConfirm';

export default function Dashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assets', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch assets');
      setAssets(data.assets || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
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
