"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { 
  Settings, 
  ShieldCheck, 
  HardDrive, 
  Database, 
  Bell, 
  KeyRound, 
  Check, 
  Sparkles 
} from "lucide-react";
import { useAppContext } from "@/store/AppContext";

export default function SuperAdminSettings() {
  const { currentUser } = useAppContext();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Institution settings state
  const [instName, setInstName] = useState("ARCHYV Institutional Repository");
  const [retentionDays, setRetentionDays] = useState("90");
  const [allowPublicViewer, setAllowPublicViewer] = useState(true);
  const [enforce2FA, setEnforce2FA] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Global platform configurations, storage policies, and institutional security controls."
      />

      {saveSuccess && (
        <div className="p-4 bg-[var(--archyv-accent)]/15 border border-[var(--border)] text-foreground rounded-2xl flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-foreground" />
          Settings saved successfully.
        </div>
      )}

      {/* Demo Credentials Reminder Box */}
      <div className="bg-gray-50 border border-[var(--border)] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[var(--archyv-accent-hover)]" />
          <h3 className="font-bold text-foreground text-sm">Super Admin Demo Credentials Reference</h3>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          To access the restricted Super Admin portal, use the direct URL <code className="bg-[var(--archyv-accent)]/20 px-1.5 py-0.5 rounded text-foreground font-mono font-bold border border-[var(--border)]">/superadmin</code> and sign in with:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-white p-3 rounded-xl border border-[var(--border)]">
          <div>
            <span className="text-gray-500">Email: </span>
            <span className="font-bold text-gray-900">superadmin@archyv.com</span>
          </div>
          <div>
            <span className="text-gray-500">Password: </span>
            <span className="font-bold text-gray-900">SuperAdmin@123</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Institution Preferences */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <Database className="w-5 h-5 text-gray-500" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Institution Information</h2>
              <p className="text-xs text-gray-400">Branding and institutional workspace identity</p>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Institution Repository Name
              </label>
              <input
                type="text"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Document Trash Retention Period (Days)
              </label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
              />
              <p className="text-[11px] text-gray-400 mt-1">Soft-deleted files in Trash will be purged after this duration.</p>
            </div>
          </div>
        </div>

        {/* Security & Access Policies */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <ShieldCheck className="w-5 h-5 text-gray-500" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Governance & Security Policies</h2>
              <p className="text-xs text-gray-400">Access control restrictions and authentication enforcement</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={allowPublicViewer}
                onChange={(e) => setAllowPublicViewer(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[var(--archyv-accent)] focus:ring-[var(--archyv-accent)]"
              />
              <div>
                <div className="text-sm font-semibold text-foreground">In-Browser Live Document Viewer</div>
                <div className="text-xs text-gray-500">Allow users to view spreadsheets, PDFs, and Word files directly in browser</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={enforce2FA}
                onChange={(e) => setEnforce2FA(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[var(--archyv-accent)] focus:ring-[var(--archyv-accent)]"
              />
              <div>
                <div className="text-sm font-semibold text-foreground">Require Two-Factor Authentication for Admins</div>
                <div className="text-xs text-gray-500">Enforces TOTP 2FA for all administrator logins across the portal</div>
              </div>
            </label>
          </div>
        </div>

        {/* Cloud Storage Integration Info */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <HardDrive className="w-5 h-5 text-gray-500" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Cloud Storage Connectivity</h2>
              <p className="text-xs text-gray-400">Google Drive API service integration status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl space-y-1">
              <span className="text-gray-500 font-medium">Provider</span>
              <div className="font-bold text-foreground">Google Drive API v3</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl space-y-1">
              <span className="text-gray-500 font-medium">Authentication State</span>
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--archyv-accent-hover)]" />
                OAuth2 Refresh Token Active
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            Save System Configurations
          </button>
        </div>
      </form>
    </div>
  );
}
