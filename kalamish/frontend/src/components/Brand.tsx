import React from 'react';
import { Link } from 'react-router-dom';

interface BrandProps {
  compact?: boolean;
  to?: string;
  subtitle?: string;
}

export const Brand: React.FC<BrandProps> = ({
  compact = false,
  to = '/',
  subtitle,
}) => (
  <Link to={to} className="group inline-flex items-center gap-3 text-vscode-text no-underline">
    <span
      className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#aea3ff]/40 bg-[linear-gradient(145deg,rgba(139,124,255,.22),rgba(110,231,242,.06))] shadow-[inset_0_1px_rgba(255,255,255,.12),0_0_28px_rgba(139,124,255,.14)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#aea3ff]/70"
      aria-hidden="true"
    >
      <span className="absolute h-1 w-4 rotate-45 rounded-full bg-[#a99dff]" />
      <span className="absolute h-4 w-1 rotate-45 rounded-full bg-[#a99dff]" />
      <span className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-[#6ee7f2] shadow-[0_0_8px_#6ee7f2]" />
    </span>
    {!compact && (
      <span>
        <span className="block text-[15px] font-[680] tracking-[-.03em]">reactJK</span>
        {subtitle && (
          <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.18em] text-vscode-muted">
            {subtitle}
          </span>
        )}
      </span>
    )}
  </Link>
);
