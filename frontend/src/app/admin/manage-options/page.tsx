"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { useAppContext, Domain, Subdomain } from "@/store/AppContext";
import { Pencil, Trash2, Check, X, ChevronDown, ChevronRight, Plus } from "lucide-react";

function OptionCard({
  title,
  items,
  onAdd,
  onUpdate,
  onDelete,
  placeholder
}: {
  title: string;
  items: { id: string; name: string }[];
  onAdd: (name: string) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  placeholder: string;
}) {
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    setIsAdding(true);
    setAddError("");
    const res = await onAdd(newValue.trim());
    if (res.success) {
      setNewValue("");
    } else {
      setAddError(res.error || `Failed to add ${title}`);
    }
    setIsAdding(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editValue.trim()) return;
    setIsUpdating(true);
    const res = await onUpdate(id, editValue.trim());
    if (res.success) {
      setEditingId(null);
    } else {
      alert(res.error || `Failed to update ${title}`);
    }
    setIsUpdating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${title}?`)) return;
    setIsDeletingId(id);
    const res = await onDelete(id);
    if (!res.success) {
      alert(res.error || `Failed to delete ${title}`);
    }
    setIsDeletingId(null);
  };

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-foreground mb-4">{title}s</h2>
      
      <div className="flex flex-col gap-2 mb-6">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700">
            {editingId === item.id ? (
              <div className="flex gap-2 flex-1 mr-2 items-center">
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--archyv-accent)]"
                />
                <button
                  onClick={() => handleUpdate(item.id)}
                  disabled={isUpdating}
                  className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1 text-gray-500 hover:bg-gray-200 rounded transition-colors"
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <span className="truncate flex-1">{item.name}</span>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setEditValue(item.name);
                    }}
                    className="p-1.5 text-gray-400 hover:text-[var(--archyv-accent)] hover:bg-gray-100 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeletingId === item.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No {title.toLowerCase()}s found.</p>}
      </div>

      <form onSubmit={handleAdd} className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Add New {title}</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
          />
          <button
            type="submit"
            disabled={isAdding || !newValue.trim()}
            className="px-4 py-2 bg-[var(--archyv-accent)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--archyv-accent-hover)] disabled:opacity-50 transition-colors"
          >
            {isAdding ? "Adding..." : "+ Add"}
          </button>
        </div>
        {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
      </form>
    </div>
  );
}

function DomainOptionCard({
  domains,
  onAddDomain,
  onUpdateDomain,
  onDeleteDomain,
  onAddSubdomain,
  onUpdateSubdomain,
  onDeleteSubdomain
}: {
  domains: Domain[];
  onAddDomain: (name: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateDomain: (id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteDomain: (id: string) => Promise<{ success: boolean; error?: string }>;
  onAddSubdomain: (domainId: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateSubdomain: (domainId: string, id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteSubdomain: (domainId: string, id: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [newSubdomainValue, setNewSubdomainValue] = useState("");
  const [isAddingSubdomain, setIsAddingSubdomain] = useState(false);
  const [addingSubdomainDomainId, setAddingSubdomainDomainId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    setIsAdding(true);
    setAddError("");
    const res = await onAddDomain(newValue.trim());
    if (res.success) {
      setNewValue("");
    } else {
      setAddError(res.error || `Failed to add Domain`);
    }
    setIsAdding(false);
  };

  const handleUpdate = async (id: string, isSubdomain: boolean, domainId?: string) => {
    if (!editValue.trim()) return;
    setIsUpdating(true);
    const res = isSubdomain 
      ? await onUpdateSubdomain(domainId!, id, editValue.trim())
      : await onUpdateDomain(id, editValue.trim());
    
    if (res.success) {
      setEditingId(null);
    } else {
      alert(res.error || `Failed to update ${isSubdomain ? 'Subdomain' : 'Domain'}`);
    }
    setIsUpdating(false);
  };

  const handleDelete = async (id: string, isSubdomain: boolean, domainId?: string) => {
    if (!confirm(`Are you sure you want to delete this ${isSubdomain ? 'Subdomain' : 'Domain'}?`)) return;
    setIsDeletingId(id);
    const res = isSubdomain
      ? await onDeleteSubdomain(domainId!, id)
      : await onDeleteDomain(id);
      
    if (!res.success) {
      alert(res.error || `Failed to delete ${isSubdomain ? 'Subdomain' : 'Domain'}`);
    }
    setIsDeletingId(null);
  };

  const handleAddSubdomain = async (domainId: string) => {
    if (!newSubdomainValue.trim()) return;
    setIsAddingSubdomain(true);
    const res = await onAddSubdomain(domainId, newSubdomainValue.trim());
    if (res.success) {
      setNewSubdomainValue("");
      setAddingSubdomainDomainId(null);
    } else {
      alert(res.error || "Failed to add subdomain");
    }
    setIsAddingSubdomain(false);
  };

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-foreground mb-4">Domains & Subdomains</h2>
      
      <div className="flex flex-col gap-2 mb-6">
        {domains.map(domain => (
          <div key={domain.id} className="flex flex-col border border-gray-100 rounded-lg bg-gray-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <button 
                onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
                className="p-1 mr-2 text-gray-400 hover:bg-gray-200 rounded"
              >
                {expandedDomain === domain.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {editingId === domain.id ? (
                <div className="flex gap-2 flex-1 mr-2 items-center">
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--archyv-accent)]"
                  />
                  <button onClick={() => handleUpdate(domain.id, false)} disabled={isUpdating} className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-200 rounded transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="truncate flex-1 font-medium text-gray-700">{domain.name}</span>
                  <div className="flex gap-1 ml-2 items-center">
                    <button onClick={() => { setAddingSubdomainDomainId(domain.id); setExpandedDomain(domain.id); }} className="p-1.5 text-[var(--archyv-accent)] hover:bg-[var(--archyv-accent)]/10 rounded transition-colors" title="Add Subdomain">
                      <Plus size={14} />
                    </button>
                    <button onClick={() => { setEditingId(domain.id); setEditValue(domain.name); }} className="p-1.5 text-gray-400 hover:text-[var(--archyv-accent)] hover:bg-gray-100 rounded transition-colors" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(domain.id, false)} disabled={isDeletingId === domain.id} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {expandedDomain === domain.id && (
              <div className="bg-white border-t border-gray-100 px-4 py-2 flex flex-col gap-1">
                {domain.subdomains && domain.subdomains.length > 0 ? (
                  domain.subdomains.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between py-2 pl-6 pr-2 border-b border-gray-50 last:border-0 text-sm text-gray-600">
                      {editingId === sub.id ? (
                        <div className="flex gap-2 flex-1 items-center">
                          <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1" />
                          <button onClick={() => handleUpdate(sub.id, true, domain.id)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-200 rounded">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate flex-1">- {sub.name}</span>
                          <div className="flex gap-1 ml-2">
                            <button onClick={() => { setEditingId(sub.id); setEditValue(sub.name); }} className="p-1 text-gray-400 hover:text-[var(--archyv-accent)] rounded">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleDelete(sub.id, true, domain.id)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-2 pl-6 text-sm text-gray-400 italic">No subdomains</div>
                )}
                
                {addingSubdomainDomainId === domain.id && (
                  <div className="flex gap-2 items-center py-2 pl-6 pr-2">
                    <input
                      type="text"
                      placeholder="New subdomain name"
                      value={newSubdomainValue}
                      onChange={e => setNewSubdomainValue(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--archyv-accent)]"
                      autoFocus
                    />
                    <button onClick={() => handleAddSubdomain(domain.id)} disabled={isAddingSubdomain || !newSubdomainValue.trim()} className="px-3 py-1 bg-[var(--archyv-accent)] text-white text-xs rounded hover:bg-[var(--archyv-accent-hover)] disabled:opacity-50">
                      Add
                    </button>
                    <button onClick={() => { setAddingSubdomainDomainId(null); setNewSubdomainValue(""); }} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded text-xs">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {domains.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No domains found.</p>}
      </div>

      <form onSubmit={handleAdd} className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Add New Domain</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Projects"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
          />
          <button
            type="submit"
            disabled={isAdding || !newValue.trim()}
            className="px-4 py-2 bg-[var(--archyv-accent)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--archyv-accent-hover)] disabled:opacity-50 transition-colors"
          >
            {isAdding ? "Adding..." : "+ Add"}
          </button>
        </div>
        {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
      </form>
    </div>
  );
}

export default function ManageOptions() {
  const { domains, academicYears, departments, fetchDomains, fetchAcademicYears, fetchDepartments } = useAppContext();
  
  const apiCall = async (url: string, method: string, body?: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}${url}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.message };
    }
    return { success: true };
  };

  const domainOps = {
    add: async (name: string) => {
      const res = await apiCall("/domains", "POST", { name });
      if (res.success) await fetchDomains();
      return res;
    },
    update: async (id: string, name: string) => {
      const res = await apiCall(`/domains/${id}`, "PATCH", { name });
      if (res.success) await fetchDomains();
      return res;
    },
    delete: async (id: string) => {
      const res = await apiCall(`/domains/${id}`, "DELETE");
      if (res.success) await fetchDomains();
      return res;
    }
  };

  const yearOps = {
    add: async (name: string) => {
      const res = await apiCall("/academic-years", "POST", { year: name });
      if (res.success) await fetchAcademicYears();
      return res;
    },
    update: async (id: string, name: string) => {
      const res = await apiCall(`/academic-years/${id}`, "PATCH", { year: name });
      if (res.success) await fetchAcademicYears();
      return res;
    },
    delete: async (id: string) => {
      const res = await apiCall(`/academic-years/${id}`, "DELETE");
      if (res.success) await fetchAcademicYears();
      return res;
    }
  };

  const deptOps = {
    add: async (name: string) => {
      const res = await apiCall("/departments", "POST", { name });
      if (res.success) await fetchDepartments();
      return res;
    },
    update: async (id: string, name: string) => {
      const res = await apiCall(`/departments/${id}`, "PATCH", { name });
      if (res.success) await fetchDepartments();
      return res;
    },
    delete: async (id: string) => {
      const res = await apiCall(`/departments/${id}`, "DELETE");
      if (res.success) await fetchDepartments();
      return res;
    }
  };

  const subdomainOps = {
    add: async (domainId: string, name: string) => {
      const res = await apiCall(`/domains/${domainId}/subdomains`, "POST", { name });
      if (res.success) await fetchDomains();
      return res;
    },
    update: async (domainId: string, id: string, name: string) => {
      const res = await apiCall(`/domains/${domainId}/subdomains/${id}`, "PATCH", { name });
      if (res.success) await fetchDomains();
      return res;
    },
    delete: async (domainId: string, id: string) => {
      const res = await apiCall(`/domains/${domainId}/subdomains/${id}`, "DELETE");
      if (res.success) await fetchDomains();
      return res;
    }
  };

  return (
    <div>
      <PageHeader
        title="Manage Options"
        subtitle="Manage globally available domains, subdomains, academic years, and departments."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <DomainOptionCard
          domains={domains}
          onAddDomain={domainOps.add}
          onUpdateDomain={domainOps.update}
          onDeleteDomain={domainOps.delete}
          onAddSubdomain={subdomainOps.add}
          onUpdateSubdomain={subdomainOps.update}
          onDeleteSubdomain={subdomainOps.delete}
        />
        <OptionCard
          title="Academic Year"
          items={academicYears.map(y => ({ id: y.id, name: y.year }))}
          onAdd={yearOps.add}
          onUpdate={yearOps.update}
          onDelete={yearOps.delete}
          placeholder="e.g. 2026-27"
        />
        <OptionCard
          title="Department"
          items={departments || []}
          onAdd={deptOps.add}
          onUpdate={deptOps.update}
          onDelete={deptOps.delete}
          placeholder="e.g. Computer Science"
        />
      </div>
    </div>
  );
}
