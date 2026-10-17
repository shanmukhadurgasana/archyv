"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { 
  Layers, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Users 
} from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function SuperAdminDomains() {
  const { domains, fetchDomains, documents } = useAppContext();

  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [newDomainName, setNewDomainName] = useState("");
  const [newIsFaculty, setNewIsFaculty] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState("");

  // Edit Domain State
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [editDomainValue, setEditDomainValue] = useState("");
  const [editDomainIsFaculty, setEditDomainIsFaculty] = useState(false);
  const [isUpdatingDomain, setIsUpdatingDomain] = useState(false);

  // Add Subdomain State
  const [addingSubdomainDomainId, setAddingSubdomainDomainId] = useState<string | null>(null);
  const [newSubdomainValue, setNewSubdomainValue] = useState("");
  const [isAddingSubdomain, setIsAddingSubdomain] = useState(false);

  // Edit Subdomain State
  const [editingSubdomainId, setEditingSubdomainId] = useState<string | null>(null);
  const [editSubdomainValue, setEditSubdomainValue] = useState("");

  // Delete State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string; isSubdomain?: boolean; domainId?: string } | null>(null);

  const apiCall = async (url: string, method: string, body?: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}${url}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || "Operation failed" };
    }
    return { success: true };
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim() || isAddingDomain) return;

    setIsAddingDomain(true);
    setDomainError("");
    const res = await apiCall("/domains", "POST", { name: newDomainName.trim(), isFaculty: newIsFaculty });
    setIsAddingDomain(false);

    if (res.success) {
      setNewDomainName("");
      setNewIsFaculty(false);
      await fetchDomains();
    } else {
      setDomainError(res.error || "Failed to add domain");
    }
  };

  const handleUpdateDomain = async (id: string) => {
    if (!editDomainValue.trim() || isUpdatingDomain) return;

    setIsUpdatingDomain(true);
    const res = await apiCall(`/domains/${id}`, "PATCH", { name: editDomainValue.trim(), isFaculty: editDomainIsFaculty });
    setIsUpdatingDomain(false);

    if (res.success) {
      setEditingDomainId(null);
      await fetchDomains();
    } else {
      alert(res.error || "Failed to update domain");
    }
  };

  const handleAddSubdomain = async (domainId: string) => {
    if (!newSubdomainValue.trim() || isAddingSubdomain) return;

    setIsAddingSubdomain(true);
    const res = await apiCall(`/domains/${domainId}/subdomains`, "POST", { name: newSubdomainValue.trim() });
    setIsAddingSubdomain(false);

    if (res.success) {
      setNewSubdomainValue("");
      setAddingSubdomainDomainId(null);
      await fetchDomains();
    } else {
      alert(res.error || "Failed to add subdomain");
    }
  };

  const handleUpdateSubdomain = async (subdomainId: string, domainId: string) => {
    if (!editSubdomainValue.trim()) return;

    const res = await apiCall(`/domains/${domainId}/subdomains/${subdomainId}`, "PATCH", { name: editSubdomainValue.trim() });
    if (res.success) {
      setEditingSubdomainId(null);
      await fetchDomains();
    } else {
      alert(res.error || "Failed to update subdomain");
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { id, isSubdomain, domainId } = deleteConfirmation;
    setDeleteConfirmation(null);

    const endpoint = isSubdomain ? `/domains/${domainId}/subdomains/${id}` : `/domains/${id}`;
    const res = await apiCall(endpoint, "DELETE");

    if (res.success) {
      await fetchDomains();
    } else {
      alert(res.error || "Failed to delete");
    }
  };

  const totalSubdomains = domains.reduce((acc, d) => acc + (d.subdomains?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Domains & Subdomains"
        subtitle="Manage academic, administrative, and faculty-specific file categorization domains."
      />

      {/* Metrics Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Domains</div>
            <div className="text-2xl font-bold text-foreground mt-1">{domains.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subdomains Configured</div>
            <div className="text-2xl font-bold text-foreground mt-1">{totalSubdomains}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Faculty Domains</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {domains.filter(d => d.isFaculty).length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-foreground mb-1">Knowledge Domains</h2>
          <p className="text-xs text-gray-500 mb-4">Click to inspect subdomains and branch associations</p>
        </div>

        {/* Domains List */}
        <div className="space-y-3">
          {domains.map((dom) => {
            const docCount = documents.filter(d => !d.isDeleted && (d.domain === dom.name || (typeof d.domain === 'object' && (d.domain as any)?.name === dom.name))).length;

            return (
              <div key={dom.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/60 transition-colors">
                  {editingDomainId === dom.id ? (
                    <div className="flex items-center gap-3 flex-1 mr-4">
                      <input
                        type="text"
                        value={editDomainValue}
                        onChange={(e) => setEditDomainValue(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]"
                        autoFocus
                      />
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editDomainIsFaculty}
                          onChange={(e) => setEditDomainIsFaculty(e.target.checked)}
                          className="rounded text-[var(--archyv-accent)]"
                        />
                        <span>Faculty Domain</span>
                      </label>
                      <button
                        onClick={() => handleUpdateDomain(dom.id)}
                        disabled={isUpdatingDomain}
                        className="p-1.5 text-foreground hover:bg-[var(--archyv-accent)]/20 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingDomainId(null)}
                        className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setExpandedDomain(expandedDomain === dom.id ? null : dom.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center font-bold text-xs shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm flex items-center gap-2">
                          {dom.name}
                          {dom.isFaculty && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--archyv-accent)]/20 text-foreground border border-[var(--border)]">
                              👥 Faculty Domain
                            </span>
                          )}
                          <span className="text-xs font-normal text-gray-400">
                            ({dom.subdomains?.length || 0} subdomains)
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {docCount} files categorized in this domain
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingDomainId(dom.id);
                        setEditDomainValue(dom.name);
                        setEditDomainIsFaculty(Boolean(dom.isFaculty));
                      }}
                      className="p-1.5 text-gray-400 hover:text-[var(--archyv-accent-hover)] hover:bg-gray-200 rounded-lg transition-colors"
                      title="Edit Domain"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmation({ id: dom.id, name: dom.name, isSubdomain: false })}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Domain"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedDomain(expandedDomain === dom.id ? null : dom.id)}
                      className="p-1.5 text-gray-400 hover:text-foreground rounded-lg"
                    >
                      {expandedDomain === dom.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Subdomains view */}
                {expandedDomain === dom.id && (
                  <div className="p-4 border-t border-gray-100 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Subdomains under {dom.name}
                      </span>
                      {addingSubdomainDomainId !== dom.id && (
                        <button
                          onClick={() => {
                            setAddingSubdomainDomainId(dom.id);
                            setNewSubdomainValue("");
                          }}
                          className="text-xs font-semibold text-[var(--archyv-accent-hover)] hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Subdomain
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {dom.subdomains && dom.subdomains.length > 0 ? (
                        dom.subdomains.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between text-xs"
                          >
                            {editingSubdomainId === sub.id ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input
                                  type="text"
                                  value={editSubdomainValue}
                                  onChange={(e) => setEditSubdomainValue(e.target.value)}
                                  className="w-full px-2 py-1 border rounded bg-white text-xs"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleUpdateSubdomain(sub.id, dom.id)}
                                  className="p-1 text-foreground hover:bg-[var(--archyv-accent)]/20 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingSubdomainId(null)}
                                  className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-semibold text-gray-800 truncate">
                                  {sub.name}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingSubdomainId(sub.id);
                                      setEditSubdomainValue(sub.name);
                                    }}
                                    className="p-1 text-gray-400 hover:text-[var(--archyv-accent-hover)]"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmation({ id: sub.id, name: sub.name, isSubdomain: true, domainId: dom.id })}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-3 text-xs text-gray-400 italic">
                          No subdomains configured yet.
                        </div>
                      )}
                    </div>

                    {addingSubdomainDomainId === dom.id && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 max-w-sm">
                        <input
                          type="text"
                          placeholder="Subdomain name (e.g. Assignments, Lab Manuals)"
                          value={newSubdomainValue}
                          onChange={(e) => setNewSubdomainValue(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[var(--archyv-accent)]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddSubdomain(dom.id)}
                          disabled={isAddingSubdomain || !newSubdomainValue.trim()}
                          className="px-3 py-1.5 bg-[var(--archyv-accent)] text-foreground text-xs font-semibold rounded-lg hover:bg-[var(--archyv-accent-hover)] disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingSubdomainDomainId(null)}
                          className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Domain Form */}
        <div className="pt-4 border-t border-gray-100">
          <form onSubmit={handleAddDomain} className="space-y-3 max-w-md">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Add New Domain
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Research, Projects, Accreditations"
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
              />
              <button
                type="submit"
                disabled={isAddingDomain || !newDomainName.trim()}
                className="px-5 py-2.5 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {isAddingDomain ? "Adding..." : "+ Add"}
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={newIsFaculty}
                onChange={(e) => setNewIsFaculty(e.target.checked)}
                className="rounded border-gray-300 text-[var(--archyv-accent)] focus:ring-[var(--archyv-accent)]"
              />
              <span>Mark as Faculty Domain (Dedicated faculty uploads without academic year constraints)</span>
            </label>
            {domainError && <p className="text-red-500 text-xs mt-1">{domainError}</p>}
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmation)}
        title={`Delete ${deleteConfirmation?.isSubdomain ? "Subdomain" : "Domain"}`}
        message={`Are you sure you want to delete "${deleteConfirmation?.name}"? This action cannot be undone.`}
        confirmText="Confirm Delete"
        onCancel={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
