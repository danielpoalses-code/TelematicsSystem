import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    collapsed?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className, collapsed, size = 'md' }) => {
    const userRole = localStorage.getItem('powerstar_user_role') || 'khulu_admin';
    const isPowerstarClient = userRole === 'fleet_client' || userRole === 'dealer_manager' || userRole === 'oem_manager';

    const iconSizes = {
        sm: { w: 24, h: 24 },
        md: { w: 32, h: 32 },
        lg: { w: 48, h: 48 }
    };

    const textSizes = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-4xl'
    };

    if (isPowerstarClient) {
        return (
            <div className={cn("flex items-center gap-1.5", className)}>
                <div className="relative flex-shrink-0">
                    <svg
                        width={iconSizes[size].w}
                        height={iconSizes[size].h}
                        viewBox="0 0 40 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M20 35C20 35 32 24 32 16C32 9.37258 26.6274 4 20 4C13.3726 4 8 9.37258 8 16C8 24 20 35 20 35Z" fill="#DC3545" />
                        <path d="M14 18V13H21L24 16V20H23M14 20H22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="16" cy="20" r="1.5" fill="white" />
                        <circle cx="21" cy="20" r="1.5" fill="white" />
                        <ellipse cx="20" cy="36" rx="6" ry="1.5" stroke="#94A3B8" strokeWidth="1" />
                    </svg>
                </div>
                {!collapsed && (
                    <div className={cn("font-bold tracking-tighter leading-none whitespace-nowrap", textSizes[size])}>
                        <span className="text-slate-900">Power</span>
                        <span className="text-accent">Tech</span>
                    </div>
                )}
            </div>
        );
    }

    const imgHeights = { sm: 'h-12', md: 'h-20', lg: 'h-28' };

    return (
        <div className={cn("flex items-center", className)}>
            <img
                src="/khulu-logo.png"
                alt="Khulu Digital"
                className={cn(
                    "object-contain transition-all duration-300",
                    imgHeights[size],
                    collapsed ? "w-auto max-w-[44px]" : "w-auto max-w-[220px]"
                )}
            />
        </div>
    );
};

export default Logo;
