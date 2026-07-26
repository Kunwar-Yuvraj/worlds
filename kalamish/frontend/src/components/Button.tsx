import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-vscode-accent focus:ring-offset-2 focus:ring-offset-vscode-bg disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none hover:-translate-y-px active:translate-y-0 active:scale-[.99]';

  const variants = {
    primary: 'border border-[#b9b0ff]/50 bg-gradient-to-br from-[#9688ff] to-[#7365e9] text-white shadow-[0_10px_32px_rgba(111,94,235,.25),inset_0_1px_rgba(255,255,255,.2)] hover:from-[#a89dff] hover:to-[#8071f1] hover:shadow-[0_14px_38px_rgba(111,94,235,.34)]',
    secondary: 'border border-white/[.1] bg-white/[.045] text-vscode-text hover:border-[#aea3ff]/35 hover:bg-vscode-accent/[.08]',
    outline: 'border border-white/[.11] bg-transparent text-[#d9deea] hover:border-[#aea3ff]/35 hover:bg-vscode-accent/[.07] hover:text-white',
    danger: 'border border-[#ff7a90]/35 bg-[#ff7a90]/10 text-[#ff9cad] hover:bg-[#ff7a90]/20',
    ghost: 'border border-transparent bg-transparent text-vscode-muted hover:bg-white/[.045] hover:text-vscode-text',
  };

  const sizes = {
    sm: 'min-h-9 px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Resolving...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
