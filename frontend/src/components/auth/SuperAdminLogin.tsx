"use client";

import { useState } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import { Eye, EyeOff, ShieldAlert, Sparkles, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/store/AppContext";

export default function SuperAdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedDemo, setCopiedDemo] = useState(false);

  const router = useRouter();
  const { login } = useAppContext();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      setIsLoading(false);

      if (result === true) {
        router.push("/superadmin");
      } else {
        setError("Invalid Super Admin credentials. Please check email and password.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setError("An error occurred during authentication.");
    }
  };

  const fillDemoCredentials = () => {
    setEmail("superadmin@archyv.com");
    setPassword("SuperAdmin@123");
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2500);
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--archyv-accent)]/15 border border-[var(--archyv-accent)]/30 text-[var(--foreground)] text-xs font-semibold mb-3 tracking-wider uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-[#a87431]" />
            Restricted Portal
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Super Admin Access
          </h2>
          <p className="text-gray-500 text-sm">
            Master control workspace for institution administrators
          </p>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-left">
              {error}
            </div>
          )}
        </div>

        {/* Demo Credentials Box */}
        <div className="mb-6 p-4 rounded-2xl bg-[var(--archyv-accent)]/10 border border-[var(--border)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--archyv-accent-hover)]" />
              Demo Super Admin Credentials
            </span>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs font-semibold text-foreground hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedDemo ? (
                <>
                  <Check className="w-3 h-3 text-foreground" />
                  <span className="text-foreground font-bold">Filled!</span>
                </>
              ) : (
                "Fill Credentials"
              )}
            </button>
          </div>
          <div className="text-xs font-mono text-gray-700 space-y-1 bg-white p-2.5 rounded-lg border border-[var(--border)]">
            <div>
              <span className="text-gray-400 select-none">Email: </span>
              <span className="font-semibold text-gray-900">superadmin@archyv.com</span>
            </div>
            <div>
              <span className="text-gray-400 select-none">Password: </span>
              <span className="font-semibold text-gray-900">SuperAdmin@123</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Super Admin Email
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="superadmin@archyv.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground font-semibold py-3 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Authenticating..." : "Access Super Admin Portal"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          ARCHYV Multi-Tenant Institution Management Platform
        </div>
      </div>
    </AuthLayout>
  );
}
