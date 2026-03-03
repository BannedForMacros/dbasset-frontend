interface BadgeProps {
  label: string;
  type?: 'good' | 'regular' | 'bad' | 'neutral' | 'brand' | 'accent';
}

const styles: Record<string, { bg: string; color: string; border: string }> = {
  good:    { bg: 'rgba(34,196,161,0.1)',  color: '#0f9b76', border: 'rgba(34,196,161,0.3)'  },
  regular: { bg: 'rgba(245,158,11,0.1)',  color: '#b45309', border: 'rgba(245,158,11,0.3)'  },
  bad:     { bg: 'rgba(239,68,68,0.08)',  color: '#dc2626', border: 'rgba(239,68,68,0.25)'  },
  neutral: { bg: '#f1f5f9',               color: '#64748b', border: '#e2e8f0'                },
  brand:   { bg: 'rgba(30,71,134,0.08)',  color: '#1e4786', border: 'rgba(30,71,134,0.2)'   },
  accent:  { bg: 'rgba(34,196,161,0.12)', color: '#0f9b76', border: 'rgba(34,196,161,0.3)'  },
};

export default function Badge({ label, type = 'neutral' }: BadgeProps) {
  const s = styles[type];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  );
}