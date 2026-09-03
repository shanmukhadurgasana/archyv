"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  Document
} from "@/lib/mock-data";
import { deleteFile } from "@/lib/storage";

export interface AuditLog {
  id: string;
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
  trashDocuments: Document[];
  auditLogs: AuditLog[];
  starredDocs: Record<string, string[]>; // mapping of userId to array of docIds
  globalSearchQuery: string;
}

interface AppContextType extends Omit<AppState, "currentUser"> {
  currentUser: User | null;
  login: (email: string, password?: string) => Promise<boolean | { require2FA: boolean, tempToken: string }>;
  login2FA: (tempToken: string, token: string) => Promise<boolean>;
  logout: () => Promise<void>;

  deleteDocument: (id: string) => Promise<void>;
  restoreDocument: (id: string) => Promise<void>;
  permanentDeleteDocument: (id: string) => Promise<void>;
  toggleStar: (docId: string) => void;
  createFaculty: (user: any) => Promise<boolean>;
  deleteFaculty: (id: string) => Promise<void>;
  updateFaculty: (id: string, updates: any) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => void;
  setGlobalSearchQuery: (query: string) => void;
  fetchTrashDocuments: (params?: any) => Promise<void>;
  fetchDocuments: (params?: any) => Promise<void>;
  addDocument: (doc: Document) => void;
  isDataLoading: boolean;
  fetchDashboardStats: () => Promise<void>;
  dashboardStats: any;
  paginationData: any;
  trashPaginationData: any;
  fetchAuditLogs: (page?: number, limit?: number) => Promise<void>;
  authStatus: "loading" | "authenticated" | "unauthenticated";
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initialize state with mock data
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [isDataLoading, setIsDataLoading] = useState(false);


  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Failed to fetch users");
    }
  };

  const [documents, setDocuments] = useState<Document[]>([]);
  const [trashDocuments, setTrashDocuments] = useState<Document[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [paginationData, setPaginationData] = useState<any>(null);
  const [trashPaginationData, setTrashPaginationData] = useState<any>(null);

  const buildQueryString = (params?: any) => {
    const query = new URLSearchParams();
    if (globalSearchQuery) query.append("search", globalSearchQuery);
    if (!params) return query.toString();
    
    if (params.search && params.search !== globalSearchQuery) query.set("search", params.search);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.domain) query.append("domain", params.domain);
    if (params.department) query.append("faculty", params.department);
    if (params.status) query.append("status", params.status);
    if (params.isDeleted) query.append("isDeleted", "true");
    if (params.isStarred) query.append("isStarred", "true");
    
    return query.toString();
  };

  const fetchDocuments = async (params?: any) => {
    try {
      const queryString = buildQueryString(params);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents${queryString ? `?${queryString}` : ''}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        if (data.pagination) setPaginationData(data.pagination);
      }
    } catch (e) {
      console.error("Failed to fetch documents");
    }
  };

  const fetchTrashDocuments = async (params?: any) => {
    try {
      // Use the generic documents endpoint but force isDeleted=true to leverage pagination & search
      const queryParams = { ...params, isDeleted: true };
      const queryString = buildQueryString(queryParams);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents${queryString ? `?${queryString}` : ''}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setTrashDocuments(data.documents);
        if (data.pagination) setTrashPaginationData(data.pagination);
      }
    } catch (e) {
      console.error("Failed to fetch trash documents");
    }
  };

  const initializeData = async (user: User) => {
    setIsDataLoading(true);
    const isAdmin = user.role.toLowerCase() === 'admin';
    const promises = [
      fetchDocuments(),
      fetchTrashDocuments(),
      fetchDashboardStats(),
    ];
    if (isAdmin) {
      promises.push(fetchUsers());
      promises.push(fetchAuditLogs());
    }
    await Promise.allSettled(promises);
    setIsDataLoading(false);
  };

  const addDocument = (doc: Document) => {
    setDocuments(prev => [doc, ...prev]);
  };

  const [starredDocs, setStarredDocs] = useState<Record<string, string[]>>({});

  // When documents change, recompute the local starredDocs map for the current user
  useEffect(() => {
    if (currentUser && documents.length > 0) {
      const starred = documents.filter(d => d.isStarred).map(d => d.id);
      setStarredDocs(prev => ({ ...prev, [currentUser.id]: starred }));
    }
  }, [documents, currentUser]);

  
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/dashboard/stats`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats", e);
    }
  };

  const fetchAuditLogs = async (page = 1, limit = 100) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/audit-logs?page=${page}&limit=${limit}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.auditLogs.map((log: any) => {
          const dt = new Date(log.createdAt);
          return {
            id: log.id,
            time: dt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true }),
            user: log.user?.name || "Unknown",
            action: log.action,
            target: log.target,
            domain: log.domain || "System"
          };
        });
        setAuditLogs(mapped);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.require2FA) {
          return { require2FA: true, tempToken: data.tempToken };
        }
        setCurrentUser(data.user);
        setAuthStatus("authenticated");
        initializeData(data.user);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login failed:", e);
      return false;
    }
  };

  const login2FA = async (tempToken: string, token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/login/2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tempToken, token }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setAuthStatus("authenticated");
        initializeData(data.user);
        return true;
      }
      return false;
    } catch (e) {
      console.error("2FA Login failed:", e);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (currentUser) {
        }
      setCurrentUser(null);
      setAuthStatus("unauthenticated");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const deleteDocument = async (id: string) => {
    if (currentUser?.role.toLowerCase() !== "admin") return;
    
    // Grab the document before it's deleted to move it to trash optimistically
    const docToDelete = documents.find(d => d.id === id);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        
        if (docToDelete) {
          const trashedDoc = {
            ...docToDelete,
            isDeleted: true,
            deletedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            daysLeft: 90
          };
          setTrashDocuments(prev => [trashedDoc, ...prev]);
        }
        
        if (dashboardStats) {
            setDashboardStats((prev: any) => ({
                ...prev,
                trashDocuments: prev.trashDocuments + 1,
                totalDocuments: Math.max(0, prev.totalDocuments - 1),
            }));
        }
      } else {
        alert("Failed to delete document");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting document");
    }
  };

  const restoreDocument = async (id: string) => {
    if (currentUser?.role.toLowerCase() !== "admin") return;
    
    const docToRestore = trashDocuments.find(d => d.id === id);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${id}/restore`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (res.ok) {
        setTrashDocuments(prev => prev.filter(d => d.id !== id));
        
        if (docToRestore) {
          const restoredDoc = { ...docToRestore, isDeleted: false };
          delete restoredDoc.deletedDate;
          delete restoredDoc.daysLeft;
          setDocuments(prev => [restoredDoc, ...prev]);
        }
        
        if (dashboardStats) {
            setDashboardStats((prev: any) => ({
                ...prev,
                trashDocuments: Math.max(0, prev.trashDocuments - 1),
                totalDocuments: prev.totalDocuments + 1,
            }));
        }
      } else {
        alert("Failed to restore document");
      }
    } catch (e) {
      console.error(e);
      alert("Error restoring document");
    }
  };

  const permanentDeleteDocument = async (id: string) => {
    if (currentUser?.role.toLowerCase() !== "admin") return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${id}/permanent`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setTrashDocuments(prev => prev.filter(d => d.id !== id));
      } else {
        alert("Failed to permanently delete document");
      }
    } catch (e) {
      console.error(e);
      alert("Error permanently deleting document");
    }
  };

  const toggleStar = async (docId: string) => {
    if (!currentUser) return;
    
    const userStarred = starredDocs[currentUser.id] || [];
    const isCurrentlyStarred = userStarred.includes(docId);
    
    // Optimistic UI update
    setStarredDocs(prev => ({
      ...prev,
      [currentUser.id]: isCurrentlyStarred 
        ? userStarred.filter(id => id !== docId) 
        : [...userStarred, docId]
    }));
    
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isStarred: !isCurrentlyStarred } : d));

    try {
      const method = isCurrentlyStarred ? 'DELETE' : 'POST';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${docId}/star`, {
        method,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to toggle star");
      }
    } catch (e) {
      console.error(e);
      // Revert optimistic update on error
      setStarredDocs(prev => ({
        ...prev,
        [currentUser.id]: userStarred
      }));
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isStarred: isCurrentlyStarred } : d));
    }
  };

  const createFaculty = async (user: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(user)
      });
      if (response.status === 401) {
        window.location.href = "/";
        return { success: false, error: "Session expired. Redirecting..." };
      }
      if (response.ok) {
        const data = await response.json();
        setUsers(prev => [...prev, data.user]);
        return { success: true };
      }
      const errData = await response.json();
      return { success: false, error: errData.message || "Failed to create faculty" };
    } catch (e) {
      console.error("Failed to create faculty:", e);
      return { success: false, error: "Network error occurred" };
    }
  };

  const deleteFaculty = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        }
    } catch (e) {
      console.error("Failed to delete faculty:", e);
    }
  };

  const updateFaculty = async (id: string, updates: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(prev => prev.map(u => u.id === id ? data.user : u));
        }
    } catch (e) {
      console.error("Failed to update faculty:", e);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    
    // Only process profile updates (not avatar, as avatar has its own endpoint)
    if (Object.keys(updates).length > 0 && !updates.avatar) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/me/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates)
        });
        
        if (res.ok) {
          const data = await res.json();
          const updatedUser = data.user;
          setCurrentUser(updatedUser);
          localStorage.setItem("archyv_user", JSON.stringify(updatedUser));
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        }
      } catch (err) {
        console.error("Failed to update profile", err);
      }
    } else if (updates.avatar) {
      // Local update for avatar which was already processed by the avatar endpoint
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem("archyv_user", JSON.stringify(updatedUser));
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
  };

  const value = {
    currentUser,
    users,
    documents,
    trashDocuments,
    fetchTrashDocuments,
    fetchDocuments,
    fetchDashboardStats,
    dashboardStats,
    paginationData,
    trashPaginationData,
    fetchAuditLogs,auditLogs,
    starredDocs,
    login,
    login2FA,
    logout,
    deleteDocument,
    restoreDocument,
    permanentDeleteDocument,
    toggleStar,
    createFaculty,
    deleteFaculty,
    updateFaculty,
    updateUserProfile,
    globalSearchQuery,
    setGlobalSearchQuery,
    authStatus,
    isDataLoading,
    addDocument
  };

  // Fetch user session on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/me`, {
          credentials: "include",
          cache: "no-store"
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
          setAuthStatus("authenticated");
          initializeData(data.user);
        } else {
          setCurrentUser(null);
          setAuthStatus("unauthenticated");
        }
      } catch (e) {
        console.warn("Failed to fetch current user session (server might be restarting)");
        setCurrentUser(null);
        setAuthStatus("unauthenticated");
      }
    };
    fetchUser();
  }, []);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
