import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  children: ReactNode;
  count?: number;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const NotificationBadge = ({ 
  children, 
  count, 
  variant = 'info',
  className 
}: NotificationBadgeProps) => {
  const variantStyles = {
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="relative inline-flex">
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'absolute -top-2 -right-2 flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold border backdrop-blur-sm',
            variantStyles[variant],
            className
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;
