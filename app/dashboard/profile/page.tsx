"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load profile");
        setFullname(data.admin.fullname || "");
        setEmail(data.admin.email || "");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load profile";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const onSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setSuccess("Profile updated successfully");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update profile";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setPwdSaving(true);
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to change password";
      setError(msg);
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 mt-4">
          <h1 className="text-2xl font-semibold text-white mb-2">Profile</h1>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="profile-info" className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_16px] shadow-cyan-400/50" />
              <h1 id="profile-info" className="text-xl font-semibold text-white">Profile</h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">Update your name and email address used across the admin portal.</p>
          </div>
          <div className="px-6 py-5">
            {error && (
              <div className="mb-4 p-3 rounded border border-red-500 text-red-300 bg-red-900/20">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded border border-green-500 text-green-300 bg-green-900/20">{success}</div>
            )}
            <form onSubmit={onSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-slate-300" htmlFor="fullname">Full name</label>
                  <input
                    id="fullname"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Your name"
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
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 font-medium text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section aria-labelledby="change-password" className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 id="change-password" className="text-lg font-medium text-white">Change password</h2>
            <p className="mt-1 text-sm text-slate-400">Choose a strong password to protect your account.</p>
          </div>
          <div className="px-6 py-5">
            <form onSubmit={onChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-slate-300" htmlFor="currentPassword">Current password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-300" htmlFor="newPassword">New password</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-500">Minimum 8 characters.</p>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-slate-300" htmlFor="confirmNewPassword">Confirm new password</label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={pwdSaving}
                className="inline-flex items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 font-medium text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              >
                {pwdSaving ? "Updating..." : "Update password"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
