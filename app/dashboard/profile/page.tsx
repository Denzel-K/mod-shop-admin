"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Lock, ChevronDown, ChevronUp, Edit, Save, X, Package, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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

  // Assets state
  const [assets, setAssets] = useState<{_id: string; name: string; thumbnailUrl: string}[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);

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
        setAdminId(data.admin.id);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load profile";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Fetch assets curated by this admin
  useEffect(() => {
    if (!adminId) return;
    
    const fetchAssets = async () => {
      try {
        setAssetsLoading(true);
        const res = await fetch(`/api/assets?curatedBy=${adminId}&limit=6`, { cache: "no-store" });
        const data = await res.json();
        if (res.ok) {
          setAssets(data.assets || []);
        }
      } catch (e) {
        console.error("Failed to load assets:", e);
      } finally {
        setAssetsLoading(false);
      }
    };
    
    fetchAssets();
  }, [adminId]);

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
    <div className="mx-auto max-w-[1400px] pt-8 space-y-6">
      {/* Page Header */}
      <header className="flex items-center gap-3">
        <User className="size-5 text-cyan-400" />
        <h1 className="text-xl font-bold text-white">Profile Settings</h1>
      </header>

      {/* Global Messages */}
      {error && (
        <div className="p-3 rounded-lg border border-red-500 text-red-300 bg-red-900/20 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-lg border border-green-500 text-green-300 bg-green-900/20 text-sm">{success}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Personal Info & Security (2/3 width on desktop) */}
        <div className="xl:col-span-2 space-y-8">
          {/* Personal Information */}
          <section aria-labelledby="personal-info">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-5 rounded bg-cyan-500/20 flex items-center justify-center">
                    <div className="size-2.5 rounded bg-cyan-400" />
                  </div>
                  <h2 id="personal-info" className="text-xl font-semibold text-white">Personal Information</h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg transition"
                  >
                    {editMode ? (
                      <>
                        <X className="size-3.5" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="size-3.5" />
                        Edit
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Avatar Section */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <Avatar className="size-20 border-2 border-slate-700">
                        <AvatarImage src={avatarUrl || undefined} alt={fullname || "Admin"} />
                        <AvatarFallback className="bg-slate-800 text-slate-300 text-lg font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      {editMode && (
                        <div className="absolute -bottom-2 -right-2 flex gap-1">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarUploading}
                            className="size-8 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center text-xs disabled:opacity-60 transition"
                            title="Upload new avatar"
                          >
                            {avatarUploading ? (
                              <RefreshCw className="size-3 animate-spin" />
                            ) : (
                              <Edit className="size-3" />
                            )}
                          </button>
                          {avatarUrl && (
                            <button
                              onClick={onRemoveAvatar}
                              disabled={avatarRemoving}
                              className="size-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-xs disabled:opacity-60 transition"
                              title="Remove avatar"
                            >
                              {avatarRemoving ? (
                                <RefreshCw className="size-3 animate-spin" />
                              ) : (
                                <X className="size-3" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadAvatar(f);
                        e.currentTarget.value = '';
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Profile Form */}
                  <div className="flex-1 min-w-0">
                    {editMode ? (
                      <form onSubmit={onSaveProfile} className="space-y-4">
                        <div>
                          <label htmlFor="fullname" className="block text-sm font-medium text-slate-300 mb-1">
                            Full Name
                          </label>
                          <input
                            id="fullname"
                            type="text"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                            Email Address
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditMode(false)}
                            className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800/50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg disabled:opacity-60 transition"
                          >
                            {saving ? (
                              <>
                                <RefreshCw className="size-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="size-4" />
                                Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                          <p className="text-white font-medium">{fullname || "Not set"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                          <p className="text-white">{email || "Not set"}</p>
                        </div>
                      </div>
                    )}
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
                className="w-full px-6 py-5 text-left border-b border-slate-800 hover:bg-slate-800/30 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="size-5 rounded bg-amber-500/20 flex items-center justify-center">
                    <div className="size-2.5 rounded bg-amber-400" />
                  </div>
                  <div>
                    <h2 id="security-section" className="text-xl font-semibold text-white">Security Settings</h2>
                    <p className="text-sm text-slate-400 mt-1">Change your password and security preferences</p>
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
                  <form onSubmit={onChangePassword} className="space-y-4">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-slate-300 mb-1">
                        Current Password
                      </label>
                      <input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-1">
                        New Password
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordSectionOpen(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmNewPassword("");
                        }}
                        className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800/50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={pwdSaving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg disabled:opacity-60 transition"
                      >
                        {pwdSaving ? (
                          <>
                            <RefreshCw className="size-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Lock className="size-4" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Curated Assets (1/3 width on desktop) */}
        <div className="xl:col-span-1">
          <section aria-labelledby="curated-assets">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg overflow-hidden h-fit">
              <div className="px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded bg-emerald-500/20 flex items-center justify-center">
                    <div className="size-2 rounded bg-emerald-400" />
                  </div>
                  <h2 id="curated-assets" className="text-lg font-semibold text-white">Curated Assets</h2>
                </div>
                <p className="text-sm text-slate-400 mt-1">Assets you&apos;ve curated and managed</p>
              </div>
              
              <div className="p-5">
                {assetsLoading ? (
                  <div className="text-center py-8">
                    <div className="size-12 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <Package className="size-6 text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-sm">Loading assets...</p>
                  </div>
                ) : assets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="size-12 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <Package className="size-6 text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">No assets curated yet</p>
                    <p className="text-slate-500 text-xs">Assets you curate will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-300 font-medium">{assets.length} Asset{assets.length !== 1 ? 's' : ''} Curated</p>
                      <Link 
                        href="/dashboard/assets" 
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                      >
                        View all <ExternalLink className="size-3" />
                      </Link>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {assets.slice(0, 4).map((asset) => (
                        <Link
                          key={asset._id}
                          href={`/dashboard/assets/${asset._id}`}
                          className="group block rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 hover:border-slate-700 transition overflow-hidden"
                        >
                          <div className="aspect-square relative bg-slate-900">
                            <Image
                              src={asset.thumbnailUrl}
                              alt={asset.name}
                              fill
                              sizes="120px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-white font-medium truncate" title={asset.name}>
                              {asset.name}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
