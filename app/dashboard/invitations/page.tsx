"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

type Invitation = {
  id: string;
  email: string;
  fullname: string;
  expiresAt: string;
  acceptedAt: string | null;
  invitedBy: { id: string; fullname: string; email: string } | null;
  createdAt: string;
};

export default function InvitationsPage() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const pendingInvites = useMemo(
    () => invitations.filter((i) => !i.acceptedAt),
    [invitations]
  );
  const acceptedInvites = useMemo(
    () => invitations.filter((i) => i.acceptedAt),
    [invitations]
  );

  const inviteSchema = z.object({
    fullname: z.string().trim().min(2, "Full name is required"),
    email: z.string().trim().email("Valid email is required"),
  });

  const fetchInvitations = async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/auth/invitations?includeAccepted=true", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load invitations");
      setInvitations(data.invitations || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load invitations";
      setError(msg);
      toast.error(msg);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const onInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const parsed = inviteSchema.safeParse({ fullname, email });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message || "Invalid input";
      setError(first);
      toast.error(first);
      return;
    }
    try {
      setSending(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");
      setSuccess("Invitation sent successfully");
      toast.success("Invitation sent");
      setFullname("");
      setEmail("");
      fetchInvitations();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send invitation";
      setError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const onResend = async (inv: Invitation) => {
    setError(null);
    setSuccess(null);
    try {
      setResendingId(inv.id);
      const res = await fetch("/api/auth/invitations/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inv.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      setSuccess(`Invitation re-sent to ${inv.email}`);
      toast.success(`Re-sent to ${inv.email}`);
      fetchInvitations();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to resend";
      setError(msg);
      toast.error(msg);
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section aria-labelledby="invite-admins">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_16px] shadow-cyan-400/50" />
              <h1 id="invite-admins" className="text-xl font-semibold text-white">Invite Admins</h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">Send invitation emails to new administrators. Invites expire in 7 days.</p>
          </div>
          <div className="px-6 py-5">
            {error && (
              <div className="mb-4 p-3 rounded border border-red-500 text-red-300 bg-red-900/20">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded border border-green-500 text-green-300 bg-green-900/20">{success}</div>
            )}
            <form onSubmit={onInvite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-slate-300" htmlFor="fullname">Full name</label>
                  <input
                    id="fullname"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Jane Doe"
                    aria-label="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-300" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    aria-label="Email address"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 font-medium text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                >
                  {sending ? "Sending..." : "Send Invitation"}
                </button>
                <p className="text-xs text-slate-500">An email with a secure link will be sent to the invitee.</p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section aria-labelledby="pending-invitations">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 id="pending-invitations" className="text-lg font-medium text-white">Pending Invitations</h2>
            <p className="mt-1 text-sm text-slate-400">Invites awaiting acceptance by recipients.</p>
          </div>
          {listLoading ? (
            <div className="px-6 py-6 text-slate-400">Loading invitations...</div>
          ) : pendingInvites.length === 0 ? (
            <div className="px-6 py-6 text-slate-400">No pending invitations.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-6 text-xs text-slate-400 px-6 py-2 border-b border-slate-800">
                  <div className="col-span-2">Email</div>
                  <div>Name</div>
                  <div>Invited By</div>
                  <div>Expires</div>
                  <div>Actions</div>
                </div>
                <ul className="divide-y divide-slate-800">
                  {pendingInvites.map((inv) => (
                    <li key={inv.id} className="grid grid-cols-6 items-center px-6 py-3">
                      <div className="col-span-2 truncate text-white" title={inv.email}>{inv.email}</div>
                      <div className="truncate text-slate-200" title={inv.fullname}>{inv.fullname}</div>
                      <div className="truncate text-slate-300" title={inv.invitedBy ? `${inv.invitedBy.fullname} (${inv.invitedBy.email})` : ""}>{inv.invitedBy ? `${inv.invitedBy.fullname} (${inv.invitedBy.email})` : "—"}</div>
                      <div className="text-slate-400">{new Date(inv.expiresAt).toLocaleString()}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onResend(inv)}
                          disabled={resendingId === inv.id}
                          className="inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm text-white border border-slate-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-slate-600"
                          aria-label={`Resend invitation to ${inv.email}`}
                        >
                          {resendingId === inv.id ? "Resending..." : "Resend"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="accepted-invitations">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 id="accepted-invitations" className="text-lg font-medium text-white">Accepted Invitations</h2>
            <p className="mt-1 text-sm text-slate-400">Recently accepted invitations for audit purposes.</p>
          </div>
          {listLoading ? (
            <div className="px-6 py-6 text-slate-400">Loading invitations...</div>
          ) : acceptedInvites.length === 0 ? (
            <div className="px-6 py-6 text-slate-400">No accepted invitations yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-6 text-xs text-slate-400 px-6 py-2 border-b border-slate-800">
                  <div className="col-span-2">Email</div>
                  <div>Name</div>
                  <div>Invited By</div>
                  <div>Accepted At</div>
                  <div></div>
                </div>
                <ul className="divide-y divide-slate-800">
                  {acceptedInvites.map((inv) => (
                    <li key={inv.id} className="grid grid-cols-6 items-center px-6 py-3">
                      <div className="col-span-2 truncate text-white" title={inv.email}>{inv.email}</div>
                      <div className="truncate text-slate-200" title={inv.fullname}>{inv.fullname}</div>
                      <div className="truncate text-slate-300" title={inv.invitedBy ? `${inv.invitedBy.fullname} (${inv.invitedBy.email})` : ""}>{inv.invitedBy ? `${inv.invitedBy.fullname} (${inv.invitedBy.email})` : "—"}</div>
                      <div className="text-slate-400">{inv.acceptedAt ? new Date(inv.acceptedAt).toLocaleString() : ""}</div>
                      <div />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
