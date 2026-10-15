"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/store/AppContext";

interface RoleRedirectProps {
  pagePath: string;
}

export default function RoleRedirect({ pagePath }: RoleRedirectProps) {
  const router = useRouter();
  const { currentUser, authStatus } = useAppContext();

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === "unauthenticated" || !currentUser) {
      router.replace("/");
    } else {
      const role = currentUser.role.toLowerCase() === "admin" ? "admin" : "faculty";
      router.replace(`/${role}/${pagePath}`);
    }
  }, [authStatus, currentUser, pagePath, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
      <div className="w-8 h-8 border-4 border-[var(--archyv-accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
