import React, { useState } from 'react';
import {
    Users, Phone, Mail, MapPin, ChevronDown, ChevronRight,
    Building2, Truck, WifiOff, TrendingUp, Award, BarChart3,
    Globe, Search,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Dealership {
    name: string;
    city: string;
    units: number;
    offline: number;
}

interface RegionalManager {
    id: string;
    name: string;
    region: string;
    provinces: string[];
    phone: string;
    email: string;
    yearsActive: number;
    dealerships: Dealership[];
    targets: { monthly: number; achieved: number };
    color: string;
}

// ── Seeded Data ────────────────────────────────────────────────────────────────
const managers: RegionalManager[] = [
    {
        id: 'RM-001',
        name: 'Andre Potgieter',
        region: 'Coastal',
        provinces: ['KwaZulu-Natal', 'Western Cape', 'Eastern Cape', 'Northern Cape'],
        phone: '',
        email: '',
        yearsActive: 0,
        color: '#6366f1',
        dealerships: [
            { name: 'Powerstar Pinetown TCD',     city: 'Pinetown',        units: 58,  offline: 9  },
            { name: 'Powerstar Empangeni',         city: 'Empangeni',       units: 44,  offline: 11 },
            { name: 'Powerstar PMB – Almighty Eq.',city: 'Pietermaritzburg',units: 37,  offline: 14 },
            { name: 'Powerstar Brackenfell',       city: 'Brackenfell',     units: 25,  offline: 5  },
            { name: 'Powerstar Port Elizabeth',    city: 'Gqeberha',        units: 22,  offline: 3  },
            { name: 'Powerstar George',            city: 'George',          units: 10,  offline: 1  },
            { name: 'Powerstar Upington',          city: 'Upington',        units: 11,  offline: 2  },
        ],
        targets: { monthly: 20, achieved: 0 },
    },
    {
        id: 'RM-002',
        name: 'Thabo Nkosi',
        region: 'Gauteng',
        provinces: ['Gauteng'],
        phone: '+27 83 722 0191',
        email: 't.nkosi@powerstar.co.za',
        yearsActive: 8,
        color: '#14b8a6',
        dealerships: [
            { name: 'Powerstar Centurion',   city: 'Centurion',  units: 112, offline: 38 },
            { name: 'Powerstar Brakpan',     city: 'Brakpan',    units: 67,  offline: 20 },
            { name: 'Powerstar Wonderboom',  city: 'Pretoria',   units: 29,  offline: 5  },
        ],
        targets: { monthly: 20, achieved: 17 },
    },
    {
        id: 'RM-003',
        name: 'Jackie Pieterse',
        region: 'Mpumalanga',
        provinces: ['Mpumalanga'],
        phone: '',
        email: '',
        yearsActive: 0,
        color: '#f59e0b',
        dealerships: [
            { name: 'Powerstar Ermelo',      city: 'Ermelo',      units: 52, offline: 16 },
            { name: 'Powerstar Middelburg',  city: 'Middelburg',  units: 31, offline: 4  },
            { name: 'Powerstar Nelspruit',   city: 'Nelspruit',   units: 18, offline: 2  },
        ],
        targets: { monthly: 10, achieved: 0 },
    },
    {
        id: 'RM-005',
        name: 'Lindiwe Sithole',
        region: 'Northern Cape & Free State',
        provinces: ['Northern Cape', 'Free State'],
        phone: '+27 84 670 2213',
        email: 'l.sithole@powerstar.co.za',
        yearsActive: 3,
        color: '#22c55e',
        dealerships: [
            { name: 'Powerstar Bloemfontein',      city: 'Bloemfontein',    units: 19, offline: 2 },
            { name: 'Powerstar Kimberly',          city: 'Kimberly',        units: 14, offline: 2 },
            { name: 'Powerstar Schweizer-Reneke',  city: 'Schweizer-Reneke',units: 8,  offline: 2 },
        ],
        targets: { monthly: 7, achieved: 6 },
    },
    {
        id: 'RM-006',
        name: 'Andile Mahlangu',
        region: 'Limpopo',
        provinces: ['Limpopo'],
        phone: '+27 73 815 4490',
        email: 'a.mahlangu@powerstar.co.za',
        yearsActive: 5,
        color: '#8b5cf6',
        dealerships: [
            { name: 'Powerstar Polokwane',         city: 'Polokwane',  units: 41, offline: 11 },
        ],
        targets: { monthly: 6, achieved: 5 },
    },
    {
        id: 'RM-007',
        name: 'Ricardo Ferreira',
        region: 'International',
        provinces: ['Zimbabwe', 'Namibia', 'Botswana', 'Mozambique', 'Eswatini'],
        phone: '+27 82 304 7760',
        email: 'r.ferreira@powerstar.co.za',
        yearsActive: 7,
        color: '#ef4444',
        dealerships: [
            { name: 'Powerstar Zimbabwe – T/A Machinery', city: 'Harare',     units: 34, offline: 10 },
            { name: 'Powerstar Namibia – GDP Investments',city: 'Windhoek',   units: 31, offline: 15 },
            { name: 'Powerstar Namibia – Hendeca',        city: 'Swakopmund', units: 24, offline: 13 },
            { name: 'Powerstar Botswana',                 city: 'Gaborone',   units: 12, offline: 3  },
            { name: 'Powerstar Mozambique – Haps',        city: 'Maputo',     units: 9,  offline: 2  },
            { name: 'Swazi Bus & Truck',                  city: 'Matsapha',   units: 6,  offline: 1  },
        ],
        targets: { monthly: 14, achieved: 11 },
    },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
const InitialAvatar: React.FC<{ name: string; color: string }> = ({ name, color }) => {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-[13px] font-black shrink-0"
            style={{ background: color }}
        >
            {initials}
        </div>
    );
};

const TargetBar: React.FC<{ monthly: number; achieved: number; color: string }> = ({ monthly, achieved, color }) => {
    const pct = Math.min((achieved / monthly) * 100, 100);
    return (
        <div>
            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                <span>Target</span>
                <span style={{ color }}>{achieved} / {monthly} units</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
};

const ManagerCard: React.FC<{ mgr: RegionalManager }> = ({ mgr }) => {
    const [expanded, setExpanded] = useState(false);
    const totalUnits   = mgr.dealerships.reduce((s, d) => s + d.units, 0);
    const totalOffline = mgr.dealerships.reduce((s, d) => s + d.offline, 0);
    const onlinePct    = Math.round(((totalUnits - totalOffline) / totalUnits) * 100);

    return (
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Card header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-5 flex items-start justify-between gap-4 hover:bg-slate-50/40 transition-colors text-left"
            >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <InitialAvatar name={mgr.name} color={mgr.color} />
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-black text-slate-800 tracking-tight">{mgr.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: mgr.color }}>{mgr.region}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {mgr.provinces.map(p => (
                                <span key={p} className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">{p}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="hidden sm:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                        <p className="text-xl font-black text-slate-800">{mgr.dealerships.length}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dealers</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-black text-slate-800">{totalUnits}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Units</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-black" style={{ color: mgr.color }}>{onlinePct}%</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Online</p>
                    </div>
                    {mgr.yearsActive > 0 && (
                        <div className="text-center">
                            <p className="text-[11px] font-black text-slate-400">{mgr.yearsActive}y</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tenure</p>
                        </div>
                    )}
                </div>

                {expanded
                    ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                    : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                }
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-border">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">

                        {/* Contact */}
                        <div className="p-5 space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Contact Details</p>
                            {mgr.phone ? (
                                <div className="flex items-center gap-2.5">
                                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="text-[12px] font-bold text-slate-700">{mgr.phone}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5">
                                    <Phone className="h-3.5 w-3.5 text-slate-200 shrink-0" />
                                    <span className="text-[11px] text-slate-300 italic">Not yet added</span>
                                </div>
                            )}
                            {mgr.email ? (
                                <div className="flex items-center gap-2.5">
                                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="text-[12px] font-bold text-slate-700 truncate">{mgr.email}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5">
                                    <Mail className="h-3.5 w-3.5 text-slate-200 shrink-0" />
                                    <span className="text-[11px] text-slate-300 italic">Not yet added</span>
                                </div>
                            )}
                            <div className="flex items-start gap-2.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="text-[12px] font-bold text-slate-700">{mgr.provinces.join(', ')}</span>
                            </div>
                            {mgr.targets.monthly > 0 && (
                                <div className="pt-2">
                                    <TargetBar monthly={mgr.targets.monthly} achieved={mgr.targets.achieved} color={mgr.color} />
                                </div>
                            )}
                        </div>

                        {/* Dealership table */}
                        <div className="p-5 lg:col-span-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Dealerships Under Management</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[11px]">
                                    <thead>
                                        <tr>
                                            {['Dealership', 'City', 'Total Units', 'Offline', 'Online %'].map(h => (
                                                <th key={h} className="text-left pb-2 pr-3 font-black text-[9px] text-slate-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {mgr.dealerships.map(d => {
                                            const op = Math.round(((d.units - d.offline) / d.units) * 100);
                                            return (
                                                <tr key={d.name} className="hover:bg-slate-50/50">
                                                    <td className="py-2 pr-3 font-bold text-slate-700 max-w-[180px] truncate">{d.name}</td>
                                                    <td className="py-2 pr-3 text-slate-400">{d.city}</td>
                                                    <td className="py-2 pr-3 font-black text-slate-700">{d.units}</td>
                                                    <td className="py-2 pr-3">
                                                        <span className="font-black text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded ring-1 ring-red-100">{d.offline}</span>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full" style={{ width: `${op}%`, background: mgr.color }} />
                                                            </div>
                                                            <span className="font-black text-[10px]" style={{ color: mgr.color }}>{op}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const OEMRegionalManagers: React.FC = () => {
    const [search, setSearch] = useState('');

    const filtered = managers.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.region.toLowerCase().includes(search.toLowerCase()) ||
        m.provinces.some(p => p.toLowerCase().includes(search.toLowerCase()))
    );

    const totalUnits   = managers.reduce((s, m) => s + m.dealerships.reduce((a, d) => a + d.units, 0), 0);
    const totalOffline = managers.reduce((s, m) => s + m.dealerships.reduce((a, d) => a + d.offline, 0), 0);
    const totalDealers = managers.reduce((s, m) => s + m.dealerships.length, 0);

    const chartData = managers.map(m => ({
        name: m.region.length > 14 ? m.region.slice(0, 13) + '…' : m.region,
        units: m.dealerships.reduce((s, d) => s + d.units, 0),
        offline: m.dealerships.reduce((s, d) => s + d.offline, 0),
        color: m.color,
    }));

    return (
        <div className="p-4 lg:p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Regional Managers</h1>
                <p className="text-slate-500 text-sm mt-0.5">Territory overview — dealerships, unit coverage and performance targets per region</p>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Regional Managers', value: managers.length, icon: Users, color: 'text-slate-800', bg: 'bg-slate-100' },
                    { label: 'Dealerships Managed', value: totalDealers, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Units Under Management', value: totalUnits, icon: Truck, color: 'text-teal-600', bg: 'bg-teal-50' },
                    { label: 'Currently Offline', value: totalOffline, icon: WifiOff, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="bg-white border border-border rounded-xl p-5 shadow-sm">
                            <div className={cn('p-2.5 rounded-xl w-fit mb-3', kpi.bg)}>
                                <Icon className={cn('h-4 w-4', kpi.color)} />
                            </div>
                            <p className={cn('text-3xl font-black', kpi.color)}>{kpi.value}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{kpi.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Units per Region chart */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-slate-400" />
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Units per Region</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                        <Tooltip
                            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                            formatter={(value: number, name: string) => [value, name === 'units' ? 'Total Units' : 'Offline']}
                        />
                        <Bar dataKey="units" name="units" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                        </Bar>
                        <Bar dataKey="offline" name="offline" fill="#ef4444" fillOpacity={0.35} radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Manager cards */}
            <div>
                <div className="flex items-center justify-between mb-4 gap-4">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Manager Directory</h3>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name, region or province…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full border border-border rounded-lg py-1.5 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent/40 bg-white"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {filtered.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">No managers match your search.</p>
                    )}
                    {filtered.map(mgr => <ManagerCard key={mgr.id} mgr={mgr} />)}
                </div>
            </div>

        </div>
    );
};

export default OEMRegionalManagers;
