import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] tracking-wide uppercase">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            w-full 
            bg-white/5 
            border border-white/10 
            focus:border-[var(--accent-primary)] focus:bg-white/10
            focus:ring-1 focus:ring-[var(--accent-primary)]
            rounded-[var(--radius-sm)] 
            h-11 px-4 
            text-[var(--text-primary)]
            outline-none transition-all duration-200
            placeholder:text-white/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500/50 focus:border-red-500' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
