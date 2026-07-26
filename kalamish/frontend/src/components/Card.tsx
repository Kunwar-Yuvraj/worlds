import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx('glass-card rounded-[20px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#aea3ff]/25', className)
      )}
      {...props}
    >
      {children}
    </div>
  );
};
