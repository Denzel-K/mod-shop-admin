"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Shield } from "lucide-react";
import { ModShopLogo } from "@/components/mod-shop-logo";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string(),
}).refine((vals) => vals.password === vals.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<{ fullname: string; email: string; role?: "super-admin" | "manager" | "curator" } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError("Missing invitation token.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/auth/invitations/validate?token=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to validate invitation");
        setInvitation({ fullname: data.invitation.fullname, email: data.invitation.email, role: data.invitation.role });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to validate invitation";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Missing invitation token.");
      return;
    }

    const parsed = schema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message || "Invalid input";
      setError(first);
      toast.error(first);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept invitation");
      setSuccess("Invitation accepted. Redirecting to dashboard...");
      toast.success("Account created");
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to accept invitation";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Accept Invitation</h1>
          <p className="text-slate-400">Validating invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">Loading…</div>}>
    <div className="relative min-h-screen bg-slate-900/80 flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(#0b1220_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />
      </div>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <ModShopLogo size="lg" />
              <h1 className="text-xl font-semibold text-white">Accept Invitation</h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">Join the Mod Shop Admin Portal by creating your password.</p>
          </div>

          <div className="px-6 py-5">
            {error && (
              <div className="mb-4 p-3 rounded border border-red-500 text-red-300 bg-red-900/20">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded border border-green-500 text-green-300 bg-green-900/20">
                {success}
              </div>
            )}
            {invitation && (
              <div className="mb-6 text-sm text-slate-300 grid grid-cols-1 gap-2">
                <div><span className="text-slate-400">Name:</span> {invitation.fullname}</div>
                <div><span className="text-slate-400">Email:</span> {invitation.email}</div>
                {invitation.role && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Assigned Role:</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-200">
                      <Shield className="size-3 text-cyan-400" />
                      {invitation.role.replace('-', ' ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-slate-300" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">Minimum 8 characters.</p>
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-200"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 font-medium text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              >
                {submitting ? "Creating account..." : "Accept Invitation"}
              </button>
            </form>
          </div>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">Having trouble? Contact your administrator for a new invitation.</p>
      </div>
    </div>
    </Suspense>
  );
}
