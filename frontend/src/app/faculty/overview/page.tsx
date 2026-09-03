"use client";

import PageHeader from "@/components/ui/PageHeader";
import DomainCard from "@/components/ui/DomainCard";
import FileCard from "@/components/ui/FileCard";
import { useAppContext } from "@/store/AppContext";
import Image from "next/image";

export default function FacultyOverview() {
  const { currentUser, documents, globalSearchQuery, dashboardStats, isDataLoading } = useAppContext();
  
  // Calculate dynamic stats
  const facultyDocs = documents.filter(d => {
    if (d.isDeleted || d.uploadedBy !== currentUser?.name) return false;
    
    if (globalSearchQuery) {
      const q = globalSearchQuery.toLowerCase();
      const matchesName = d.name?.toLowerCase().includes(q);
      const matchesDomain = d.domain?.toLowerCase().includes(q);
      const matchesDepartment = d.department?.toLowerCase().includes(q);
      const matchesYear = (d as any).year?.toLowerCase().includes(q);
      return matchesName || matchesDomain || matchesDepartment || matchesYear;
    }
    
    return true;
  });
  
  const dynamicDomainStats = dashboardStats?.domainStats || [];

  return (
    <div>
      <PageHeader 
        title={`Good morning, ${currentUser?.name || "Faculty"} 👋`} 
        subtitle="Here's what's happening with your documents today." 
      />

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">Document overview by domain</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {dynamicDomainStats.map((stat: any) => (
            <DomainCard key={stat.id} name={stat.name} count={stat.count} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">My Documents</h2>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span>My Documents</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          <span className="text-gray-400">All Documents</span>
        </div>

        {isDataLoading ? (
          <div className="text-center py-8 text-sm text-gray-500 bg-white border border-[var(--border)] rounded-2xl flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--archyv-accent)] border-t-transparent rounded-full animate-spin"></div>
            Loading documents...
          </div>
        ) : facultyDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {facultyDocs.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-500 bg-white border border-[var(--border)] rounded-2xl">
            No documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
