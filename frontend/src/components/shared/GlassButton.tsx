import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  fullWidth?: boolean;
}

export const GlassButton = ({ 
  children, 
  className, 
  variant = 'default',
  fullWidth = false,
  ...props 
}: GlassButtonProps) => {
  const variantStyles = {
    default: 'hover:bg-white/20',
    primary: 'bg-blue-500/20 hover:bg-blue-500/30',
    success: 'bg-green-500/20 hover:bg-green-500/30',
    danger: 'bg-red-500/20 hover:bg-red-500/30',
  };

  return (
    <button
      className={cn(
        'glass-button rounded-xl py-3 px-6 text-white transition-all disabled:opacity-50 font-medium',
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlassButton;
