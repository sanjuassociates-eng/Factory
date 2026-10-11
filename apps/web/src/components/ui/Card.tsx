import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-steel-200 bg-white p-4 shadow-sm md:p-6', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold text-steel-900 md:text-xl">{children}</h2>;
}
