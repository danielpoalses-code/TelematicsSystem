import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Map as MapIcon, History, FileBarChart, Bell, Hexagon, SlidersHorizontal,
    Cable, Truck, RotateCcw, Radio, CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '../context/DemoContext';
import { Toasts } from './Toasts';
import { Chip, SEVERITY_STYLE, formatClock } from './ui';

const NAV = [
    { to: '/demo/map', label: 'Live Map', icon: MapIcon },
    { to: '/demo/history', label: 'History', icon: History },
    { to: '/demo/reports', label: 'Reports', icon: FileBarChart },
    { to: '/demo/events', label: 'Events', icon: Bell },
    { to: '/demo/geofences', label: 'Geofences', icon: Hexagon },
    { to: '/demo/notifications', label: 'Notifications', icon: SlidersHorizontal },
    { to: '/demo/integrations', label: 'Integrations', icon: Cable },
    { to: '/demo/fleet', label: 'My Fleet', icon: Truck },
];

export const DemoShell: React.FC = () => {
    const { vehicles, alerts, unreadAlerts, fleetName, resetDemo, acknowledgeAll } = useDemo();
    const location = useLocation();
    const navigate = useNavigate();
    const [bellOpen, setBellOpen] = useState(false);

    const counts = useMemo(() => ({
        total: vehicles.length,
        moving: vehicles.filter(v => v.status === 'moving').length,
        idling: vehicles.filter(v => v.status === 'idling').length,
        parked: vehicles.filter(v => v.status === 'parked').length,
    }), [vehicles]);

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            <header className="shrink-0 bg-white border-b border-slate-200 px-4 flex items-center gap-2 h-14 z-[1100] relative">
                <button onClick={() => navigate('/demo')} className="flex items-center gap-2 mr-2 group">
                    <span className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Radio size={18} />
                    </span>
                    <span className="font-black tracking-tight text-slate-800 hidden lg:block">
                        Power<span className="text-accent">Tech</span>
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-white bg-slate-800 rounded px-1.5 py-0.5 align-middle">Demo</span>
                    </span>
                </button>

                <nav className="flex items-center gap-0.5 overflow-x-auto">
                    {NAV.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => cn(
                                'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors',
                                isActive ? 'text-accent' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50',
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={15} />
                                    <span className="hidden md:inline">{label}</span>
                                    {isActive && (
                                        <motion.span layoutId="demo-nav-pill" className="absolute inset-0 rounded-lg bg-red-50 -z-10"
                                            transition={{ type: 'spring', stiffness: 450, damping: 35 }} />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5">
                        <Chip color="#475569" title="Total vehicles">{counts.total}</Chip>
                        <Chip color="#22c55e" title="Moving">{counts.moving}</Chip>
                        <Chip color="#f59e0b" title="Idling">{counts.idling}</Chip>
                        <Chip color="#3b82f6" title="Parked">{counts.parked}</Chip>
                    </div>

                    <div className="relative">
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setBellOpen(o => !o)}
                            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            <Bell size={18} />
                            <AnimatePresence>
                                {unreadAlerts > 0 && (
                                    <motion.span
                                        key={unreadAlerts}
                                        initial={{ scale: 0.4 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
                                    >
                                        {unreadAlerts > 99 ? '99+' : unreadAlerts}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        <AnimatePresence>
                            {bellOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                    transition={{ duration: 0.16 }}
                                    className="absolute right-0 top-11 w-[360px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                                >
                                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-700">Latest alerts</span>
                                        <button onClick={acknowledgeAll} className="text-xs text-slate-400 hover:text-accent flex items-center gap-1 transition-colors">
                                            <CheckCheck size={13} /> Mark all read
                                        </button>
                                    </div>
                                    <div className="max-h-[360px] overflow-y-auto">
                                        {alerts.length === 0 && (
                                            <div className="px-4 py-8 text-center text-sm text-slate-400">No alerts yet — they appear live as your fleet moves.</div>
                                        )}
                                        {alerts.slice(0, 12).map(a => {
                                            const sev = SEVERITY_STYLE[a.severity];
                                            return (
                                                <button
                                                    key={a.id}
                                                    onClick={() => { setBellOpen(false); navigate('/demo/events'); }}
                                                    className={cn('w-full text-left px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-2.5', !a.acknowledged && 'bg-red-50/40')}
                                                >
                                                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                                                    <span className="min-w-0">
                                                        <span className="block text-xs font-bold text-slate-700 truncate">{a.title}</span>
                                                        <span className="block text-[11px] text-slate-400 truncate">{a.vehicleName} · {formatClock(a.time)}</span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => { setBellOpen(false); navigate('/demo/events'); }}
                                        className="w-full py-2.5 text-xs font-bold text-accent hover:bg-red-50 transition-colors"
                                    >
                                        View all events →
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="hidden lg:flex flex-col items-end leading-tight">
                        <span className="text-xs font-bold text-slate-700">{fleetName ?? 'No fleet selected'}</span>
                        <span className="text-[10px] text-slate-400">Sandbox environment</span>
                    </div>

                    <button
                        onClick={() => { resetDemo(); navigate('/demo'); }}
                        title="Reset demo"
                        className="p-2 rounded-lg text-slate-400 hover:text-accent hover:bg-red-50 transition-colors"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </header>

            <main className="flex-1 min-h-0 relative" onClick={() => bellOpen && setBellOpen(false)}>
                <AnimatePresence mode="wait">
                    <div key={location.pathname} className="h-full">
                        <Outlet />
                    </div>
                </AnimatePresence>
            </main>

            <Toasts />
        </div>
    );
};
