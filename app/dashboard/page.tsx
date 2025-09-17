'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Upload, LogOut, ImageIcon, FileBox } from 'lucide-react';

type Asset = {
  _id: string;
  name: string;
  description?: string;
  thumbnailUrl: string;
  modelUrl: string;
  format: 'glb' | 'gltf';
  scale?: number;
};

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
      {/* Top Bar */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_24px] shadow-cyan-400/50" />
            <h1 className="text-white text-xl font-semibold tracking-wide">Mod Shop Library</h1>
            <span className="text-xs text-slate-400 border border-slate-700 rounded px-1.5 py-0.5">3D Models</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setEditingAsset(null); setShowUpload(true); }} className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700">
              <Plus className="w-4 h-4 mr-2" /> Upload Model
            </Button>
            <Button onClick={handleLogout} variant="outline" className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

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
              <div key={asset._id} className="group rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/80 transition-colors shadow-lg shadow-black/20 overflow-hidden">
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
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 px-3 bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={() => { setEditingAsset(asset); setShowUpload(true); }}>Edit</Button>
                    <Button size="sm" variant="destructive" className="h-8 px-3 bg-red-600 hover:bg-red-500" onClick={() => setDeletingId(asset._id)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Dialog (inline minimal) */}
      {showUpload && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !isUploading && setShowUpload(false)}>
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-white font-semibold">{editingAsset ? 'Edit Asset' : 'Upload 3D Model'}</h4>
              
            </div>
            <UploadForm
              onClose={() => setShowUpload(false)}
              onUploaded={() => { setShowUpload(false); fetchAssets(); setEditingAsset(null); }}
              setUploading={setIsUploading}
              asset={editingAsset}
            />
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeletingId(null)}>
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-white font-semibold mb-3">Delete asset?</h4>
            <p className="text-slate-400 text-sm mb-5">This will permanently remove the asset and its files.</p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" className="bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={() => setDeletingId(null)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-500" onClick={async () => {
                const id = deletingId; setDeletingId(null);
                if (!id) return;
                await fetch(`/api/assets/${id}`, { method: 'DELETE' });
                fetchAssets();
              }}>Yes, delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadForm({ onClose, onUploaded, setUploading, asset }: { onClose: () => void; onUploaded: () => void; setUploading: (v: boolean) => void; asset?: Asset | null }) {
  const [name, setName] = useState(asset?.name || '');
  const [description, setDescription] = useState(asset?.description || '');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [scaleOverride, setScaleOverride] = useState<string>(asset?.scale ? String(asset.scale) : '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isModelDragOver, setIsModelDragOver] = useState(false);
  const [isThumbDragOver, setIsThumbDragOver] = useState(false);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (thumbFile) {
      const url = URL.createObjectURL(thumbFile);
      setThumbPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbPreviewUrl(null);
    }
  }, [thumbFile]);

  const isEdit = !!asset;
  const canSubmit = useMemo(() => {
    if (isEdit) return !!name && !submitting; // editing metadata only
    return !!name && !!modelFile && !!thumbFile && !submitting; // creating requires files
  }, [isEdit, name, modelFile, thumbFile, submitting]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setUploading(true);
    setError('');
    try {
      let res: Response;
      if (isEdit && asset) {
        res = await fetch(`/api/assets/${asset._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, scale: scaleOverride ? Number(scaleOverride) : undefined }),
        });
      } else {
        const fd = new FormData();
        fd.set('name', name);
        if (description) fd.set('description', description);
        if (scaleOverride.trim()) fd.set('scale', scaleOverride.trim());
        if (modelFile) fd.set('model', modelFile);
        if (thumbFile) fd.set('thumbnail', thumbFile);
        res = await fetch('/api/assets', { method: 'POST', body: fd });
      }
      const data = await res.json();
      if (!res.ok) {
        const msg: string = data?.error || (isEdit ? 'Save failed' : 'Upload failed');
        throw new Error(msg);
      }
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-5 space-y-5">
      {error && (
        <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-300">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nissan GTR R35" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" required />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Auto-scaling</Label>
          <div className="text-xs text-slate-400 border border-slate-700 rounded-lg p-3 bg-slate-800/40">
            {isEdit ? (
              <>Update name/description/scale below. Re-upload files is not supported in this dialog.</>
            ) : (
              <>We automatically compute a display scale from the model’s bounding box so cars render uniformly. No manual scale input needed.</>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scale" className="text-slate-300">Scale override (optional)</Label>
          <Input
            id="scale"
            type="number"
            min="0.0001"
            step="0.0001"
            value={scaleOverride}
            onChange={(e) => setScaleOverride(e.target.value)}
            placeholder="e.g. 100"
            className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500"
          />
          <p className="text-xs text-slate-500">If provided, this value will be used instead of the auto-computed scale.</p>
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description" className="text-slate-300">Description (optional)</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Model (.glb/.gltf)</Label>
          <div
            className={`border border-dashed rounded-lg p-4 bg-slate-800/40 transition-colors ${
              isModelDragOver ? 'border-cyan-500/60 bg-slate-800/60' : 'border-slate-700'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsModelDragOver(true); }}
            onDragLeave={() => setIsModelDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsModelDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file && /\.(glb|gltf)$/i.test(file.name)) setModelFile(file);
            }}
          >
            <div className="text-sm text-slate-400">
              {modelFile ? (
                <div className="flex items-center justify-between">
                  <span className="truncate">{modelFile.name}</span>
                  <button type="button" className="text-cyan-400 hover:text-cyan-300 text-xs" onClick={() => setModelFile(null)}>Change</button>
                </div>
              ) : (
                <>
                  <p>Drag & drop your .glb or .gltf file here</p>
                  <p className="text-xs mt-1">or click to browse</p>
                </>
              )}
            </div>
            <input
              accept=".glb,.gltf"
              type="file"
              onChange={(e) => setModelFile(e.target.files?.[0] || null)}
              className="sr-only"
              id="model-input"
            />
            <label htmlFor="model-input" className="block mt-3 text-center text-xs text-slate-300 underline cursor-pointer">Choose file</label>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Thumbnail (image)</Label>
          <div
            className={`border border-dashed rounded-lg p-4 bg-slate-800/40 transition-colors ${
              isThumbDragOver ? 'border-cyan-500/60 bg-slate-800/60' : 'border-slate-700'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsThumbDragOver(true); }}
            onDragLeave={() => setIsThumbDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsThumbDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) setThumbFile(file);
            }}
          >
            {thumbPreviewUrl ? (
              <div className="flex items-center gap-4">
                <Image src={thumbPreviewUrl} alt="Thumbnail preview" width={128} height={80} className="h-20 w-32 object-cover rounded border border-slate-700" />
                <div className="text-sm text-slate-400 truncate">{thumbFile?.name}</div>
                <button type="button" className="ml-auto text-cyan-400 hover:text-cyan-300 text-xs" onClick={() => setThumbFile(null)}>Change</button>
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                <p>Drag & drop an image here</p>
                <p className="text-xs mt-1">or click to browse</p>
              </div>
            )}
            <input
              accept="image/*"
              type="file"
              onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
              className="sr-only"
              id="thumb-input"
            />
            <label htmlFor="thumb-input" className="block mt-3 text-center text-xs text-slate-300 underline cursor-pointer">Choose file</label>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" onClick={onClose} disabled={submitting} variant="outline" className="bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50">Cancel</Button>
        <Button type="submit" disabled={!canSubmit} className="bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 flex items-center gap-2">
          {submitting && <span className="inline-block h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
          {submitting ? (isEdit ? 'Saving…' : 'Uploading…') : (isEdit ? 'Save changes' : 'Upload')}
        </Button>
      </div>
    </form>
  );
}
