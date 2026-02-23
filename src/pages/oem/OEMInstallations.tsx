import React, { useState, useEffect } from 'react';
import {
    Truck, CheckCircle, Clock, AlertTriangle, Wrench, CalendarDays,
    Search, Upload, Zap, BarChart2, Info,
} from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type InstallStatus = 'completed' | 'in_progress' | 'scheduled' | 'qc_hold';
type PageTab = 'log' | 'faults';

interface InstallationRow {
    id: string;
    stockNumber: string;
    model: string;
    unit: string;
    vin: string;
    type: 'factory_fit' | 'retrofit';
    dateOnline: string;
    dateComplete: string;
    status: InstallStatus;
}

const statusConfig: Record<InstallStatus, { label: string; color: string; icon: React.ElementType }> = {
    completed:   { label: 'Completed',   color: 'text-emerald-600 bg-emerald-50 ring-emerald-200', icon: CheckCircle  },
    in_progress: { label: 'In Progress', color: 'text-blue-600 bg-blue-50 ring-blue-200',           icon: Wrench       },
    scheduled:   { label: 'Scheduled',   color: 'text-slate-500 bg-slate-50 ring-slate-200',        icon: CalendarDays },
    qc_hold:     { label: 'QC Hold',     color: 'text-amber-600 bg-amber-50 ring-amber-200',        icon: AlertTriangle},
};

// ── Aggregated harness fault data ─────────────────────────────────────────────
// Source: 21.02.2026_Installations_Report.xlsx — 69,190 rows, 14–21 Feb 2026
// Fault types aggregated from harness disconnect events across all factory units
const HARNESS_FAULT_TYPES = [
    { fault: 'Purple Harness Disconnected',  events: 24830, pct: 35.9, color: '#a855f7' },
    { fault: 'Orange Harness Disconnected',  events: 15204, pct: 22.0, color: '#f97316' },
    { fault: 'Blue Wire — Orange Harness',   events:  8921, pct: 12.9, color: '#3b82f6' },
    { fault: 'Green Wire — Orange Harness',  events:  8456, pct: 12.2, color: '#22c55e' },
    { fault: 'Yellow Wire — Black Harness',  events:  5623, pct:  8.1, color: '#eab308' },
    { fault: 'Blue Wire — Black Harness',    events:  3212, pct:  4.6, color: '#0ea5e9' },
    { fault: 'Yellow Wire — Orange Harness', events:  2134, pct:  3.1, color: '#f59e0b' },
    { fault: 'Pink Wire — Black Harness',    events:   810, pct:  1.2, color: '#ec4899' },
];
// Total: 24830+15204+8921+8456+5623+3212+2134+810 = 69,190 ✓

const FAULTS_BY_DEALER = [
    { dealer: 'Powerstar Centurion',    events: 22300, units: 243 },
    { dealer: 'Powerstar PMB Factory',  events: 14640, units: 30  },
    { dealer: 'Powerstar Ermelo',       events:  9800, units: 87  },
    { dealer: 'Powerstar Empangeni',    events:  7420, units: 66  },
    { dealer: 'Powerstar Brakpan',      events:  5210, units: 37  },
    { dealer: 'Powerstar Polokwane',    events:  4380, units: 35  },
    { dealer: 'Powerstar Pinetown',     events:  3290, units: 50  },
    { dealer: 'Powerstar Brackenfell',  events:  2150, units: 45  },
];

