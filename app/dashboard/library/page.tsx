"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Upload, Trash2, ExternalLink } from 'lucide-react'
import { useEnvPresets } from '@/lib/viewer/useEnvPresets'
import type { EnvPresetKey, EnvPresetConfig } from '@/lib/viewer/useEnvPresets'
import type { EnvPreset } from '@/lib/viewer/environment'

type LibraryItem = {
  name: string
  size: number
  contentType: string | null
  updated: string | null
  url: string
}

type Category = {
  key: string
  label: string
  prefix: string
}

const CATEGORIES: Category[] = [
  { key: 'ground-textures', label: 'Ground Textures', prefix: 'ground-textures/' },
  { key: 'hdri-backgrounds', label: 'HDRI Backgrounds', prefix: 'HDRI-backgrounds/' },
  { key: 'hdri-thumbnails', label: 'HDRI Thumbnails', prefix: 'HDRI-thumbnails/' },
  { key: 'scenes', label: 'Scenes', prefix: 'scenes/' },
]

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export default function LibraryPage() {
  const [active, setActive] = useState<Category>(CATEGORIES[0])
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subpath, setSubpath] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [groupView, setGroupView] = useState(true)
  const [usedOnly, setUsedOnly] = useState(true)
  const [searchQ, setSearchQ] = useState('')

  // Preset manager state
  const { presets: presetMap, setPresets: setPresetMap } = useEnvPresets()
  const presetKeys = Object.keys(presetMap) as unknown as EnvPreset[]
  const [selectedPresetKey, setSelectedPresetKey] = useState<EnvPreset>(presetKeys[0] ?? 'city')
  const [pmLabel, setPmLabel] = useState<string>('')
  const [pmBlur, setPmBlur] = useState<number>(0)
  const [pmGround, setPmGround] = useState<string>('')
  const [pmHDRI, setPmHDRI] = useState<string>('')
  const [pmThumb, setPmThumb] = useState<string>('')
  const [pmSaving, setPmSaving] = useState(false)

  // Lists for selectors
  const [listGround, setListGround] = useState<LibraryItem[]>([])
  const [listHDRI, setListHDRI] = useState<LibraryItem[]>([])
  const [listThumbs, setListThumbs] = useState<LibraryItem[]>([])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const pageItems = useMemo(() => {
    const filtered = items.filter((it) => {
      if (!searchQ) return true
      const q = searchQ.toLowerCase()
      return it.name.toLowerCase().includes(q) || (it.contentType || '').toLowerCase().includes(q)
    })
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [items, page, pageSize, searchQ])

  // Build used paths and mapping to presets
  const usedPathToPresets = useMemo(() => {
    const map = new Map<string, string[]>()
    const add = (path?: string, presetKey?: string) => {
      if (!path || !presetKey) return
      let p = path.replace(/^\//, '')
      p = p.replace(/^api\/storage\/objects\//, '')
      const arr = map.get(p) || []
      if (!arr.includes(presetKey)) arr.push(presetKey)
      map.set(p, arr)
    }
    for (const [k, cfg] of Object.entries(presetMap)) {
      add(typeof cfg.groundTexture === 'string' ? cfg.groundTexture : undefined, k)
      if (typeof cfg.files === 'string') add(cfg.files, k)
      else if (Array.isArray(cfg.files)) cfg.files.forEach((f) => add(f, k))
      add(cfg.thumbnail, k)
    }
    return map
  }, [presetMap])

  // When grouping, compute groups from filtered and optionally used-only items
  const grouped = useMemo(() => {
    const result: Record<string, LibraryItem[]> = {}
    const base = items.filter((it) => {
      if (usedOnly) {
        const used = usedPathToPresets.has(it.name)
        if (!used) return false
      }
      if (!searchQ) return true
      const q = searchQ.toLowerCase()
      return it.name.toLowerCase().includes(q) || (it.contentType || '').toLowerCase().includes(q)
    })
    for (const it of base) {
      const rel = it.name.startsWith(active.prefix) ? it.name.slice(active.prefix.length) : it.name
      const seg = (rel.split('/')[0] || '(root)')
      if (!result[seg]) result[seg] = []
      result[seg].push(it)
    }
    return result
  }, [items, active.prefix, usedOnly, searchQ, usedPathToPresets])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const resp = await fetch(`/api/library/list?prefix=${encodeURIComponent(active.prefix)}`)
        if (!resp.ok) throw new Error(`List failed: ${resp.status}`)
        const data = await resp.json()
        if (mounted) setItems(data.items || [])
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load'
        if (mounted) setError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [active])

  useEffect(() => { setPage(1) }, [active, pageSize])

  // Load library lists for selectors
  useEffect(() => {
    let alive = true
    const loadAll = async () => {
      try {
        const [g, h, t] = await Promise.all([
          fetch('/api/library/list?prefix=' + encodeURIComponent('ground-textures/')).then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/library/list?prefix=' + encodeURIComponent('HDRI-backgrounds/')).then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/library/list?prefix=' + encodeURIComponent('HDRI-thumbnails/')).then(r => r.json()).catch(() => ({ items: [] })),
        ])
        if (!alive) return
        setListGround(g.items || [])
        setListHDRI(h.items || [])
        setListThumbs(t.items || [])
      } catch {}
    }
    loadAll()
    return () => { alive = false }
  }, [])

  // Initialize preset editor when selection or map changes
  useEffect(() => {
    if (!presetKeys.length) return
    if (!presetKeys.includes(selectedPresetKey)) setSelectedPresetKey(presetKeys[0])
    const cfg = presetMap[selectedPresetKey as EnvPresetKey]
    if (cfg) {
      setPmLabel(cfg.label)
      setPmBlur(cfg.defaultBlur ?? 0)
      setPmGround(typeof cfg.groundTexture === 'string' ? cfg.groundTexture : '')
      setPmHDRI(typeof cfg.files === 'string' ? cfg.files : Array.isArray(cfg.files) ? cfg.files[0] : '')
      setPmThumb(cfg.thumbnail)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPresetKey, presetMap])

  async function onSavePreset() {
    try {
      setPmSaving(true)
      const next: Record<EnvPresetKey, EnvPresetConfig> = { ...presetMap }
      const key = selectedPresetKey as EnvPresetKey
      next[key] = {
        ...(next[key] || {}),
        label: pmLabel || key,
        defaultBlur: pmBlur,
        groundTexture: pmGround,
        groundName: (next[key]?.groundName ?? 'Ground'),
        thumbnail: pmThumb,
        files: pmHDRI,
        dreiPreset: (next[key]?.dreiPreset ?? 'studio'),
        key,
      }
      // optimistic update
      setPresetMap(next)
      const resp = await fetch('/api/environment/presets', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ presets: next }),
      })
      if (!resp.ok) throw new Error('Save failed')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setPmSaving(false)
    }
  }

  async function onDelete(path: string) {
    if (!confirm(`Delete ${path}?`)) return
    const resp = await fetch(`/api/library/object?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
    if (!resp.ok) {
      alert('Delete failed')
      return
    }
    setItems((prev) => prev.filter((i) => i.name !== path))
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(selectedFiles)) {
        const cleanSub = subpath.trim().replace(/^\/+|\/+$/g, '')
        const objectPath = `${active.prefix}${cleanSub ? cleanSub + '/' : ''}${file.name}`
        const url = `/api/storage/upload?path=${encodeURIComponent(objectPath)}&ct=${encodeURIComponent(file.type || 'application/octet-stream')}`
        const resp = await fetch(url, {
          method: 'PUT',
          headers: { 'content-type': file.type || 'application/octet-stream' },
          body: file,
        })
        if (!resp.ok) throw new Error(`Upload failed: ${file.name}`)
      }
      // refresh list
      const listResp = await fetch(`/api/library/list?prefix=${encodeURIComponent(active.prefix)}`)
      if (listResp.ok) {
        const data = await listResp.json()
        setItems(data.items || [])
      }
      setSelectedFiles(null)
      const inputEl = document.getElementById('file-input') as HTMLInputElement | null
      if (inputEl) inputEl.value = ''
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      alert(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Category Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button
            key={c.key}
            variant={active.key === c.key ? 'default' : 'outline'}
            className={active.key === c.key ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'}
            onClick={() => setActive(c)}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {/* Toolbar: search + toggles */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search files by name or type"
          className="w-full sm:max-w-sm h-9 bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded px-3"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className={`h-9 ${groupView ? 'border-cyan-600 ring-1 ring-cyan-700/40' : 'border-slate-700'} bg-slate-800/80 text-slate-300 hover:bg-slate-700`}
            onClick={() => setGroupView((v) => !v)}
          >
            {groupView ? 'Grouped' : 'Flat'} view
          </Button>
          <Button
            variant="outline"
            className={`h-9 ${usedOnly ? 'border-cyan-600 ring-1 ring-cyan-700/40' : 'border-slate-700'} bg-slate-800/80 text-slate-300 hover:bg-slate-700`}
            onClick={() => setUsedOnly((v) => !v)}
          >
            {usedOnly ? 'Showing used only' : 'Showing all'}
          </Button>
        </div>
      </div>

      {/* Preset Manager */}
      <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Preset</label>
            <select
              value={selectedPresetKey}
              onChange={(e) => setSelectedPresetKey(e.target.value as EnvPreset)}
              className="w-full h-9 bg-slate-800/60 border border-slate-700 text-white rounded px-2"
            >
              {presetKeys.map((k) => (
                <option key={k} value={k}>{presetMap[(k as EnvPresetKey)]?.label ?? k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Label</label>
            <input value={pmLabel} onChange={(e) => setPmLabel(e.target.value)} className="w-full h-9 bg-slate-800/60 border border-slate-700 text-white rounded px-3" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">HDRI file</label>
            <select value={pmHDRI} onChange={(e) => setPmHDRI(e.target.value)} className="w-full h-9 bg-slate-800/60 border border-slate-700 text-white rounded px-2">
              <option value="">Select…</option>
              {listHDRI.map((f) => (<option key={f.name} value={`/api/storage/objects/${f.name}`}>{f.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Thumbnail</label>
            <select value={pmThumb} onChange={(e) => setPmThumb(e.target.value)} className="w-full h-9 bg-slate-800/60 border border-slate-700 text-white rounded px-2">
              <option value="">Select…</option>
              {listThumbs.map((f) => (<option key={f.name} value={`/api/storage/objects/${f.name}`}>{f.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ground texture</label>
            <select value={pmGround} onChange={(e) => setPmGround(e.target.value)} className="w-full h-9 bg-slate-800/60 border border-slate-700 text-white rounded px-2">
              <option value="">Select…</option>
              {listGround.map((f) => (<option key={f.name} value={`/api/storage/objects/${f.name}`}>{f.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Default blur (0–1)</label>
            <input type="number" min={0} max={1} step={0.01} value={pmBlur} onChange={(e) => setPmBlur(parseFloat(e.target.value) || 0)} className="w-full h-9 bg-slate-800/60 border border-slate-700 text-white rounded px-3" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={onSavePreset} disabled={pmSaving} className="h-9 bg-cyan-600/80 hover:bg-cyan-500">{pmSaving ? 'Saving…' : 'Save Preset'}</Button>
        </div>
      </div>

      {/* Upload Bar */}
      <form onSubmit={onUpload} className="mb-4 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-slate-300 mb-1">Subfolder (optional)</label>
            <input
              value={subpath}
              onChange={(e) => setSubpath(e.target.value)}
              placeholder="e.g. desert-rocks"
              className="w-full h-9 bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded px-3"
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-slate-300 mb-1">Files</label>
            <input id="file-input" type="file" multiple onChange={(e) => setSelectedFiles(e.target.files)} className="w-full text-slate-300" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={uploading} className="h-9 bg-cyan-600/80 hover:bg-cyan-500">
              <Upload className="w-4 h-4 mr-2" /> {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </form>

      {/* Table or Grouped Cards */}
      {loading ? (
        <div className="text-slate-300">Loading…</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          {groupView ? (
            <div className="space-y-3">
              {Object.keys(grouped).sort().map((gk) => {
                const gi = grouped[gk]
                const usedCount = gi.filter((x) => usedPathToPresets.has(x.name)).length
                return (
                  <div key={gk} className="rounded-lg border border-slate-800 bg-slate-900/70">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-slate-200">
                        <span className="text-sm font-semibold">{gk}</span>
                        <span className="text-xs text-slate-400">{gi.length} files</span>
                        {usedOnly ? null : <span className="text-xs text-cyan-400">{usedCount} used</span>}
                      </div>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {gi.map((it) => {
                        const isPreview = it.contentType && it.contentType.startsWith('image/')
                        const presets = usedPathToPresets.get(it.name) || []
                        if (usedOnly && presets.length === 0) return null
                        return (
                          <div key={it.name} className="p-3 flex gap-3 items-start">
                            <div className="w-28 h-20 flex items-center justify-center border border-slate-800 rounded overflow-hidden bg-slate-950">
                              {isPreview ? (
                                <img src={`/api/storage/objects/${encodeURI(it.name)}`} alt={it.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-slate-500 text-sm">No preview</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs text-slate-200 break-all">{it.name}</div>
                              <div className="text-[11px] text-slate-400 mt-1">{it.contentType || 'unknown'} • {formatBytes(it.size)} • {it.updated ? new Date(it.updated).toLocaleString() : '—'}</div>
                              {presets.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {presets.map((p) => (
                                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-700 text-cyan-300 bg-cyan-900/10">{p}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button asChild variant="outline" className="h-8 bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700">
                                <a href={`/api/storage/objects/${encodeURI(it.name)}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-1" /> Open</a>
                              </Button>
                              <Button onClick={() => onDelete(it.name)} variant="outline" className="h-8 border-red-700/60 text-red-400 hover:bg-red-900/20">
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-900/70 text-slate-300">
                    <tr>
                      <th className="text-left p-2 border-b border-slate-800">Preview</th>
                      <th className="text-left p-2 border-b border-slate-800">Path</th>
                      <th className="text-left p-2 border-b border-slate-800">Type</th>
                      <th className="text-left p-2 border-b border-slate-800">Size</th>
                      <th className="text-left p-2 border-b border-slate-800">Updated</th>
                      <th className="text-left p-2 border-b border-slate-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-950/40">
                    {pageItems.map((it) => {
                      if (usedOnly && !usedPathToPresets.has(it.name)) return null
                      const isPreview = it.contentType && (it.contentType.startsWith('image/') || it.contentType.startsWith('video/'))
                      return (
                        <tr key={it.name} className="align-top hover:bg-slate-900/40">
                          <td className="p-2 w-[140px]">
                            {isPreview && it.contentType?.startsWith('image/') ? (
                              <img src={`/api/storage/objects/${encodeURI(it.name)}`} alt={it.name} className="w-32 h-20 object-cover rounded border border-slate-800" />
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="font-mono text-xs break-all text-slate-200">{it.name}</div>
                          </td>
                          <td className="p-2 text-slate-300">{it.contentType || 'unknown'}</td>
                          <td className="p-2 text-slate-300">{formatBytes(it.size)}</td>
                          <td className="p-2 text-slate-300">{it.updated ? new Date(it.updated).toLocaleString() : '—'}</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button asChild variant="outline" className="h-8 bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700">
                                <a href={`/api/storage/objects/${encodeURI(it.name)}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-1" /> Open</a>
                              </Button>
                              <Button onClick={() => onDelete(it.name)} variant="outline" className="h-8 border-red-700/60 text-red-400 hover:bg-red-900/20">
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {pageItems.map((it) => {
                  if (usedOnly && !usedPathToPresets.has(it.name)) return null
                  const isPreview = it.contentType && it.contentType.startsWith('image/')
                  return (
                    <div key={it.name} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                      <div className="flex gap-3">
                        <div className="w-24 h-16 flex items-center justify-center border border-slate-800 rounded overflow-hidden bg-slate-950">
                          {isPreview ? (
                            <img src={`/api/storage/objects/${encodeURI(it.name)}`} alt={it.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-500 text-sm">No preview</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[11px] text-slate-200 break-all">{it.name}</div>
                          <div className="text-[11px] text-slate-400 mt-1">{it.contentType || 'unknown'} • {formatBytes(it.size)}</div>
                          <div className="text-[11px] text-slate-500">{it.updated ? new Date(it.updated).toLocaleString() : '—'}</div>
                          <div className="mt-2 flex gap-2">
                            <Button asChild variant="outline" className="h-8 bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700">
                              <a href={`/api/storage/objects/${encodeURI(it.name)}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-1" /> Open</a>
                            </Button>
                            <Button onClick={() => onDelete(it.name)} variant="outline" className="h-8 border-red-700/60 text-red-400 hover:bg-red-900/20">
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination controls */}
              {groupView ? null : (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">{items.length} items • Page {page} of {totalPages}</div>
                  <div className="flex items-center gap-3">
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="h-9 bg-slate-800/60 border border-slate-700 text-slate-200 rounded px-2"
                    >
                      {[10, 20, 50, 100].map((n) => (<option key={n} value={n}>{n}/page</option>))}
                    </select>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink isActive>{page}</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
