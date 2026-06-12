import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AlertSeverity } from '../data/alerts';
import type { VehicleStatus } from '../data/fleets';

export const STATUS_COLOR: Record<VehicleStatus, string> = {
    moving: '#22c55e',
    idling: '#f59e0b',
    parked: '#3b82f6',
    offline: '#94a3b8',
};

export const STATUS_LABEL: Record<VehicleStatus, string> = {
    moving: 'Moving',
    idling: 'Idling',
    parked: 'Parked',
    offline: 'No connection',
};

export const SEVERITY_STYLE: Record<AlertSeverity, { bg: string; text: string; dot: string; label: string }> = {
    info: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', label: 'Info' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Warning' },
    critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Critical' },
};

export function formatDuration(ms: number): string {
    const totalMin = Math.floor(ms / 60000);
    const d = Math.floor(totalMin / 1440);
    const h = Math.floor((totalMin % 1440) / 60);
    const m = totalMin % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export function formatClock(t: number): string {
    return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>{children}</div>
);

export const SectionTitle: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
    <div className="flex items-start justify-between gap-4 mb-4">
        <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {right}
    </div>
);

export const DemoButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }> = ({
    className, variant = 'primary', children, ...props
}) => (
    <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
            'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none',
            variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover shadow-sm shadow-red-200',
            variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
            variant === 'outline' && 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 bg-white',
            variant === 'danger' && 'bg-red-50 text-red-600 hover:bg-red-100',
            className,
        )}
        {...(props as object)}
    >
        {children}
    </motion.button>
);

export const Chip: React.FC<{ color: string; children: React.ReactNode; title?: string }> = ({ color, children, title }) => (
    <span title={title} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white tabular-nums" style={{ backgroundColor: color }}>
        {children}
    </span>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }> = ({ icon, title, hint, action }) => (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="text-slate-300 mb-4 [&>svg]:w-12 [&>svg]:h-12">{icon}</div>
        <div className="text-slate-700 font-semibold">{title}</div>
        {hint && <div className="text-sm text-slate-400 mt-1 max-w-sm">{hint}</div>}
        {action && <div className="mt-5">{action}</div>}
    </motion.div>
);

export const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <label className={cn('block', className)}>
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{label}</span>
        {children}
    </label>
);

export const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow';

export const PageFade: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={className}
    >
        {children}
    </motion.div>
);
