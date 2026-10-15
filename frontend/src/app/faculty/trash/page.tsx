"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FacultyTrash() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/faculty/overview");
  }, [router]);

  return null;
}
