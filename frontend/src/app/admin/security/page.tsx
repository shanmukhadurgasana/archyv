"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Shield, Smartphone, Laptop, Loader2, AlertCircle } from "lucide-react";
import { useAppContext } from "@/store/AppContext";
import Image from "next/image";

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastActivity: string;
  isCurrent: boolean;
}

export default function AdminSecurity() {
  const { currentUser, updateUserProfile } = useAppContext();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  
  // 2FA state
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/sessions`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleGenerate2FA = async () => {
    setError("");
    setIsProcessing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/2fa/generate`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCodeUrl);
        setIsSettingUp(true);
      } else {
        setError("Failed to generate 2FA setup");
      }
    } catch (e) {
      setError("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify2FA = async () => {
    setError("");
    setIsProcessing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setSuccess("2FA enabled successfully");
        setIsSettingUp(false);
        updateUserProfile({ isTwoFactorEnabled: true });
        setToken("");
      } else {
        const data = await res.json();
        setError(data.message || "Invalid 2FA code");
      }
    } catch (e) {
      setError("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable 2FA? This will reduce your account security.")) return;
    setError("");
    setIsProcessing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/2fa/disable`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setSuccess("2FA disabled successfully");
        updateUserProfile({ isTwoFactorEnabled: false });
      } else {
        setError("Failed to disable 2FA");
      }
    } catch (e) {
      setError("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/sessions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeAllOther = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/sessions`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  return (
    <div className="max-w-4xl">
      <PageHeader 
        title="Security" 
        subtitle="Manage security settings and active sessions for your admin account."
      />

      <div className="space-y-6">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--archyv-accent)]/10 flex items-center justify-center text-[var(--archyv-accent)]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
              </div>
            </div>
            {currentUser?.isTwoFactorEnabled ? (
              <div className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Enabled
              </div>
            ) : (
              <div className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-gray-200">
                Disabled
              </div>
            )}
          </div>

          <div className="pl-16">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium flex items-center gap-2 border border-green-100">
                <Shield className="w-4 h-4" />
                {success}
              </div>
            )}

            {currentUser?.isTwoFactorEnabled ? (
              <>
                <p className="text-sm text-gray-600 mb-4 max-w-xl">
                  Two-factor authentication is currently enabled. You will be prompted for an authentication code when signing in from unrecognized devices.
                </p>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleDisable2FA}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-white border border-gray-200 text-foreground font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                  >
                    Disable 2FA
                  </button>
                </div>
              </>
            ) : isSettingUp ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 max-w-xl">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the code below to verify.
                </p>
                {qrCode && <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border rounded-lg" />}
                <div className="flex items-center gap-2 max-w-xs">
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit code" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50"
                  />
                  <button 
                    onClick={handleVerify2FA}
                    disabled={isProcessing || token.length < 6}
                    className="px-4 py-2 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button 
                    onClick={() => { setIsSettingUp(false); setQrCode(""); }}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4 max-w-xl">
                  Two-factor authentication is currently disabled. Enable it to secure your account with TOTP (Time-Based One-Time Password).
                </p>
                <button 
                  onClick={handleGenerate2FA}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground font-semibold rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                  Setup 2FA
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Active Sessions</h2>
              <p className="text-sm text-gray-500">Manage your active sessions across all devices.</p>
            </div>
          </div>

          <div className="pl-16 space-y-4">
            {loadingSessions ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-sm text-gray-500">No active sessions found.</div>
            ) : (
              sessions.map(session => (
                <div key={session.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl ${session.isCurrent ? 'border-gray-200 bg-gray-50/50' : 'border-gray-100'}`}>
                  <div className="flex items-start gap-3">
                    {session.deviceInfo.toLowerCase().includes("mobile") ? (
                      <Smartphone className="w-5 h-5 text-gray-400 mt-0.5" />
                    ) : (
                      <Laptop className="w-5 h-5 text-gray-400 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {session.deviceInfo}
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full uppercase tracking-wider font-bold">This Device</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Last active: {formatDate(session.lastActivity)}</div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button 
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              ))
            )}
            
            {sessions.length > 1 && (
              <button 
                onClick={handleRevokeAllOther}
                className="mt-2 px-4 py-2 bg-white border border-gray-200 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                Sign out of all other devices
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
