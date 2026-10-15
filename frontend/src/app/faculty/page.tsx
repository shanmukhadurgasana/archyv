"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/store/AppContext";

export default function FacultyRedirect() {
  const router = useRouter();
  const { currentUser, authStatus } = useAppContext();

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === "unauthenticated" || !currentUser) {
      router.replace("/");
    } else if (currentUser.role.toLowerCase() === "admin") {
      router.replace("/admin/faculty");
    } else {
      router.replace("/faculty/overview");
    }
  }, [authStatus, currentUser, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
      <div className="w-8 h-8 border-4 border-[var(--archyv-accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
