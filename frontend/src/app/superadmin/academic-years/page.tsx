"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { 
  Calendar, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  FileText 
} from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function SuperAdminAcademicYears() {
  const { academicYears, fetchAcademicYears, documents } = useAppContext();

  const [newYear, setNewYear] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.trim() || isAdding) return;

    setIsAdding(true);
    setAddError("");
    const res = await apiCall("/academic-years", "POST", { year: newYear.trim() });
    setIsAdding(false);

    if (res.success) {
      setNewYear("");
      await fetchAcademicYears();
    } else {
      setAddError(res.error || "Failed to add academic year");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editValue.trim() || isUpdating) return;

    setIsUpdating(true);
    const res = await apiCall(`/academic-years/${id}`, "PATCH", { year: editValue.trim() });
    setIsUpdating(false);

    if (res.success) {
      setEditingId(null);
      await fetchAcademicYears();
    } else {
      alert(res.error || "Failed to update academic year");
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { id } = deleteConfirmation;
    setDeleteConfirmation(null);

    const res = await apiCall(`/academic-years/${id}`, "DELETE");
    if (res.success) {
      await fetchAcademicYears();
    } else {
      alert(res.error || "Failed to delete academic year");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Academic Years"
        subtitle="Configure institution calendar cycles and curriculum academic sessions."
      />

      {/* Metrics Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Academic Sessions</div>
            <div className="text-2xl font-bold text-foreground mt-1">{academicYears.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categorized Files</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {documents.filter(d => !d.isDeleted && d.year).length}
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
          <h2 className="text-base font-bold text-foreground mb-1">Academic Sessions List</h2>
          <p className="text-xs text-gray-500 mb-4">Files across branches are mapped against these calendar sessions</p>
        </div>

        <div className="divide-y divide-gray-100">
          {academicYears.map((ay) => {
            const docCount = documents.filter(d => !d.isDeleted && (d.year === ay.year || (typeof d.academicYear === 'object' && (d.academicYear as any)?.year === ay.year))).length;

            return (
              <div key={ay.id} className="py-4 flex items-center justify-between gap-4">
                {editingId === ay.id ? (
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(ay.id)}
                      disabled={isUpdating}
                      className="p-1.5 text-foreground hover:bg-[var(--archyv-accent)]/20 rounded-lg"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center font-bold text-xs">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm">
                        Academic Year {ay.year}
                      </div>
                      <div className="text-xs text-gray-400">
                        {docCount} associated documents
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(ay.id);
                      setEditValue(ay.year);
                    }}
                    className="p-1.5 text-gray-400 hover:text-[var(--archyv-accent-hover)] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Session"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmation({ id: ay.id, name: ay.year })}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {academicYears.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              No academic years configured yet.
            </div>
          )}
        </div>

        {/* Add Form */}
        <div className="pt-4 border-t border-gray-100">
          <form onSubmit={handleAdd} className="space-y-2 max-w-md">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Add Academic Year
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 2024-2025"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
              />
              <button
                type="submit"
                disabled={isAdding || !newYear.trim()}
                className="px-5 py-2.5 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {isAdding ? "Adding..." : "+ Add"}
              </button>
            </div>
            {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmation)}
        title="Delete Academic Year"
        message={`Are you sure you want to delete Academic Year "${deleteConfirmation?.name}"?`}
        confirmText="Confirm Delete"
        onCancel={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
