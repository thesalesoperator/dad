import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center transition-all duration-200 font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

        const variants = {
            primary: `
        bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]
        text-white 
        shadow-[0_0_20px_-5px_var(--accent-glow)]
        hover:shadow-[0_0_25px_-5px_var(--accent-glow)]
        hover:brightness-110
        border border-transparent
      `,
            secondary: `
        bg-white/5 
        hover:bg-white/10 
        text-white 
        border border-white/10
        backdrop-blur-sm
      `,
            ghost: 'bg-transparent hover:bg-white/5 text-[var(--accent-primary)]',
            danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
            md: 'h-10 px-5 text-sm rounded-[var(--radius-sm)]',
            lg: 'h-12 px-8 text-base rounded-[var(--radius-md)]',
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
