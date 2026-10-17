"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Trash2, 
  Pencil, 
  X, 
  Eye, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  KeyRound, 
  UserPlus 
} from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { User } from "@/lib/mock-data";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function SuperAdminFaculties() {
  const { users, documents, departments, createFaculty, deleteFaculty, updateFaculty, refreshData } = useAppContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [newFaculty, setNewFaculty] = useState({
    name: "",
    email: "",
    facultyId: "",
    department: "",
    designation: "Assistant Professor",
    phone: "",
    dateOfJoin: "",
    initialPassword: "",
    status: "Active"
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Edit State
  const [editingFaculty, setEditingFaculty] = useState<User | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});

  // View State
  const [viewingFaculty, setViewingFaculty] = useState<User | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const deptList = ["All Departments", ...departments.map(d => d.name)];

  const facultyList = users.filter((u) => {
    if (u.role?.toLowerCase() !== "faculty") return false;
    
    // Department filter
    if (selectedDept !== "All Departments" && u.department !== selectedDept) {
      return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.facultyId && u.facultyId.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const getFacultyFileCount = (facultyName: string) => {
    return documents.filter(d => !d.isDeleted && d.uploadedBy === facultyName).length;
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!newFaculty.name.trim()) errors.name = "Full name is required";
    if (!newFaculty.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newFaculty.email)) errors.email = "Invalid email format";
    if (!newFaculty.initialPassword.trim()) errors.initialPassword = "Initial password is required";
    else if (newFaculty.initialPassword.length < 6) errors.initialPassword = "Password must be at least 6 characters";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    const res = await createFaculty({
      ...newFaculty,
      facultyId: newFaculty.facultyId || `FAC-${Date.now().toString().slice(-5)}`,
      department: newFaculty.department || (departments[0]?.name || "CSD")
    });
    setIsSubmitting(false);

    if (res.success) {
      setShowAddModal(false);
      setNewFaculty({
        name: "",
        email: "",
        facultyId: "",
        department: "",
        designation: "Assistant Professor",
        phone: "",
        dateOfJoin: "",
        initialPassword: "",
        status: "Active"
      });
      await refreshData();
    } else {
      setFormErrors({ general: res.error || "Failed to create faculty account." });
    }
  };

  const handleEditFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty || isSubmitting) return;

    setIsSubmitting(true);
    await updateFaculty(editingFaculty.id, editData);
    setIsSubmitting(false);
    setEditingFaculty(null);
    await refreshData();
  };

  const handleDeleteFaculty = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    await deleteFaculty(targetId);
    await refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Faculty Members"
          subtitle="Directory and governance of all registered academic faculty and instructors."
        />
        <button
          onClick={() => {
            setFormErrors({});
            setNewFaculty({
              ...newFaculty,
              department: departments[0]?.name || "CSD"
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Faculty
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Faculty</div>
            <div className="text-2xl font-bold text-foreground mt-1">{users.filter(u => u.role?.toLowerCase() === "faculty").length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Departments Covered</div>
            <div className="text-2xl font-bold text-foreground mt-1">{departments.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Files by Faculty</div>
            <div className="text-2xl font-bold text-foreground mt-1">
              {documents.filter(d => !d.isDeleted && d.uploaderRole?.toLowerCase() === "faculty").length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search faculty by name, email, ID or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50"
            >
              {deptList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
              Showing <span className="font-semibold text-foreground">{facultyList.length}</span> faculty
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-3.5 px-6">Faculty Member</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Contact</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Files</th>
                <th className="py-3.5 px-6">Last Login</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facultyList.length > 0 ? (
                facultyList.map((faculty) => (
                  <tr key={faculty.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Faculty */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--archyv-accent)]/20 text-foreground font-bold flex items-center justify-center shrink-0 text-sm">
                          {faculty.avatar ? (
                            <img src={faculty.avatar} alt={faculty.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            faculty.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{faculty.name}</div>
                          <div className="text-xs text-gray-400">ID: {faculty.facultyId || faculty.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800">
                        <Building2 className="w-3.5 h-3.5 text-gray-500" />
                        {faculty.department || "General"}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6">
                      <div className="text-xs space-y-0.5">
                        <div className="text-gray-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{faculty.email}</span>
                        </div>
                        {faculty.phone && (
                          <div className="text-gray-500 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{faculty.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        faculty.status === "Active" || !faculty.status
                          ? "bg-[var(--archyv-accent)]/15 text-foreground border border-[var(--border)]"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          faculty.status === "Active" || !faculty.status ? "bg-foreground" : "bg-gray-400"
                        }`} />
                        {faculty.status || "Active"}
                      </span>
                    </td>

                    {/* Files Uploaded */}
                    <td className="py-4 px-6 text-xs font-semibold text-gray-800">
                      {getFacultyFileCount(faculty.name)} uploads
                    </td>

                    {/* Last Login */}
                    <td className="py-4 px-6 text-xs text-gray-500">
                      {faculty.lastLogin || "Never"}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingFaculty(faculty)}
                          className="p-1.5 text-gray-400 hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Faculty"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingFaculty(faculty);
                            setEditData({
                              name: faculty.name,
                              phone: faculty.phone || "",
                              department: faculty.department || "",
                              status: faculty.status || "Active"
                            });
                          }}
                          className="p-1.5 text-gray-400 hover:text-[var(--archyv-accent-hover)] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Faculty"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(faculty)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Faculty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    {searchQuery ? "No faculty members match your search." : "No faculty members registered."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--archyv-accent)]/20 text-[#9a6e35] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Add Faculty Member</h3>
                  <p className="text-xs text-gray-500">Register new academic instructor</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
                {formErrors.general}
              </div>
            )}

            <form onSubmit={handleAddFaculty} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Arvind Rao"
                    value={newFaculty.name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                    required
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Faculty ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FAC-2024-01"
                    value={newFaculty.facultyId}
                    onChange={(e) => setNewFaculty({ ...newFaculty, facultyId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="faculty@institution.edu"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  required
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <select
                    value={newFaculty.department}
                    onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                    {departments.length === 0 && <option value="General">General</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={newFaculty.phone}
                    onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={newFaculty.dateOfJoin}
                    onChange={(e) => setNewFaculty({ ...newFaculty, dateOfJoin: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newFaculty.status}
                    onChange={(e) => setNewFaculty({ ...newFaculty, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Initial Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter initial password for login"
                    value={newFaculty.initialPassword}
                    onChange={(e) => setNewFaculty({ ...newFaculty, initialPassword: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                    required
                  />
                </div>
                {formErrors.initialPassword && <p className="text-red-500 text-xs mt-1">{formErrors.initialPassword}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
                >
                  {isSubmitting ? "Creating..." : "Create Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h3 className="font-bold text-foreground">Edit Faculty Member</h3>
              <button
                onClick={() => setEditingFaculty(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={editData.department || ""}
                  onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editData.phone || ""}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Account Status
                </label>
                <select
                  value={editData.status || "Active"}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Faculty Modal */}
      {viewingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h3 className="font-bold text-foreground">Faculty Member Profile</h3>
              <button
                onClick={() => setViewingFaculty(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[var(--archyv-accent)]/20 text-foreground font-bold flex items-center justify-center text-lg">
                  {viewingFaculty.avatar ? (
                    <img src={viewingFaculty.avatar} alt={viewingFaculty.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    viewingFaculty.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-bold text-base text-foreground">{viewingFaculty.name}</div>
                  <div className="text-xs text-gray-500">{viewingFaculty.email}</div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--archyv-accent)]/15 text-foreground border border-[var(--border)]">
                    Faculty Member
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Faculty ID:</span>
                  <span className="font-semibold text-foreground">{viewingFaculty.facultyId || viewingFaculty.id.substring(0, 8)}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-medium text-foreground">{viewingFaculty.department || "General"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium text-foreground">{viewingFaculty.phone || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium text-foreground">{viewingFaculty.status || "Active"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Total Uploaded Files:</span>
                  <span className="font-bold text-foreground">{getFacultyFileCount(viewingFaculty.name)} documents</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Last Login:</span>
                  <span className="font-medium text-foreground">{viewingFaculty.lastLogin || "Never"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingFaculty(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-foreground text-xs font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Faculty Member"
        message={`Are you sure you want to delete faculty member "${deleteTarget?.name}" (${deleteTarget?.email})? This action cannot be undone.`}
        confirmText="Delete Faculty"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFaculty}
      />
    </div>
  );
}
