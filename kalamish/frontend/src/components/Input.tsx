import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-2">
        {label && <label className="text-[11px] font-semibold tracking-[.02em] text-[#c4c9d5]">{label}</label>}
        <input
          ref={ref}
          className={twMerge(
            clsx(
              'min-h-12 rounded-xl border border-white/[.11] bg-[#070a11]/70 px-3.5 py-2.5 text-sm text-vscode-text outline-none transition-all placeholder:text-[#535b6d] hover:border-white/20 focus:border-vscode-accent focus:bg-[#070a11] focus:ring-2 focus:ring-vscode-accent/10',
              error && 'border-red-500 focus:border-red-500',
              className
            )
          )}
          {...props}
        />
        {error && <span className="mt-0.5 text-xs text-[#ff9cad]">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
