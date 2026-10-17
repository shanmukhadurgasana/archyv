"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Users, 
  FileText 
} from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function SuperAdminDepartments() {
  const { departments, fetchDepartments, users, documents } = useAppContext();

  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [deptError, setDeptError] = useState("");

  // Edit Department State
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptValue, setEditDeptValue] = useState("");
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);

  // Add Section State
  const [addingSectionDeptId, setAddingSectionDeptId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);

  // Edit Section State
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionValue, setEditSectionValue] = useState("");

  // Delete State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string; isSection?: boolean; deptId?: string } | null>(null);

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

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || isAddingDept) return;

    setIsAddingDept(true);
    setDeptError("");
    const res = await apiCall("/departments", "POST", { name: newDeptName.trim() });
    setIsAddingDept(false);

    if (res.success) {
      setNewDeptName("");
      await fetchDepartments();
    } else {
      setDeptError(res.error || "Failed to add department");
    }
  };

  const handleUpdateDept = async (id: string) => {
    if (!editDeptValue.trim() || isUpdatingDept) return;

    setIsUpdatingDept(true);
    const res = await apiCall(`/departments/${id}`, "PATCH", { name: editDeptValue.trim() });
    setIsUpdatingDept(false);

    if (res.success) {
      setEditingDeptId(null);
      await fetchDepartments();
    } else {
      alert(res.error || "Failed to update department");
    }
  };

  const handleAddSection = async (deptId: string) => {
    if (!newSectionName.trim() || isAddingSection) return;

    setIsAddingSection(true);
    const res = await apiCall(`/departments/${deptId}/sections`, "POST", { name: newSectionName.trim() });
    setIsAddingSection(false);

    if (res.success) {
      setNewSectionName("");
      setAddingSectionDeptId(null);
      await fetchDepartments();
    } else {
      alert(res.error || "Failed to add section");
    }
  };

  const handleUpdateSection = async (sectionId: string, deptId: string) => {
    if (!editSectionValue.trim()) return;

    const res = await apiCall(`/departments/${deptId}/sections/${sectionId}`, "PATCH", { name: editSectionValue.trim() });
    if (res.success) {
      setEditingSectionId(null);
      await fetchDepartments();
    } else {
      alert(res.error || "Failed to update section");
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { id, isSection, deptId } = deleteConfirmation;
    setDeleteConfirmation(null);

    const endpoint = isSection ? `/departments/${deptId}/sections/${id}` : `/departments/${id}`;
    const res = await apiCall(endpoint, "DELETE");

    if (res.success) {
      await fetchDepartments();
    } else {
      alert(res.error || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Departments & Sections"
        subtitle="Manage academic departments, branches, and class sections across your institution."
      />

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Departments</div>
            <div className="text-2xl font-bold text-foreground mt-1">{departments.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Class Sections</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {departments.reduce((acc, d) => acc + (d.sections?.length || 0), 0)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Faculty Assigned</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {users.filter(u => u.role?.toLowerCase() === "faculty" && u.department).length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-foreground mb-1">Departments List</h2>
          <p className="text-xs text-gray-500 mb-4">Click any department to inspect or configure its sections</p>
        </div>

        {/* Departments Accordion List */}
        <div className="space-y-3">
          {departments.map((dept) => {
            const facultyCount = users.filter(u => u.department === dept.name).length;
            const fileCount = documents.filter(d => !d.isDeleted && (d.department === dept.name || d.branch === dept.name)).length;

            return (
              <div key={dept.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/60 transition-colors">
                  {editingDeptId === dept.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <input
                        type="text"
                        value={editDeptValue}
                        onChange={(e) => setEditDeptValue(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateDept(dept.id)}
                        disabled={isUpdatingDept}
                        className="p-1.5 text-foreground hover:bg-[var(--archyv-accent)]/20 rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingDeptId(null)}
                        className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center font-bold text-xs shrink-0">
                        {dept.name.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm flex items-center gap-2">
                          {dept.name}
                          <span className="text-xs font-normal text-gray-400">
                            ({dept.sections?.length || 0} sections)
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {facultyCount} faculty members • {fileCount} documents
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingDeptId(dept.id);
                        setEditDeptValue(dept.name);
                      }}
                      className="p-1.5 text-gray-400 hover:text-[var(--archyv-accent-hover)] hover:bg-gray-200 rounded-lg transition-colors"
                      title="Edit Department"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmation({ id: dept.id, name: dept.name, isSection: false })}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                      className="p-1.5 text-gray-400 hover:text-foreground rounded-lg"
                    >
                      {expandedDept === dept.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Sections Sub-view */}
                {expandedDept === dept.id && (
                  <div className="p-4 border-t border-gray-100 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Sections in {dept.name}
                      </span>
                      {addingSectionDeptId !== dept.id && (
                        <button
                          onClick={() => {
                            setAddingSectionDeptId(dept.id);
                            setNewSectionName("");
                          }}
                          className="text-xs font-semibold text-[var(--archyv-accent-hover)] hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Section
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {dept.sections && dept.sections.length > 0 ? (
                        dept.sections.map((sec) => (
                          <div
                            key={sec.id}
                            className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between text-xs"
                          >
                            {editingSectionId === sec.id ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input
                                  type="text"
                                  value={editSectionValue}
                                  onChange={(e) => setEditSectionValue(e.target.value)}
                                  className="w-full px-2 py-1 border rounded bg-white text-xs"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleUpdateSection(sec.id, dept.id)}
                                  className="p-1 text-foreground hover:bg-[var(--archyv-accent)]/20 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingSectionId(null)}
                                  className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-semibold text-gray-800">
                                  Section {sec.name}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingSectionId(sec.id);
                                      setEditSectionValue(sec.name);
                                    }}
                                    className="p-1 text-gray-400 hover:text-[var(--archyv-accent-hover)]"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmation({ id: sec.id, name: `Section ${sec.name}`, isSection: true, deptId: dept.id })}
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
                          No sections configured for this department yet.
                        </div>
                      )}
                    </div>

                    {addingSectionDeptId === dept.id && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 max-w-sm">
                        <input
                          type="text"
                          placeholder="Section name (e.g. A, B, Section-1)"
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[var(--archyv-accent)]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddSection(dept.id)}
                          disabled={isAddingSection || !newSectionName.trim()}
                          className="px-3 py-1.5 bg-[var(--archyv-accent)] text-foreground text-xs font-semibold rounded-lg hover:bg-[var(--archyv-accent-hover)] disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingSectionDeptId(null)}
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

        {/* Add New Department Form */}
        <div className="pt-4 border-t border-gray-100">
          <form onSubmit={handleAddDept} className="space-y-2 max-w-md">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Add New Department
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Computer Science & Engineering (CSE)"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
              />
              <button
                type="submit"
                disabled={isAddingDept || !newDeptName.trim()}
                className="px-5 py-2.5 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {isAddingDept ? "Adding..." : "+ Add"}
              </button>
            </div>
            {deptError && <p className="text-red-500 text-xs mt-1">{deptError}</p>}
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmation)}
        title={`Delete ${deleteConfirmation?.isSection ? "Section" : "Department"}`}
        message={`Are you sure you want to delete "${deleteConfirmation?.name}"? Associated records might be affected.`}
        confirmText="Confirm Delete"
        onCancel={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
