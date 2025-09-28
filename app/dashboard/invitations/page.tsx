"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MailPlus, RefreshCw, Send, Users, Filter, Plus } from "lucide-react";

type Invitation = {
  id: string;
  email: string;
  fullname: string;
  expiresAt: string;
  acceptedAt: string | null;
  invitedBy: { id: string; fullname: string; email: string } | null;
  role?: "super-admin" | "manager" | "curator";
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
  const [role, setRole] = useState<"super-admin" | "manager" | "curator">("curator");
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "super-admin" | "manager" | "curator">("all");

  const filteredInvitations = useMemo(() => {
    let filtered = invitations;
    
    if (statusFilter === "pending") {
      filtered = filtered.filter(i => !i.acceptedAt);
    } else if (statusFilter === "accepted") {
      filtered = filtered.filter(i => i.acceptedAt);
    }
    
    if (roleFilter !== "all") {
      filtered = filtered.filter(i => (i.role || "curator") === roleFilter);
    }
    
    return filtered;
  }, [invitations, statusFilter, roleFilter]);

  const pendingInvites = useMemo(
    () => invitations.filter((i) => !i.acceptedAt),
    [invitations]
  );
  const acceptedInvites = useMemo(
    () => invitations.filter((i) => i.acceptedAt),
    [invitations]
  );
  const totalInvites = invitations.length;

  const inviteSchema = z.object({
    fullname: z.string().trim().min(2, "Full name is required"),
    email: z.string().trim().email("Valid email is required"),
    role: z.enum(["super-admin", "manager", "curator"]).default("curator"),
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
    const parsed = inviteSchema.safeParse({ fullname, email, role });
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
        body: JSON.stringify({ fullname, email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");
      setSuccess("Invitation sent successfully");
      toast.success("Invitation sent");
      setFullname("");
      setEmail("");
      setRole("curator");
      setModalOpen(false);
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
    <div className="mx-auto max-w-[1400px] space-y-8 pt-8">
      {/* Header with stats and invite button */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <MailPlus className="size-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Team Invitations</h1>
          </div>
          <p className="mt-2 text-slate-400">Manage administrator invitations and access control.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 text-center min-w-[80px]">
              <div className="text-xs uppercase text-slate-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-white">{totalInvites}</div>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 text-center min-w-[80px]">
              <div className="text-xs uppercase text-slate-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-amber-300">{pendingInvites.length}</div>
            </div>
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 text-center min-w-[80px]">
              <div className="text-xs uppercase text-slate-400 mb-1">Accepted</div>
              <div className="text-2xl font-bold text-emerald-300">{acceptedInvites.length}</div>
            </div>
          </div>
          
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition">
                <Plus className="size-4" />
                Invite Admin
              </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Invite New Administrator</DialogTitle>
              </DialogHeader>
              
              {error && (
                <div className="p-3 rounded border border-red-500 text-red-300 bg-red-900/20 text-sm">{error}</div>
              )}
              {success && (
                <div className="p-3 rounded border border-green-500 text-green-300 bg-green-900/20 text-sm">{success}</div>
              )}
              
              <form onSubmit={onInvite} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 text-slate-300" htmlFor="modal-fullname">Full name</label>
                  <input
                    id="modal-fullname"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-slate-300" htmlFor="modal-email">Email address</label>
                  <input
                    id="modal-email"
                    type="email"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-slate-300" htmlFor="modal-role">Role</label>
                  <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                    <SelectTrigger className="w-full rounded-lg border border-slate-700 bg-slate-950/80 text-white focus:outline-none focus:ring-2 focus:ring-cyan-600">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border border-slate-700 text-slate-100">
                      <SelectItem value="super-admin">Super Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="curator">Curator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800/50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg disabled:opacity-60 transition"
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Unified table with filters */}
      <section>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">All Invitations</h2>
                <p className="mt-1 text-sm text-slate-400">Manage and track invitation status</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-slate-400" />
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger className="w-32 rounded-lg border border-slate-700 bg-slate-950/80 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border border-slate-700 text-slate-100">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
                  <SelectTrigger className="w-32 rounded-lg border border-slate-700 bg-slate-950/80 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border border-slate-700 text-slate-100">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super-admin">Super Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="curator">Curator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {listLoading ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <RefreshCw className="size-6 animate-spin mx-auto mb-3" />
              Loading invitations...
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <Users className="size-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">No invitations found</p>
              <p className="text-sm">Try adjusting your filters or invite a new administrator.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-950/50">
                  <tr className="text-xs text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">User</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Invited By</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/40 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{inv.fullname}</div>
                          <div className="text-sm text-slate-400">{inv.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300">
                          {(inv.role || 'curator').replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {inv.acceptedAt ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-900/30 border border-emerald-700/50 px-2.5 py-1 text-xs font-medium text-emerald-300">
                            Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-900/30 border border-amber-700/50 px-2.5 py-1 text-xs font-medium text-amber-300">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {inv.invitedBy ? inv.invitedBy.fullname : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {inv.acceptedAt 
                          ? new Date(inv.acceptedAt).toLocaleDateString()
                          : `Expires ${new Date(inv.expiresAt).toLocaleDateString()}`
                        }
                      </td>
                      <td className="px-6 py-4">
                        {!inv.acceptedAt && (
                          <button
                            onClick={() => onResend(inv)}
                            disabled={resendingId === inv.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg disabled:opacity-60 transition"
                          >
                            {resendingId === inv.id ? (
                              <>
                                <RefreshCw className="size-3.5 animate-spin" />
                                Resending...
                              </>
                            ) : (
                              <>
                                <Send className="size-3.5" />
                                Resend
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
