import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'gray' | 'green' | 'yellow' | 'purple';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'blue' }) => {
  const styles = {
    blue: 'bg-[#6ee7f2]/[.06] text-[#8eeaf2] border-[#6ee7f2]/20',
    gray: 'bg-white/[.035] text-[#8f97a9] border-white/[.09]',
    green: 'bg-[#6ee7f2]/[.06] text-[#8eeaf2] border-[#6ee7f2]/20',
    yellow: 'bg-[#dcbf77]/[.07] text-[#dfc88f] border-[#dcbf77]/20',
    purple: 'bg-[#8b7cff]/[.08] text-[#b4aaff] border-[#8b7cff]/25',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] ${styles[variant]}`}>
      {children}
    </span>
  );
};
