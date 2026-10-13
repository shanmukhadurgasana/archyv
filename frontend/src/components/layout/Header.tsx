import { Search, Menu, RotateCw } from "lucide-react";
import Link from "next/link";
import { User } from "@/lib/mock-data";
import { useAppContext } from "@/store/AppContext";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const { globalSearchQuery, setGlobalSearchQuery, refreshData, isRefreshing } = useAppContext();
  const profileHref = user.role.toLowerCase() === "admin" ? "/admin/profile" : "/faculty/profile";

  return (
    <header className="h-20 border-b border-[var(--border)] bg-background flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative max-w-2xl w-full hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search files, folders or records..." 
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 bg-gray-50/50 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 focus:border-[var(--archyv-accent)] transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Refresh button placed at top right at left side of profile link and name */}
        <button
          id="header-refresh-btn"
          onClick={() => refreshData()}
          disabled={isRefreshing}
          title="Refresh page data"
          aria-label="Refresh page data"
          className="p-2.5 rounded-xl border border-[var(--border)] bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-600 hover:text-foreground transition-all duration-200 shadow-sm flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-[var(--archyv-accent)]/50 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          <RotateCw 
            className={`w-4 h-4 text-gray-600 group-hover:text-foreground transition-transform duration-500 ${isRefreshing ? "animate-spin text-[var(--archyv-accent)]" : "group-hover:rotate-90"}`} 
          />
        </button>

        {/* Profile link and name */}
        <Link 
          href={profileHref}
          className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-[var(--foreground)] font-semibold text-sm relative overflow-hidden">
            {user.avatar ? (
              <img 
                src={user.avatar.startsWith('/api') ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.avatar}` : user.avatar} 
                alt={user.name} 
                className="w-full h-full object-cover" 
                crossOrigin="use-credentials"
              />
            ) : (
              user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium flex items-center gap-1 text-foreground">
              {user.name}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
