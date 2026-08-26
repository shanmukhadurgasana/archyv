"use client";

import PageHeader from "@/components/ui/PageHeader";
import { ArrowUpCircle, CheckCircle2, XCircle, Trash2, Eye } from "lucide-react";
import Image from "next/image";
import { useAppContext } from "@/store/AppContext";

export default function AdminAuditLogs() {
  const { auditLogs } = useAppContext();

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

  const getDetails = (action: string) => {
    switch (action) {
      case "Uploaded file": return "File uploaded successfully";
      case "Approved file": return "Document approved and moved to Files";
      case "Rejected file": return "Document rejected due to incorrect format";
      case "Deleted file": return "File moved to trash";
      case "Restored file": return "File restored from trash";
      case "Permanently deleted file": return "File deleted permanently";
      case "Accessed file": return "File viewed by admin";
      case "Created folder": return "New folder created";
      default: return "Action recorded successfully";
    }
  };

  return (
    <div>
      <PageHeader 
        title="Audit Logs" 
        subtitle="Track all important activities performed in the system."
      />



      <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-[var(--border)] text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Time</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">User</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Action</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Target</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Module</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">IP Address</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Details</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-gray-600">{log.time.split(" ").slice(0, 3).join(" ")}</div>
                    <div className="font-medium text-foreground">{log.time.split(" ")[3]} {log.time.split(" ")[4]}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                        {log.user.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{log.user}</div>
                        <div className="text-[10px] text-gray-500">{log.user === "Admin" ? "Administrator" : "CSIT"}</div>
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
                        <div className="font-medium text-foreground truncate max-w-[150px]">{log.target}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]">/Files/{log.domain}/2026</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {log.domain}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    192.168.1.{10 + log.id}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {getDetails(log.action)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="w-8 h-8 ml-auto rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:text-foreground hover:bg-gray-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}


