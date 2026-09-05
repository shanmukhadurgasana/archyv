"use client";

import PageHeader from "@/components/ui/PageHeader";
import DomainCard from "@/components/ui/DomainCard";
import { ChevronRight, ArrowUpCircle, CheckCircle2, XCircle, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAppContext } from "@/store/AppContext";

export default function AdminOverview() {
  const { dashboardStats } = useAppContext();

  // Calculate true storage usage from active files
  const totalBytes = dashboardStats?.totalBytes || 0;
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const totalStr = parseFloat(totalMB) > 1024 ? `${(parseFloat(totalMB) / 1024).toFixed(2)} GB` : `${totalMB} MB`;
  const percentage = Math.min((totalBytes / (100 * 1024 * 1024 * 1024)) * 100, 100).toFixed(1);
  const domainStats = dashboardStats?.domainStats || [];
  const recentActivity = dashboardStats?.recentActivity || [];


  const getActionIcon = (action: string) => {
    switch (action) {
      case "Uploaded file": return <ArrowUpCircle className="w-4 h-4 text-gray-500" />;
      case "Approved file": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "Rejected file": return <XCircle className="w-4 h-4 text-red-500" />;
      case "Deleted file": return <Trash2 className="w-4 h-4 text-gray-500" />;
      case "Restored file": return <ArrowUpCircle className="w-4 h-4 text-blue-500" />;
      case "Permanently deleted file": return <Trash2 className="w-4 h-4 text-red-600" />;
      case "Accessed file": return <Eye className="w-4 h-4 text-gray-500" />;
      case "Created folder": return <div className="w-4 h-4 relative"><Image src="/logo.png" alt="Folder" fill className="object-contain" /></div>;
      default: return <ArrowUpCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div>
      <PageHeader
        title="Good morning, Admin 👋"
        subtitle="Here's what's happening with ARCHYV today."
      />

      <div className="mb-8 bg-white border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Storage</h2>
          <Link href="/admin/storage" className="text-xs font-semibold text-[var(--archyv-accent-hover)] flex items-center hover:underline">
            View details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-foreground">{totalStr} <span className="text-gray-400 font-normal">used</span></span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--archyv-accent)] rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">Quick access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {domainStats.map((stat: any) => (
            <DomainCard key={stat.id} name={stat.name} count={stat.count} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <div className="flex items-center gap-4">
            <Link href="/admin/audit-logs" className="text-xs font-semibold text-[var(--archyv-accent-hover)] flex items-center hover:underline">
              View all <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 w-1/4">User</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-1/4">Action</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-1/4">Target</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-1/6">Domain</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-1/6 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentActivity.slice(0, 10).map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                          {(log.user || "System").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{log.user}</div>
                          <div className="text-[10px] text-gray-500">CSIT</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-gray-600">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 relative shrink-0"><Image src="/logo.png" alt="File" fill className="object-contain" /></div>
                        <div>
                          <div className="font-medium text-foreground truncate max-w-[200px]">{log.target}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[200px]">/Files/{log.domain}/2026</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {log.domain}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-gray-600">{log.time.split(" ")[2]} {log.time.split(" ")[3]}</div>
                      <div className="text-[10px] text-gray-400">{log.time.split(" ").slice(0, 2).join(" ")}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
