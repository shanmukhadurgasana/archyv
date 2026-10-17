"use client";

import React, { useEffect, useState } from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";
import Header from "./Header";
import SuperAdminLogin from "@/components/auth/SuperAdminLogin";
import { useAppContext } from "@/store/AppContext";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { currentUser, authStatus, isRefreshing } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || (authStatus === "loading" && !currentUser)) {
    return (
      <div className="flex h-screen bg-white items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--archyv-accent)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-500">Loading Super Admin Workspace...</span>
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.role?.toLowerCase() === "super_admin" || 
                       currentUser?.role?.toLowerCase() === "superadmin";

  // If not authenticated or not a super admin, show Super Admin Login
  if (authStatus === "unauthenticated" || !currentUser || !isSuperAdmin) {
    return <SuperAdminLogin />;
  }

  return (
    <div className="flex h-screen bg-white">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={currentUser} />
        {isRefreshing && (
          <div className="h-0.5 w-full bg-[var(--border)] overflow-hidden">
            <div className="h-full bg-[var(--archyv-accent)] animate-pulse w-full"></div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-8 bg-[var(--background)]">
          <div className="max-w-6xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
