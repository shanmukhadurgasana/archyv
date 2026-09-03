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
  const { currentUser, authStatus } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/");
    } else if (authStatus === "authenticated" && currentUser) {
      if (pathname.startsWith("/admin") && currentUser.role.toLowerCase() !== "admin") {
        router.push("/faculty/overview");
      } else if (pathname.startsWith("/faculty") && currentUser.role.toLowerCase() !== "faculty") {
        router.push("/admin/overview");
      }
    }
  }, [authStatus, currentUser, pathname, router]);

  if (authStatus === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[var(--archyv-accent)] border-t-transparent rounded-full animate-spin"></div>
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
        <main className="flex-1 overflow-y-auto p-8 bg-[var(--background)]">
          <div className="max-w-6xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
