import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockAdminUser } from "@/lib/mock-data";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout user={mockAdminUser}>{children}</DashboardLayout>;
}
