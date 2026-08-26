import { Search, Bell, Menu } from "lucide-react";

import { User } from "@/lib/mock-data";
import { useAppContext } from "@/store/AppContext";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const { globalSearchQuery, setGlobalSearchQuery } = useAppContext();

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

      <div className="flex items-center gap-6">
        <button className="relative text-gray-500 hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-[var(--archyv-accent)]/20 flex items-center justify-center text-[var(--foreground)] font-semibold text-sm relative overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium flex items-center gap-1">
              {user.name} 
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
