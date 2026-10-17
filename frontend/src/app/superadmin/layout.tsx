import React from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";

export default function RootSuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminLayout>{children}</SuperAdminLayout>;
}
