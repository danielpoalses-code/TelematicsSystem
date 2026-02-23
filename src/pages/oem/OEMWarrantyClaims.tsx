import React, { useState } from 'react';
import {
    ShieldAlert, AlertTriangle, CheckCircle2, Clock,
    ChevronRight, Search, FileText, HelpCircle, DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
type Verdict = 'part_failure' | 'driver_fault' | 'pending' | 'inconclusive';
type Status  = 'open' | 'under_investigation' | 'resolved';
type Filter  = 'all' | Status | Verdict;

interface DriverBehaviour {
    harshBraking:   number;   // events / 100 km
    harshAccel:     number;   // events / 100 km
    speedingEvents: number;
    avgSpeedKph:    number;
    idlePct:        number;
    overallScore:   number;   // 0–100 (higher = better)
}

interface Claim {
    id:                 string;
    unitNumber:         string;
    make:               string;
    model:              string;
    year:               number;
    vin:                string;
    mileageKm:          number;
    partComponent:      string;
    failureDescription: string;
    dateFiled:          string;
    dateIncident:       string;
    dealership:         string;
    driver:             string;
    status:             Status;
    verdict:            Verdict;
    behaviour:          DriverBehaviour;
    notes:              string;
    estimatedCostZAR:   number;
    approvedZAR:        number | null;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const claims: Claim[] = [
    {
        id: 'WC-2026-001', unitNumber: '4821',
        make: 'Powerstar', model: 'VX2642', year: 2024,
        vin: 'PS2024VX2642-4821', mileageKm: 87_432,
        partComponent: 'Cooling System — Radiator',
        failureDescription: 'Coolant temperature exceeded 118°C on three consecutive days. Radiator cap seal failure suspected but telemetry shows sustained high-load driving with no coolant stops recorded.',
        dateFiled: '18 Feb 2026', dateIncident: '15 Feb 2026',
        dealership: 'Johannesburg North Motors', driver: 'T. Mokoena',
        status: 'under_investigation', verdict: 'driver_fault',
        behaviour: { harshBraking: 18, harshAccel: 22, speedingEvents: 47, avgSpeedKph: 112, idlePct: 4, overallScore: 38 },
        notes: 'Driver recorded running engine at continuous high RPM on long hauls with no rest stops. Coolant level adequate at last service check. Behaviour pattern strongly suggests thermal overload from driver misuse.',
        estimatedCostZAR: 24_800, approvedZAR: null,
    },
    {
        id: 'WC-2026-002', unitNumber: '3302',
        make: 'Powerstar', model: 'VX2642', year: 2023,
        vin: 'PS2023VX2642-3302', mileageKm: 142_100,
        partComponent: 'Transmission — Gear Selector',
        failureDescription: 'Gear selector mechanism seized at 5th gear. Gearbox internal inspection confirmed selector fork fracture — not wear-related. Clean break pattern consistent with casting defect.',
        dateFiled: '15 Feb 2026', dateIncident: '13 Feb 2026',
        dealership: 'Cape Town Fleet Centre', driver: 'J. van der Berg',
        status: 'resolved', verdict: 'part_failure',
        behaviour: { harshBraking: 4, harshAccel: 5, speedingEvents: 8, avgSpeedKph: 87, idlePct: 18, overallScore: 82 },
        notes: 'Metallurgical inspection confirmed manufacturing batch defect in selector fork casting (batch PS-TX-23-Q2). Warranty fully approved. Component replaced at no cost to operator.',
        estimatedCostZAR: 67_500, approvedZAR: 67_500,
    },
    {
        id: 'WC-2026-003', unitNumber: '7743',
        make: 'Powerstar', model: 'VX3346', year: 2024,
        vin: 'PS2024VX3346-7743', mileageKm: 54_210,
        partComponent: 'Braking System — Front Pads & Discs',
        failureDescription: 'Front brake pads worn to metal at 54,000 km. Expected minimum service life is 120,000 km under normal operation. Discs scored and warped from metal-on-metal contact.',
        dateFiled: '12 Feb 2026', dateIncident: '10 Feb 2026',
        dealership: 'Durban Truck & Commercial', driver: 'S. Dlamini',
        status: 'resolved', verdict: 'driver_fault',
        behaviour: { harshBraking: 41, harshAccel: 31, speedingEvents: 89, avgSpeedKph: 118, idlePct: 2, overallScore: 14 },
        notes: 'Telemetry shows 41 harsh braking events per 100 km — 8× above fleet average of 5. Claim declined. Driver retraining mandatory before return to duty. Replacement at operator cost.',
        estimatedCostZAR: 18_400, approvedZAR: 0,
    },
    {
        id: 'WC-2026-004', unitNumber: '5519',
        make: 'Powerstar', model: 'VX2642', year: 2023,
        vin: 'PS2023VX2642-5519', mileageKm: 201_000,
        partComponent: 'Fuel System — Injector Rail',
        failureDescription: 'Two fuel injectors failed on cylinders 3 and 4. Misfire codes P0303/P0304 logged repeatedly. Injectors seized internally — possible fuel quality issue.',
        dateFiled: '10 Feb 2026', dateIncident: '8 Feb 2026',
        dealership: 'Pretoria East Commercial Vehicles', driver: 'M. Sithole',
        status: 'under_investigation', verdict: 'pending',
        behaviour: { harshBraking: 9, harshAccel: 12, speedingEvents: 21, avgSpeedKph: 94, idlePct: 22, overallScore: 63 },
        notes: 'Fuel quality testing in progress. High idle time (22%) may indicate prolonged idling with non-standard fuel. Injectors sent to accredited lab for residue and carbon deposit analysis.',
        estimatedCostZAR: 31_200, approvedZAR: null,
    },
    {
        id: 'WC-2026-005', unitNumber: '2108',
        make: 'Powerstar', model: 'VX3346', year: 2024,
        vin: 'PS2024VX3346-2108', mileageKm: 28_900,
        partComponent: 'Suspension — Rear Air Bag',
        failureDescription: 'Rear left air bag ruptured at 28,900 km. Bag material showed micro-cracking consistent with manufacturing batch recall criteria.',
        dateFiled: '8 Feb 2026', dateIncident: '7 Feb 2026',
        dealership: 'East Rand Truck Specialists', driver: 'B. Nkosi',
        status: 'resolved', verdict: 'part_failure',
        behaviour: { harshBraking: 6, harshAccel: 7, speedingEvents: 12, avgSpeedKph: 88, idlePct: 16, overallScore: 79 },
        notes: 'Linked to production batch PS-Q3-2024-AB07. Proactive recall issued for 34 units. Full warranty coverage approved — unit repaired at no cost to operator.',
        estimatedCostZAR: 14_600, approvedZAR: 14_600,
    },
    {
        id: 'WC-2026-006', unitNumber: '9034',
        make: 'Powerstar', model: 'VX2642', year: 2022,
        vin: 'PS2022VX2642-9034', mileageKm: 318_400,
        partComponent: 'Electrical — Alternator',
        failureDescription: 'Alternator output dropped to 9V under load. Brushes and rectifier assembly burnt out. Diode pack failure confirmed on bench test.',
        dateFiled: '5 Feb 2026', dateIncident: '3 Feb 2026',
        dealership: 'George & Garden Route Motors', driver: 'P. Botha',
        status: 'open', verdict: 'part_failure',
        behaviour: { harshBraking: 7, harshAccel: 8, speedingEvents: 15, avgSpeedKph: 91, idlePct: 21, overallScore: 76 },
        notes: 'Unit at 318,400 km. Alternator rated for 300,000 km under normal load. Reviewing extended-use warranty exception. Driver behaviour well within acceptable range — not a contributing factor.',
        estimatedCostZAR: 9_800, approvedZAR: null,
    },
    {
        id: 'WC-2026-007', unitNumber: '6612',
        make: 'Powerstar', model: 'VX3346', year: 2023,
        vin: 'PS2023VX3346-6612', mileageKm: 61_800,
        partComponent: 'Drivetrain — Clutch Assembly',
        failureDescription: 'Clutch disc friction material worn to rivet heads at 61,800 km. Expected service life 180,000 km. Pressure plate also damaged from prolonged slip events.',
        dateFiled: '1 Feb 2026', dateIncident: '28 Jan 2026',
        dealership: 'Bloemfontein Truck Hub', driver: 'L. Erasmus',
        status: 'resolved', verdict: 'driver_fault',
        behaviour: { harshBraking: 28, harshAccel: 19, speedingEvents: 34, avgSpeedKph: 105, idlePct: 8, overallScore: 22 },
        notes: 'Clutch temperature sensor logged 14 sustained high-slip events exceeding 280°C. Telemetry confirms excessive clutch slipping on hill starts and in traffic. Claim declined — driver retraining issued.',
        estimatedCostZAR: 22_100, approvedZAR: 0,
    },
    {
        id: 'WC-2026-008', unitNumber: '3847',
        make: 'Powerstar', model: 'VX2642', year: 2024,
        vin: 'PS2024VX2642-3847', mileageKm: 44_300,
        partComponent: 'Drivetrain — Rear Differential',
        failureDescription: 'Differential bearing noise reported at 44,300 km. Workshop inspection found premature pitting on pinion bearings. GVW logs show unit operating within rated limits.',
        dateFiled: '28 Jan 2026', dateIncident: '25 Jan 2026',
        dealership: 'Nelspruit Commercial Vehicles', driver: 'A. Mahlangu',
        status: 'under_investigation', verdict: 'pending',
        behaviour: { harshBraking: 11, harshAccel: 13, speedingEvents: 19, avgSpeedKph: 96, idlePct: 14, overallScore: 59 },
        notes: 'Bearing samples sent to accredited metallurgical lab. Load data reviewed — unit consistently within rated GVW. Driver behaviour is moderate; no clear misuse pattern detected.',
        estimatedCostZAR: 38_700, approvedZAR: null,
    },
];

// ── Badge configs ─────────────────────────────────────────────────────────────
const verdictCfg: Record<Verdict, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    part_failure: { label: 'Part Failure',  bg: 'bg-blue-50',    text: 'text-blue-700',   icon: ShieldAlert },
    driver_fault: { label: 'Driver Fault',  bg: 'bg-orange-50',  text: 'text-orange-700', icon: AlertTriangle },
    pending:      { label: 'Pending',       bg: 'bg-yellow-50',  text: 'text-yellow-700', icon: HelpCircle },
    inconclusive: { label: 'Inconclusive',  bg: 'bg-slate-100',  text: 'text-slate-600',  icon: HelpCircle },
};

const statusCfg: Record<Status, { label: string; bg: string; text: string }> = {
    open:                { label: 'Open',          bg: 'bg-amber-50',   text: 'text-amber-700'   },
    under_investigation: { label: 'Investigating', bg: 'bg-purple-50',  text: 'text-purple-700'  },
    resolved:            { label: 'Resolved',      bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

// ── Small reusable badge components ──────────────────────────────────────────
const VerdictBadge: React.FC<{ verdict: Verdict }> = ({ verdict }) => {
    const c = verdictCfg[verdict];
    const Icon = c.icon;
    return (
        <span className={cn('inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded', c.bg, c.text)}>
            <Icon className="h-2.5 w-2.5" />{c.label}
        </span>
    );
};

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
    const c = statusCfg[status];
    return (
        <span className={cn('inline-flex text-[10px] font-black uppercase px-2 py-0.5 rounded', c.bg, c.text)}>
            {c.label}
        </span>
    );
};

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    const cls = score >= 70 ? 'text-emerald-600 bg-emerald-50' : score >= 45 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
    return <span className={cn('text-[10px] font-black px-2 py-0.5 rounded', cls)}>{score}/100</span>;
};

// ── Behaviour bar ─────────────────────────────────────────────────────────────
const BehaviourBar: React.FC<{ label: string; value: number; max: number; invertColor?: boolean }> = ({
    label, value, max, invertColor = false,
}) => {
    const pct = Math.min((value / max) * 100, 100);
    const barColor = invertColor
        ? pct > 60 ? 'bg-red-400'     : pct > 30 ? 'bg-amber-400' : 'bg-emerald-400'
        : pct > 70 ? 'bg-emerald-400' : pct > 40 ? 'bg-amber-400' : 'bg-red-400';
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 font-bold uppercase tracking-widest">{label}</span>
                <span className="font-black text-slate-700">{value}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

// ── Claim detail panel ────────────────────────────────────────────────────────
const ClaimDetail: React.FC<{ claim: Claim }> = ({ claim }) => {
    const b = claim.behaviour;
    const scoreColor = b.overallScore >= 70 ? 'text-emerald-600' : b.overallScore >= 45 ? 'text-amber-600' : 'text-red-600';
    const scoreStroke = b.overallScore >= 70 ? '#10b981' : b.overallScore >= 45 ? '#f59e0b' : '#ef4444';
    const r = 34;
    const circ = 2 * Math.PI * r;
    const dash = circ * (b.overallScore / 100);

    return (
        <div className="bg-white border border-border rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden divide-y divide-border">

            {/* Header */}
            <div className="p-5 flex items-start justify-between gap-4">
                <div>
                    <p className="font-mono text-[10px] text-slate-400 mb-1">{claim.id}</p>
                    <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight leading-snug">{claim.partComponent}</h2>
                    <p className="text-[11px] text-slate-500 mt-1">Unit #{claim.unitNumber} · {claim.make} {claim.model} {claim.year}</p>
                </div>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <VerdictBadge verdict={claim.verdict} />
                    <StatusBadge  status={claim.status} />
                </div>
            </div>

            {/* Claim meta */}
            <div className="p-5 grid grid-cols-2 gap-y-3 gap-x-4">
                {[
                    { label: 'Incident Date', value: claim.dateIncident },
                    { label: 'Filed Date',    value: claim.dateFiled },
                    { label: 'Driver',        value: claim.driver },
                    { label: 'Dealership',    value: claim.dealership },
                    { label: 'VIN',           value: claim.vin },
                    { label: 'Mileage',       value: `${claim.mileageKm.toLocaleString()} km` },
                    { label: 'Est. Cost',     value: `R ${claim.estimatedCostZAR.toLocaleString()}` },
                    { label: 'Approved',      value: claim.approvedZAR === null ? '— Pending' : claim.approvedZAR === 0 ? 'Declined' : `R ${claim.approvedZAR.toLocaleString()}` },
                ].map(row => (
                    <div key={row.label}>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.label}</p>
                        <p className="text-[11px] font-bold text-slate-700 mt-0.5 truncate">{row.value}</p>
                    </div>
                ))}
            </div>

            {/* Driver behaviour */}
            <div className="p-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Driver Behaviour Report</p>

                <div className="flex items-center gap-5 mb-4">
                    {/* Score ring */}
                    <div className="relative flex-shrink-0">
                        <svg width={84} height={84} viewBox="0 0 84 84">
                            <circle cx={42} cy={42} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
                            <circle cx={42} cy={42} r={r} fill="none"
                                stroke={scoreStroke} strokeWidth={8} strokeLinecap="round"
                                strokeDasharray={`${dash} ${circ}`}
                                transform="rotate(-90 42 42)" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn('text-xl font-black leading-none', scoreColor)}>{b.overallScore}</span>
                            <span className="text-[9px] text-slate-400 font-bold">/ 100</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2.5">
                        <BehaviourBar label="Harsh Braking / 100 km" value={b.harshBraking}   max={50}  invertColor />
                        <BehaviourBar label="Harsh Accel / 100 km"   value={b.harshAccel}     max={50}  invertColor />
                        <BehaviourBar label="Speeding Events"         value={b.speedingEvents} max={100} invertColor />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Avg Speed',  value: `${b.avgSpeedKph} km/h` },
                        { label: 'Idle Time',  value: `${b.idlePct}%` },
                        { label: 'Driver Score', value: `${b.overallScore}/100` },
                    ].map(s => (
                        <div key={s.label} className="bg-slate-50 rounded-lg px-3 py-2.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className="text-[12px] font-black text-slate-700 mt-0.5">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Failure description */}
            <div className="p-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Failure Description</p>
                <p className="text-[12px] text-slate-600 leading-relaxed">{claim.failureDescription}</p>
            </div>

            {/* Investigator notes */}
            <div className="p-5 bg-slate-50/60">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Investigator Notes</p>
                <p className="text-[12px] text-slate-600 leading-relaxed">{claim.notes}</p>
            </div>
        </div>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const OEMWarrantyClaims: React.FC = () => {
    const [selected, setSelected] = useState<Claim | null>(claims[0]);
    const [filter, setFilter]     = useState<Filter>('all');
    const [search, setSearch]     = useState('');

    const filtered = claims.filter(c => {
        const q = search.toLowerCase();
        const matchesSearch = q === '' ||
            c.id.toLowerCase().includes(q) ||
            c.unitNumber.includes(q) ||
            c.driver.toLowerCase().includes(q) ||
            c.partComponent.toLowerCase().includes(q) ||
            c.dealership.toLowerCase().includes(q);
        const matchesFilter =
            filter === 'all'       ? true :
            filter === 'open'      ? c.status  === 'open' :
            filter === 'under_investigation' ? c.status === 'under_investigation' :
            filter === 'resolved'  ? c.status  === 'resolved' :
            filter === 'part_failure' ? c.verdict === 'part_failure' :
            filter === 'driver_fault' ? c.verdict === 'driver_fault' :
            filter === 'pending'   ? c.verdict === 'pending' : true;
        return matchesSearch && matchesFilter;
    });

    const totalClaims    = claims.length;
    const openClaims     = claims.filter(c => c.status !== 'resolved').length;
    const partFaults     = claims.filter(c => c.verdict === 'part_failure').length;
    const driverFaults   = claims.filter(c => c.verdict === 'driver_fault').length;
    const totalEstimated = claims.reduce((s, c) => s + c.estimatedCostZAR, 0);
    const totalApproved  = claims.reduce((s, c) => s + (c.approvedZAR ?? 0), 0);

    const filterOptions: { key: Filter; label: string }[] = [
        { key: 'all',                label: 'All' },
        { key: 'open',               label: 'Open' },
        { key: 'under_investigation',label: 'Investigating' },
        { key: 'resolved',           label: 'Resolved' },
        { key: 'part_failure',       label: 'Part Failure' },
        { key: 'driver_fault',       label: 'Driver Fault' },
        { key: 'pending',            label: 'Pending' },
    ];

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700">

            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Warranty Claims</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Driver behaviour analysis · Part failure verification · Full claim traceability
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded text-xs font-black uppercase tracking-widest hover:bg-accent/90 transition-colors">
                    <FileText className="h-3.5 w-3.5" />
                    Lodge New Claim
                </button>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Total Claims',     value: totalClaims,                              icon: FileText,      color: 'text-slate-600',   bg: 'bg-slate-50'   },
                    { label: 'Open / Active',    value: openClaims,                               icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
                    { label: 'Part Failure',     value: partFaults,                               icon: ShieldAlert,   color: 'text-blue-600',    bg: 'bg-blue-50'    },
                    { label: 'Driver Fault',     value: driverFaults,                             icon: AlertTriangle, color: 'text-orange-600',  bg: 'bg-orange-50'  },
                    { label: 'Est. Exposure',    value: `R ${(totalEstimated / 1000).toFixed(0)}k`, icon: DollarSign,  color: 'text-red-600',     bg: 'bg-red-50'     },
                    { label: 'Approved Pay-out', value: `R ${(totalApproved  / 1000).toFixed(0)}k`, icon: CheckCircle2,color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(k => {
                    const Icon = k.icon;
                    return (
                        <div key={k.label} className={cn('rounded-xl p-4 border border-border', k.bg)}>
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={cn('h-3.5 w-3.5 shrink-0', k.color)} />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{k.label}</p>
                            </div>
                            <p className={cn('text-2xl font-black', k.color)}>{k.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Claims list + detail panel */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6 items-start">

                {/* Claims table */}
                <div className="bg-white border border-border rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search ID, unit, driver, component…"
                                className="w-full pl-9 pr-3 py-2 text-[12px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-accent/40 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {filterOptions.map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={cn(
                                        'px-2.5 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all',
                                        filter === f.key
                                            ? 'bg-accent text-white'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead className="bg-slate-50 border-b border-border">
                                <tr>
                                    {['Claim ID', 'Unit', 'Component', 'Date Filed', 'Driver Score', 'Verdict', 'Status', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left font-black text-[10px] text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(c => (
                                    <tr
                                        key={c.id}
                                        onClick={() => setSelected(c)}
                                        className={cn(
                                            'cursor-pointer transition-colors hover:bg-slate-50/70',
                                            selected?.id === c.id && 'bg-accent/5 border-l-2 border-l-accent'
                                        )}
                                    >
                                        <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">{c.id}</td>
                                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">#{c.unitNumber}</td>
                                        <td className="px-4 py-3 font-bold text-slate-700 max-w-[200px] truncate">{c.partComponent}</td>
                                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{c.dateFiled}</td>
                                        <td className="px-4 py-3"><ScoreBadge score={c.behaviour.overallScore} /></td>
                                        <td className="px-4 py-3"><VerdictBadge verdict={c.verdict} /></td>
                                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                        <td className="px-4 py-3 text-slate-300"><ChevronRight className="h-3.5 w-3.5" /></td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-[12px]">
                                            No claims match the current filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail panel */}
                {selected ? (
                    <ClaimDetail claim={selected} />
                ) : (
                    <div className="bg-white border border-border rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
                        <FileText className="h-8 w-8 text-slate-200" />
                        <p className="text-[12px] text-slate-400 max-w-[200px]">
                            Select a claim to view the driver behaviour report and full details.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OEMWarrantyClaims;
