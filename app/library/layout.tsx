"use client"

import { ReactNode } from 'react'
import { TopBar } from '@/components/dashboard/TopBar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Library" subtitle="Environment & Scene Assets" />
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-slate-300 text-sm">Manage HDRIs, ground textures, scenes and thumbnails</div>
          <Button asChild variant="outline" className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700">
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link>
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
