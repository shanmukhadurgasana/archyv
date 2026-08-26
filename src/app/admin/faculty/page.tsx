"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Eye, Trash2, Search, Plus, X } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { User } from "@/lib/mock-data";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function AdminFaculty() {
  const [showModal, setShowModal] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ 
    name: "", email: "", department: "CSD", phone: "", 
    designation: "", dateOfJoin: "", facultyId: "", initialPassword: "", status: "Active" 
  });
  const [errors, setErrors] = useState<{name?: string, email?: string, phone?: string}>({});
  
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
      approved: docs.filter(d => d.status === "Approved").length,
      pending: docs.filter(d => d.status === "Pending").length,
      declined: docs.filter(d => d.status === "Rejected").length,
    };
  };

  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!newFaculty.name.trim()) newErrors.name = "Name is required";
    if (!newFaculty.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(newFaculty.email)) newErrors.email = "Email is invalid";
    if (!newFaculty.phone.trim()) newErrors.phone = "Phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createFaculty({
      id: newFaculty.facultyId || `fac-${Date.now()}`,
      name: newFaculty.name,
      email: newFaculty.email,
      role: "faculty",
      department: newFaculty.department,
      dateOfJoin: newFaculty.dateOfJoin,
      phone: newFaculty.phone,
      status: newFaculty.status
    });

    setErrors({});
    setShowModal(false);
    setNewFaculty({ name: "", email: "", department: "CSD", phone: "", designation: "", dateOfJoin: "", facultyId: "", initialPassword: "", status: "Active" });
  };

  const handleEditFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (showEditModal) {
      updateFaculty(showEditModal.id, editFacultyData);
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
                    {faculty.dateOfJoin}
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
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
        onConfirm={() => {
          if (showDeleteModal) {
            deleteFaculty(showDeleteModal);
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
                    onChange={(e) => setNewFaculty({...newFaculty, name: e.target.value})}
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
                    onChange={(e) => setNewFaculty({...newFaculty, facultyId: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                    placeholder="e.g. FAC-2026"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <input 
                    type="email" 
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({...newFaculty, email: e.target.value})}
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
                    onChange={(e) => setNewFaculty({...newFaculty, phone: e.target.value})}
                    className={`w-full px-3 py-2 bg-white border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all`}
                    placeholder="e.g. +91 98765 43210"
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Department</label>
                  <select 
                    value={newFaculty.department}
                    onChange={(e) => setNewFaculty({...newFaculty, department: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right"
                  >
                    <option value="CSD">CSD</option>
                    <option value="CSE">CSE</option>
                    <option value="CSIT">CSIT</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Designation</label>
                  <input 
                    type="text" 
                    value={newFaculty.designation}
                    onChange={(e) => setNewFaculty({...newFaculty, designation: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                    placeholder="e.g. Assistant Professor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Date of Joining</label>
                  <input 
                    type="date" 
                    value={newFaculty.dateOfJoin}
                    onChange={(e) => setNewFaculty({...newFaculty, dateOfJoin: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all text-gray-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Status</label>
                  <select 
                    value={newFaculty.status}
                    onChange={(e) => setNewFaculty({...newFaculty, status: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-foreground">Initial Password</label>
                  <input 
                    type="text" 
                    value={newFaculty.initialPassword}
                    onChange={(e) => setNewFaculty({...newFaculty, initialPassword: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                    placeholder="Set an initial password"
                  />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Full Name</label>
                  <input 
                    type="text" 
                    value={editFacultyData.name || ""}
                    onChange={(e) => setEditFacultyData({...editFacultyData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Email Address</label>
                  <input 
                    type="email" 
                    value={editFacultyData.email || ""}
                    onChange={(e) => setEditFacultyData({...editFacultyData, email: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Phone Number</label>
                  <input 
                    type="tel" 
                    value={editFacultyData.phone || ""}
                    onChange={(e) => setEditFacultyData({...editFacultyData, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Department</label>
                  <select 
                    value={editFacultyData.department || ""}
                    onChange={(e) => setEditFacultyData({...editFacultyData, department: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right"
                  >
                    <option value="CSD">CSD</option>
                    <option value="CSE">CSE</option>
                    <option value="CSIT">CSIT</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Date of Joining</label>
                  <input 
                    type="date" 
                    value={editFacultyData.dateOfJoin || ""}
                    onChange={(e) => setEditFacultyData({...editFacultyData, dateOfJoin: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all text-gray-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Status</label>
                  <select 
                    value={editFacultyData.status || ""}
                    onChange={(e) => setEditFacultyData({...editFacultyData, status: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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
                <div className="w-16 h-16 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-xl font-bold text-foreground shrink-0">
                  {showViewModal.name.substring(0, 2).toUpperCase()}
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
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total</div>
                          <div className="text-xl font-bold text-foreground">{stats.total}</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <div className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Approved</div>
                          <div className="text-xl font-bold text-green-700">{stats.approved}</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                          <div className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-1">Pending</div>
                          <div className="text-xl font-bold text-orange-700">{stats.pending}</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                          <div className="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">Declined</div>
                          <div className="text-xl font-bold text-red-700">{stats.declined}</div>
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
