export type Role = "faculty" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  department?: string;
  dateOfJoin?: string;
  phone?: string;
  status?: string;
  lastLogin?: string;
  password?: string;
  adminId?: string;
}

export interface DomainStats {
  id: string;
  name: string;
  count: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  time?: string;
  domain: string;
  department?: string;
  uploadedBy?: string;
  isStarred: boolean;
  isDeleted?: boolean;
  deletedDate?: string;
  daysLeft?: number;
  accessList?: string[];
  year?: string;
  filename?: string;
}

export const mockFacultyUser: User = {
  id: "fac-001",
  name: "Dr. Priya",
  email: "priya.faculty@college.edu",
  role: "faculty",
  department: "Computer Science and Engineering",
  dateOfJoin: "August 16, 2023",
  phone: "+91 98765 43210",
  status: "Active",
  lastLogin: "May 24, 2026, 10:30 AM",
  password: "Password123!"
};

export const mockAdminUser: User = {
  id: "adm-001",
  name: "Admin",
  email: "admin@archyv.edu",
  role: "admin",
  dateOfJoin: "August 16, 2023",
  phone: "+91 98765 43210",
  status: "Active",
  lastLogin: "May 24, 2026, 10:30 AM",
  password: "Password123!",
  adminId: "ADM-001"
};

export const mockDomainStats: DomainStats[] = [
  { id: "d1", name: "Admissions", count: 24 },
  { id: "d2", name: "Administrative", count: 31 },
  { id: "d3", name: "Examination", count: 46 },
  { id: "d4", name: "Placements", count: 18 },
  { id: "d5", name: "Events", count: 27 },
];

export const mockDocuments: Document[] = [
  {
    id: "doc-001",
    name: "Admission Notification",
    type: "PDF",
    size: "1.2 MB",
    date: "May 24, 2026",
    domain: "Admissions",
    isStarred: false,
    uploadedBy: "Priya Faculty",
    department: "CSIT"
  },
  {
    id: "doc-002",
    name: "Admission Guidelines",
    type: "PDF",
    size: "2.4 MB",
    date: "May 22, 2026",
    domain: "Admissions",
    isStarred: true,
    uploadedBy: "Karthik Faculty",
    department: "Admissions"
  },
  {
    id: "doc-003",
    name: "Cutoff Ranks 2026",
    type: "PDF",
    size: "1.8 MB",
    date: "May 20, 2026",
    domain: "Admissions",
    isStarred: false,
    uploadedBy: "Admin",
    department: "Admissions"
  },
  {
    id: "doc-004",
    name: "Mid Semester Timetable.pdf",
    type: "PDF",
    size: "1.2 MB",
    date: "May 24, 2026",
    time: "10:42 AM",
    domain: "Examination",
    isStarred: true,
    uploadedBy: "Priya Faculty",
    department: "CSIT"
  },
  {
    id: "doc-005",
    name: "Placement Drive Report.docx",
    type: "DOCX",
    size: "2.4 MB",
    date: "May 24, 2026",
    time: "09:31 AM",
    domain: "Placements",
    isStarred: false,
    uploadedBy: "Ravi Faculty",
    department: "CSD"
  },
  {
    id: "doc-006",
    name: "Event Budget Proposal.xlsx",
    type: "XLSX",
    size: "1.1 MB",
    date: "May 24, 2026",
    time: "09:10 AM",
    domain: "Events",
    isStarred: false,
    uploadedBy: "Sneha Faculty",
    department: "CSIT"
  },
  {
    id: "doc-007",
    name: "Syllabus CSE 2026.pdf",
    type: "PDF",
    size: "890 KB",
    date: "May 23, 2026",
    time: "05:15 PM",
    domain: "Academics",
    isStarred: false,
    uploadedBy: "Anita Faculty",
    department: "CSE"
  }
];

export const mockFolders = [
  { name: "ANATOMY", files: 12 },
  { name: "BIOCHEMISTRY", files: 18 },
  { name: "ENGLISH", files: 10 },
  { name: "HISTOLOGY", files: 14 },
  { name: "LATIN", files: 8 },
  { name: "medical bio", files: 6 },
  { name: "physiology", files: 9 },
  { name: "RUSSIAN", files: 7 },
];

export const mockTrashFiles: Document[] = [
  {
    id: "t-001",
    name: "Placement Drive Report.docx",
    type: "DOCX",
    size: "2.4 MB",
    date: "May 24, 2026",
    time: "10:45 AM",
    domain: "Placements",
    department: "CSD",
    uploadedBy: "Ravi Faculty",
    isStarred: false,
    isDeleted: true,
    deletedDate: "May 24, 2026",
    daysLeft: 89,
  },
  {
    id: "t-002",
    name: "Old Notice.pdf",
    type: "PDF",
    size: "1.1 MB",
    date: "May 22, 2026",
    time: "04:15 PM",
    domain: "Administrative",
    department: "Notices",
    uploadedBy: "Admin",
    isStarred: false,
    isDeleted: true,
    deletedDate: "May 22, 2026",
    daysLeft: 87,
  }
];

export const mockAuditLogs = [
  { id: 1, time: "May 27, 2026 11:42 AM", user: "Priya Faculty", action: "Uploaded file", target: "Placement Drive Report.docx", domain: "Files" },
  { id: 2, time: "May 27, 2026 11:35 AM", user: "Admin", action: "Approved file", target: "Placement Drive Report.docx", domain: "Approval Queue" },
  { id: 3, time: "May 27, 2026 11:18 AM", user: "Ravi Faculty", action: "Uploaded file", target: "Event Budget Proposal.xlsx", domain: "Files" },
  { id: 4, time: "May 27, 2026 10:58 AM", user: "Admin", action: "Rejected file", target: "Syllabus CSE 2026.pdf", domain: "Approval Queue" },
  { id: 5, time: "May 27, 2026 10:42 AM", user: "Anita Faculty", action: "Uploaded file", target: "Syllabus CSE 2026.pdf", domain: "Files" },
];
