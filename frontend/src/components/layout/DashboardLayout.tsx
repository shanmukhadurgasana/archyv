"use client";

import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAppContext } from "@/store/AppContext";
import { usePathname, useRouter } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentUser, authStatus, isRefreshing } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (authStatus === "unauthenticated") {
      router.push("/");
    } else if (authStatus === "authenticated" && currentUser) {
      if (pathname.startsWith("/admin") && currentUser.role.toLowerCase() !== "admin") {
        router.push("/faculty/overview");
      } else if (pathname.startsWith("/faculty") && currentUser.role.toLowerCase() !== "faculty") {
        router.push("/admin/overview");
      }
    }
  }, [mounted, authStatus, currentUser, pathname, router]);

  if (!mounted || (authStatus === "loading" && !currentUser)) {
    const roleFromPath = pathname.startsWith("/admin") ? "admin" : "faculty";
    return (
      <div className="flex h-screen bg-white">
        <Sidebar role={roleFromPath} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 border-b border-[var(--border)] bg-background flex items-center justify-between px-8 sticky top-0 z-10" />
          <main className="flex-1 overflow-y-auto p-8 bg-[var(--background)] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[var(--archyv-accent)] border-t-transparent rounded-full animate-spin"></div>
          </main>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated" || !currentUser) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar role={currentUser.role.toLowerCase() as "admin" | "faculty"} />
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
