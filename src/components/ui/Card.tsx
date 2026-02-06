import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'glass' | 'solid' | 'glow';
    hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'glass', hover = true, ...props }, ref) => {
        const baseStyles = `
            relative rounded-[var(--radius-md)] p-5 sm:p-6 
            transition-all duration-300 ease-out
            overflow-hidden
        `;

        const variants = {
            glass: `
                bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                backdrop-blur-2xl
                border border-white/[0.08]
                shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]
                before:absolute before:inset-0 before:rounded-[var(--radius-md)]
                before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent before:h-[1px]
                ${hover ? 'hover:border-[var(--accent-primary)]/30 hover:shadow-[0_8px_40px_-8px_rgba(0,240,255,0.15)] hover:-translate-y-1' : ''}
            `,
            solid: `
                bg-[var(--bg-card)]
                border border-white/[0.06]
                ${hover ? 'hover:border-white/[0.12]' : ''}
            `,
            glow: `
                bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                backdrop-blur-2xl
                border border-[var(--accent-primary)]/20
                shadow-[0_0_40px_-10px_var(--accent-glow)]
                before:absolute before:inset-0 before:rounded-[var(--radius-md)]
                before:bg-gradient-to-b before:from-[var(--accent-primary)]/10 before:to-transparent before:h-px
                ${hover ? 'hover:shadow-[0_0_60px_-10px_var(--accent-glow)] hover:-translate-y-1' : ''}
            `,
        };

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${className}`}
                {...props}
            />
        );
    }
);

Card.displayName = 'Card';
