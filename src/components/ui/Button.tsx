'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { hapticImpact } from '@/lib/native/haptics';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'neon';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
        const baseStyles = `
            relative inline-flex items-center justify-center 
            font-semibold tracking-wide
            transition-all duration-300 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed 
            active:scale-[0.97]
            overflow-hidden
        `;

        const variants = {
            primary: `
                bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]
                text-[var(--bg-darker)]
                shadow-[0_0_30px_-5px_var(--accent-glow)]
                hover:shadow-[0_0_50px_-5px_var(--accent-glow),0_0_80px_-10px_var(--accent-glow-secondary)]
                hover:-translate-y-0.5 hover:brightness-110
                border-0
            `,
            secondary: `
                bg-white/[0.05]
                hover:bg-white/[0.1]
                text-white
                border border-white/[0.1]
                backdrop-blur-xl
                hover:border-white/[0.2]
            `,
            ghost: `
                bg-transparent 
                hover:bg-[var(--accent-primary)]/10 
                text-[var(--accent-primary)]
                hover:shadow-[0_0_20px_-5px_var(--accent-glow)]
            `,
            danger: `
                bg-red-500/10 
                text-red-400 
                border border-red-500/20 
                hover:bg-red-500/20
                hover:border-red-500/40
            `,
            neon: `
                bg-transparent
                text-[var(--accent-primary)]
                border-2 border-[var(--accent-primary)]
                shadow-[0_0_20px_-5px_var(--accent-glow),inset_0_0_20px_-10px_var(--accent-glow)]
                hover:bg-[var(--accent-primary)]/10
                hover:shadow-[0_0_40px_-5px_var(--accent-glow),inset_0_0_40px_-10px_var(--accent-glow)]
                hover:-translate-y-0.5
            `,
        };

        const sizes = {
            sm: 'h-9 px-4 text-xs rounded-xl',
            md: 'h-11 px-6 text-sm rounded-xl',
            lg: 'h-14 px-10 text-base rounded-2xl',
        };

        const width = fullWidth ? 'w-full' : '';

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
                {...props}
                onClick={(e) => {
                    hapticImpact(size === 'lg' ? 'medium' : 'light');
                    props.onClick?.(e);
                }}
            >
                {/* Shimmer effect on primary button */}
                {variant === 'primary' && (
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                )}
                <span className="relative z-10">{children}</span>
            </button>
        );
    }
);

Button.displayName = 'Button';
