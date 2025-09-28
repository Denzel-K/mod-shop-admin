"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Lock, ChevronDown, ChevronUp, Edit, Save, X } from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const initials = useMemo(() => {
    const parts = (fullname || "").trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || "MS";
  }, [fullname]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load profile");
        setFullname(data.admin.fullname || "");
        setEmail(data.admin.email || "");
        setAvatarUrl(data.admin.avatarUrl || null);
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
      setEditMode(false);
      toast.success("Profile updated");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update profile";
      setError(msg);
      toast.error(msg);
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
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
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
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordSectionOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to change password";
      setError(msg);
      toast.error(msg);
    } finally {
      setPwdSaving(false);
    }
  };

  const onUploadAvatar = async (file: File) => {
    setError(null);
    setSuccess(null);
    try {
      setAvatarUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "PATCH", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload avatar");
      setAvatarUrl(data.avatarUrl);
      toast.success("Avatar updated");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to upload avatar";
      setError(msg);
      toast.error(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const onRemoveAvatar = async () => {
    setError(null);
    setSuccess(null);
    try {
      setAvatarRemoving(true);
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove avatar");
      setAvatarUrl(null);
      toast.success("Avatar removed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to remove avatar";
      setError(msg);
      toast.error(msg);
    } finally {
      setAvatarRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 mt-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="size-14 rounded-full bg-slate-800" />
            <div className="h-6 w-40 bg-slate-800 rounded" />
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-10 bg-slate-800 rounded" />
            <div className="h-10 bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] pt-8 space-y-8">
      {/* Page Header */}
      <header className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <User className="size-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        </div>
      </header>

      {/* Global Messages */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500 text-red-300 bg-red-900/20">{error}</div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-green-500 text-green-300 bg-green-900/20">{success}</div>
      )}

      {/* Profile Information Section */}
      <section aria-labelledby="profile-info">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="size-5 text-cyan-400" />
              <div>
                <h2 id="profile-info" className="text-xl font-semibold text-white">Personal Information</h2>
                <p className="text-sm text-slate-400">Manage your account details and avatar</p>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
            >
              {editMode ? (
                <>
                  <X className="size-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="size-4" />
                  Edit
                </>
              )}
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[200px,1fr] gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="size-32 shadow-lg ring-2 ring-slate-700">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={fullname || 'Avatar'} />
                    ) : (
                      <AvatarFallback className="text-2xl text-slate-200 bg-slate-800">{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  {editMode && (
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity grid place-content-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-sm rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white transition"
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? 'Uploading…' : 'Change Photo'}
                      </button>
                    </div>
                  )}
                </div>
                
                {editMode && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-slate-400 text-center">PNG, JPG or WEBP<br />Max 5MB</p>
                    {avatarUrl && (
                      <button
                        onClick={onRemoveAvatar}
                        disabled={avatarRemoving}
                        className="text-xs text-red-300 hover:text-red-200 disabled:opacity-60 transition"
                      >
                        {avatarRemoving ? 'Removing…' : 'Remove Photo'}
                      </button>
                    )}
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadAvatar(f);
                    e.currentTarget.value = '';
                  }}
                />
              </div>

              {/* Profile Form */}
              <div className="space-y-6">
                <form id="profile-form" onSubmit={onSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300" htmlFor="fullname">
                        Full Name
                      </label>
                      {editMode ? (
                        <input
                          id="fullname"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition"
                          value={fullname}
                          onChange={(e) => setFullname(e.target.value)}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-slate-200 min-h-[48px] flex items-center">
                          {fullname || <span className="text-slate-500">Not set</span>}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-300" htmlFor="email">
                        Email Address
                      </label>
                      {editMode ? (
                        <input
                          id="email"
                          type="email"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                        />
                      ) : (
                        <div className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-slate-200 min-h-[48px] flex items-center">
                          {email || <span className="text-slate-500">Not set</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {editMode && (
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-60 transition"
                      >
                        <Save className="size-4" />
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section aria-labelledby="security-section">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <button
            onClick={() => setPasswordSectionOpen(!passwordSectionOpen)}
            className="w-full px-6 py-5 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/30 transition"
          >
            <div className="flex items-center gap-3">
              <Lock className="size-5 text-amber-400" />
              <div className="text-left">
                <h2 id="security-section" className="text-xl font-semibold text-white">Security Settings</h2>
                <p className="text-sm text-slate-400">Change your password and security preferences</p>
              </div>
            </div>
            {passwordSectionOpen ? (
              <ChevronUp className="size-5 text-slate-400" />
            ) : (
              <ChevronDown className="size-5 text-slate-400" />
            )}
          </button>
          
          {passwordSectionOpen && (
            <div className="p-6 border-t border-slate-800/50">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-2">Change Password</h3>
                  <p className="text-sm text-slate-400">Choose a strong password to protect your account. Minimum 8 characters required.</p>
                </div>
                
                <form onSubmit={onChangePassword} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="currentPassword">
                        Current Password
                      </label>
                      <input
                        id="currentPassword"
                        type="password"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="newPassword">
                          New Password
                        </label>
                        <input
                          id="newPassword"
                          type="password"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="confirmNewPassword">
                          Confirm New Password
                        </label>
                        <input
                          id="confirmNewPassword"
                          type="password"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordSectionOpen(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                      }}
                      className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pwdSaving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-60 transition"
                    >
                      <Lock className="size-4" />
                      {pwdSaving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
