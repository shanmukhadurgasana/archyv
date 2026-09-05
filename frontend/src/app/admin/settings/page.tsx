"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import PasskeyManager from "@/components/auth/PasskeyManager";

export default function AdminSettings() {
  const { currentUser, updateUserProfile } = useAppContext();
  const [showPrev, setShowPrev] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [prevPassword, setPrevPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reqLength = newPassword.length >= 8;
  const reqLower = /[a-z]/.test(newPassword);
  const reqUpper = /[A-Z]/.test(newPassword);
  const reqNumber = /[0-9]/.test(newPassword);
  const reqSpecial = /[!@#$%^&*]/.test(newPassword);

  const allReqsMet = reqLength && reqLower && reqUpper && reqNumber && reqSpecial;
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  
  const isSubmitDisabled = !allReqsMet || !passwordsMatch || !prevPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!allReqsMet) {
      setError("Please satisfy all new password requirements.");
      return;
    }

    if (!passwordsMatch) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: prevPassword, newPassword })
      });

      if (response.ok) {
        setSuccess("Password updated successfully! Other sessions revoked.");
        setPrevPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update password.");
      }
    } catch (e) {
      setError("An error occurred while updating the password.");
    }
  };

  const handleCancel = () => {
    setError("");
    setSuccess("");
    setPrevPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="max-w-5xl">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account security settings."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white border border-[var(--border)] rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-[var(--archyv-accent)]/10 flex items-center justify-center text-[var(--archyv-accent)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Change Password</h2>
              <p className="text-sm text-gray-500">Update your password regularly to keep your account secure.</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-medium flex items-center gap-2 border border-green-100">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Previous Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPrev ? "text" : "password"} 
                  value={prevPassword}
                  onChange={(e) => setPrevPassword(e.target.value)}
                  placeholder="Enter your current password" 
                  className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPrev(!showPrev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPrev ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showNew ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password" 
                  className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showConfirm ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password" 
                  className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button 
                type="submit"
                disabled={isSubmitDisabled}
                className={`flex items-center gap-2 px-6 py-2.5 font-semibold rounded-lg transition-colors shadow-sm ${
                  isSubmitDisabled 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground"
                }`}
              >
                <Lock className="w-4 h-4" />
                Update Password
              </button>
              <button 
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 bg-white border border-gray-200 text-foreground font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="w-full lg:w-[300px] shrink-0 bg-orange-50/30 border border-orange-100 rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-4">
            <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center text-gray-500">
              <Check className="w-3 h-3" />
            </div>
            Password Requirements
          </div>
          <p className="text-sm text-gray-600 mb-4">Your password must include:</p>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                reqLength ? "border-[var(--archyv-accent)] text-[var(--archyv-accent)] bg-[var(--archyv-accent)]/10" : "border-gray-300 text-gray-300 bg-white"
              }`}>
                <Check className="w-2.5 h-2.5" />
              </div>
              At least 8 characters
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                reqUpper ? "border-[var(--archyv-accent)] text-[var(--archyv-accent)] bg-[var(--archyv-accent)]/10" : "border-gray-300 text-gray-300 bg-white"
              }`}>
                <Check className="w-2.5 h-2.5" />
              </div>
              One uppercase letter (A-Z)
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                reqLower ? "border-[var(--archyv-accent)] text-[var(--archyv-accent)] bg-[var(--archyv-accent)]/10" : "border-gray-300 text-gray-300 bg-white"
              }`}>
                <Check className="w-2.5 h-2.5" />
              </div>
              One lowercase letter (a-z)
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                reqNumber ? "border-[var(--archyv-accent)] text-[var(--archyv-accent)] bg-[var(--archyv-accent)]/10" : "border-gray-300 text-gray-300 bg-white"
              }`}>
                <Check className="w-2.5 h-2.5" />
              </div>
              One number (0-9)
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                reqSpecial ? "border-[var(--archyv-accent)] text-[var(--archyv-accent)] bg-[var(--archyv-accent)]/10" : "border-gray-300 text-gray-300 bg-white"
              }`}>
                <Check className="w-2.5 h-2.5" />
              </div>
              One special character (!@#$%^&*)
            </div>
          </div>
        </div>
      </div>
      
      {/* Passkey Management Section */}
      <PasskeyManager />
    </div>
  );
}
