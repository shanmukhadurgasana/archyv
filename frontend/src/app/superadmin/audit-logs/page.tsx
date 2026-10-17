"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { 
  List, 
  Search, 
  Filter, 
  ArrowUpCircle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Eye, 
  UserPlus, 
  ShieldCheck, 
  RotateCw 
} from "lucide-react";
import { useAppContext } from "@/store/AppContext";

export default function SuperAdminAuditLogs() {
  const { auditLogs, fetchAuditLogs, isRefreshing } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE_ADMIN":
      case "CREATE_USER":
        return <UserPlus className="w-4 h-4 text-foreground" />;
      case "LOGIN":
        return <ShieldCheck className="w-4 h-4 text-[var(--archyv-accent-hover)]" />;
      case "UPLOAD_DOCUMENT":
      case "Uploaded file":
        return <ArrowUpCircle className="w-4 h-4 text-[var(--archyv-accent-hover)]" />;
      case "APPROVE_DOCUMENT":
      case "Approved file":
        return <CheckCircle2 className="w-4 h-4 text-foreground" />;
      case "REJECT_DOCUMENT":
      case "Rejected file":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case "DELETE_USER":
      case "DELETE_DOCUMENT":
      case "Deleted file":
      case "Permanently deleted file":
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedAction !== "ALL" && log.action !== selectedAction) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.user?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.target?.toLowerCase().includes(q) ||
      log.domain?.toLowerCase().includes(q)
    );
  });

  const uniqueActions = Array.from(new Set(auditLogs.map((l) => l.action).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Audit Trail Logs"
          subtitle="System-wide chronological audit trail tracking user events, administrative actions, and document modifications."
        />
        <button
          onClick={() => fetchAuditLogs()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-foreground text-xs font-semibold shadow-xs disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user, action, target or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50"
          >
            <option value="ALL">All Actions ({auditLogs.length})</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap ml-2">
            Showing <span className="font-semibold text-foreground">{filteredLogs.length}</span> records
          </div>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">User / Actor</th>
                <th className="py-3.5 px-6">Action</th>
                <th className="py-3.5 px-6">Target Resource</th>
                <th className="py-3.5 px-6">Domain / Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-6 text-xs text-gray-500 whitespace-nowrap font-medium">
                      {log.time}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-foreground text-xs">{log.user || "System"}</div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-gray-700 max-w-xs truncate">
                      {log.target}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600">
                        {log.domain || "System"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                    No audit records matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
