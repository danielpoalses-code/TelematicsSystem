import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    UserCheck, HeartPulse, Clock4, BellRing, Route as RouteIcon, Fuel,
    Play, Download, Truck, FileBarChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '../context/DemoContext';
import { dailyStats, engineHealthSeries, fuelSeries, generateRangeActivity } from '../sim/history';
import { seededRand, type DemoVehicle } from '../data/fleets';
import { Card, DemoButton, EmptyState, Field, inputCls, formatClock, SEVERITY_STYLE } from '../components/ui';

type ReportType = 'driver' | 'engine' | 'mileage' | 'alerts' | 'trips' | 'fuel';

const REPORT_TYPES: { id: ReportType; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'driver', label: 'Driver behaviour', desc: 'Harsh braking, acceleration & speeding scores', icon: <UserCheck size={17} /> },
    { id: 'engine', label: 'Engine health', desc: 'Coolant, RPM, oil pressure & battery trends', icon: <HeartPulse size={17} /> },
    { id: 'mileage', label: 'Hours & mileage', desc: 'Distance, driving hours and utilisation', icon: <Clock4 size={17} /> },
    { id: 'alerts', label: 'Alerts report', desc: 'All triggered alerts grouped by type', icon: <BellRing size={17} /> },
    { id: 'trips', label: 'Trips & parkings', desc: 'Every trip and stop with times and distance', icon: <RouteIcon size={17} /> },
    { id: 'fuel', label: 'Fuel report', desc: 'Levels, refuels and suspected drains', icon: <Fuel size={17} /> },
];

const PIE_COLORS = ['#DC3545', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#0ea5e9'];

function downloadCsv(filename: string, rows: (string | number)[][]) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <Card className={cn('p-4', className)}>
        <h4 className="text-sm font-bold text-slate-700 mb-3">{title}</h4>
        {children}
    </Card>
);

