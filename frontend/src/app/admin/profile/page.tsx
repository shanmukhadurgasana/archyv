"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Camera, User, Mail, Phone, Calendar, Circle, Clock, ShieldCheck, Hash, X } from "lucide-react";
import { useAppContext } from "@/store/AppContext";

export default function AdminProfile() {
  const { currentUser, updateUserProfile } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", email: "", phone: "", facultyId: "", role: "admin" as "admin" | "faculty" });

  const user = currentUser?.role?.toLowerCase() === 'admin' ? currentUser : null;

  if (!user) return null;

  const handleEditClick = () => {
    setEditData({ 
      name: user.name, 
      email: user.email, 
      phone: user.phone || "", 
      facultyId: user.facultyId || "",
      role: user.role
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateUserProfile(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div>
      <PageHeader 
        title="My Profile" 
        subtitle="View and manage your administrator profile information."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[320px] shrink-0 bg-white border border-[var(--border)] rounded-2xl p-8 flex flex-col items-center text-center h-fit">
          <div className="w-32 h-32 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-4xl font-bold text-foreground mb-4 relative group">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.name.split(" ").map(n => n[0]).join("")
            )}
            <button 
              onClick={() => document.getElementById("avatar-upload")?.click()}
              className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Change</span>
            </button>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("file", file);
                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/me/avatar`, {
                    method: 'PATCH',
                    body: formData,
                    credentials: 'include'
                  });
                  if (res.ok) {
                    const data = await res.json();
                    updateUserProfile({ avatar: data.user.avatar });
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
          <h2 className="text-xl font-bold text-foreground mb-1">{user.name}</h2>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--archyv-accent)]/10 text-[var(--archyv-accent-hover)] text-xs font-semibold rounded-full border border-[var(--archyv-accent)]/20 mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator
          </div>

          <div className="w-full space-y-4 text-sm text-left mb-8 border-t border-[var(--border)] pt-6">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{user.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Hash className="w-4 h-4 text-gray-400" />
              <span>{user.facultyId || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <ShieldCheck className="w-4 h-4 text-gray-400" />
              <span className="capitalize">{user.role === 'admin' ? 'Administrator' : user.role}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <User className="w-5 h-5" />
                Profile Information
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-4 py-2 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-white border border-gray-200 text-foreground font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 divide-y divide-[var(--border)] md:divide-y-0">
              <div className="flex items-center justify-between md:block py-3 md:py-0 border-t border-[var(--border)] md:border-0">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Full Name</span>
                </div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editData.name} 
                    onChange={e => setEditData({...editData, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                ) : (
                  <div className="font-medium text-foreground">{user.name}</div>
                )}
              </div>

              <div className="flex items-center justify-between md:block py-3 md:py-0 border-t border-[var(--border)] md:border-0">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Email Address</span>
                </div>
                {isEditing ? (
                  <input 
                    type="email" 
                    value={editData.email} 
                    onChange={e => setEditData({...editData, email: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                ) : (
                  <div className="font-medium text-foreground">{user.email}</div>
                )}
              </div>

              <div className="flex items-center justify-between md:block py-3 md:py-0 border-t border-[var(--border)] md:border-0">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">Phone Number</span>
                </div>
                {isEditing ? (
                  <input 
                    type="tel" 
                    value={editData.phone} 
                    onChange={e => setEditData({...editData, phone: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                ) : (
                  <div className="font-medium text-foreground">{user.phone || 'N/A'}</div>
                )}
              </div>

              <div className="flex items-center justify-between md:block py-3 md:py-0 border-t border-[var(--border)] md:border-0">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm font-medium">Faculty ID</span>
                </div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editData.facultyId} 
                    onChange={e => setEditData({...editData, facultyId: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
                  />
                ) : (
                  <div className="font-medium text-foreground">{user.facultyId || 'N/A'}</div>
                )}
              </div>

              <div className="flex items-center justify-between md:block py-3 md:py-0 border-t border-[var(--border)] md:border-0">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Role</span>
                </div>
                {isEditing ? (
                  <select 
                    value={editData.role}
                    onChange={e => setEditData({...editData, role: e.target.value as "admin" | "faculty"})}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all appearance-none cursor-pointer"
                  >
                    <option value="admin">Administrator</option>
                    <option value="faculty">Faculty</option>
                  </select>
                ) : (
                  <div className="font-medium text-foreground capitalize">{user.role === 'admin' ? 'Administrator' : user.role}</div>
                )}
              </div>

              <div className="flex items-center justify-between md:block py-3 md:py-0 border-t border-[var(--border)] md:border-0">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Date of Join</span>
                </div>
                <div className="font-medium text-foreground">{user.dateOfJoin}</div>
              </div>

              <div className="flex items-center justify-between md:block py-3 md:py-0 border-t border-[var(--border)] md:border-0">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Circle className="w-4 h-4" />
                  <span className="text-sm font-medium">Admin Status</span>
                </div>
                <div className="font-medium text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                  {user.status || 'Active'}
                </div>
              </div>

              <div className="flex items-center justify-between md:block py-3 md:py-0 border-t border-[var(--border)] md:border-0">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Last Login</span>
                </div>
                <div className="font-medium text-foreground">{user.lastLogin || 'Never'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
