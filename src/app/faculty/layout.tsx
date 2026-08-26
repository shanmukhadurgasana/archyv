import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { mockFacultyUser } from "@/lib/mock-data";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout user={mockFacultyUser}>{children}</DashboardLayout>;
}
