"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export function ConnectionTest() {
  const [status, setStatus] = useState<string>("Testing backend...");

  useEffect(() => {
    apiClient.get("/health")
      .then((data) => setStatus(`Backend: ${data.status} | DB: ${data.database}`))
      .catch((err) => setStatus(`Error: ${err.message}`));
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-2 right-2 text-[10px] bg-black/80 text-white px-2 py-1 rounded-md z-50 pointer-events-none font-mono">
      {status}
    </div>
  );
}
