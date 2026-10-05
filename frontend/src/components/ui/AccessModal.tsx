"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "@/store/AppContext";
import { Document } from "@/lib/mock-data";

interface AccessModalProps {
  isOpen: boolean;
  document: Document;
  onClose: () => void;
}

export default function AccessModal({ isOpen, document, onClose }: AccessModalProps) {
  const { users, updateDocumentAccess } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [accessMode, setAccessMode] = useState<string>("NONE");
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);

  const facultyUsers = users.filter(u => u.role.toUpperCase() === 'FACULTY' && u.status === 'Active');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && document) {
      setAccessMode(document.accessType || "NONE");
      if (document.facultyAccess) {
        setSelectedFaculty(document.facultyAccess.map((fa: any) => fa.facultyId));
      } else {
        setSelectedFaculty([]);
      }
    }
  }, [isOpen, document]);

  if (!isOpen || !mounted) return null;

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await updateDocumentAccess(document.id, accessMode, accessMode === 'SELECT_FACULTY' ? selectedFaculty : []);
      if (res.success) {
        onClose();
      } else {
        alert(res.error || "Failed to update access");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaculty = (id: string) => {
    setSelectedFaculty(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white border border-[var(--border)] rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold text-foreground">Document Access</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="accessMode" 
                value="NONE" 
                checked={accessMode === "NONE"}
                onChange={() => setAccessMode("NONE")}
                className="w-4 h-4 text-[var(--archyv-accent)] focus:ring-[var(--archyv-accent)] border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">None</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="accessMode" 
                value="SELECT_FACULTY" 
                checked={accessMode === "SELECT_FACULTY"}
                onChange={() => setAccessMode("SELECT_FACULTY")}
                className="w-4 h-4 text-[var(--archyv-accent)] focus:ring-[var(--archyv-accent)] border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Select Faculty</span>
            </label>
            
            {accessMode === "SELECT_FACULTY" && (
              <div className="pl-7 pr-2 py-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 space-y-2 mt-2">
                {facultyUsers.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">No active faculty found.</p>
                ) : (
                  facultyUsers.map(faculty => (
                    <label key={faculty.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                      <input 
                        type="checkbox" 
                        checked={selectedFaculty.includes(faculty.id)}
                        onChange={() => toggleFaculty(faculty.id)}
                        className="w-3.5 h-3.5 text-[var(--archyv-accent)] focus:ring-[var(--archyv-accent)] border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 truncate">{faculty.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" 
                name="accessMode" 
                value="ALL_FACULTY" 
                checked={accessMode === "ALL_FACULTY"}
                onChange={() => setAccessMode("ALL_FACULTY")}
                className="w-4 h-4 text-[var(--archyv-accent)] focus:ring-[var(--archyv-accent)] border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">All Faculty</span>
            </label>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3 justify-end bg-gray-50/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[var(--archyv-accent)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--archyv-accent-hover)] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>,
    globalThis.document.body
  );
}
