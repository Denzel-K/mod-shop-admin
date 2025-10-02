import { Suspense } from 'react';
import { headers } from 'next/headers';
import AssetViewerPanel from '@/components/asset/AssetViewerPanel';
import { IAssetMetadata } from '@/models/Asset';
import Link from 'next/link';

async function getAssetAbsolute(baseUrl: string, id: string) {
  const res = await fetch(`${baseUrl}/api/assets/${id}`, {
    // Force dynamic for SSR page loads
    cache: 'no-store',
    // In Next.js App Router, fetch on the server includes cookies by default
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.asset as {
    _id: string;
    name: string;
    description?: string;
    modelUrl: string;
    format: 'glb' | 'gltf';
    scale?: number;
    assetSource?: 'sketchfab' | 'turbosquid' | 'internal' | 'other';
    creatorCredits?: { text?: string };
    make?: string;
    model?: string;
    year?: number;
    variant?: string;
    tags?: string[];
    metadata?: IAssetMetadata;
  } | null;
}

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host');
  const proto = (hdrs.get('x-forwarded-proto') || 'http').split(',')[0];
  const baseUrl = `${proto}://${host}`;
  const asset = await getAssetAbsolute(baseUrl, id);

  if (!asset) {
    return (
      <div className="min-h-screen h-full bg-slate-950 text-slate-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Asset not found</h1>
            <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300">Back to Library</Link>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">We could not find that asset.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-slate-200">
      {/* Top bar - Reduced height and increased transparency */}
      <header className="sticky top-0 z-30 border-b border-slate-800/50 bg-slate-900/60 backdrop-blur-xl transition-all duration-300">
        <div className="px-4 py-3 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_20px] shadow-cyan-400/50" />
            <h1 className="text-white text-lg font-semibold tracking-wide">{asset.name}</h1>
            <span className="text-xs text-slate-400 border border-slate-700/50 rounded px-1.5 py-0.5 uppercase">{asset.format}</span>
            {asset.make && (
              <span className="text-xs text-slate-400 border border-slate-700/50 rounded px-1.5 py-0.5">{asset.make}{asset.model ? ` • ${asset.model}` : ''}{asset.year ? ` • ${asset.year}` : ''}</span>
            )}
            {asset.assetSource && (
              <span className="text-[10px] text-cyan-300 border border-cyan-700/50 rounded px-1 py-0.5 uppercase">{asset.assetSource}</span>
            )}
            {asset.creatorCredits?.text && (
              <details className="ml-2 cursor-pointer">
                <summary className="list-none text-xs text-slate-300 border border-slate-700/50 rounded px-1.5 py-0.5 hover:bg-slate-800/50">Credits</summary>
                <div className="absolute mt-2 w-[min(560px,90vw)] p-3 bg-slate-900/95 text-slate-200 border border-slate-700/50 rounded shadow-xl backdrop-blur-xl z-50">
                  <div className="text-xs leading-relaxed whitespace-pre-wrap">{asset.creatorCredits.text}</div>
                </div>
              </details>
            )}
          </div>
          <Link href="/dashboard" className="text-slate-300 hover:text-white border border-slate-700/50 bg-slate-800/60 hover:bg-slate-700/80 rounded px-3 py-1.5 text-sm transition-colors">Back to Library</Link>
        </div>
      </header>

      {/* Full-screen viewer section */}
      <main className="flex-1 relative overflow-hidden">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-black">
            <div className="text-center">
              <div className="text-lg mb-2">Loading viewer…</div>
              <div className="text-sm text-slate-500">Preparing 3D scene</div>
            </div>
          </div>
        }>
          <AssetViewerPanel
            url={asset.modelUrl}
            assetId={asset._id}
            initialScale={asset.scale || 1.0}
            assetName={asset.name}
            assetFormat={asset.format}
            assetMetadata={asset.metadata}
            assetDescription={asset.description}
            assetTags={asset.tags}
          />
        </Suspense>
      </main>
    </div>
  );
}
