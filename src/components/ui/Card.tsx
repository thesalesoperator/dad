import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'glass' | 'solid';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'glass', ...props }, ref) => {
        const baseStyles = 'rounded-[var(--radius-md)] p-6 transition-all duration-300';

        // Modern Glass Effect:
        // - High transparency background
        // - Thin, bright top border for light reflection
        // - Backdrop blur
        const variants = {
            glass: `
        backdrop-blur-xl 
        bg-white/5 
        border border-white/10 
        shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)]
      `,
            solid: 'bg-[#1e293b] border border-white/5',
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
