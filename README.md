# 📚 ARCHYV

**ARCHYV** is a robust, role-based Document Management System (DMS) built specifically for academic environments. It provides separate secure dashboards for Admins and Faculty members to upload, manage, share, and track files across various domains and departments. 

It features an advanced role-based workflow, granular access control, passkey authentication, two-factor authentication, and a dynamic approval system for academic archives.

---

## 🛠️ Tech Stack

ARCHYV is built using a modern, scalable full-stack architecture separated into a decoupled frontend and backend.

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) 16.3.2 (App Router)
- **Library:** [React](https://react.dev/) 19.2.8
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React Context API (`AppContext`)
- **WebAuthn (Passkeys):** `@simplewebauthn/browser`
- **Language:** TypeScript

### Backend
- **Framework:** [Express.js](https://expressjs.com/) (Node.js)
- **Database:** PostgreSQL
- **ORM:** [Prisma](https://www.prisma.io/)
- **File Storage:** [Cloudinary](https://cloudinary.com/) (multer, streamifier)
- **Authentication:** JWT (JSON Web Tokens), `bcryptjs`
- **Two-Factor Authentication:** `otpauth`, `nodemailer` (for Email OTP)
- **WebAuthn (Passkeys):** `@simplewebauthn/server`
- **Security:** `helmet`, `cors`, `express-rate-limit`
- **Task Scheduling:** `node-cron`
- **Language:** TypeScript

---

## ✨ Key Features

1. **Role-Based Workflows (Admin vs Faculty)**
   - **Admins** have full system access, can approve/reject files, manage organization-wide settings, and view all audit logs.
   - **Faculty** can upload files (which enter a `PENDING` state), view their approved documents, and access documents shared with them.

2. **Advanced Access Control**
   - Documents can be assigned strict access constraints: `NONE`, `ALL_FACULTY`, or `SELECT_FACULTY`.
   - Access can be dynamically modified by Admins at any time, instantly pushing visibility changes to the affected faculty dashboards.

3. **High-End Security**
   - **Passkeys (WebAuthn):** Users can register hardware keys, Touch ID, or Windows Hello for passwordless login.
   - **2FA:** Optional OTP-based two-factor authentication.
   - Granular RBAC checks on every backend route.

4. **Dynamic Data Management**
   - Dynamic tracking of Domains, Departments, and Academic Years.
   - Trash system with automatic 90-day expiration retention policies.
   - Detailed Audit Logs tracking every interaction (Views, Downloads, Uploads, Deletions).

5. **Modern UI/UX**
   - Beautiful Grid and List views.
   - Drag & Drop interface for organizing and interacting with files.
   - Real-time dashboard statistics and storage visualization.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Cloudinary Account (for file storage)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Archyv_ssd
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder using the `.env.example` format (you will need your Database URL and Cloudinary keys).
4. Run Prisma migrations:
   ```bash
   npm run prisma:generate
   npx prisma db push
   ```
5. Seed the initial admin user:
   ```bash
   npm run seed:admin
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the `frontend` folder:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000`.*

---

## 🔒 Default Admin Credentials
If you ran the seed script, the default Admin account will be generated. Check your `seed-admin.ts` file or terminal output for the credentials to log in.

---

*Designed & Built for Academic Excellence.*
