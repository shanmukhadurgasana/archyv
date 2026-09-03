"use client";

import PageHeader from "@/components/ui/PageHeader";
import { Camera, User, Mail, Phone, Building2, Calendar, Circle, FileText, Clock, Loader2 } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import { useState, useRef } from "react";
import Image from "next/image";

export default function FacultyProfile() {
  const { currentUser, updateUserProfile, documents } = useAppContext();
  const user = currentUser;
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalDocs = user ? documents.filter(d => d.uploadedBy === user.name).length : 0;

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/me/avatar`, {
        method: "PATCH",
        credentials: "include",
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        updateUserProfile({ avatar: data.user.avatar });
      } else {
        alert("Failed to upload avatar");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="View and manage your profile information."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[320px] shrink-0 bg-white border border-[var(--border)] rounded-2xl p-8 flex flex-col items-center text-center h-fit">
          <div className="w-32 h-32 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-4xl font-bold text-foreground mb-6 relative overflow-hidden">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name} fill className="object-cover" />
            ) : (
              user.name.split(" ").map(n => n[0]).join("")
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm text-gray-500 hover:text-foreground transition-colors z-10"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
          />

          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {isUploading ? "Uploading..." : "Change Photo"}
          </button>
        </div>

        <div className="flex-1 space-y-6">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Full Name</span>
              </div>
              <div className="font-medium text-foreground">{user.name}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Date of Join</span>
              </div>
              <div className="font-medium text-foreground">{user.dateOfJoin}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Mail className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Email</span>
              </div>
              <div className="font-medium text-foreground">{user.email}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Circle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Faculty Status</span>
              </div>
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                {user.status}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Phone Number</span>
              </div>
              <div className="font-medium text-foreground">{user.phone}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Documents Contributed</span>
              </div>
              <div className="font-medium text-foreground">{totalDocs} Documents</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Department</span>
              </div>
              <div className="font-medium text-foreground">{user.department}</div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Last Login</span>
              </div>
              <div className="font-medium text-foreground">{user.lastLogin}</div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
