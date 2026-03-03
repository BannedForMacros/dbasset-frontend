import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{
        backgroundColor: '#fff',
        border: accent ? '1.5px solid rgba(34,196,161,0.3)' : '1.5px solid #e2e8f0',
      }}
    >
      <div
        className="p-3 rounded-xl flex-shrink-0"
        style={{ backgroundColor: accent ? 'rgba(34,196,161,0.1)' : 'rgba(30,71,134,0.08)' }}
      >
        <span style={{ color: accent ? '#22c4a1' : '#1e4786', display: 'flex' }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{label}</p>
        <p className="text-2xl font-bold" style={{ color: '#0f172a' }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{sub}</p>}
      </div>
    </div>
  );
}