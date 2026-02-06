import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glow';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        const baseStyles = 'bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-6 transition-all duration-300 text-white';

        const variants = {
            default: 'border border-[#2C2C2E]',
            glow: 'border border-[var(--color-primary)] shadow-[var(--shadow-glow)]',
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
