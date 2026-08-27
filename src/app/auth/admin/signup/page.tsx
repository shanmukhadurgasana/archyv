"use client";

import Link from "next/link";
import { useState } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import { Eye, EyeOff, Key } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/auth/admin/login");
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Create Admin Account</h2>
          <p className="text-gray-500 text-sm">Sign up to create your Admin account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Name</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input 
                type="text" 
                placeholder="Enter your name" 
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Email</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Create a password" 
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
            <p className="text-xs text-gray-500 mt-2">Password must be at least 8 characters long.</p>
          </div>

          <div className="space-y-2 pt-1">
            <button 
              type="submit"
              className="w-full bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Create Account
            </button>

            <div className="relative flex items-center py-1.5">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink-0 mx-3 text-gray-400 text-sm font-medium">or</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <button 
              type="button"
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-foreground font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-sm"
            >
              <Key className="w-5 h-5 text-gray-700" />
              Continue with Passkeys
            </button>
          </div>

        </form>

        <div className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/admin/login" className="text-[var(--archyv-accent-hover)] font-medium hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </AuthLayout>
  );
}
