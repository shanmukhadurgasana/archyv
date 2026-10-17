"use client";

import PageHeader from "@/components/ui/PageHeader";
import { 
  Users, 
  ShieldCheck, 
  GraduationCap, 
  FileText, 
  Building2, 
  Layers, 
  Calendar, 
  ChevronRight, 
  HardDrive, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  UploadCloud, 
  UserPlus, 
  Shield 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/store/AppContext";

export default function SuperAdminOverview() {
  const router = useRouter();
  const { 
    dashboardStats, 
    users, 
    documents, 
    departments, 
    domains, 
    academicYears, 
    auditLogs 
  } = useAppContext();

  // Metrics calculation
  const totalFaculty = dashboardStats?.totalFaculty ?? users.filter(u => u.role?.toLowerCase() === "faculty").length;
  const totalAdmin = dashboardStats?.totalAdmin ?? users.filter(u => u.role?.toLowerCase() === "admin").length;
  const totalFiles = dashboardStats?.totalFiles ?? dashboardStats?.totalDocuments ?? documents.filter(d => !d.isDeleted).length;
  const totalDepartments = dashboardStats?.totalDepartments ?? departments.length;
  const totalDomains = dashboardStats?.totalDomains ?? domains.length;
  const totalAcademicYears = dashboardStats?.totalAcademicYears ?? academicYears.length;

  const facultyFilesCount = dashboardStats?.facultyFilesCount ?? documents.filter(d => !d.isDeleted && d.uploaderRole?.toLowerCase() === "faculty").length;
  const adminFilesCount = dashboardStats?.adminFilesCount ?? documents.filter(d => !d.isDeleted && (d.uploaderRole?.toLowerCase() === "admin" || d.uploaderRole?.toLowerCase() === "super_admin")).length;

  // Storage
  const totalBytes = dashboardStats?.totalBytes || 0;
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const totalStr = parseFloat(totalMB) > 1024 ? `${(parseFloat(totalMB) / 1024).toFixed(2)} GB` : `${totalMB} MB`;
  const storagePercentage = Math.min((totalBytes / (100 * 1024 * 1024 * 1024)) * 100, 100).toFixed(1);

  // Overview metric cards using consistent theme colors
  const metricCards = [
    {
      title: "Faculty",
      count: totalFaculty,
      description: "Registered faculty members",
      icon: GraduationCap,
      href: "/superadmin/faculties",
      accentBg: "bg-[var(--archyv-accent)]/15",
      accentText: "text-foreground",
    },
    {
      title: "Admins",
      count: totalAdmin,
      description: "Department & system admins",
      icon: ShieldCheck,
      href: "/superadmin/admins",
      accentBg: "bg-[var(--archyv-accent)]/15",
      accentText: "text-foreground",
    },
    {
      title: "Files",
      count: totalFiles,
      description: "Approved & active documents",
      icon: FileText,
      href: "/superadmin/files",
      accentBg: "bg-[var(--archyv-accent)]/15",
      accentText: "text-foreground",
    },
    {
      title: "Departments",
      count: totalDepartments,
      description: "Branches & academic depts",
      icon: Building2,
      href: "/superadmin/departments",
      accentBg: "bg-[var(--archyv-accent)]/15",
      accentText: "text-foreground",
    },
    {
      title: "Domains",
      count: totalDomains,
      description: "Active knowledge domains",
      icon: Layers,
      href: "/superadmin/domains",
      accentBg: "bg-[var(--archyv-accent)]/15",
      accentText: "text-foreground",
    },
    {
      title: "Academic Years",
      count: totalAcademicYears,
      description: "Curriculum batch sessions",
      icon: Calendar,
      href: "/superadmin/academic-years",
      accentBg: "bg-[var(--archyv-accent)]/15",
      accentText: "text-foreground",
    },
  ];

  const recentLogs = auditLogs && auditLogs.length > 0 
    ? auditLogs.slice(0, 6) 
    : (dashboardStats?.recentActivity?.slice(0, 6) || []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE_ADMIN":
      case "CREATE_USER":
        return <UserPlus className="w-4 h-4 text-foreground" />;
      case "UPLOAD_DOCUMENT":
        return <UploadCloud className="w-4 h-4 text-[var(--archyv-accent-hover)]" />;
      case "APPROVE_DOCUMENT":
        return <CheckCircle2 className="w-4 h-4 text-foreground" />;
      case "REJECT_DOCUMENT":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case "DELETE_USER":
      case "DELETE_DOCUMENT":
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Super Admin Overview"
          subtitle="Complete system oversight, multi-tenant administrative control, and file analytics."
        />
        <div className="flex items-center gap-2">
          <Link
            href="/superadmin/admins"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            + Add Admin
          </Link>
          <Link
            href="/superadmin/faculties"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-foreground text-sm font-medium transition-all shadow-xs"
          >
            <GraduationCap className="w-4 h-4 text-gray-500" />
            + Add Faculty
          </Link>
        </div>
      </div>

      {/* 6 Key Stat Cards - Clicking navigates to respective page */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">
          System Metrics (Click to inspect)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                onClick={() => router.push(card.href)}
                className="group bg-white border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--archyv-accent)] hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-xl ${card.accentBg} ${card.accentText} flex items-center justify-center transition-transform group-hover:scale-105`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {card.title}
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {card.count}
                      </div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-[var(--archyv-accent)]/20 flex items-center justify-center text-gray-400 group-hover:text-foreground transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                  <span>{card.description}</span>
                  <span className="font-semibold text-[var(--archyv-accent-hover)] group-hover:underline flex items-center">
                    Manage <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Distribution & Storage Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Distribution Card */}
        <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-foreground">File Upload Distribution</h2>
              <p className="text-xs text-gray-500 mt-0.5">Files uploaded by faculty vs administrators</p>
            </div>
            <Link
              href="/superadmin/files"
              className="text-xs font-semibold text-[var(--archyv-accent-hover)] hover:underline flex items-center gap-1"
            >
              Open Files Manager <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-gray-50/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[var(--archyv-accent)]/20 flex items-center justify-center text-foreground">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600">Faculty Uploads</div>
                  <div className="text-xl font-bold text-foreground">{facultyFilesCount} files</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-[var(--archyv-accent)] h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalFiles > 0 ? (facultyFilesCount / totalFiles) * 100 : 0}%` }}
                />
              </div>
              <div className="text-[11px] text-gray-500 mt-1.5 flex justify-between">
                <span>Share of total files</span>
                <span className="font-medium text-foreground">
                  {totalFiles > 0 ? ((facultyFilesCount / totalFiles) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-gray-50/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[var(--archyv-accent)]/20 flex items-center justify-center text-foreground">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600">Admin Uploads</div>
                  <div className="text-xl font-bold text-foreground">{adminFilesCount} files</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-foreground h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalFiles > 0 ? (adminFilesCount / totalFiles) * 100 : 0}%` }}
                />
              </div>
              <div className="text-[11px] text-gray-500 mt-1.5 flex justify-between">
                <span>Share of total files</span>
                <span className="font-medium text-foreground">
                  {totalFiles > 0 ? ((adminFilesCount / totalFiles) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Domain Breakdown pills */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Files by Domain
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {domains.slice(0, 4).map((dom) => {
                const count = documents.filter(d => !d.isDeleted && (d.domain === dom.name || (typeof d.domain === 'object' && (d.domain as any)?.name === dom.name))).length;
                return (
                  <div key={dom.id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50">
                    <div className="text-xs font-medium text-gray-700 truncate">{dom.name}</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{count} files</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cloud Storage Usage Card */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--archyv-accent)]/15 flex items-center justify-center text-[var(--archyv-accent-hover)]">
                  <HardDrive className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Storage Usage</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--archyv-accent)]/15 text-foreground border border-[var(--border)]">
                Active
              </span>
            </div>

            <div className="my-4">
              <div className="text-3xl font-extrabold text-foreground tracking-tight">
                {totalStr}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Used out of 100 GB allocated cloud capacity
              </div>
            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden my-4">
              <div
                className="h-full bg-[var(--archyv-accent)] rounded-full transition-all duration-700"
                style={{ width: `${Math.max(parseFloat(storagePercentage), 2)}%` }}
              />
            </div>

            <div className="space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span>Google Drive Storage:</span>
                <span className="font-semibold text-foreground">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Total Active Records:</span>
                <span className="font-semibold text-foreground">{totalFiles} items</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity Utilized:</span>
                <span className="font-semibold text-foreground">{storagePercentage}%</span>
              </div>
            </div>
          </div>

          <Link
            href="/superadmin/files"
            className="w-full mt-6 py-2.5 px-3 rounded-xl border border-gray-200 text-center text-xs font-semibold text-foreground hover:bg-gray-50 transition-colors block"
          >
            Review Files & Quotas
          </Link>
        </div>
      </div>

      {/* Recent Activity Audit Preview */}
      <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-foreground">Recent Audit Activity</h2>
          </div>
          <Link
            href="/superadmin/audit-logs"
            className="text-xs font-semibold text-[var(--archyv-accent-hover)] hover:underline flex items-center gap-1"
          >
            View Full Audit Logs <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {recentLogs.length > 0 ? (
            recentLogs.map((log: any) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      <span className="font-semibold">{log.user || "System"}</span>{" "}
                      <span className="text-gray-500 text-xs">performed</span>{" "}
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[11px] font-mono text-gray-700">
                        {log.action}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      Target: {log.target} {log.domain && `• Domain: ${log.domain}`}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 shrink-0 font-medium">
                  {log.time}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-sm text-gray-400">
              No recent audit logs available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
