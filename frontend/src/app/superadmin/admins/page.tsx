"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  Trash2, 
  Pencil, 
  X, 
  Eye, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  UserPlus 
} from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { User } from "@/lib/mock-data";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function SuperAdminAdmins() {
  const { users, createAdmin, deleteFaculty, updateFaculty, refreshData } = useAppContext();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    phone: "",
    initialPassword: "",
    status: "Active"
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Edit State
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [editData, setEditData] = useState<{ name?: string; phone?: string; status?: string }>({});

  // View Modal State
  const [viewingAdmin, setViewingAdmin] = useState<User | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Filter admins
  const adminsList = users.filter((u) => {
    const roleLower = u.role?.toLowerCase();
    if (roleLower !== "admin") return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone && u.phone.includes(q));
  });

  const activeAdminsCount = adminsList.filter(a => a.status === "Active" || !a.status).length;
  const inactiveAdminsCount = adminsList.length - activeAdminsCount;

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!newAdmin.name.trim()) errors.name = "Full name is required";
    if (!newAdmin.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newAdmin.email)) errors.email = "Invalid email format";
    if (!newAdmin.initialPassword.trim()) errors.initialPassword = "Initial password is required";
    else if (newAdmin.initialPassword.length < 6) errors.initialPassword = "Password must be at least 6 characters";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    const res = await createAdmin(newAdmin);
    setIsSubmitting(false);

    if (res.success) {
      setShowAddModal(false);
      setNewAdmin({ name: "", email: "", phone: "", initialPassword: "", status: "Active" });
      await refreshData();
    } else {
      setFormErrors({ general: res.error || "Failed to create administrator account." });
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || isSubmitting) return;

    setIsSubmitting(true);
    await updateFaculty(editingAdmin.id, editData);
    setIsSubmitting(false);
    setEditingAdmin(null);
    await refreshData();
  };

  const handleDeleteAdmin = async () => {
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
          title="Administrators"
          subtitle="Manage institution administrators with privileged governance access."
        />
        <button
          onClick={() => {
            setFormErrors({});
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Administrator
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Administrators</div>
            <div className="text-2xl font-bold text-foreground mt-1">{adminsList.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Admins</div>
            <div className="text-2xl font-bold text-foreground mt-1">{activeAdminsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--archyv-accent)]/15 text-foreground flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Inactive Admins</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">{inactiveAdminsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar & Table Card */}
      <div className="bg-white border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search admin by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Showing <span className="font-semibold text-foreground">{adminsList.length}</span> administrators
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-3.5 px-6">Administrator</th>
                <th className="py-3.5 px-6">Contact</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Joined Date</th>
                <th className="py-3.5 px-6">Last Login</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminsList.length > 0 ? (
                adminsList.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* User */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--archyv-accent)]/20 text-foreground font-bold flex items-center justify-center shrink-0">
                          {admin.avatar ? (
                            <img src={admin.avatar} alt={admin.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            admin.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{admin.name}</div>
                          <div className="text-xs text-gray-400">ID: {admin.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6">
                      <div className="text-xs space-y-0.5">
                        <div className="text-gray-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{admin.email}</span>
                        </div>
                        {admin.phone && (
                          <div className="text-gray-500 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{admin.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        admin.status === "Active" || !admin.status
                          ? "bg-[var(--archyv-accent)]/15 text-foreground border border-[var(--border)]"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          admin.status === "Active" || !admin.status ? "bg-foreground" : "bg-gray-400"
                        }`} />
                        {admin.status || "Active"}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-6 text-xs text-gray-600 font-medium">
                      {admin.dateOfJoin || "N/A"}
                    </td>

                    {/* Last Login */}
                    <td className="py-4 px-6 text-xs text-gray-500">
                      {admin.lastLogin || "Never"}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingAdmin(admin)}
                          className="p-1.5 text-gray-400 hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingAdmin(admin);
                            setEditData({ name: admin.name, phone: admin.phone || "", status: admin.status || "Active" });
                          }}
                          className="p-1.5 text-gray-400 hover:text-[var(--archyv-accent-hover)] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Admin"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    {searchQuery ? "No administrators matching your search query." : "No administrators registered."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--archyv-accent)]/20 text-[#9a6e35] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Add New Administrator</h3>
                  <p className="text-xs text-gray-500">Create a privileged admin account</p>
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

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  required
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="admin.name@institution.edu"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  required
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newAdmin.status}
                    onChange={(e) => setNewAdmin({ ...newAdmin, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
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
                    placeholder="Enter secure initial password"
                    value={newAdmin.initialPassword}
                    onChange={(e) => setNewAdmin({ ...newAdmin, initialPassword: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                    required
                  />
                </div>
                {formErrors.initialPassword && <p className="text-red-500 text-xs mt-1">{formErrors.initialPassword}</p>}
                <p className="text-[11px] text-gray-400 mt-1">Admin will use this password to sign in via the Admin Login page.</p>
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
                  {isSubmitting ? "Creating..." : "Create Administrator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h3 className="font-bold text-foreground">Edit Administrator</h3>
              <button
                onClick={() => setEditingAdmin(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAdmin} className="space-y-4">
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
                  onClick={() => setEditingAdmin(null)}
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

      {/* View Admin Modal */}
      {viewingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <h3 className="font-bold text-foreground">Administrator Details</h3>
              <button
                onClick={() => setViewingAdmin(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-[var(--archyv-accent)]/20 text-foreground font-bold flex items-center justify-center text-lg">
                  {viewingAdmin.avatar ? (
                    <img src={viewingAdmin.avatar} alt={viewingAdmin.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    viewingAdmin.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-bold text-base text-foreground">{viewingAdmin.name}</div>
                  <div className="text-xs text-gray-500">{viewingAdmin.email}</div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--archyv-accent)]/15 text-foreground border border-[var(--border)]">
                    Administrator
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium text-foreground">{viewingAdmin.phone || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium text-foreground">{viewingAdmin.status || "Active"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Joined Date:</span>
                  <span className="font-medium text-foreground">{viewingAdmin.dateOfJoin || "N/A"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">Last Login:</span>
                  <span className="font-medium text-foreground">{viewingAdmin.lastLogin || "Never"}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-gray-500">System UUID:</span>
                  <span className="font-mono text-gray-700">{viewingAdmin.id}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingAdmin(null)}
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
        title="Delete Administrator"
        message={`Are you sure you want to delete administrator "${deleteTarget?.name}" (${deleteTarget?.email})? This action cannot be undone.`}
        confirmText="Delete Administrator"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAdmin}
      />
    </div>
  );
}
