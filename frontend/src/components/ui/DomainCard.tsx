import Image from "next/image";

interface DomainCardProps {
  name: string;
  count: number;
  isFaculty?: boolean;
}

export default function DomainCard({ name, count, isFaculty }: DomainCardProps) {
  const showFacultyBadge = Boolean(isFaculty);
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all cursor-pointer group h-full">
      <div className="w-12 h-12 shrink-0 rounded-xl border border-[var(--border)] flex items-center justify-center bg-gray-50 group-hover:bg-[var(--archyv-accent)]/10 transition-colors p-2.5 relative">
        <Image src="/logo.png" alt="Domain" fill sizes="48px" className="object-contain p-2 opacity-80 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground mb-0.5 leading-snug flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
          <span className="break-words">{name}</span>
          {showFacultyBadge && (
            <span className="inline-flex items-center text-xs text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded-full shrink-0" title="Faculty Domain">
              👥
            </span>
          )}
        </div>
        <div className="text-xl font-bold text-foreground">
          {count.toLocaleString()}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
          Documents
        </div>
      </div>
    </div>
  );
}
