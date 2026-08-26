import Image from "next/image";
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FCF8F5] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Logo at the top left */}
      <div className="absolute top-6 left-6 md:top-10 md:left-12 flex items-center gap-4 z-20">
        <div className="w-12 h-12 md:w-14 md:h-14 relative">
          <Image src="/logo.png" alt="ARCHYV" fill className="object-contain" />
        </div>
        <span className="font-bold text-2xl md:text-3xl tracking-widest uppercase text-foreground">ARCHYV</span>
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row items-start md:items-center gap-12 md:gap-24 z-10 relative py-8 mt-16 md:mt-0">
        <div className="flex-1 w-full">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-medium leading-tight text-foreground">
              Store.<br />
              Find.<br />
              Control.<br />
              <span className="text-[var(--archyv-accent)]">Preserve.</span>
            </h1>

            <div className="w-12 h-0.5 bg-[var(--archyv-accent)] mt-8 mb-6"></div>

            <p className="text-gray-500 max-w-sm text-lg">
              A secure document management platform for your institution.
            </p>
          </div>

          <div className="text-sm text-gray-400 mt-20">
            &copy; 2026 Archyv. All rights reserved.
          </div>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
