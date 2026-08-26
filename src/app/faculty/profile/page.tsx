"use client";

import PageHeader from "@/components/ui/PageHeader";
import { mockFacultyUser } from "@/lib/mock-data";
import { Camera, User, Mail, Phone, Building2, Calendar, Circle, FileText, Clock, Folder } from "lucide-react";

export default function FacultyProfile() {
  const user = mockFacultyUser;

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="View and manage your profile information."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[320px] shrink-0 bg-white border border-[var(--border)] rounded-2xl p-8 flex flex-col items-center text-center h-fit">
          <div className="w-32 h-32 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-4xl font-bold text-foreground mb-6 relative">
            {user.name.split(" ").map(n => n[0]).join("")}
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm text-gray-500 hover:text-foreground transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <Camera className="w-4 h-4" />
            Change Photo
          </button>
        </div>

        <div className="flex-1 space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Full Name</span>
              </div>
              <div className="font-medium text-foreground">{user.name}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Date of Join</span>
              </div>
              <div className="font-medium text-foreground">{user.dateOfJoin}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Mail className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Email</span>
              </div>
              <div className="font-medium text-foreground">{user.email}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Circle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Faculty Status</span>
              </div>
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                {user.status}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Phone Number</span>
              </div>
              <div className="font-medium text-foreground">{user.phone}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Documents Contributed</span>
              </div>
              <div className="font-medium text-foreground">32 Documents</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Department</span>
              </div>
              <div className="font-medium text-foreground">{user.department}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Last Login</span>
              </div>
              <div className="font-medium text-foreground">{user.lastLogin}</div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
