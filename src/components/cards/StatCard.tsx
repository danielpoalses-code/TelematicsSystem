import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: {
        value: number;
        isUp: boolean;
    };
    className?: string;
    variant?: 'default' | 'green' | 'blue' | 'amber' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    className,
    variant = 'default'
}) => {
    const variantStyles = {
        default: 'border-border',
        green: 'border-status-green/20 bg-status-green/5',
        blue: 'border-status-blue/20 bg-status-blue/5',
        amber: 'border-status-amber/20 bg-status-amber/5',
        red: 'border-status-red/20 bg-status-red/5',
    };

    return (
        <div className={cn(
            "p-5 rounded-xl border space-y-3 bg-white hover:shadow-md transition-all group",
            variantStyles[variant],
            className
        )}>
            <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-surface border border-border text-slate-400 group-hover:text-accent transition-colors">
                    <Icon className="h-4 w-4" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded",
                        trend.isUp ? "text-status-green bg-status-green/10" : "text-status-red bg-status-red/10"
                    )}>
                        {trend.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {trend.value}%
                    </div>
                )}
            </div>

            <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{value}</h3>
            </div>
        </div>
    );
};

export default StatCard;
