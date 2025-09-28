import { Suspense } from 'react';
import DashboardClient from './DashboardClient';

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">Loading dashboard…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
