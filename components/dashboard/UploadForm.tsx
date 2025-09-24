"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Asset } from "@/types/asset";
import { toast } from "sonner";

export function UploadForm({ onClose, onUploaded, setUploading, asset }: { onClose: () => void; onUploaded: () => void; setUploading: (v: boolean) => void; asset?: Asset | null }) {
  const [name, setName] = useState(asset?.name || '');
  const [description, setDescription] = useState(asset?.description || '');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [scaleOverride, setScaleOverride] = useState<string>(asset?.scale ? String(asset.scale) : '');
  // New fields
  const [assetSource, setAssetSource] = useState<string>('');
  const [creatorText, setCreatorText] = useState<string>('');
  const [creatorName, setCreatorName] = useState<string>('');
  const [creatorProfileUrl, setCreatorProfileUrl] = useState<string>('');
  const [creatorSourcePageUrl, setCreatorSourcePageUrl] = useState<string>('');
  const [creatorLicense, setCreatorLicense] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [variant, setVariant] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  // Metadata (category inputs)
  const [wrappableSurfaces, setWrappableSurfaces] = useState<string>('');
  const [rims, setRims] = useState<string>('');
  const [windows, setWindows] = useState<string>('');
  const [doors, setDoors] = useState<string>('');
  const [tyres, setTyres] = useState<string>('');
  const [interior, setInterior] = useState<string>('');
  const [lights, setLights] = useState<string>('');
  const [metadataJson, setMetadataJson] = useState<string>('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isModelDragOver, setIsModelDragOver] = useState(false);
  const [isThumbDragOver, setIsThumbDragOver] = useState(false);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          body: JSON.stringify({
            name,
            description,
            scale: scaleOverride ? Number(scaleOverride) : undefined,
            assetSource: assetSource || undefined,
            creatorCredits: (creatorText || creatorName || creatorProfileUrl || creatorSourcePageUrl || creatorLicense) ? {
              text: creatorText || undefined,
              creatorName: creatorName || undefined,
              profileUrl: creatorProfileUrl || undefined,
              sourcePageUrl: creatorSourcePageUrl || undefined,
              license: creatorLicense || undefined,
            } : undefined,
            make: make || undefined,
            model: model || undefined,
            year: year ? Number(year) : undefined,
            variant: variant || undefined,
            tags: tagsInput ? Array.from(new Set(tagsInput.split(',').map((t) => t.trim()).filter(Boolean))) : undefined,
            metadata: (() => {
              if (metadataJson.trim()) {
                try { return JSON.parse(metadataJson); } catch { /* ignore */ }
              }
              const obj: any = {};
              const parseList = (s: string) => Array.from(new Set(s.split(',').map((t) => t.trim()).filter(Boolean)));
              if (wrappableSurfaces.trim()) obj.wrappableSurfaces = parseList(wrappableSurfaces);
              if (rims.trim()) obj.rims = parseList(rims);
              if (windows.trim()) obj.windows = parseList(windows);
              if (doors.trim()) obj.doors = parseList(doors);
              if (tyres.trim()) obj.tyres = parseList(tyres);
              if (interior.trim()) obj.interior = parseList(interior);
              if (lights.trim()) obj.lights = parseList(lights);
              return Object.keys(obj).length ? obj : undefined;
            })(),
          }),
        });
        // JSON parsing moved below for consistency
        if (!res.ok) {
          // Parse JSON to extract error below
        } else {
          toast.success('Asset updated');
        }
      } else {
        // Client-side basic validation
        if (modelFile && !/\.(glb|gltf)$/i.test(modelFile.name)) {
          throw new Error('Model must be a .glb or .gltf file');
        }
        if (thumbFile && !thumbFile.type.startsWith('image/')) {
          throw new Error('Thumbnail must be an image');
        }

        // Generate client uploadId and start progress polling
        const newUploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        setUploadId(newUploadId);
        setUploadProgress(0);
        setUploadStatus('uploading');

        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
          try {
            const pr = await fetch(`/api/uploads/progress/${newUploadId}`, { cache: 'no-store' });
            if (pr.ok) {
              const pj = await pr.json();
              const pg = pj?.progress?.progress ?? 0;
              const st = pj?.progress?.status ?? 'uploading';
              setUploadProgress(pg);
              setUploadStatus(st);
              if (st === 'completed' || st === 'failed') {
                if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
              }
            }
          } catch {}
        }, 900);

        const fd = new FormData();
        fd.set('name', name);
        if (description) fd.set('description', description);
        if (scaleOverride.trim()) fd.set('scale', scaleOverride.trim());
        if (assetSource) fd.set('assetSource', assetSource);
        if (make) fd.set('make', make);
        if (model) fd.set('model', model);
        if (year) fd.set('year', year);
        if (variant) fd.set('variant', variant);
        if (tagsInput) fd.set('tags', JSON.stringify(Array.from(new Set(tagsInput.split(',').map((t) => t.trim()).filter(Boolean)))));
        // Metadata serialization
        if (metadataJson.trim()) {
          fd.set('metadata', metadataJson.trim());
        } else {
          const obj: any = {};
          const parseList = (s: string) => Array.from(new Set(s.split(',').map((t) => t.trim()).filter(Boolean)));
          if (wrappableSurfaces.trim()) obj.wrappableSurfaces = parseList(wrappableSurfaces);
          if (rims.trim()) obj.rims = parseList(rims);
          if (windows.trim()) obj.windows = parseList(windows);
          if (doors.trim()) obj.doors = parseList(doors);
          if (tyres.trim()) obj.tyres = parseList(tyres);
          if (interior.trim()) obj.interior = parseList(interior);
          if (lights.trim()) obj.lights = parseList(lights);
          if (Object.keys(obj).length) fd.set('metadata', JSON.stringify(obj));
        }
        // Creator credits serialization
        if (creatorText || creatorName || creatorProfileUrl || creatorSourcePageUrl || creatorLicense) {
          fd.set('creatorCredits', JSON.stringify({
            text: creatorText || undefined,
            creatorName: creatorName || undefined,
            profileUrl: creatorProfileUrl || undefined,
            sourcePageUrl: creatorSourcePageUrl || undefined,
            license: creatorLicense || undefined,
          }));
        }
        if (modelFile) fd.set('model', modelFile);
        if (thumbFile) fd.set('thumbnail', thumbFile);
        fd.set('uploadId', newUploadId);
        res = await fetch('/api/assets', { method: 'POST', body: fd });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg: string = data?.error || (isEdit ? 'Save failed' : 'Upload failed');
        throw new Error(msg);
      }
      if (!isEdit) {
        const provider = data?.storageStats?.provider || 'storage';
        toast.success(`Upload complete via ${provider.toUpperCase()}`);
      }
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setUploadStatus('failed');
    } finally {
      setSubmitting(false);
      setUploading(false);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
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
          <Label htmlFor="assetSource" className="text-slate-300">Asset Source</Label>
          <select id="assetSource" value={assetSource} onChange={(e) => setAssetSource(e.target.value)} className="w-full bg-slate-800/60 border border-slate-700 text-white rounded px-3 py-2">
            <option value="">Select source</option>
            <option value="sketchfab">Sketchfab</option>
            <option value="turbosquid">TurboSquid</option>
            <option value="internal">Internal</option>
            <option value="other">Other</option>
          </select>
          {assetSource === 'sketchfab' && (
            <p className="text-xs text-slate-500">Creator credit text is required for Sketchfab-sourced models.</p>
          )}
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
        {/* Creator Credits */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="creatorText" className="text-slate-300">Creator Credits Text</Label>
            <Input id="creatorText" value={creatorText} onChange={(e) => setCreatorText(e.target.value)} placeholder="e.g. Model by Jane Doe on Sketchfab" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creatorName" className="text-slate-300">Creator Name</Label>
            <Input id="creatorName" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="e.g. Jane Doe" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creatorProfileUrl" className="text-slate-300">Creator Profile URL</Label>
            <Input id="creatorProfileUrl" value={creatorProfileUrl} onChange={(e) => setCreatorProfileUrl(e.target.value)} placeholder="https://sketchfab.com/jane-doe" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creatorSourcePageUrl" className="text-slate-300">Source Page URL</Label>
            <Input id="creatorSourcePageUrl" value={creatorSourcePageUrl} onChange={(e) => setCreatorSourcePageUrl(e.target.value)} placeholder="https://sketchfab.com/3d-models/...." className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creatorLicense" className="text-slate-300">License</Label>
            <Input id="creatorLicense" value={creatorLicense} onChange={(e) => setCreatorLicense(e.target.value)} placeholder="e.g. CC BY 4.0" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
        </div>
        {/* Make / Model / Year / Variant */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="space-y-2">
            <Label htmlFor="make" className="text-slate-300">Make</Label>
            <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Nissan" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model" className="text-slate-300">Model</Label>
            <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. GTR" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year" className="text-slate-300">Year</Label>
            <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2017" type="number" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="variant" className="text-slate-300">Variant</Label>
            <Input id="variant" value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="e.g. NISMO" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
        </div>
        {/* Tags */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="tags" className="text-slate-300">Tags (comma-separated)</Label>
          <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. coupe, sports, 2-door" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          <p className="text-xs text-slate-500">You can paste comma-separated tags or type and press Enter to add a comma.</p>
        </div>
        {/* Metadata category inputs */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-slate-300">Wrappable Surfaces (comma-separated)</Label>
            <Input value={wrappableSurfaces} onChange={(e) => setWrappableSurfaces(e.target.value)} placeholder="e.g. Body, Hood, Roof" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Rims (comma-separated)</Label>
            <Input value={rims} onChange={(e) => setRims(e.target.value)} placeholder="e.g. FL_Rim, FR_Rim, RL_Rim, RR_Rim" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Windows (comma-separated)</Label>
            <Input value={windows} onChange={(e) => setWindows(e.target.value)} placeholder="e.g. Front_Windshield, Rear_Windshield, Left_Window, Right_Window" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Doors (comma-separated)</Label>
            <Input value={doors} onChange={(e) => setDoors(e.target.value)} placeholder="e.g. FL_Door, FR_Door, RL_Door, RR_Door" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Tyres (comma-separated)</Label>
            <Input value={tyres} onChange={(e) => setTyres(e.target.value)} placeholder="e.g. FL_Tyre, FR_Tyre, RL_Tyre, RR_Tyre" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Interior (comma-separated)</Label>
            <Input value={interior} onChange={(e) => setInterior(e.target.value)} placeholder="e.g. Seats, Dashboard, Steering_Wheel" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Lights (comma-separated)</Label>
            <Input value={lights} onChange={(e) => setLights(e.target.value)} placeholder="e.g. Headlights, Taillights, Indicators" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
        </div>
        {/* Raw JSON metadata editor */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="metadataJson" className="text-slate-300">Raw Metadata JSON (optional)</Label>
          <textarea id="metadataJson" value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} rows={5} className="w-full bg-slate-800/60 border border-slate-700 text-white rounded px-3 py-2 font-mono text-sm" placeholder='{"wrappableSurfaces":["Body","Hood"],"windows":["Front_Windshield"]}' />
          <p className="text-xs text-slate-500">Paste a JSON object. If provided, it will override the category inputs above.</p>
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
      {!isEdit && uploadId && (
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Upload progress</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded">
            <div className="h-2 bg-cyan-500 rounded transition-all" style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }} />
          </div>
          <div className="text-xs text-slate-500 mt-1">{uploadStatus === 'uploading' ? 'Uploading…' : uploadStatus === 'processing' ? 'Processing…' : uploadStatus === 'completed' ? 'Completed' : uploadStatus === 'failed' ? 'Failed' : ''}</div>
        </div>
      )}
    </form>
  );
}
