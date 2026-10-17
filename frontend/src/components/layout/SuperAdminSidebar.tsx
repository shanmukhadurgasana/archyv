"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppContext } from "@/store/AppContext";
import { 
  Home, 
  ShieldCheck, 
  GraduationCap, 
  Folder, 
  List, 
  Calendar, 
  Layers, 
  Building2, 
  Settings, 
  User, 
  LogOut 
} from "lucide-react";
import clsx from "clsx";

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAppContext();

  const handleLogout = async () => {
    await logout();
    router.push("/superadmin");
  };

  const mainNav = [
    { label: "Overview", href: "/superadmin", icon: Home, matchSubroutes: false },
    { label: "Admins", href: "/superadmin/admins", icon: ShieldCheck, matchSubroutes: true },
    { label: "Faculties", href: "/superadmin/faculties", icon: GraduationCap, matchSubroutes: true },
    { label: "Files", href: "/superadmin/files", icon: Folder, matchSubroutes: true },
    { label: "Audit Logs", href: "/superadmin/audit-logs", icon: List, matchSubroutes: true },
  ];

  const managementNav = [
    { label: "Academic Year", href: "/superadmin/academic-years", icon: Calendar, matchSubroutes: true },
    { label: "Domains", href: "/superadmin/domains", icon: Layers, matchSubroutes: true },
    { label: "Departments", href: "/superadmin/departments", icon: Building2, matchSubroutes: true },
  ];

  const accountNav = [
    { label: "Profile", href: "/superadmin/profile", icon: User, matchSubroutes: true },
    { label: "Settings", href: "/superadmin/settings", icon: Settings, matchSubroutes: true },
  ];

  const renderLinks = (links: { label: string; href: string; icon: React.ElementType; matchSubroutes?: boolean }[]) => {
    return links.map((link) => {
      const Icon = link.icon;
      const isActive = link.matchSubroutes
        ? pathname === link.href || pathname.startsWith(link.href + "/")
        : pathname === link.href || (link.href === "/superadmin" && pathname === "/superadmin/overview");

      return (
        <Link
          key={link.href}
          href={link.href}
          className={clsx(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
            isActive
              ? "bg-[var(--archyv-accent)]/20 text-foreground font-semibold"
              : "text-gray-500 hover:bg-gray-100 hover:text-foreground"
          )}
        >
          <Icon className={clsx("w-5 h-5", isActive ? "text-foreground" : "text-gray-500")} />
          <span>{link.label}</span>
        </Link>
      );
    });
  };

  return (
    <div className="w-64 border-r border-[var(--border)] h-screen flex flex-col bg-background shrink-0 sticky top-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-6 flex flex-col gap-0.5">
        <Link href="/superadmin" className="flex items-center gap-2">
          <img src="/logo.png" alt="ARCHYV Logo" className="h-8 w-auto object-contain" />
          <span className="font-bold text-xl tracking-widest uppercase">ARCHYV</span>
        </Link>
        <div className="ml-10 flex items-center gap-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.18em] uppercase bg-[var(--archyv-accent)]/20 text-foreground border border-[var(--border)]">
            SUPER ADMIN
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="px-4 py-2 flex-1 flex flex-col gap-6">
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase mb-3 px-4 tracking-wider">
            Dashboard
          </div>
          {renderLinks(mainNav)}
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase mb-3 px-4 tracking-wider">
            System & Academic
          </div>
          {renderLinks(managementNav)}
        </div>

        <div className="mt-auto pb-4">
          <div className="text-xs font-semibold text-gray-400 uppercase mb-3 px-4 tracking-wider">
            Account
          </div>
          {renderLinks(accountNav)}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors text-left"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
