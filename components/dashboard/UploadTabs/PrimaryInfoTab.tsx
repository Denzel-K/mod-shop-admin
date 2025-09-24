"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PrimaryInfoProps = {
  isEdit: boolean;
  // Core fields
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  scaleOverride: string;
  setScaleOverride: (v: string) => void;
  // Source and credits
  assetSource: string;
  setAssetSource: (v: string) => void;
  isSketchfab: boolean;
  sketchfabValid: boolean;
  fieldErrors: Record<string, string>;
  creatorText: string;
  setCreatorText: (v: string) => void;
  creatorName: string;
  setCreatorName: (v: string) => void;
  creatorProfileUrl: string;
  setCreatorProfileUrl: (v: string) => void;
  creatorSourcePageUrl: string;
  setCreatorSourcePageUrl: (v: string) => void;
  creatorLicense: string;
  setCreatorLicense: (v: string) => void;
  // Files
  modelFile: File | null;
  setModelFile: (f: File | null) => void;
  thumbFile: File | null;
  setThumbFile: (f: File | null) => void;
  isModelDragOver: boolean;
  setIsModelDragOver: (v: boolean) => void;
  isThumbDragOver: boolean;
  setIsThumbDragOver: (v: boolean) => void;
  thumbPreviewUrl: string | null;
};

export function PrimaryInfoTab(props: PrimaryInfoProps) {
  const {
    isEdit,
    name,
    setName,
    description,
    setDescription,
    scaleOverride,
    setScaleOverride,
    assetSource,
    setAssetSource,
    isSketchfab,
    sketchfabValid,
    fieldErrors,
    creatorText,
    setCreatorText,
    creatorName,
    setCreatorName,
    creatorProfileUrl,
    setCreatorProfileUrl,
    creatorSourcePageUrl,
    setCreatorSourcePageUrl,
    creatorLicense,
    setCreatorLicense,
    modelFile,
    setModelFile,
    thumbFile,
    setThumbFile,
    isModelDragOver,
    setIsModelDragOver,
    isThumbDragOver,
    setIsThumbDragOver,
    thumbPreviewUrl,
  } = props;

  return (
    <div className="space-y-5">
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
          {isSketchfab && (
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
            <Input id="creatorText" value={creatorText} onChange={(e) => setCreatorText(e.target.value)} placeholder="e.g. Model by Jane Doe on Sketchfab" className={`bg-slate-800/60 border ${sketchfabValid ? 'border-slate-700' : 'border-red-600'} text-white placeholder-slate-500`} />
            {!sketchfabValid && <p className="text-xs text-red-400">Creator credit text is required for Sketchfab assets.</p>}
            {fieldErrors.creatorText && <p className="text-xs text-red-400">{fieldErrors.creatorText}</p>}
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
      </div>

      {/* File pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
    </div>
  );
}
