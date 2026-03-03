'use client';

import { ReactNode } from 'react';

type IconButtonVariant = 'view' | 'edit' | 'delete' | 'default';

interface IconButtonProps {
  onClick?: () => void;
  icon: ReactNode;
  variant?: IconButtonVariant;
  title?: string;
  disabled?: boolean;
}

const variants: Record<IconButtonVariant, { base: string; hover: string; iconColor: string; hoverIcon: string }> = {
  view:    { base: 'rgba(30,71,134,0.06)',  hover: '#1e4786',           iconColor: '#1e4786',  hoverIcon: '#fff' },
  edit:    { base: 'rgba(34,196,161,0.08)', hover: '#22c4a1',           iconColor: '#22c4a1',  hoverIcon: '#fff' },
  delete:  { base: 'rgba(239,68,68,0.06)',  hover: '#ef4444',           iconColor: '#ef4444',  hoverIcon: '#fff' },
  default: { base: 'rgba(100,116,139,0.06)', hover: '#64748b',          iconColor: '#64748b',  hoverIcon: '#fff' },
};

export default function IconButton({ onClick, icon, variant = 'default', title, disabled }: IconButtonProps) {
  const v = variants[variant];

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="p-2 rounded-lg transition-all duration-150 flex items-center justify-center"
      style={{ backgroundColor: v.base, color: v.iconColor }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = v.hover;
        e.currentTarget.style.color = v.hoverIcon;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = v.base;
        e.currentTarget.style.color = v.iconColor;
      }}
    >
      {icon}
    </button>
  );
}