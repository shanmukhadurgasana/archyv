import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
