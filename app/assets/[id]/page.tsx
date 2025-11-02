import { Suspense } from 'react';
import { headers } from 'next/headers';
import AssetViewerPanel from '@/components/asset/AssetViewerPanel';
import { IAssetMetadata } from '@/models/Asset';
import AssetHeaderBar from '@/components/asset/AssetHeaderBar';
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
    progress?: { overall?: number; breakdown?: Record<string, number>; metadataValidation?: Record<string, boolean> };
    lastEditedBy?: { name?: string; email?: string; at?: string | Date };
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
      {/* Floating Top Bar */}
      <header className="fixed z-30 left-0 right-0 top-4">
        <AssetHeaderBar asset={asset} />
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
