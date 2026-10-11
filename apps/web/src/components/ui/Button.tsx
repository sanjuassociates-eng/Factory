import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-steel-800 text-white hover:bg-steel-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-steel-700 hover:bg-steel-100',
};

const sizes = {
  sm: 'px-3 py-2 text-sm min-h-9',
  md: 'px-4 py-2.5 text-sm min-h-11',
  lg: 'px-5 py-3 text-base min-h-12',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
