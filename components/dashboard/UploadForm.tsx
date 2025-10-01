"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Asset } from "@/types/asset";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrimaryInfoTab } from "@/components/dashboard/UploadTabs/PrimaryInfoTab";
import { MetadataTab } from "@/components/dashboard/UploadTabs/MetadataTab";

type MetadataCategories = {
  wrappableSurfaces?: Record<string, string>;
  rims?: Record<string, string>;
  windows?: Record<string, string>;
  doors?: Record<string, string>;
  tyres?: Record<string, string>;
  interior?: Record<string, string>;
  lights?: Record<string, string>;
};

type ApiResponse = {
  error?: string;
  storageStats?: { provider?: string };
};

// Payload for JSON finalize request to /api/assets
type FinalizePayload = {
  name: string;
  description?: string;
  scale?: string;
  assetSource?: string;
  make?: string;
  model?: string;
  year?: string;
  tags?: string[];
  creatorCredits?: { text?: string };
  uploadId: string;
  modelPath: string;
  thumbnailPath: string;
  metadata?: MetadataCategories | Record<string, unknown>;
};

export function UploadForm({ onClose, onUploaded, setUploading, asset }: { onClose: () => void; onUploaded: () => void; setUploading: (v: boolean) => void; asset?: Asset | null }) {
  const [name, setName] = useState(asset?.name || '');
  const [description, setDescription] = useState(asset?.description || '');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [scaleOverride, setScaleOverride] = useState<string>(asset?.scale ? String(asset.scale) : '');
  // New fields
  const [assetSource, setAssetSource] = useState<string>(asset?.assetSource || '');
  const [creatorText, setCreatorText] = useState<string>(asset?.creatorCredits?.text || '');
  const [make, setMake] = useState<string>(asset?.make || '');
  const [model, setModel] = useState<string>(asset?.model || '');
  const [year, setYear] = useState<string>(asset?.year ? String(asset.year) : '');
  const [tagsChips, setTagsChips] = useState<string[]>(asset?.tags || []);
  // Metadata (key-value inputs)
  const [wrappableSurfaces, setWrappableSurfaces] = useState<Record<string, string>>({});
  const [rims, setRims] = useState<Record<string, string>>({});
  const [windows, setWindows] = useState<Record<string, string>>({});
  const [doors, setDoors] = useState<Record<string, string>>({});
  const [tyres, setTyres] = useState<Record<string, string>>({});
  const [interior, setInterior] = useState<Record<string, string>>({});
  const [lights, setLights] = useState<Record<string, string>>({});
  const [metadataMode, setMetadataMode] = useState<'keyvalue' | 'json'>('keyvalue');
  const [metadataJson, setMetadataJson] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isModelDragOver, setIsModelDragOver] = useState(false);
  const [isThumbDragOver, setIsThumbDragOver] = useState(false);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSketchfab = assetSource === 'sketchfab';
  const sketchfabValid = !isSketchfab || (creatorText.trim().length > 0);

  useEffect(() => {
    if (thumbFile) {
      const url = URL.createObjectURL(thumbFile);
      setThumbPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setThumbPreviewUrl(null);
    }
  }, [thumbFile]);

  // Prefill metadata when editing existing asset
  useEffect(() => {
    if (!asset || !asset.metadata) return;
    const m = asset.metadata;
    // Only prefill if fields are still empty to avoid clobbering user input
    if (Object.keys(wrappableSurfaces).length === 0 && m.wrappableSurfaces) setWrappableSurfaces(m.wrappableSurfaces);
    if (Object.keys(rims).length === 0 && m.rims) setRims(m.rims);
    if (Object.keys(windows).length === 0 && m.windows) setWindows(m.windows);
    if (Object.keys(doors).length === 0 && m.doors) setDoors(m.doors);
    if (Object.keys(tyres).length === 0 && m.tyres) setTyres(m.tyres);
    if (Object.keys(interior).length === 0 && m.interior) setInterior(m.interior);
    if (Object.keys(lights).length === 0 && m.lights) setLights(m.lights);

    // JSON editor prefill for editing
    if (!metadataJson.trim()) {
      setMetadataJson(JSON.stringify(m, null, 2));
    }
    // We intentionally depend only on `asset` here to avoid clobbering user edits mid-session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);

  const isEdit = !!asset;
  const canSubmit = useMemo(() => {
    if (isEdit) return !!name && sketchfabValid && !submitting; // editing metadata only
    return !!name && !!modelFile && !!thumbFile && sketchfabValid && !submitting; // creating requires files
  }, [isEdit, name, modelFile, thumbFile, submitting, sketchfabValid]);

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
            curator: 'self',
            creatorCredits: (creatorText) ? {
              text: creatorText || undefined,
            } : undefined,
            make: make || undefined,
            model: model || undefined,
            year: year ? Number(year) : undefined,
            tags: tagsChips.length ? tagsChips : undefined,
            metadata: (() => {
              if (metadataMode === 'json' && metadataJson.trim()) {
                try { return JSON.parse(metadataJson); } catch { /* ignore */ }
              }
              const obj: MetadataCategories = {};
              if (Object.keys(wrappableSurfaces).length) obj.wrappableSurfaces = wrappableSurfaces;
              if (Object.keys(rims).length) obj.rims = rims;
              if (Object.keys(windows).length) obj.windows = windows;
              if (Object.keys(doors).length) obj.doors = doors;
              if (Object.keys(tyres).length) obj.tyres = tyres;
              if (Object.keys(interior).length) obj.interior = interior;
              if (Object.keys(lights).length) obj.lights = lights;
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

        // Generate client uploadId
        const newUploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        setUploadId(newUploadId);
        setUploadProgress(0);
        setUploadStatus('uploading');
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

        // 1) Request signed URLs for direct uploads
        const signRes = await fetch('/api/uploads/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            uploadId: newUploadId,
            model: { filename: modelFile!.name, contentType: modelFile!.type || 'application/octet-stream' },
            thumbnail: { filename: thumbFile!.name, contentType: thumbFile!.type || 'image/jpeg' },
          }),
        });
        if (!signRes.ok) {
          const j = await signRes.json().catch(() => ({}));
          throw new Error(j?.error || 'Failed to get signed upload URLs');
        }
        const signJson = await signRes.json();
        const modelSignedUrl: string = signJson?.model?.url;
        const modelPath: string = signJson?.model?.path;
        const thumbSignedUrl: string = signJson?.thumbnail?.url;
        const thumbnailPath: string = signJson?.thumbnail?.path;

        // Helper to upload a file with progress via signed URL
        const uploadWithProgress = (file: File, url: string, onProgress: (pct: number) => void) => new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url, true);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const pct = (evt.loaded / evt.total) * 100;
              onProgress(pct);
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed with status ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(file);
        });

        // 2) Upload model and thumbnail directly to storage
        // Split progress roughly: model 0-70, thumbnail 70-90
        await uploadWithProgress(modelFile!, modelSignedUrl, (pct) => {
          setUploadProgress(Math.min(70, Math.round((pct / 100) * 70)));
        });
        await uploadWithProgress(thumbFile!, thumbSignedUrl, (pct) => {
          setUploadProgress(70 + Math.min(20, Math.round((pct / 100) * 20)));
        });
        setUploadStatus('processing');

        // Serialize metadata/fields for finalize
        const finalizeBody: FinalizePayload = {
          name,
          description: description || undefined,
          scale: scaleOverride.trim() || undefined,
          assetSource: assetSource || undefined,
          make: make || undefined,
          model: model || undefined,
          year: year || undefined,
          tags: tagsChips.length ? tagsChips : undefined,
          creatorCredits: creatorText ? { text: creatorText } : undefined,
          uploadId: newUploadId,
          modelPath,
          thumbnailPath,
        };
        if (metadataMode === 'json' && metadataJson.trim()) {
          finalizeBody.metadata = (() => { try { return JSON.parse(metadataJson.trim()); } catch { return undefined; } })();
        } else {
          const obj: MetadataCategories = {};
          if (Object.keys(wrappableSurfaces).length) obj.wrappableSurfaces = wrappableSurfaces;
          if (Object.keys(rims).length) obj.rims = rims;
          if (Object.keys(windows).length) obj.windows = windows;
          if (Object.keys(doors).length) obj.doors = doors;
          if (Object.keys(tyres).length) obj.tyres = tyres;
          if (Object.keys(interior).length) obj.interior = interior;
          if (Object.keys(lights).length) obj.lights = lights;
          if (Object.keys(obj).length) finalizeBody.metadata = obj;
        }

        // 3) Finalize on server without large body
        res = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalizeBody),
        });
      }
      let data: ApiResponse = {};
      try {
        data = await res.json() as ApiResponse;
      } catch {
        data = {};
      }
      if (!res.ok) {
        const msg: string = data?.error || (isEdit ? 'Save failed' : 'Upload failed');
        // Inline field mapping for known errors
        const nextFieldErrors: Record<string, string> = {};
        if (typeof msg === 'string' && msg.toLowerCase().includes('creatorcredits.text')) {
          nextFieldErrors.creatorText = 'Creator credit text is required for Sketchfab assets';
        }
        setFieldErrors(nextFieldErrors);
        throw new Error(msg);
      }
      if (!isEdit) {
        const provider = data?.storageStats?.provider || 'storage';
        toast.success(`Upload complete via ${provider.toUpperCase()}`);
        setUploadProgress(100);
        setUploadStatus('completed');
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
    // Place Tabs outside the form so tab triggers are not within a form context
    <Tabs defaultValue="primary" className="w-full">
      <TabsList className="sticky top-0 z-10 bg-foreground gap-2 border-[1.5px] border-slate-700 mb-4 mt-2 ml-2">
        <TabsTrigger value="primary" asChild>
          <button
            type="button"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:border-cyan-600 bg-slate-800/40 text-slate-200 border border-slate-700 hover:bg-slate-800 rounded-md px-3 py-1.5"
          >
            Primary Info
          </button>
        </TabsTrigger>
        <TabsTrigger value="metadata" asChild>
          <button
            type="button"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:border-cyan-600 bg-slate-800/40 text-slate-200 border border-slate-700 hover:bg-slate-800 rounded-md px-3 py-1.5"
          >
            Metadata
          </button>
        </TabsTrigger>
      </TabsList>

      {/* The form wraps only the tab contents and footer, not the tab triggers */}
      <form onSubmit={submit} className="py-5 px-2 sm:px-4 md:px-6 space-y-5">
        {error && (
          <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="primary" className="animate-in fade-in slide-in-from-top-1 duration-200">
          <PrimaryInfoTab
            isEdit={isEdit}
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            scaleOverride={scaleOverride}
            setScaleOverride={setScaleOverride}
            assetSource={assetSource}
            setAssetSource={setAssetSource}
            isSketchfab={isSketchfab}
            sketchfabValid={sketchfabValid}
            fieldErrors={fieldErrors}
            creatorText={creatorText}
            setCreatorText={setCreatorText}
            make={make}
            setMake={setMake}
            model={model}
            setModel={setModel}
            year={year}
            setYear={setYear}
            tagsChips={tagsChips}
            setTagsChips={setTagsChips}
            modelFile={modelFile}
            setModelFile={setModelFile}
            thumbFile={thumbFile}
            setThumbFile={setThumbFile}
            isModelDragOver={isModelDragOver}
            setIsModelDragOver={setIsModelDragOver}
            isThumbDragOver={isThumbDragOver}
            setIsThumbDragOver={setIsThumbDragOver}
            thumbPreviewUrl={thumbPreviewUrl}
          />
        </TabsContent>
        <TabsContent value="metadata" className="animate-in fade-in slide-in-from-top-1 duration-200">
          <MetadataTab
            metadataMode={metadataMode}
            setMetadataMode={setMetadataMode}
            wrappableSurfaces={wrappableSurfaces}
            setWrappableSurfaces={setWrappableSurfaces}
            rims={rims}
            setRims={setRims}
            windows={windows}
            setWindows={setWindows}
            doors={doors}
            setDoors={setDoors}
            tyres={tyres}
            setTyres={setTyres}
            interior={interior}
            setInterior={setInterior}
            lights={lights}
            setLights={setLights}
            metadataJson={metadataJson}
            setMetadataJson={setMetadataJson}
            isEdit={isEdit}
          />
        </TabsContent>
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
    </Tabs>
  );
}
