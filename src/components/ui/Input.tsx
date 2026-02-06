import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            w-full bg-[var(--color-surface)] text-white 
            border-2 border-transparent focus:border-[var(--color-primary)]
            rounded-[var(--radius-md)] h-12 px-4 
            outline-none transition-all duration-300
            font-[var(--font-body)]
            placeholder:text-[#3A3A3C]
            disabled:opacity-50
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && <span className="text-xs text-red-500 font-bold animate-pulse">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
