
import Link from "next/link";
import AuthLayout from "@/components/layout/AuthLayout";
import { ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <AuthLayout>
      <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to ARCHYV</h2>
          <p className="text-gray-500 text-sm">Select your role to continue</p>
        </div>

        <div className="space-y-4">
          <Link href="/auth/faculty/login" className="block group">
            <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-between hover:border-[var(--archyv-accent)] hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--archyv-accent)]/10 flex items-center justify-center text-[var(--archyv-accent)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground text-lg mb-0.5">Faculty</div>
                  <div className="text-sm text-gray-500">Access and manage your department files</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--archyv-accent)] transition-colors" />
            </div>
          </Link>

          <Link href="/auth/admin/login" className="block group">
            <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-between hover:border-[var(--archyv-accent)] hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--archyv-accent)]/10 flex items-center justify-center text-[var(--archyv-accent)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground text-lg mb-0.5">Admin</div>
                  <div className="text-sm text-gray-500">Manage institution files, faculty and settings</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--archyv-accent)] transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
