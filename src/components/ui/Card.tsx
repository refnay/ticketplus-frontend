import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  header,
  footer,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden transition-all',
          className
        )
      )}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          {header}
        </div>
      )}
      <div className={clsx(!noPadding && 'p-5')}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          {footer}
        </div>
      )}
    </div>
  );
};
