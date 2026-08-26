"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  mockAdminUser, 
  mockFacultyUser, 
  mockDocuments, 
  mockTrashFiles, 
  mockAuditLogs, 
  User, 
  Document 
} from "@/lib/mock-data";
import { deleteFile } from "@/lib/storage";

export interface AuditLog {
  id: number;
  time: string;
  user: string;
  action: string;
  target: string;
  domain: string;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  documents: Document[];
  auditLogs: AuditLog[];
  starredDocs: Record<string, string[]>; // mapping of userId to array of docIds
  globalSearchQuery: string;
}

interface AppContextType extends AppState {
  login: (email: string, role: "admin" | "faculty") => boolean;
  logout: () => void;
  addDocument: (doc: Document) => void;
  updateDocumentStatus: (id: string, status: "Approved" | "Pending" | "Rejected") => void;
  deleteDocument: (id: string) => void;
  restoreDocument: (id: string) => void;
  permanentDeleteDocument: (id: string) => void;
  toggleStar: (docId: string) => void;
  createFaculty: (user: User) => void;
  deleteFaculty: (id: string) => void;
  updateFaculty: (id: string, updates: Partial<User>) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  addAuditLog: (action: string, target: string, domain: string) => void;
  setGlobalSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize state with mock data
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Try to load user from localStorage for basic persistence during reloads in development
  useEffect(() => {
    const savedUser = localStorage.getItem("archyv_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, []);

  const [users, setUsers] = useState<User[]>([mockAdminUser, mockFacultyUser]);
  
  useEffect(() => {
    const savedUsers = localStorage.getItem("archyv_users");
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        console.error("Failed to parse users from local storage");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("archyv_users", JSON.stringify(users));
  }, [users]);

  const [documents, setDocuments] = useState<Document[]>([...mockDocuments, ...mockTrashFiles]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem("archyv_documents");
    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch (e) {
        console.error("Failed to parse documents from local storage");
      }
    }
  }, []);

  // Save documents to localStorage when they change
  useEffect(() => {
    localStorage.setItem("archyv_documents", JSON.stringify(documents));
  }, [documents]);
  
  // Initialize starred docs based on mock data's initial isStarred (assigning to mockFacultyUser for now)
  const [starredDocs, setStarredDocs] = useState<Record<string, string[]>>({
    [mockFacultyUser.id]: mockDocuments.filter(d => d.isStarred).map(d => d.id),
    [mockAdminUser.id]: []
  });

  useEffect(() => {
    const savedStarred = localStorage.getItem("archyv_starred_docs");
    if (savedStarred) {
      try {
        setStarredDocs(JSON.parse(savedStarred));
      } catch (e) {
        console.error("Failed to parse starred docs from local storage");
      }
    }
  }, []);

  const addAuditLog = (action: string, target: string, domain: string) => {
    if (!currentUser) return;
    
    const newLog: AuditLog = {
      id: Date.now(),
      time: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true }),
      user: currentUser.name,
      action,
      target,
      domain
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const login = (email: string, role: "admin" | "faculty") => {
    // Basic mock authentication
    const user = users.find(u => u.email === email && u.role === role);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("archyv_user", JSON.stringify(user));
      addAuditLog("Logged in", "System", "Auth");
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog("Logged out", "System", "Auth");
    }
    setCurrentUser(null);
    localStorage.removeItem("archyv_user");
  };

  const addDocument = (doc: Document) => {
    setDocuments(prev => [doc, ...prev]);
    addAuditLog("Uploaded file", doc.name, doc.domain || "Files");
  };

  const updateDocumentStatus = (id: string, status: "Approved" | "Pending" | "Rejected") => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    const doc = documents.find(d => d.id === id);
    if (doc) {
      addAuditLog(`${status} file`, doc.name, "Approval Queue");
    }
  };

  const deleteDocument = (id: string) => {
    if (currentUser?.role !== "admin") return;
    setDocuments(prev => prev.map(d => {
      if (d.id === id) {
        return { 
          ...d, 
          isDeleted: true, 
          deletedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          daysLeft: 90 
        };
      }
      return d;
    }));
    
    const doc = documents.find(d => d.id === id);
    if (doc) {
      addAuditLog("Deleted file", doc.name, "Files");
    }
  };

  const restoreDocument = (id: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === id) {
        const { isDeleted, deletedDate, daysLeft, ...rest } = d;
        return { ...rest, isDeleted: false };
      }
      return d;
    }));
    
    const doc = documents.find(d => d.id === id);
    if (doc) {
      addAuditLog("Restored file", doc.name, "Trash");
    }
  };

  const permanentDeleteDocument = (id: string) => {
    if (currentUser?.role !== "admin") return;
    const doc = documents.find(d => d.id === id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    
    // Also remove from starred if it was starred
    setStarredDocs(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(userId => {
        next[userId] = next[userId].filter(docId => docId !== id);
      });
      localStorage.setItem("archyv_starred_docs", JSON.stringify(next));
      return next;
    });

    // Delete the actual file from IndexedDB
    deleteFile(id).catch(err => console.error("Failed to delete file from IndexedDB", err));

    if (doc) {
      addAuditLog("Permanently deleted file", doc.name, "Trash");
    }
  };

  const toggleStar = (docId: string) => {
    if (!currentUser) return;
    
    setStarredDocs(prev => {
      const userStarred = prev[currentUser.id] || [];
      const isCurrentlyStarred = userStarred.includes(docId);
      
      const nextUserStarred = isCurrentlyStarred 
        ? userStarred.filter(id => id !== docId)
        : [...userStarred, docId];
        
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        addAuditLog(isCurrentlyStarred ? "Unstarred file" : "Starred file", doc.name, "Files");
      }
        
      const nextState = {
        ...prev,
        [currentUser.id]: nextUserStarred
      };
      
      localStorage.setItem("archyv_starred_docs", JSON.stringify(nextState));
      return nextState;
    });
  };

  const createFaculty = (user: User) => {
    setUsers(prev => [...prev, user]);
    addAuditLog("Created faculty", user.name, "Faculty Management");
  };

  const deleteFaculty = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addAuditLog("Deleted faculty", id, "Faculty Management");
  };

  const updateFaculty = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    addAuditLog("Updated faculty", updates.name || id, "Faculty Management");
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem("archyv_user", JSON.stringify(updatedUser));
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      addAuditLog("Updated profile", updatedUser.name, "Profile");
    }
  };

  const value = {
    currentUser,
    users,
    documents,
    auditLogs,
    starredDocs,
    login,
    logout,
    addDocument,
    updateDocumentStatus,
    deleteDocument,
    restoreDocument,
    permanentDeleteDocument,
    toggleStar,
    createFaculty,
    deleteFaculty,
    updateFaculty,
    updateUserProfile,
    addAuditLog,
    globalSearchQuery,
    setGlobalSearchQuery
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
