import PageHeader from "@/components/ui/PageHeader";
import { Shield, Smartphone, Laptop } from "lucide-react";

export default function AdminSecurity() {
  return (
    <div className="max-w-4xl">
      <PageHeader 
        title="Security" 
        subtitle="Manage security settings and active sessions for your admin account."
      />

      <div className="space-y-6">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--archyv-accent)]/10 flex items-center justify-center text-[var(--archyv-accent)]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Enabled
            </div>
          </div>

          <div className="pl-16">
            <p className="text-sm text-gray-600 mb-4 max-w-xl">
              Two-factor authentication is currently enabled. You will be prompted for an authentication code when signing in from unrecognized devices.
            </p>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-white border border-gray-200 text-foreground font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Disable 2FA
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 text-foreground font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Generate Recovery Codes
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Active Sessions</h2>
              <p className="text-sm text-gray-500">Manage your active sessions across all devices.</p>
            </div>
          </div>

          <div className="pl-16 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="flex items-start gap-3">
                <Laptop className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    Windows • Chrome
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full uppercase tracking-wider font-bold">This Device</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">IP: 192.168.1.5 • Last active: Just now</div>
                  <div className="text-xs text-gray-500">Location: Mumbai, India</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">iOS • Safari</div>
                  <div className="text-xs text-gray-500 mt-1">IP: 112.19.45.12 • Last active: 2 hours ago</div>
                  <div className="text-xs text-gray-500">Location: Mumbai, India</div>
                </div>
              </div>
              <button className="px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors">
                Revoke Session
              </button>
            </div>
            
            <button className="mt-2 px-4 py-2 bg-white border border-gray-200 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors text-sm">
              Sign out of all other devices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
