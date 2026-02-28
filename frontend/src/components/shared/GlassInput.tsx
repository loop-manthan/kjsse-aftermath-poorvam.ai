import { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
}

export const GlassInput = ({ icon, error, className, ...props }: GlassInputProps) => {
  return (
    <div className="space-y-1">
      <div className={cn('glass-input rounded-xl flex items-center gap-3 px-4', error && 'border-red-500/50')}>
        {icon && <div className="text-white/40">{icon}</div>}
        <input
          className={cn(
            'flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-red-400 text-xs px-2">{error}</p>}
    </div>
  );
};

export default GlassInput;
