"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Search, Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface IMessage {
  _id: string;
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  createdAt: string;
  status: "new" | "replied" | "closed";
  replies: Array<{ body: string; to: string; from: string; createdAt: string; repliedById?: string; repliedByName?: string; repliedByEmail?: string }>;
}

type Bubble = {
  id: string;
  role: "user" | "admin";
  body: string;
  at: string;
  repliedByName?: string;
};

export default function MailPage() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [selected, setSelected] = useState<IMessage | null>(null);
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; fullname: string; email: string; role: string } | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/mail/messages?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      setMessages(data.messages || []);
      const pg = data.pagination || {};
      setTotal(pg.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // Fetch current admin for display/fallback
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return; // not critical to break the page
        const data = await res.json();
        if (data?.admin) setCurrentAdmin(data.admin);
      } catch {}
    };
    run();
  }, []);

  // Build chat bubbles: original inbound, then all replies
  const bubbles: Bubble[] = useMemo(() => {
    if (!selected) return [];
    const base: Bubble[] = [
      {
        id: `${selected._id}-orig`,
        role: "user",
        body: selected.message,
        at: selected.createdAt,
      },
    ];
    const replies = (selected.replies || []).map((r, idx) => ({
      id: `${selected._id}-r-${idx}`,
      role: "admin" as const,
      body: r.body,
      at: r.createdAt,
      repliedByName: r.repliedByName || r.repliedByEmail || currentAdmin?.fullname,
    }));
    return [...base, ...replies];
  }, [selected, currentAdmin]);

  useEffect(() => {
    // Scroll to bottom when conversation changes or modal opens
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [bubbles.length, selected, open]);

  const onSendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/mail/messages/${selected._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send reply");
      setReply("");
      await fetchMessages();
      // Keep the same selected after refresh
      setSelected((prev) => {
        if (!prev) return prev;
        const found = (data?.messageId ? messages.find((m) => m._id === data.messageId) : messages.find((m) => m._id === prev._id)) || null;
        return found || prev;
      });
      // scroll bottom next tick
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const formatted = useMemo(() => messages, [messages]);

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());
  const selectAll = () => setSelectedIds(new Set(formatted.map(m => m._id)));

  const updateStatusBulk = async (newStatus: 'new'|'replied'|'closed') => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map(async (id) => {
        await fetch(`/api/mail/messages/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      }));
      clearSelection();
      await fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header for context (icon + count) */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Mail className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg sm:text-xl font-semibold truncate">Mail</h1>
          <Badge variant="secondary" className="bg-white/10 border-white/10">{messages.length}</Badge>
        </div>
      </div>

      {/* Main grid */}
      <main className="px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Toolbar: search + filter inline */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
              </div>
              <div className="flex items-center gap-2">
                <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-36 bg-slate-800/60 border-slate-700 text-white">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchMessages} className="bg-cyan-600 hover:bg-cyan-500 transition-colors"><Search className="w-4 h-4 mr-2" />Search</Button>
              </div>
            </div>
          </div>

          {/* Gmail-like container */}
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            {/* List header / bulk actions */}
            <div className="px-3 sm:px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="accent-cyan-500" aria-label="Select all" onChange={(e)=> e.target.checked ? selectAll() : clearSelection()} />
                <span className="hidden sm:inline">Selected {selectedIds.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800" onClick={fetchMessages}>Refresh</Button>
                <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => updateStatusBulk('replied')} disabled={selectedIds.size===0}>Mark as replied</Button>
                <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => updateStatusBulk('closed')} disabled={selectedIds.size===0}>Close</Button>
                <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800" onClick={clearSelection} disabled={selectedIds.size===0}>Clear</Button>
              </div>
            </div>

            {/* Messages list */}
            <div className="divide-y divide-slate-800">
              {loading ? (
              <div className="text-slate-400 text-sm p-4">Loading…</div>
              ) : formatted.length === 0 ? (
              <div className="text-slate-400 text-sm p-4">No messages</div>
              ) : (
              formatted.map((m) => {
                const active = selected?._id === m._id;
                return (
                  <div key={m._id} className={`group px-3 sm:px-4 py-3 sm:py-3.5 ${active ? "bg-slate-900" : "hover:bg-slate-900/70"}`}>
                    <div className="flex items-start sm:items-center gap-3">
                      <input type="checkbox" className="mt-1 sm:mt-0 accent-cyan-500" checked={selectedIds.has(m._id)} onChange={()=>toggleRow(m._id)} aria-label="Select row" />
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { setSelected(m); setOpen(true); }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="font-medium truncate text-slate-100">{m.subject || "(no subject)"}</div>
                          {m.status === "new" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px] shadow-cyan-400/60" />}
                          <Badge className="ml-1 bg-slate-800 border-slate-700 text-slate-300 capitalize hidden sm:inline">{m.status}</Badge>
                        </div>
                        <div className="text-xs text-slate-400 truncate">{m.name} • {m.email}</div>
                        <div className="text-sm text-slate-300 line-clamp-1 sm:line-clamp-2 mt-1">{m.message}</div>
                      </div>
                      <div className="text-[11px] text-slate-400 whitespace-nowrap pl-2">{new Date(m.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>
          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <div>Page {page} of {Math.max(1, Math.ceil(total / pageSize))} • {total} messages</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Newer</Button>
              <Button variant="outline" size="sm" className="bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-800" onClick={() => setPage((p) => (p * pageSize < total ? p + 1 : p))} disabled={page * pageSize >= total}>Older</Button>
            </div>
          </div>
        </div>
        {/* Conversation Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl lg:max-w-4xl bg-slate-900 border border-slate-800 text-white p-0 overflow-hidden">
            <DialogHeader className="px-5 py-4 pt-8 border-b border-slate-800">
              <DialogTitle className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{selected?.name}</div>
                  <div className="text-slate-400 text-xs truncate">{selected?.email}{selected?.company ? ` • ${selected.company}` : ""}</div>
                </div>
                <div className="hidden sm:block text-slate-400 text-xs truncate max-w-[50%]">{selected?.subject || "(no subject)"}</div>
              </DialogTitle>
            </DialogHeader>
            {/* Thread */}
            <div ref={scrollRef} className="max-h[70vh] sm:max-h-[70vh] overflow-y-auto p-4 sm:p-6 space-y-3">
              {bubbles.map((b) => (
                <div key={b.id} className={`flex ${b.role === "admin" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl border transition-all duration-200 ${
                      b.role === "admin"
                        ? "bg-cyan-600/90 border-cyan-500 text-white shadow-[0_4px_24px] shadow-cyan-600/20"
                        : "bg-slate-900 border-slate-800 text-slate-100"
                    } p-3 sm:p-4 animate-in fade-in slide-in-from-bottom-1`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-6">{b.body}</div>
                    <div className={`mt-1.5 text-[10px] ${b.role === "admin" ? "text-white/80" : "text-slate-400"}`}>
                      {new Date(b.at).toLocaleString()}
                      {b.role === 'admin' && (
                        <>
                          {` • Replied${b.repliedByName ? ` by ${b.repliedByName}` : ''}`}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Composer */}
            {selected && (
              <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/80">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 focus-within:border-cyan-700 transition-colors">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    className="min-h-[80px] max-h-[40vh] bg-transparent border-0 focus-visible:ring-0 text-white"
                  />
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="text-xs text-slate-500">Replies are sent to {selected.email}</div>
                    <Button onClick={onSendReply} disabled={sending || !reply.trim()} className="bg-cyan-600 hover:bg-cyan-500 transition-colors">
                      {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Send
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
