import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellOff, Check, CheckCheck, MapPin, Cpu, Filter, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '../context/DemoContext';
import { PageFade, SEVERITY_STYLE, formatClock, EmptyState, DemoButton, Card } from '../components/ui';
import type { AlertSeverity } from '../data/alerts';

const SEV_FILTERS: (AlertSeverity | 'all')[] = ['all', 'critical', 'warning', 'info'];
const KIND_FILTERS = [
    { id: 'all', label: 'All sources' },
    { id: 'sensor', label: 'Sensors' },
    { id: 'geofence', label: 'Geofences' },
] as const;

const Events: React.FC = () => {
    const { alerts, vehicles, acknowledgeAlert, acknowledgeAll, selectVehicle } = useDemo();
    const navigate = useNavigate();
    const [sev, setSev] = useState<AlertSeverity | 'all'>('all');
    const [kind, setKind] = useState<'all' | 'sensor' | 'geofence'>('all');
    const [vehicleFilter, setVehicleFilter] = useState('all');

    const filtered = useMemo(() => alerts.filter(a =>
        (sev === 'all' || a.severity === sev) &&
        (kind === 'all' || a.kind === kind) &&
        (vehicleFilter === 'all' || a.vehicleId === vehicleFilter)
    ), [alerts, sev, kind, vehicleFilter]);

    const stats = useMemo(() => ({
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
        unread: alerts.filter(a => !a.acknowledged).length,
    }), [alerts]);

    if (vehicles.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <EmptyState icon={<Truck />} title="No fleet loaded" hint="Load a fleet — events stream in live as vehicles trigger rules."
                    action={<DemoButton onClick={() => navigate('/demo')}>Choose a fleet</DemoButton>} />
            </div>
        );
    }

    return (
        <PageFade className="h-full overflow-y-auto bg-slate-50">
            <div className="max-w-4xl mx-auto px-6 py-6">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Event stream</h2>
                        <p className="text-sm text-slate-400">Live alerts from your fleet — threshold breaches, geofence crossings and system events.</p>
                    </div>
                    <DemoButton variant="outline" onClick={acknowledgeAll} disabled={stats.unread === 0}>
                        <CheckCheck size={14} /> Acknowledge all ({stats.unread})
                    </DemoButton>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-5">
                    {([['Critical', stats.critical, 'text-red-600 bg-red-50'], ['Warnings', stats.warning, 'text-amber-600 bg-amber-50'], ['Info', stats.info, 'text-sky-600 bg-sky-50'], ['Unread', stats.unread, 'text-slate-700 bg-slate-100']] as const).map(([label, n, cls]) => (
                        <Card key={label} className="p-3.5 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
                            <motion.span key={n} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className={cn('rounded-lg px-2.5 py-1 text-sm font-black tabular-nums', cls)}>{n}</motion.span>
                        </Card>
                    ))}
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Filter size={14} className="text-slate-400" />
                    {SEV_FILTERS.map(s => (
                        <button key={s} onClick={() => setSev(s)}
                            className={cn('rounded-full px-3 py-1 text-xs font-bold capitalize transition-colors',
                                sev === s ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400')}>
                            {s}
                        </button>
                    ))}
                    <span className="w-px h-5 bg-slate-200 mx-1" />
                    {KIND_FILTERS.map(k => (
                        <button key={k.id} onClick={() => setKind(k.id)}
                            className={cn('rounded-full px-3 py-1 text-xs font-bold transition-colors',
                                kind === k.id ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400')}>
                            {k.label}
                        </button>
                    ))}
                    <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}
                        className="ml-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none">
                        <option value="all">All vehicles</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState icon={<BellOff />} title="No events match"
                        hint="Leave the demo running — vehicles will trigger speeding, temperature and geofence alerts within a minute or two." />
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence initial={false}>
                            {filtered.map(a => {
                                const s = SEVERITY_STYLE[a.severity];
                                return (
                                    <motion.div
                                        key={a.id}
                                        layout
                                        initial={{ opacity: 0, y: -14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                        className={cn('bg-white rounded-xl border p-3.5 flex gap-3 items-start shadow-sm transition-colors',
                                            a.acknowledged ? 'border-slate-100 opacity-70' : 'border-slate-200')}
                                    >
                                        <span className={cn('shrink-0 w-9 h-9 rounded-full flex items-center justify-center', s.bg, s.text)}>
                                            {a.kind === 'geofence' ? <MapPin size={16} /> : a.kind === 'sensor' ? <Cpu size={16} /> : <Bell size={16} />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-slate-800">{a.title}</span>
                                                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', s.bg, s.text)}>{s.label}</span>
                                                <span className="text-[11px] text-slate-400 tabular-nums ml-auto">{formatClock(a.time)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{a.detail}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <button
                                                    onClick={() => { selectVehicle(a.vehicleId); navigate('/demo/map'); }}
                                                    className="text-[11px] font-bold text-accent hover:underline"
                                                >
                                                    {a.vehicleName} — view on map →
                                                </button>
                                                {!a.acknowledged && (
                                                    <button onClick={() => acknowledgeAlert(a.id)}
                                                        className="text-[11px] font-bold text-slate-400 hover:text-green-600 flex items-center gap-1 transition-colors">
                                                        <Check size={12} /> Acknowledge
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </PageFade>
    );
};

export default Events;
