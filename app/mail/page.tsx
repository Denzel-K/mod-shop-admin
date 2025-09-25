"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Search, Loader2, ArrowLeft, Send } from "lucide-react";

interface IMessage {
  _id: string;
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  createdAt: string;
  status: "new" | "replied" | "closed";
  replies: Array<{ body: string; to: string; from: string; createdAt: string }>;
}

type Bubble = {
  id: string;
  role: "user" | "admin";
  body: string;
  at: string;
};

export default function MailPage() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [selected, setSelected] = useState<IMessage | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await fetch(`/api/mail/messages?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      setMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }));
    return [...base, ...replies];
  }, [selected]);

  useEffect(() => {
    // Scroll to bottom when conversation changes
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [bubbles.length, selected]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg sm:text-xl font-semibold truncate">Mail</h1>
            <Badge variant="secondary" className="bg-white/10 border-white/10">{messages.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation list */}
        <section className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
            </div>
            <div className="flex gap-2 items-center">
              <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full bg-slate-800/60 border-slate-700 text-white">
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

          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="text-slate-400 text-sm">Loading…</div>
            ) : formatted.length === 0 ? (
              <div className="text-slate-400 text-sm">No messages</div>
            ) : (
              formatted.map((m) => {
                const active = selected?._id === m._id;
                return (
                  <button
                    key={m._id}
                    onClick={() => setSelected(m)}
                    className={`group w-full text-left rounded-xl border p-3 transition-colors ${
                      active ? "border-cyan-700 bg-slate-900" : "border-slate-800 bg-slate-900/60 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          <span className="truncate">{m.subject || "(no subject)"}</span>
                          {m.status === "new" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px] shadow-cyan-400/60" />}
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5 truncate">{m.name} • {m.email}</div>
                      </div>
                      <Badge className="bg-slate-800 border-slate-700 text-slate-300 capitalize">{m.status}</Badge>
                    </div>
                    <div className="text-slate-300 text-sm line-clamp-2 mt-2">{m.message}</div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Chat panel */}
        <section className="lg:col-span-2">
          {!selected ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-slate-400 flex items-center justify-center min-h-[50vh]">
              Select a conversation on the left to start.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 flex flex-col h-[70vh] sm:h-[72vh]">
              {/* Chat header with participant info */}
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{selected.name}</div>
                  <div className="text-slate-400 text-xs truncate">{selected.email}{selected.company ? ` • ${selected.company}` : ""}</div>
                </div>
                <div className="hidden sm:block text-slate-400 text-xs truncate max-w-[40%]">
                  {selected.subject || "(no subject)"}
                </div>
              </div>

              {/* Messages thread */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {bubbles.map((b) => (
                  <div
                    key={b.id}
                    className={`flex ${b.role === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] rounded-2xl border transition-all duration-200 ${
                        b.role === "admin"
                          ? "bg-cyan-600/90 border-cyan-500 text-white shadow-[0_4px_24px] shadow-cyan-600/20"
                          : "bg-slate-900 border-slate-800 text-slate-100"
                      } p-3 sm:p-4 animate-in fade-in slide-in-from-bottom-1`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-6">{b.body}</div>
                      <div className={`mt-1.5 text-[10px] ${b.role === "admin" ? "text-white/80" : "text-slate-400"}`}>
                        {new Date(b.at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/80">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 focus-within:border-cyan-700 transition-colors">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply…"
                    className="min-h-[80px] max-h-[40vh] bg-transparent border-0 focus-visible:ring-0 text-white"
                  />
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="text-xs text-slate-500">
                      Replies are sent to {selected.email}
                    </div>
                    <Button onClick={onSendReply} disabled={sending || !reply.trim()} className="bg-cyan-600 hover:bg-cyan-500 transition-colors">
                      {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
