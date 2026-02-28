import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  nested?: boolean;
}

export const GlassCard = ({ children, className, hover = false, nested = false }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        nested ? 'glass-nested' : 'glass-card',
        hover && 'glass-hover cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
