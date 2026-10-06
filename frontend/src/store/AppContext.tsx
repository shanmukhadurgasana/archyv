"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  Document
} from "@/lib/mock-data";
import { deleteFile } from "@/lib/storage";

export interface Subdomain {
  id: string;
  name: string;
  domainId: string;
}

export interface Domain {
  id: string;
  name: string;
  subdomains?: Subdomain[];
}

export interface AcademicYear {
  id: string;
  year: string;
}

export interface Department {
  id: string;
  name: string;
}

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
  pendingDocuments: Document[];
  trashDocuments: Document[];
  auditLogs: AuditLog[];
  domains: Domain[];
  academicYears: AcademicYear[];
  departments: Department[];
  starredDocs: Record<string, string[]>; // mapping of userId to array of docIds
  globalSearchQuery: string;
}

interface AppContextType extends Omit<AppState, "currentUser"> {
  currentUser: User | null;
  login: (email: string, password?: string) => Promise<boolean | { require2FA: boolean, tempToken: string }>;
  login2FA: (tempToken: string, token: string) => Promise<boolean>;
  loginPasskey: () => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => Promise<void>;

  deleteDocument: (id: string) => Promise<void>;
  restoreDocument: (id: string) => Promise<void>;
  permanentDeleteDocument: (id: string) => Promise<void>;
  approveDocument: (id: string) => Promise<void>;
  declineDocument: (id: string) => Promise<void>;
  updateDocumentAccess: (id: string, accessType: string, selectedFacultyIds: string[]) => Promise<{ success: boolean, error?: string }>;
  toggleStar: (docId: string) => void;
  createFaculty: (user: any) => Promise<{ success: boolean; error?: string }>;
  deleteFaculty: (id: string) => Promise<void>;
  updateFaculty: (id: string, updates: any) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => void;
  setGlobalSearchQuery: (query: string) => void;
  fetchTrashDocuments: (params?: any) => Promise<void>;
  fetchDocuments: (params?: any) => Promise<void>;
  fetchPendingDocuments: (params?: any) => Promise<void>;
  addDocument: (doc: Document) => void;
  isDataLoading: boolean;
  fetchDashboardStats: () => Promise<void>;
  dashboardStats: any;
  paginationData: any;
  trashPaginationData: any;
  fetchAuditLogs: (page?: number, limit?: number) => Promise<void>;
  fetchDomains: () => Promise<void>;
  fetchAcademicYears: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
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
  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const [trashDocuments, setTrashDocuments] = useState<Document[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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

  const fetchPendingDocuments = async (params?: any) => {
    try {
      const queryParams = { ...params, status: currentUser?.role === 'faculty' ? 'PENDING,REJECTED' : 'PENDING' };
      const queryString = buildQueryString(queryParams);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents${queryString ? `?${queryString}` : ''}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPendingDocuments(data.documents);
      }
    } catch (e) {
      console.error("Failed to fetch pending documents");
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/domains`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains);
      }
    } catch (e) {
      console.error("Failed to fetch domains");
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/academic-years`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(data.academicYears);
      }
    } catch (e) {
      console.error("Failed to fetch academic years");
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/departments`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
      }
    } catch (e) {
      console.error("Failed to fetch departments");
    }
  };

  const initializeData = async (user: User) => {
    setIsDataLoading(true);
    const isAdmin = user.role.toLowerCase() === 'admin';
    
    // Load critical data to stop loading state
    await Promise.allSettled([
      fetchDocuments(),
      fetchTrashDocuments(),
      fetchPendingDocuments(),
      fetchDomains(),
      fetchAcademicYears(),
      fetchDepartments(),
    ]);
    setIsDataLoading(false);

    // Load secondary data concurrently without blocking
    fetchDashboardStats();
    if (isAdmin) {
      fetchUsers();
      fetchAuditLogs();
    }
  };

  const addDocument = (doc: Document) => {
    if (doc.status === 'PENDING' || doc.status === 'REJECTED') {
      setPendingDocuments(prev => [doc, ...prev]);
    } else {
      setDocuments(prev => [doc, ...prev]);
    }
    
    // Update dashboard stats optimistically
    if (dashboardStats) {
      setDashboardStats((prev: any) => ({
        ...prev,
        pendingDocuments: doc.status === 'PENDING' ? prev.pendingDocuments + 1 : prev.pendingDocuments,
        totalDocuments: doc.status === 'APPROVED' ? prev.totalDocuments + 1 : prev.totalDocuments,
      }));
    }
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/2fa/login`, {
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

  const loginPasskey = async () => {
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");

      // 1. Get options from server
      const optionsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/passkey/generate-authentication-options`);
      if (!optionsRes.ok) throw new Error("Failed to get authentication options");
      const options = await optionsRes.json();

      // 2. Authenticate with browser
      let authResp;
      try {
        authResp = await startAuthentication(options);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          return { success: false, error: "Passkey authentication cancelled." };
        }
        throw err;
      }

      // 3. Send response to server for verification
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/passkey/verify-authentication`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...authResp, challenge: options.challenge })
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.message || "Failed to verify passkey");
      }

      const data = await verifyRes.json();
      setCurrentUser(data.user);
      setAuthStatus("authenticated");
      initializeData(data.user);
      
      return { success: true, role: data.user.role };
    } catch (e: any) {
      console.error("Passkey login failed:", e);
      return { success: false, error: e.message || "Passkey login failed" };
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
    const docToDelete = documents.find(d => d.id === id) || pendingDocuments.find(d => d.id === id);
    if (!docToDelete) return;
    
    // Optimistic Update
    setDocuments(prev => prev.filter(d => d.id !== id));
    setPendingDocuments(prev => prev.filter(d => d.id !== id));
    
    const trashedDoc = {
      ...docToDelete,
      isDeleted: true,
      deletedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      daysLeft: 90
    };
    setTrashDocuments(prev => [trashedDoc, ...prev]);
    
    if (dashboardStats) {
        setDashboardStats((prev: any) => ({
            ...prev,
            trashDocuments: prev.trashDocuments + 1,
            totalDocuments: docToDelete.status === 'APPROVED' ? Math.max(0, prev.totalDocuments - 1) : prev.totalDocuments,
            pendingDocuments: docToDelete.status === 'PENDING' ? Math.max(0, prev.pendingDocuments - 1) : prev.pendingDocuments,
        }));
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error("Failed to delete document");
      }
    } catch (e) {
      console.warn("Failed to delete document:", e instanceof Error ? e.message : e);
      // Revert Optimistic Update
      if (docToDelete.status === 'PENDING' || docToDelete.status === 'REJECTED') {
        setPendingDocuments(prev => [docToDelete, ...prev]);
      } else {
        setDocuments(prev => [docToDelete, ...prev]);
      }
      setTrashDocuments(prev => prev.filter(d => d.id !== id));
      if (dashboardStats) {
          setDashboardStats((prev: any) => ({
              ...prev,
              trashDocuments: Math.max(0, prev.trashDocuments - 1),
              totalDocuments: docToDelete.status === 'APPROVED' ? prev.totalDocuments + 1 : prev.totalDocuments,
              pendingDocuments: docToDelete.status === 'PENDING' ? prev.pendingDocuments + 1 : prev.pendingDocuments,
          }));
      }
      alert("Error deleting document. Reverted changes.");
    }
  };

  const restoreDocument = async (id: string) => {
    if (currentUser?.role.toLowerCase() !== "admin") return;
    
    const docToRestore = trashDocuments.find(d => d.id === id);
    if (!docToRestore) return;

    // Optimistic Update
    setTrashDocuments(prev => prev.filter(d => d.id !== id));
    
    const restoredDoc = { ...docToRestore, isDeleted: false };
    delete restoredDoc.deletedDate;
    delete restoredDoc.daysLeft;
    
    if (restoredDoc.status === 'PENDING' || restoredDoc.status === 'REJECTED') {
      setPendingDocuments(prev => [restoredDoc, ...prev]);
    } else {
      setDocuments(prev => [restoredDoc, ...prev]);
    }
    
    if (dashboardStats) {
        setDashboardStats((prev: any) => ({
            ...prev,
            trashDocuments: Math.max(0, prev.trashDocuments - 1),
            totalDocuments: restoredDoc.status === 'APPROVED' ? prev.totalDocuments + 1 : prev.totalDocuments,
            pendingDocuments: restoredDoc.status === 'PENDING' ? prev.pendingDocuments + 1 : prev.pendingDocuments,
        }));
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${id}/restore`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error("Failed to restore document");
      }
    } catch (e) {
      console.warn("Failed to restore document:", e instanceof Error ? e.message : e);
      // Revert Optimistic Update
      setTrashDocuments(prev => [docToRestore, ...prev]);
      if (restoredDoc.status === 'PENDING' || restoredDoc.status === 'REJECTED') {
        setPendingDocuments(prev => prev.filter(d => d.id !== id));
      } else {
        setDocuments(prev => prev.filter(d => d.id !== id));
      }
      if (dashboardStats) {
          setDashboardStats((prev: any) => ({
              ...prev,
              trashDocuments: prev.trashDocuments + 1,
              totalDocuments: restoredDoc.status === 'APPROVED' ? Math.max(0, prev.totalDocuments - 1) : prev.totalDocuments,
              pendingDocuments: restoredDoc.status === 'PENDING' ? Math.max(0, prev.pendingDocuments - 1) : prev.pendingDocuments,
          }));
      }
      alert("Error restoring document. Reverted changes.");
    }
  };

  const permanentDeleteDocument = async (id: string) => {
    if (currentUser?.role.toLowerCase() !== "admin") return;
    
    const docToPermanentlyDelete = trashDocuments.find(d => d.id === id);
    if (!docToPermanentlyDelete) return;

    // Optimistic Update
    setTrashDocuments(prev => prev.filter(d => d.id !== id));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${id}/permanent`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error("Failed to permanently delete document");
      }
    } catch (e) {
      console.warn("Failed to permanently delete document:", e instanceof Error ? e.message : e);
      // Revert Optimistic Update
      setTrashDocuments(prev => [docToPermanentlyDelete, ...prev]);
      alert("Error permanently deleting document. Reverted changes.");
    }
  };

  const approveDocument = async (id: string) => {
    if (currentUser?.role.toLowerCase() !== "admin") return;
    const docToApprove = pendingDocuments.find(d => d.id === id);
    if (!docToApprove) return;

    setPendingDocuments(prev => prev.filter(d => d.id !== id));
    setDocuments(prev => [{ ...docToApprove, status: 'APPROVED' }, ...prev]);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${id}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Failed to approve");
    } catch (e) {
      setPendingDocuments(prev => [docToApprove, ...prev]);
      setDocuments(prev => prev.filter(d => d.id !== id));
      alert("Error approving document");
    }
  };

  const declineDocument = async (id: string) => {
    if (currentUser?.role.toLowerCase() !== "admin") return;
    const docToDecline = pendingDocuments.find(d => d.id === id);
    if (!docToDecline) return;

    setPendingDocuments(prev => prev.filter(d => d.id !== id));
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${id}/reject`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Failed to decline");
    } catch (e) {
      setPendingDocuments(prev => [docToDecline, ...prev]);
      alert("Error declining document");
    }
  };

  const updateDocumentAccess = async (id: string, accessType: string, selectedFacultyIds: string[]) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/${id}/access`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accessType, selectedFacultyIds })
      });
      const data = await response.json();
      if (response.ok) {
        if (data.document) {
          setDocuments(prev => prev.map(d => d.id === id ? data.document : d));
        }
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (e) {
      return { success: false, error: "Network error" };
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
      console.warn("Failed to toggle star:", e instanceof Error ? e.message : e);
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
    pendingDocuments,
    trashDocuments,
    fetchTrashDocuments,
    fetchDocuments,
    fetchPendingDocuments,
    fetchDashboardStats,
    dashboardStats,
    paginationData,
    trashPaginationData,
    fetchAuditLogs,auditLogs,
    domains,
    fetchDomains,
    academicYears,
    fetchAcademicYears,
    departments,
    fetchDepartments,
    starredDocs,
    login,
    login2FA,
    loginPasskey,
    logout,
    deleteDocument,
    restoreDocument,
    permanentDeleteDocument,
    approveDocument,
    declineDocument,
    updateDocumentAccess,
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
