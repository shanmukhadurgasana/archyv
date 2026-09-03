"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Eye, Trash2, Search, Plus, X, Camera } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { User } from "@/lib/mock-data";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import CustomDropdown from "@/components/ui/CustomDropdown";

export default function AdminFaculty() {
  const [showModal, setShowModal] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: "", email: "", department: "CSD", phone: "",
    designation: "", dateOfJoin: "", facultyId: "", initialPassword: "", status: "Active"
  });
  const [errors, setErrors] = useState<{ name?: string, email?: string, phone?: string, initialPassword?: string }>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState<User | null>(null);
  const [editFacultyData, setEditFacultyData] = useState<Partial<User>>({});

  const [showViewModal, setShowViewModal] = useState<User | null>(null);

  const { users, documents, createFaculty, deleteFaculty, updateFaculty } = useAppContext();

  const facultyList = users.filter(u => {
    if (u.role !== "faculty") return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.department?.toLowerCase().includes(query));
  });

  const getFacultyStats = (name: string) => {
    const docs = documents.filter(d => d.uploadedBy === name && !d.isDeleted);
    return {
      total: docs.length,
    };
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!newFaculty.name.trim()) newErrors.name = "Name is required";
    if (!newFaculty.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newFaculty.email)) newErrors.email = "Email is invalid";
    if (!newFaculty.phone.trim()) newErrors.phone = "Phone number is required";
    if (!newFaculty.initialPassword?.trim()) newErrors.initialPassword = "Initial Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await createFaculty({
      facultyId: newFaculty.facultyId || `fac-${Date.now()}`,
      name: newFaculty.name,
      email: newFaculty.email,
      department: newFaculty.department,
      designation: newFaculty.designation,
      dateOfJoin: newFaculty.dateOfJoin,
      phone: newFaculty.phone,
      initialPassword: newFaculty.initialPassword,
      status: newFaculty.status
    });

    if (result && result.success) {
      setErrors({});
      setShowModal(false);
      setNewFaculty({ name: "", email: "", department: "CSD", phone: "", designation: "", dateOfJoin: "", facultyId: "", initialPassword: "", status: "Active" });
    } else {
      setErrors({ email: result?.error || "Failed to create faculty. Email might be in use." });
    }
  };

  const handleEditFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showEditModal) {
      await updateFaculty(showEditModal.id, editFacultyData);
      setShowEditModal(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Faculty Management"
        subtitle="Create, manage and oversee faculty accounts."
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty by name, email or department..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New Faculty</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Faculty</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Department</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Email</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Date of Joining</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {facultyList.map((faculty) => (
                <tr key={faculty.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                        {faculty.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{faculty.name}</div>
                        <div className="text-xs text-gray-500">{faculty.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {faculty.department}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {faculty.email}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {faculty.dateOfJoin ? faculty.dateOfJoin.split('-').reverse().join('/') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${faculty.status === "Active" ? "bg-green-500" : "bg-gray-300"}`}></span>
                      <span className="text-gray-600">{faculty.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setShowViewModal(faculty)} className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:text-foreground hover:bg-gray-50 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditFacultyData(faculty); setShowEditModal(faculty); }} className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:text-foreground hover:bg-gray-50 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                      </button>
                      <button onClick={() => setShowDeleteModal(faculty.id)} className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 border-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {facultyList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No faculty found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!showDeleteModal}
        title="Remove Faculty?"
        message="Are you sure you want to remove this faculty member?"
        onConfirm={async () => {
          if (showDeleteModal) {
            await deleteFaculty(showDeleteModal);
            setShowDeleteModal(null);
          }
        }}
        onCancel={() => setShowDeleteModal(null)}
      />

      {/* Add New Faculty Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-[var(--border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-foreground">Add New Faculty</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddFaculty} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all`}
                    placeholder="e.g. Dr. A. P. J. Abdul Kalam"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Faculty ID</label>
                  <input
                    type="text"
                    value={newFaculty.facultyId}
                    onChange={(e) => setNewFaculty({ ...newFaculty, facultyId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                    placeholder="e.g. FAC-2026"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all`}
                    placeholder="e.g. faculty@institution.edu"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={newFaculty.phone}
                    onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all`}
                    placeholder="e.g. +91 98765 43210"
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Department</label>
                  <CustomDropdown
                    value={newFaculty.department}
                    onChange={(val) => setNewFaculty({ ...newFaculty, department: val })}
                    options={["CSD", "CSIT"]}
                    fullWidth
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Designation</label>
                  <input
                    type="text"
                    value={newFaculty.designation}
                    onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                    placeholder="e.g. Assistant Professor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Date of Joining</label>
                  <input
                    type="date"
                    value={newFaculty.dateOfJoin}
                    onChange={(e) => setNewFaculty({ ...newFaculty, dateOfJoin: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all text-gray-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Status</label>
                  <CustomDropdown
                    value={newFaculty.status}
                    onChange={(val) => setNewFaculty({ ...newFaculty, status: val })}
                    options={["Active", "Inactive"]}
                    fullWidth
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Initial Password</label>
                  <input
                    type="text"
                    value={newFaculty.initialPassword}
                    onChange={(e) => setNewFaculty({ ...newFaculty, initialPassword: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border ${errors.initialPassword ? 'border-red-500' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all`}
                    placeholder="Set an initial password"
                  />
                  {errors.initialPassword && <p className="text-xs text-red-500">{errors.initialPassword}</p>}
                  <p className="text-xs text-gray-500">The faculty member will be required to change this upon first login.</p>
                </div>
              </div>

              <div className="pt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Add Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-[var(--border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-foreground">Edit Faculty</h3>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditFaculty} className="p-6">
              <div className="flex flex-col items-center mb-6 relative group w-24 h-24 mx-auto">
                <div className="w-24 h-24 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-3xl font-bold text-foreground overflow-hidden">
                  {editFacultyData.avatar ? (
                    <img src={editFacultyData.avatar} alt={editFacultyData.name} className="w-full h-full object-cover" />
                  ) : (
                    (editFacultyData.name || "A").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById("faculty-avatar-upload")?.click()}
                  className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  id="faculty-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users/${editFacultyData.id}/avatar`, {
                        method: 'PATCH',
                        body: formData,
                        credentials: 'include'
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setEditFacultyData({ ...editFacultyData, avatar: data.user.avatar });
                        updateFaculty(editFacultyData.id, { avatar: data.user.avatar }); // Update locally in context
                      } else {
                        alert("Failed to upload avatar");
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Error uploading avatar");
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={editFacultyData.name || ""}
                    onChange={(e) => setEditFacultyData({ ...editFacultyData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={editFacultyData.email || ""}
                    onChange={(e) => setEditFacultyData({ ...editFacultyData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={editFacultyData.phone || ""}
                    onChange={(e) => setEditFacultyData({ ...editFacultyData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Department</label>
                  <CustomDropdown
                    value={editFacultyData.department || "CSD"}
                    onChange={(val) => setEditFacultyData({ ...editFacultyData, department: val })}
                    options={["CSD", "CSIT"]}
                    fullWidth
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Date of Joining</label>
                  <input
                    type="date"
                    value={editFacultyData.dateOfJoin || ""}
                    onChange={(e) => setEditFacultyData({ ...editFacultyData, dateOfJoin: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all text-gray-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Status</label>
                  <CustomDropdown
                    value={editFacultyData.status || "Active"}
                    onChange={(val) => setEditFacultyData({ ...editFacultyData, status: val })}
                    options={["Active", "Inactive"]}
                    fullWidth
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Faculty Details Modal */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-foreground">Faculty Details</h3>
              <button
                onClick={() => setShowViewModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-xl font-bold text-foreground shrink-0 overflow-hidden">
                  {showViewModal.avatar ? (
                    <img src={showViewModal.avatar} alt={showViewModal.name} className="w-full h-full object-cover" />
                  ) : (
                    (showViewModal.name || "A").substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{showViewModal.name}</div>
                  <div className="text-sm text-gray-500">{showViewModal.department || 'No Department'}</div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Email Address</div>
                  <div className="text-sm font-medium text-foreground">{showViewModal.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Phone Number</div>
                  <div className="text-sm font-medium text-foreground">{showViewModal.phone || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Date of Join</div>
                    <div className="text-sm font-medium text-foreground">{showViewModal.dateOfJoin || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Status</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${showViewModal.status === "Active" ? "bg-green-500" : "bg-gray-300"}`}></span>
                      <span className="text-sm font-medium text-gray-600">{showViewModal.status || 'Active'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Last Login</div>
                  <div className="text-sm font-medium text-foreground">{showViewModal.lastLogin || 'Never'}</div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <div className="text-sm font-bold text-foreground mb-4">Document Statistics</div>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const stats = getFacultyStats(showViewModal.name);
                    return (
                      <>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 col-span-2">
                          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total Uploads</div>
                          <div className="text-xl font-bold text-foreground">{stats.total}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
