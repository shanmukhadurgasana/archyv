import { useState, useEffect } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Fingerprint, Plus, Trash2, Check, AlertCircle, Laptop } from "lucide-react";

export default function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/passkey`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data.passkeys || []);
      }
    } catch (e) {
      console.error("Failed to fetch passkeys", e);
    } finally {
      setLoading(false);
    }
  };

  const registerPasskey = async () => {
    setError("");
    setSuccess("");
    try {
      // 1. Get options from server
      const optionsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/passkey/generate-registration-options`, {
        credentials: "include"
      });
      if (!optionsRes.ok) throw new Error("Failed to get registration options");
      const options = await optionsRes.json();

      // 2. Pass options to browser authenticator
      let regResp;
      try {
        regResp = await startRegistration(options);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          return setError("Registration cancelled.");
        }
        throw err;
      }

      // 3. Send response to server for verification
      const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/passkey/verify-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(regResp)
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.message || "Failed to verify registration");
      }

      setSuccess("Passkey registered successfully!");
      fetchPasskeys();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An error occurred during passkey registration.");
    }
  };

  const deletePasskey = async (id: string) => {
    if (!confirm("Are you sure you want to remove this passkey?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/passkey/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setSuccess("Passkey removed.");
        setPasskeys(prev => prev.filter(p => p.id !== id));
      } else {
        throw new Error("Failed to delete passkey");
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-8 mt-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--archyv-accent)]/10 flex items-center justify-center text-[var(--archyv-accent)]">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Passkeys</h2>
            <p className="text-sm text-gray-500">Sign in securely with your fingerprint, face, or device PIN.</p>
          </div>
        </div>
        <button
          onClick={registerPasskey}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--archyv-accent)] hover:bg-[var(--archyv-accent-hover)] text-foreground font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Passkey
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-medium flex items-center gap-2 border border-green-100">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading passkeys...</div>
      ) : passkeys.length === 0 ? (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
          No passkeys registered yet. Click "Add Passkey" to register your device.
        </div>
      ) : (
        <div className="space-y-3">
          {passkeys.map(pk => (
            <div key={pk.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">
                    {pk.deviceType === "singleDevice" ? "This Device" : pk.deviceType === "multiDevice" ? "Synced Passkey" : "Unknown Device"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Added {new Date(pk.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deletePasskey(pk.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove passkey"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