const Reports: React.FC = () => {
    const { vehicles, alerts } = useDemo();
    const navigate = useNavigate();
    const [reportType, setReportType] = useState<ReportType>('driver');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [days, setDays] = useState(7);
    const [building, setBuilding] = useState(false);
    const [built, setBuilt] = useState<{ type: ReportType; vehicles: DemoVehicle[]; days: number } | null>(null);

    const toggleVehicle = (id: string) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const build = () => {
        const vs = vehicles.filter(v => selectedIds.length === 0 || selectedIds.includes(v.id));
        setBuilding(true);
        setBuilt(null);
        setTimeout(() => {
            setBuilt({ type: reportType, vehicles: vs, days });
            setBuilding(false);
        }, 700);
    };

    if (vehicles.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <EmptyState icon={<Truck />} title="No fleet loaded" hint="Load a fleet to generate reports."
                    action={<DemoButton onClick={() => navigate('/demo')}>Choose a fleet</DemoButton>} />
            </div>
        );
    }

    return (
        <div className="h-full flex">
            <aside className="w-[330px] shrink-0 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800">Reports</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Pick a report, vehicles and a period.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    <div className="space-y-1.5">
                        {REPORT_TYPES.map(rt => (
                            <motion.button
                                key={rt.id}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setReportType(rt.id)}
                                className={cn(
                                    'w-full text-left rounded-xl border p-3 flex items-start gap-3 transition-all',
                                    reportType === rt.id ? 'border-accent bg-red-50/50' : 'border-slate-200 hover:border-slate-300',
                                )}
                            >
                                <span className={cn('mt-0.5', reportType === rt.id ? 'text-accent' : 'text-slate-400')}>{rt.icon}</span>
                                <span>
                                    <span className="block text-sm font-bold text-slate-700">{rt.label}</span>
                                    <span className="block text-[11px] text-slate-400 leading-snug mt-0.5">{rt.desc}</span>
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    <Field label={`Vehicles (${selectedIds.length === 0 ? 'all' : selectedIds.length} selected)`}>
                        <div className="rounded-lg border border-slate-200 max-h-44 overflow-y-auto divide-y divide-slate-50">
                            {vehicles.map(v => (
                                <label key={v.id} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" className="accent-accent" checked={selectedIds.includes(v.id)} onChange={() => toggleVehicle(v.id)} />
                                    <span className="truncate">{v.name}</span>
                                </label>
                            ))}
                        </div>
                    </Field>

                    <Field label="Period">
                        <select className={inputCls} value={days} onChange={e => setDays(Number(e.target.value))}>
                            <option value={1}>Last 24 hours</option>
                            <option value={3}>Last 3 days</option>
                            <option value={7}>Last 7 days</option>
                        </select>
                    </Field>
                </div>
                <div className="p-4 border-t border-slate-100">
                    <DemoButton className="w-full" onClick={build} disabled={building}>
                        {building
                            ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                            : <Play size={15} />}
                        {building ? 'Building…' : 'Build report'}
                    </DemoButton>
                </div>
            </aside>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                <AnimatePresence mode="wait">
                    {!built && !building && (
                        <EmptyState
                            key="empty"
                            icon={<FileBarChart />}
                            title="Configure and build a report"
                            hint="Choose a report type on the left, select vehicles and a period, then hit Build report."
                        />
                    )}
                    {built && (
                        <motion.div key={built.type + built.days + built.vehicles.length}
                            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }} className="space-y-4 max-w-5xl mx-auto">
                            {built.type === 'driver' && <DriverReport vehicles={built.vehicles} days={built.days} />}
                            {built.type === 'engine' && <EngineReport vehicles={built.vehicles} />}
                            {built.type === 'mileage' && <MileageReport vehicles={built.vehicles} days={built.days} />}
                            {built.type === 'alerts' && <AlertsReport alerts={alerts} />}
                            {built.type === 'trips' && <TripsReport vehicles={built.vehicles} days={built.days} />}
                            {built.type === 'fuel' && <FuelReport vehicles={built.vehicles} />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

/* ---------------- individual reports ---------------- */

const ReportHeader: React.FC<{ title: string; subtitle: string; onExport?: () => void }> = ({ title, subtitle, onExport }) => (
    <div className="flex items-start justify-between">
        <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
            <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        {onExport && (
            <DemoButton variant="outline" onClick={onExport}><Download size={14} /> Export CSV</DemoButton>
        )}
    </div>
);

const DriverReport: React.FC<{ vehicles: DemoVehicle[]; days: number }> = ({ vehicles, days }) => {
    const rows = useMemo(() => vehicles.map(v => {
        const { trips } = generateRangeActivity(v, days);
        const braking = trips.reduce((s, t) => s + t.harshBraking, 0);
        const accel = trips.reduce((s, t) => s + t.harshAccel, 0);
        const speeding = trips.reduce((s, t) => s + t.overSpeedEvents, 0);
        const km = trips.reduce((s, t) => s + t.distanceKm, 0);
        const score = Math.max(40, Math.round(100 - (braking * 2.2 + accel * 2.8 + speeding * 3.5) / Math.max(1, km / 100)));
        return { driver: v.driver, vehicle: v.name, braking, accel, speeding, km: Math.round(km), score };
    }).sort((a, b) => b.score - a.score), [vehicles, days]);

    return (
        <>
            <ReportHeader title="Driver behaviour" subtitle={`${vehicles.length} vehicles · last ${days} day(s)`}
                onExport={() => downloadCsv('driver-behaviour.csv', [['Driver', 'Vehicle', 'Score', 'Harsh braking', 'Harsh accel', 'Speeding', 'Distance km'], ...rows.map(r => [r.driver, r.vehicle, r.score, r.braking, r.accel, r.speeding, r.km])])} />
            <ChartCard title="Events per driver">
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={rows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="driver" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={55} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="braking" name="Harsh braking" fill="#DC3545" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="accel" name="Harsh acceleration" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="speeding" name="Speeding" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
            <Card className="overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                        <tr>{['Rank', 'Driver', 'Vehicle', 'Distance', 'Braking', 'Accel', 'Speeding', 'Score'].map(h => <th key={h} className="px-4 py-2.5 font-bold">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {rows.map((r, i) => (
                            <tr key={r.driver + r.vehicle} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-2.5 text-slate-400 font-bold">#{i + 1}</td>
                                <td className="px-4 py-2.5 font-semibold text-slate-700">{r.driver}</td>
                                <td className="px-4 py-2.5 text-slate-500">{r.vehicle}</td>
                                <td className="px-4 py-2.5 tabular-nums">{r.km} km</td>
                                <td className="px-4 py-2.5 tabular-nums">{r.braking}</td>
                                <td className="px-4 py-2.5 tabular-nums">{r.accel}</td>
                                <td className="px-4 py-2.5 tabular-nums">{r.speeding}</td>
                                <td className="px-4 py-2.5">
                                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                                        r.score >= 85 ? 'bg-green-50 text-green-600' : r.score >= 70 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600')}>
                                        {r.score}/100
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </>
    );
};

const EngineReport: React.FC<{ vehicles: DemoVehicle[] }> = ({ vehicles }) => {
    const [focusId, setFocusId] = useState(vehicles[0]?.id);
    const focus = vehicles.find(v => v.id === focusId) ?? vehicles[0];
    const series = useMemo(() => (focus ? engineHealthSeries(focus) : []), [focus]);
    const faults = useMemo(() => vehicles.flatMap(v => {
        const out: { vehicle: string; code: string; desc: string; sev: 'warning' | 'critical' }[] = [];
        if (seededRand(v.seed, 1) > 0.7) out.push({ vehicle: v.name, code: 'P0217', desc: 'Engine over-temperature condition', sev: 'critical' });
        if (seededRand(v.seed, 2) > 0.75) out.push({ vehicle: v.name, code: 'P0562', desc: 'System voltage low', sev: 'warning' });
        if (seededRand(v.seed, 3) > 0.8) out.push({ vehicle: v.name, code: 'P0101', desc: 'MAF sensor range/performance', sev: 'warning' });
        return out;
    }), [vehicles]);

    return (
        <>
            <ReportHeader title="Engine health" subtitle={`Hourly telemetry — ${focus?.name ?? ''}`} />
            <div className="flex gap-2 flex-wrap">
                {vehicles.map(v => (
                    <button key={v.id} onClick={() => setFocusId(v.id)}
                        className={cn('rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                            v.id === focus?.id ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400')}>
                        {v.name}
                    </button>
                ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title="Coolant temperature (°C, last 24h)">
                    <ResponsiveContainer width="100%" height={210}>
                        <AreaChart data={series}>
                            <defs>
                                <linearGradient id="coolGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#DC3545" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#DC3545" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                            <YAxis tick={{ fontSize: 11 }} domain={[0, 120]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="coolantC" stroke="#DC3545" fill="url(#coolGrad)" strokeWidth={2} name="Coolant °C" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Battery voltage (V, last 24h)">
                    <ResponsiveContainer width="100%" height={210}>
                        <LineChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                            <YAxis tick={{ fontSize: 11 }} domain={[20, 30]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="batteryV" stroke="#3b82f6" strokeWidth={2} dot={false} name="Battery V" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="RPM profile">
                    <ResponsiveContainer width="100%" height={210}>
                        <AreaChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Area type="step" dataKey="rpm" stroke="#8b5cf6" fill="#8b5cf622" strokeWidth={2} name="RPM" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Oil pressure (bar)">
                    <ResponsiveContainer width="100%" height={210}>
                        <LineChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                            <YAxis tick={{ fontSize: 11 }} domain={[0, 6]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="oilBar" stroke="#22c55e" strokeWidth={2} dot={false} name="Oil bar" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
            <ChartCard title={`Active fault codes across selection (${faults.length})`}>
                {faults.length === 0
                    ? <p className="text-sm text-slate-400 py-4 text-center">No active fault codes — fleet is healthy. 🎉</p>
                    : (
                        <div className="divide-y divide-slate-50">
                            {faults.map((f, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5">
                                    <span className={cn('w-2 h-2 rounded-full', f.sev === 'critical' ? 'bg-red-500' : 'bg-amber-500')} />
                                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 rounded px-2 py-0.5">{f.code}</span>
                                    <span className="text-sm text-slate-600 flex-1">{f.desc}</span>
                                    <span className="text-xs text-slate-400">{f.vehicle}</span>
                                </div>
                            ))}
                        </div>
                    )}
            </ChartCard>
        </>
    );
};

const MileageReport: React.FC<{ vehicles: DemoVehicle[]; days: number }> = ({ vehicles, days }) => {
    const perDay = useMemo(() => {
        const map = new Map<string, { day: string; km: number; hours: number }>();
        vehicles.forEach(v => dailyStats(v, days).forEach(d => {
            const e = map.get(d.day) ?? { day: d.day.slice(5), km: 0, hours: 0 };
            e.km += d.distanceKm; e.hours += d.drivingHours;
            map.set(d.day, e);
        }));
        return [...map.values()];
    }, [vehicles, days]);

    const rows = useMemo(() => vehicles.map(v => {
        const stats = dailyStats(v, days);
        return {
            name: v.name, driver: v.driver,
            km: stats.reduce((s, d) => s + d.distanceKm, 0),
            hours: stats.reduce((s, d) => s + d.drivingHours, 0),
            idle: stats.reduce((s, d) => s + d.idleHours, 0),
            odo: v.odoKm, engineHours: v.engineHours,
        };
    }), [vehicles, days]);

    return (
        <>
            <ReportHeader title="Hours & mileage" subtitle={`${vehicles.length} vehicles · last ${days} day(s)`}
                onExport={() => downloadCsv('hours-mileage.csv', [['Vehicle', 'Driver', 'Distance km', 'Driving h', 'Idle h', 'Odometer', 'Engine h'], ...rows.map(r => [r.name, r.driver, r.km.toFixed(1), r.hours.toFixed(1), r.idle.toFixed(1), r.odo.toFixed(0), r.engineHours.toFixed(0)])])} />
            <ChartCard title="Fleet distance & driving hours per day">
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={perDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="km" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="h" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="km" dataKey="km" name="Distance (km)" fill="#DC3545" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="h" dataKey="hours" name="Driving (h)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
            <Card className="overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400">
                        <tr>{['Vehicle', 'Driver', 'Distance', 'Driving', 'Idle', 'Odometer', 'Engine hours'].map(h => <th key={h} className="px-4 py-2.5 font-bold">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {rows.map(r => (
                            <tr key={r.name} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-2.5 font-semibold text-slate-700">{r.name}</td>
                                <td className="px-4 py-2.5 text-slate-500">{r.driver}</td>
                                <td className="px-4 py-2.5 tabular-nums">{r.km.toFixed(1)} km</td>
                                <td className="px-4 py-2.5 tabular-nums">{r.hours.toFixed(1)} h</td>
                                <td className="px-4 py-2.5 tabular-nums text-amber-600">{r.idle.toFixed(1)} h</td>
                                <td className="px-4 py-2.5 tabular-nums">{r.odo.toFixed(0)} km</td>
                                <td className="px-4 py-2.5 tabular-nums">{r.engineHours.toFixed(0)} h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </>
    );
};

const AlertsReport: React.FC<{ alerts: ReturnType<typeof useDemo>['alerts'] }> = ({ alerts }) => {
    const byTitle = useMemo(() => {
        const m = new Map<string, number>();
        alerts.forEach(a => m.set(a.title, (m.get(a.title) ?? 0) + 1));
        return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [alerts]);

    return (
        <>
            <ReportHeader title="Alerts report" subtitle={`${alerts.length} alerts raised this session (live data)`}
                onExport={() => downloadCsv('alerts.csv', [['Time', 'Vehicle', 'Severity', 'Title', 'Detail'], ...alerts.map(a => [new Date(a.time).toISOString(), a.vehicleName, a.severity, a.title, a.detail])])} />
            {alerts.length === 0 ? (
                <Card className="p-10 text-center text-sm text-slate-400">
                    No alerts yet — leave the live map running for a minute; speeding, overheating and geofence events will accumulate here.
                </Card>
            ) : (
                <div className="grid lg:grid-cols-5 gap-4">
                    <ChartCard title="By type" className="lg:col-span-2">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={byTitle} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                                    {byTitle.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                    <Card className="lg:col-span-3 overflow-hidden">
                        <div className="max-h-[330px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400 sticky top-0">
                                    <tr>{['Time', 'Vehicle', 'Alert', 'Severity'].map(h => <th key={h} className="px-4 py-2.5 font-bold">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {alerts.map(a => (
                                        <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-2 tabular-nums text-slate-400 text-xs">{formatClock(a.time)}</td>
                                            <td className="px-4 py-2 font-semibold text-slate-700 text-xs">{a.vehicleName}</td>
                                            <td className="px-4 py-2 text-slate-600 text-xs">{a.title}</td>
                                            <td className="px-4 py-2">
                                                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', SEVERITY_STYLE[a.severity].bg, SEVERITY_STYLE[a.severity].text)}>
                                                    {a.severity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};

const TripsReport: React.FC<{ vehicles: DemoVehicle[]; days: number }> = ({ vehicles, days }) => {
    const all = useMemo(() => vehicles.flatMap(v => {
        const { trips } = generateRangeActivity(v, days);
        return trips.map(t => ({ ...t, vehicleName: v.name, driver: v.driver }));
    }).sort((a, b) => b.startTime - a.startTime), [vehicles, days]);

    return (
        <>
            <ReportHeader title="Trips & parkings" subtitle={`${all.length} trips · last ${days} day(s)`}
                onExport={() => downloadCsv('trips.csv', [['Vehicle', 'Driver', 'Date', 'Start', 'End', 'Distance km', 'Avg km/h', 'Max km/h', 'Fuel L'], ...all.map(t => [t.vehicleName, t.driver, t.day, formatClock(t.startTime), formatClock(t.endTime), t.distanceKm.toFixed(1), t.avgSpeed.toFixed(0), t.maxSpeed.toFixed(0), t.fuelUsedL.toFixed(1)])])} />
            <Card className="overflow-hidden">
                <div className="max-h-[560px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-400 sticky top-0">
                            <tr>{['Vehicle', 'Date', 'Start → End', 'Distance', 'Avg / Max speed', 'Fuel'].map(h => <th key={h} className="px-4 py-2.5 font-bold">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {all.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-2.5">
                                        <span className="block font-semibold text-slate-700">{t.vehicleName}</span>
                                        <span className="block text-[11px] text-slate-400">{t.driver}</span>
                                    </td>
                                    <td className="px-4 py-2.5 tabular-nums text-slate-500">{t.day}</td>
                                    <td className="px-4 py-2.5 tabular-nums text-slate-600">{formatClock(t.startTime)} → {formatClock(t.endTime)}</td>
                                    <td className="px-4 py-2.5 tabular-nums font-semibold">{t.distanceKm.toFixed(1)} km</td>
                                    <td className="px-4 py-2.5 tabular-nums">
                                        {t.avgSpeed.toFixed(0)} / <span className={t.maxSpeed > 100 ? 'text-red-500 font-bold' : ''}>{t.maxSpeed.toFixed(0)}</span> km/h
                                    </td>
                                    <td className="px-4 py-2.5 tabular-nums">{t.fuelUsedL.toFixed(1)} L</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
};

const FuelReport: React.FC<{ vehicles: DemoVehicle[] }> = ({ vehicles }) => {
    const [focusId, setFocusId] = useState(vehicles[0]?.id);
    const focus = vehicles.find(v => v.id === focusId) ?? vehicles[0];
    const series = useMemo(() => (focus ? fuelSeries(focus) : []), [focus]);
    const refuels = series.filter(s => s.event === 'refuel').length;
    const drains = series.filter(s => s.event === 'drain').length;

    return (
        <>
            <ReportHeader title="Fuel report" subtitle={`${focus?.name ?? ''} · last 7 days · ${refuels} refuels, ${drains} suspected drains`} />
            <div className="flex gap-2 flex-wrap">
                {vehicles.map(v => (
                    <button key={v.id} onClick={() => setFocusId(v.id)}
                        className={cn('rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                            v.id === focus?.id ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400')}>
                        {v.name}
                    </button>
                ))}
            </div>
            <ChartCard title="Tank level (%) — drops marked red, refuels green">
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={series}>
                        <defs>
                            <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={5} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={2} fill="url(#fuelGrad)" name="Fuel %"
                            dot={(props: { cx?: number; cy?: number; payload?: { event?: string }; index?: number }) => {
                                const ev = props.payload?.event;
                                if (!ev) return <g key={props.index} />;
                                return <circle key={props.index} cx={props.cx} cy={props.cy} r={5} fill={ev === 'refuel' ? '#22c55e' : '#DC3545'} stroke="#fff" strokeWidth={2} />;
                            }} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>
        </>
    );
};

export default Reports;