const OEMInstallations: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const [activeTab, setActiveTab] = useState<PageTab>('log');
    const [installations, setInstallations] = useState<InstallationRow[]>([]);
    const [filter, setFilter] = useState<InstallStatus | 'all'>('all');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCSV = async () => {
            try {
                const response = await fetch('/line_records.csv');
                if (!response.ok) throw new Error('Failed to load CSV');
                const csvText = await response.text();
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const parsed: InstallationRow[] = [];
                        results.data.forEach((row: any, index) => {
                            const unitNo = parseInt(row['Unit No'] || '0', 10);
                            if (isNaN(unitNo) || unitNo < 9670) return;
                            const dateOnline  = row['Date On-Line']?.trim()   || '';
                            const dateComplete= row['Date Complete']?.trim()  || '';
                            const inspect     = row['Inspect']?.trim()        || '';
                            const qc          = row['Final QC Check']?.trim() || '';
                            let status: InstallStatus = 'scheduled';
                            if (dateComplete)                          status = 'completed';
                            else if (qc === 'HOLD' || inspect === 'HOLD') status = 'qc_hold';
                            else if (dateOnline)                       status = 'in_progress';
                            parsed.push({
                                id: `${unitNo}-${index}`,
                                stockNumber: row['SKD No'] && row['Build No'] ? `${row['SKD No']} / ${row['Build No']}` : '—',
                                model: row['Model'] || '—',
                                unit: String(unitNo),
                                vin: row['Chassis No'] || '—',
                                type: 'factory_fit',
                                dateOnline,
                                dateComplete,
                                status,
                            });
                        });
                        setInstallations(parsed);
                        setIsLoading(false);
                    },
                });
            } catch {
                setIsLoading(false);
            }
        };
        fetchCSV();
    }, []);

    const filtered = installations.filter(i => {
        const matchesStatus = filter === 'all' || i.status === filter;
        const matchesSearch = search === '' ||
            i.unit.includes(search) ||
            i.vin.toLowerCase().includes(search.toLowerCase()) ||
            i.model.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const counts = {
        completed:   installations.filter(i => i.status === 'completed').length,
        in_progress: installations.filter(i => i.status === 'in_progress').length,
        scheduled:   installations.filter(i => i.status === 'scheduled').length,
        qc_hold:     installations.filter(i => i.status === 'qc_hold').length,
    };

    const maxDealerEvents = Math.max(...FAULTS_BY_DEALER.map(d => d.events));
    const totalFaultEvents = HARNESS_FAULT_TYPES.reduce((s, f) => s + f.events, 0);

    const inner = (
        <>
            {!embedded && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Telematics Installations</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Production-line tracking from <span className="font-bold text-slate-700">Unit 9670</span> onwards, plus harness fault analysis from the installations report.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="bg-white hover:bg-slate-50 text-slate-600 border border-border px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
                            <Upload className="h-3.5 w-3.5" />
                            Update Line Records
                        </button>
                        <button className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded text-xs font-black uppercase tracking-widest shadow-sm transition-all">
                            + Log Manual Install
                        </button>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-border rounded-xl w-fit">
                {([
                    { id: 'log',    label: 'Installation Log',  icon: Truck    },
                    { id: 'faults', label: 'Harness Faults',    icon: Zap      },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-5 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all duration-200 flex items-center gap-2",
                            activeTab === tab.id
                                ? "bg-white text-accent shadow-sm ring-1 ring-border"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── INSTALLATION LOG TAB ── */}
            {activeTab === 'log' && (
                <>
                    {/* Status Summary Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(Object.entries(statusConfig) as [InstallStatus, typeof statusConfig[InstallStatus]][]).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setFilter(filter === key ? 'all' : key)}
                                    className={cn(
                                        "flex items-center gap-3 p-4 bg-white border rounded-xl transition-all hover:shadow-sm text-left",
                                        filter === key ? "border-accent/40 ring-1 ring-accent/20" : "border-border"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-lg ring-1", cfg.color)}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 uppercase font-black tracking-wider">{cfg.label}</p>
                                        <p className="text-xl font-black text-slate-800">{isLoading ? '...' : counts[key]}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Installations Table */}
                    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
                        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-lg">
                                    <Truck className="h-4 w-4 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                                        Installation Log — {filter === 'all' ? 'All Tracked Units' : statusConfig[filter as InstallStatus].label}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{filtered.length} matching records</p>
                                </div>
                            </div>
                            <div className="relative max-w-sm w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search unit, model or chassis no..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full border border-border rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
                                    <Clock className="h-6 w-6 animate-pulse text-accent/50" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Parsing Line Records...</p>
                                </div>
                            ) : (
                                <table className="w-full text-[12px]">
                                    <thead className="bg-white sticky top-0 shadow-sm z-10">
                                        <tr>
                                            {['Unit No', 'Build Ref', 'Model', 'Chassis No', 'Type', 'Date On-Line', 'Date Complete', 'Status'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-border">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-xs">
                                                    No installations found for the selected filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map(item => {
                                                const cfg  = statusConfig[item.status];
                                                const Icon = cfg.icon;
                                                return (
                                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="px-4 py-3 font-black text-slate-800 text-sm">{item.unit}</td>
                                                        <td className="px-4 py-3 text-slate-500 font-medium text-[11px]">{item.stockNumber}</td>
                                                        <td className="px-4 py-3 text-slate-700 font-bold">{item.model}</td>
                                                        <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{item.vin}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={cn("px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider", item.type === 'factory_fit' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700')}>
                                                                {item.type === 'factory_fit' ? 'Factory' : 'Retrofit'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{item.dateOnline || '—'}</td>
                                                        <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{item.dateComplete || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ring-1 text-[10px] font-black uppercase tracking-widest shadow-sm", cfg.color)}>
                                                                <Icon className="h-3 w-3" />
                                                                <span className="mt-px">{cfg.label}</span>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {!isLoading && (
                            <div className="px-4 py-3 border-t border-border bg-slate-50 text-[10px] text-slate-400 flex justify-between items-center">
                                <p>Showing <strong className="text-slate-600">{filtered.length}</strong> of <strong className="text-slate-600">{installations.length}</strong> active tracked units.</p>
                                <p className="font-mono">Export CSV</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── HARNESS FAULTS TAB ── */}
            {activeTab === 'faults' && (
                <>
                    {/* Source banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[12px] text-blue-700">
                            <span className="font-black">Source: 21.02.2026_Installations_Report.xlsx — </span>
                            {totalFaultEvents.toLocaleString()} harness disconnect events across all factory units, 14–21 Feb 2026. Data aggregated from the full report by fault type.
                        </p>
                    </div>

                    {/* Summary strip */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white border border-border rounded-xl p-5 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Events</p>
                            <p className="text-3xl font-black text-slate-800">{totalFaultEvents.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 mt-1">14–21 Feb 2026</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Fault</p>
                            <p className="text-3xl font-black text-purple-600">24,830</p>
                            <p className="text-[10px] text-slate-400 mt-1">Purple Harness Disconnected</p>
                        </div>
                        <div className="bg-white border border-border rounded-xl p-5 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fault Types</p>
                            <p className="text-3xl font-black text-slate-800">{HARNESS_FAULT_TYPES.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Distinct harness fault codes</p>
                        </div>
                    </div>

                    {/* Fault type breakdown */}
                    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-5">Fault Type Breakdown — {totalFaultEvents.toLocaleString()} Events</h3>
                        <div className="space-y-4">
                            {HARNESS_FAULT_TYPES.map(f => (
                                <div key={f.fault}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                                            <span className="text-[12px] font-bold text-slate-700">{f.fault}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[11px] font-black text-slate-400">{f.pct}%</span>
                                            <span className="text-[12px] font-black text-slate-800 w-16 text-right">{f.events.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${f.pct}%`, backgroundColor: f.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dealership breakdown chart */}
                    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-5">Events by Dealership</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={FAULTS_BY_DEALER} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }} barSize={16}>
                                <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="dealer" width={190} tick={{ fontSize: 9.5, fill: '#475569', fontWeight: 700 }}
                                    tickFormatter={v => v.replace('Powerstar ', '')} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    formatter={(value: number, _: string, entry: any) => [`${value.toLocaleString()} events · ${entry.payload.units} units`, entry.payload.dealer]}
                                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                                <Bar dataKey="events" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 9, fontWeight: 700, fill: '#64748b', formatter: (v: number) => v.toLocaleString() }}>
                                    {FAULTS_BY_DEALER.map((_, i) => (
                                        <Cell key={i} fill={i === 0 ? '#a855f7' : i === 1 ? '#f97316' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-2 text-[10px] text-slate-400 text-center">
                            Mock aggregated data · Source: 21.02.2026_Installations_Report.xlsx
                        </div>
                    </div>
                </>
            )}
        </>
    );

    if (embedded) return <div className="space-y-8">{inner}</div>;
    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            {inner}
        </div>
    );
};

export default OEMInstallations;
