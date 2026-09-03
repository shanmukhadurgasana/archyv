import Image from "next/image";

interface DomainCardProps {
  name: string;
  count: number;
}

export default function DomainCard({ name, count }: DomainCardProps) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-all cursor-pointer group">
      <div className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center bg-gray-50 group-hover:bg-[var(--archyv-accent)]/10 transition-colors p-2.5 relative">
        <Image src="/logo.png" alt="Domain" fill className="object-contain p-2 opacity-80 group-hover:opacity-100 transition-opacity" />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground mb-0.5">{name}</div>
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
