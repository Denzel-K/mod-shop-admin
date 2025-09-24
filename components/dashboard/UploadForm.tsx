"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Asset } from "@/types/asset";
import { toast } from "sonner";
import { listMakes, listModels } from "@/lib/model-mapping";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrimaryInfoTab } from "@/components/dashboard/UploadTabs/PrimaryInfoTab";
import { MetadataTab } from "@/components/dashboard/UploadTabs/MetadataTab";

type MetadataCategories = {
  wrappableSurfaces?: string[];
  rims?: string[];
  windows?: string[];
  doors?: string[];
  tyres?: string[];
  interior?: string[];
  lights?: string[];
};

type ApiResponse = {
  error?: string;
  storageStats?: { provider?: string };
};

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
  const [tagsChips, setTagsChips] = useState<string[]>([]);
  // Metadata (category inputs)
  const [wrappableSurfacesChips, setWrappableSurfacesChips] = useState<string[]>([]);
  const [rimsChips, setRimsChips] = useState<string[]>([]);
  const [windowsChips, setWindowsChips] = useState<string[]>([]);
  const [doorsChips, setDoorsChips] = useState<string[]>([]);
  const [tyresChips, setTyresChips] = useState<string[]>([]);
  const [interiorChips, setInteriorChips] = useState<string[]>([]);
  const [lightsChips, setLightsChips] = useState<string[]>([]);
  const [metadataMode, setMetadataMode] = useState<'chips' | 'csv' | 'json'>('chips');
  // CSV fallbacks
  const [wrappableSurfacesCsv, setWrappableSurfacesCsv] = useState<string>('');
  const [rimsCsv, setRimsCsv] = useState<string>('');
  const [windowsCsv, setWindowsCsv] = useState<string>('');
  const [doorsCsv, setDoorsCsv] = useState<string>('');
  const [tyresCsv, setTyresCsv] = useState<string>('');
  const [interiorCsv, setInteriorCsv] = useState<string>('');
  const [lightsCsv, setLightsCsv] = useState<string>('');
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

  const makes = useMemo(() => listMakes(), []);
  const models = useMemo(() => (make ? listModels(make) : listModels()), [make]);
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
            tags: tagsChips.length ? tagsChips : undefined,
            metadata: (() => {
              if (metadataMode === 'json' && metadataJson.trim()) {
                try { return JSON.parse(metadataJson); } catch { /* ignore */ }
              }
              const obj: MetadataCategories = {};
              const parseList = (s: string) => Array.from(new Set(s.split(',').map((t) => t.trim()).filter(Boolean)));
              if (metadataMode === 'chips') {
                if (wrappableSurfacesChips.length) obj.wrappableSurfaces = wrappableSurfacesChips;
                if (rimsChips.length) obj.rims = rimsChips;
                if (windowsChips.length) obj.windows = windowsChips;
                if (doorsChips.length) obj.doors = doorsChips;
                if (tyresChips.length) obj.tyres = tyresChips;
                if (interiorChips.length) obj.interior = interiorChips;
                if (lightsChips.length) obj.lights = lightsChips;
              } else {
                if (wrappableSurfacesCsv.trim()) obj.wrappableSurfaces = parseList(wrappableSurfacesCsv);
                if (rimsCsv.trim()) obj.rims = parseList(rimsCsv);
                if (windowsCsv.trim()) obj.windows = parseList(windowsCsv);
                if (doorsCsv.trim()) obj.doors = parseList(doorsCsv);
                if (tyresCsv.trim()) obj.tyres = parseList(tyresCsv);
                if (interiorCsv.trim()) obj.interior = parseList(interiorCsv);
                if (lightsCsv.trim()) obj.lights = parseList(lightsCsv);
              }
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
        if (tagsChips.length) fd.set('tags', JSON.stringify(tagsChips));
        // Metadata serialization
        if (metadataMode === 'json' && metadataJson.trim()) {
          fd.set('metadata', metadataJson.trim());
        } else {
          const obj: MetadataCategories = {};
          const parseList = (s: string) => Array.from(new Set(s.split(',').map((t) => t.trim()).filter(Boolean)));
          if (metadataMode === 'chips') {
            if (wrappableSurfacesChips.length) obj.wrappableSurfaces = wrappableSurfacesChips;
            if (rimsChips.length) obj.rims = rimsChips;
            if (windowsChips.length) obj.windows = windowsChips;
            if (doorsChips.length) obj.doors = doorsChips;
            if (tyresChips.length) obj.tyres = tyresChips;
            if (interiorChips.length) obj.interior = interiorChips;
            if (lightsChips.length) obj.lights = lightsChips;
          } else {
            if (wrappableSurfacesCsv.trim()) obj.wrappableSurfaces = parseList(wrappableSurfacesCsv);
            if (rimsCsv.trim()) obj.rims = parseList(rimsCsv);
            if (windowsCsv.trim()) obj.windows = parseList(windowsCsv);
            if (doorsCsv.trim()) obj.doors = parseList(doorsCsv);
            if (tyresCsv.trim()) obj.tyres = parseList(tyresCsv);
            if (interiorCsv.trim()) obj.interior = parseList(interiorCsv);
            if (lightsCsv.trim()) obj.lights = parseList(lightsCsv);
          }
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
        // Hidden curator indicator for the backend to associate session user
        fd.set('curator', 'self');
        res = await fetch('/api/assets', { method: 'POST', body: fd });
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
      {/* Hidden curator field for backend session binding */}
      <input type="hidden" name="curator" value="self" />
      {error && (
        <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Tabbed interface for curators to split responsibilities */}
      <Tabs defaultValue="primary" className="w-full">
        <TabsList className="sticky top-0 z-10">
          <TabsTrigger value="primary">Primary Info</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>
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
            creatorName={creatorName}
            setCreatorName={setCreatorName}
            creatorProfileUrl={creatorProfileUrl}
            setCreatorProfileUrl={setCreatorProfileUrl}
            creatorSourcePageUrl={creatorSourcePageUrl}
            setCreatorSourcePageUrl={setCreatorSourcePageUrl}
            creatorLicense={creatorLicense}
            setCreatorLicense={setCreatorLicense}
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
            makes={makes}
            models={models}
            make={make}
            setMake={setMake}
            model={model}
            setModel={setModel}
            year={year}
            setYear={setYear}
            variant={variant}
            setVariant={setVariant}
            tagsChips={tagsChips}
            setTagsChips={setTagsChips}
            metadataMode={metadataMode}
            setMetadataMode={setMetadataMode}
            wrappableSurfacesChips={wrappableSurfacesChips}
            setWrappableSurfacesChips={setWrappableSurfacesChips}
            rimsChips={rimsChips}
            setRimsChips={setRimsChips}
            windowsChips={windowsChips}
            setWindowsChips={setWindowsChips}
            doorsChips={doorsChips}
            setDoorsChips={setDoorsChips}
            tyresChips={tyresChips}
            setTyresChips={setTyresChips}
            interiorChips={interiorChips}
            setInteriorChips={setInteriorChips}
            lightsChips={lightsChips}
            setLightsChips={setLightsChips}
            wrappableSurfacesCsv={wrappableSurfacesCsv}
            setWrappableSurfacesCsv={setWrappableSurfacesCsv}
            rimsCsv={rimsCsv}
            setRimsCsv={setRimsCsv}
            windowsCsv={windowsCsv}
            setWindowsCsv={setWindowsCsv}
            doorsCsv={doorsCsv}
            setDoorsCsv={setDoorsCsv}
            tyresCsv={tyresCsv}
            setTyresCsv={setTyresCsv}
            interiorCsv={interiorCsv}
            setInteriorCsv={setInteriorCsv}
            lightsCsv={lightsCsv}
            setLightsCsv={setLightsCsv}
            metadataJson={metadataJson}
            setMetadataJson={setMetadataJson}
          />
        </TabsContent>
      </Tabs>
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
