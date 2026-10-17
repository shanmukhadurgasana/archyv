"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Pencil, 
  Check, 
  X, 
  KeyRound, 
  Sparkles 
} from "lucide-react";
import { useAppContext } from "@/store/AppContext";

export default function SuperAdminProfile() {
  const { currentUser, updateUserProfile } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
  });

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleEditOpen = () => {
    setFormData({
      name: currentUser?.name || "",
      phone: currentUser?.phone || "",
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    updateUserProfile(formData);
    setIsEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "New password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordStatus({ type: "success", message: "Password updated successfully!" });
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setPasswordStatus(null);
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setPasswordStatus({ type: "error", message: data.message || "Failed to change password. Verify your current password." });
      }
    } catch (err: any) {
      setPasswordStatus({ type: "error", message: err.message || "Network error occurred." });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Super Admin Profile"
        subtitle="Manage master administrator account credentials and personal settings."
      />

      {/* Main Profile Card */}
      <div className="bg-white border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-[var(--archyv-accent)]/20 border-b border-[var(--border)] relative p-6 flex items-end justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-foreground border border-[var(--border)] font-bold text-xs shadow-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[var(--archyv-accent-hover)]" />
            Super Administrator
          </div>
          {!isEditing && (
            <button
              onClick={handleEditOpen}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-foreground text-xs font-semibold shadow-xs transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Info Content */}
        <div className="p-6 md:p-8 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-[var(--archyv-accent)]/20 border-4 border-white shadow-md flex items-center justify-center text-foreground font-extrabold text-2xl overflow-hidden shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.substring(0, 2).toUpperCase() || "SA"
                )}
              </div>
              <div className="mb-1">
                <h2 className="text-xl font-bold text-foreground">{currentUser?.name || "Super Administrator"}</h2>
                <p className="text-xs text-gray-500 font-mono">{currentUser?.email || "superadmin@archyv.com"}</p>
              </div>
            </div>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-gray-500" />
              Change Password
            </button>
          </div>

          {/* Edit Form or Read View */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-xs font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-xs">
              <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                <span className="text-gray-400 font-medium">Email Address</span>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {currentUser?.email || "superadmin@archyv.com"}
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                <span className="text-gray-400 font-medium">Contact Phone</span>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {currentUser?.phone || "Not specified"}
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                <span className="text-gray-400 font-medium">Account Role</span>
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--archyv-accent-hover)]" />
                  Super Administrator (Master Access)
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/70 rounded-xl space-y-1">
                <span className="text-gray-400 font-medium">Last Login</span>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {currentUser?.lastLogin || "Today"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-gray-500" />
                <h3 className="font-bold text-foreground">Change Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordStatus(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordStatus && (
              <div className={`mb-4 p-3 rounded-xl text-xs ${
                passwordStatus.type === "success" 
                  ? "bg-[var(--archyv-accent)]/15 text-foreground border border-[var(--border)]" 
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {passwordStatus.message}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-5 py-2.5 rounded-xl bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
                >
                  {isSubmittingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
