import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center transition-all duration-300 font-bold tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-[var(--color-primary)] text-white hover:bg-[#E5352B] shadow-[var(--shadow-glow)]',
            secondary: 'bg-[var(--color-surface)] text-white hover:bg-[#2C2C2E] border border-[var(--color-text-muted)]',
            outline: 'bg-transparent border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white',
            danger: 'bg-red-600 text-white hover:bg-red-700',
        };

        const sizes = {
            sm: 'h-8 px-4 text-xs var(--radius-sm)',
            md: 'h-12 px-6 text-sm var(--radius-md)',
            lg: 'h-14 px-8 text-base var(--radius-md)',
        };

        const width = fullWidth ? 'w-full' : '';

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
