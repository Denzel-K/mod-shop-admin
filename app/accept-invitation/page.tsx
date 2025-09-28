import { Suspense } from "react";
import AcceptInvitationClient from "./AcceptInvitationClient";

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">Loading…</div>}>
      <AcceptInvitationClient />
    </Suspense>
  );
}
