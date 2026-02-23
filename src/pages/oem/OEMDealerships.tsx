import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, Search, AlertTriangle, Truck, ChevronDown,
    Activity, Users, Shield, Package, Wrench, MessageSquare,
    CheckCircle2, Clock, Mail, MapPin, Layers, Star, Wifi,
    TrendingUp, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import { HAUL_TYPES } from '@/data/haulTypes';
import { DEALER_NAMES } from '@/data/dealerships';
import SalesLeaderboard from '@/pages/admin/SalesLeaderboard';

// ── Existing types ─────────────────────────────────────────────────────────────
type ServiceStatus = 'overdue' | 'due_soon' | 'ok';
type HaulType      = 'shorthaul' | 'longhaul' | 'unknown';

interface UnitRecord {
    unit: string; model: string; year: string; km: number;
    dealerId: string; client: string; haulType: HaulType;
    serviceInterval: number; distanceToService: number; serviceStatus: ServiceStatus;
}
interface DealerGroup {
    id: string; name: string; targetUnits: number;
    units: UnitRecord[]; clientMap: Map<string, UnitRecord[]>;
    namedClientCount: number; alertCount: number;
}
interface FleetCSVRow { unit: string; model: string; year: string; km: string; dealer_id: string; client: string; }

// ── New types ──────────────────────────────────────────────────────────────────
type ClientStatus =
    | 'active'
    | 'in-service'
    | 'parts-order'
    | 'awaiting-delivery'
    | 'query'
    | 'warranty';

interface ClientActivity {
    name:        string;
    trucks:      number;
    telematics:  boolean;
    rep:         string;
    status:      ClientStatus;
    note:        string;
    lastContact: string;
}
interface SalesRepEntry {
    name:    string;
    clients: ClientActivity[];
}
interface ModelInventory {
    model:          string;
    inStock:        number;
    orderedWaiting: number;
    sold:           number;
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<ClientStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    'active':            { label: 'Active',            color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2  },
    'in-service':        { label: 'In Service',        color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   icon: Wrench        },
    'parts-order':       { label: 'Awaiting Parts',    color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200', icon: Package       },
    'awaiting-delivery': { label: 'Awaiting Delivery', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  icon: Clock         },
    'query':             { label: 'Open Query',        color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200', icon: MessageSquare },
    'warranty':          { label: 'Warranty Claim',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',    icon: AlertTriangle },
};
const STATUS_NOTES: Record<ClientStatus, string[]> = {
    'active':            ['All units operational', 'Fleet running well', 'Serviced & compliant', 'No open items'],
    'in-service':        ['90,000km major service', 'Brake inspection underway', 'Diff service in progress', 'Engine service booked'],
    'parts-order':       ['Awaiting tyre delivery', 'Brake pads on order', 'Oil filters in transit', 'Awaiting windscreen'],
    'awaiting-delivery': ['1× VX 4034 — ETA 45 days', '2× FAW 26.280FT on order', '1× VX 2628 — ETA 30 days'],
    'query':             ['Tracking data gap reported', 'Geozone alert query raised', 'Driver app login issue', 'Service history query'],
    'warranty':          ['Gearbox fault — claim open', 'Engine oil consumption claim', 'Clutch warranty in progress'],
};
const REP_POOL = [
    'Thabo Nkosi',       'Zanele Dlamini',     'Johan van der Merwe', 'Pieter Botha',
    'Nomsa Sithole',     'Ruan du Plessis',    'Sipho Mahlangu',      'Linda Pretorius',
    'Bongani Zulu',      'Anele Mthembu',      'Kyle Ferreira',       'Siya Ndlovu',
    'Brendan Hartley',   'Chantelle Olivier',  'Thulani Mkhize',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function mkRng(seed: number) {
    let s = (seed * 2654435761) >>> 0;
    return (min: number, max: number): number => {
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return min + (s % (max - min + 1));
    };
}
function dateStr(daysAgo: number): string {
    const d = new Date('2026-02-22');
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}
function idSeed(id: string): number {
    return id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
}

function genClientActivities(clientEntries: [string, UnitRecord[]][], seed: number): ClientActivity[] {
    const rng = mkRng(seed * 13337 + 42);
    const statWeights: ClientStatus[] = [
        'active', 'active', 'active', 'active', 'active',
        'in-service', 'in-service',
        'parts-order',
        'query',
        'warranty',
        'awaiting-delivery',
    ];
    // Pick a small diverse rep pool for this dealer
    const repCount = Math.max(1, Math.min(4, Math.ceil(clientEntries.length / 4)));
    const usedIdx  = new Set<number>();
    const reps: string[] = [];
    for (let i = 0; i < repCount; i++) {
        let idx = rng(0, REP_POOL.length - 1);
        for (let t = 0; t < 8 && usedIdx.has(idx); t++) idx = rng(0, REP_POOL.length - 1);
        usedIdx.add(idx);
        reps.push(REP_POOL[idx]);
    }
    return clientEntries.map(([name, units]) => {
        const status = statWeights[rng(0, statWeights.length - 1)];
        const notes  = STATUS_NOTES[status];
        return {
            name,
            trucks:      units.length,
            telematics:  true,                              // all CSV units = telematics live
            rep:         reps[rng(0, reps.length - 1)],
            status,
            note:        notes[rng(0, notes.length - 1)],
            lastContact: dateStr(rng(1, 90)),
        };
    });
}

function genModelInventory(dealer: DealerGroup, seed: number): ModelInventory[] {
    const rng      = mkRng(seed * 7 + 999);
    const floorSet = new Set((dealer.clientMap.get('(Floor Stock)') ?? []).map(u => u.unit));
    const modelMap = new Map<string, { inStock: number; sold: number }>();
    for (const u of dealer.units) {
        const m = u.model || 'Powerstar';
        if (!modelMap.has(m)) modelMap.set(m, { inStock: 0, sold: 0 });
        const e = modelMap.get(m)!;
        if (floorSet.has(u.unit)) e.inStock++;
        else e.sold++;
    }
    return Array.from(modelMap.entries())
        .sort((a, b) => (b[1].inStock + b[1].sold) - (a[1].inStock + a[1].sold))
        .map(([model, { inStock, sold }]) => ({
            model,
            inStock,
            sold,
            orderedWaiting: rng(0, Math.max(2, Math.round((inStock + sold) * 0.15))),
        }));
}

// ── Dealer detail panel ────────────────────────────────────────────────────────
type DealerDetailTab = 'overview' | 'fleet' | 'activity' | 'team';

function DealerDetailPanel({ dealer }: { dealer: DealerGroup }) {
    const [tab, setTab] = useState<DealerDetailTab>('overview');
    const seed = idSeed(dealer.id);

    const clientEntries = useMemo(() =>
        Array.from(dealer.clientMap.entries())
            .filter(([k]) => k !== '(Floor Stock)')
            .sort((a, b) => b[1].length - a[1].length)
    , [dealer.clientMap]);

    const floorStock   = dealer.clientMap.get('(Floor Stock)') ?? [];
    const activities   = useMemo(() => genClientActivities(clientEntries, seed), [clientEntries, seed]);
    const modelInv     = useMemo(() => genModelInventory(dealer, seed),          [dealer, seed]);
    const overdueCount = dealer.units.filter(u => u.serviceStatus === 'overdue').length;
    const dueSoonCount = dealer.units.filter(u => u.serviceStatus === 'due_soon').length;
    const openActivities = activities.filter(a => a.status !== 'active').length;

    const salesTeam = useMemo((): SalesRepEntry[] => {
        const map = new Map<string, ClientActivity[]>();
        for (const a of activities) {
            if (!map.has(a.rep)) map.set(a.rep, []);
            map.get(a.rep)!.push(a);
        }
        return Array.from(map.entries())
            .map(([name, clients]) => ({ name, clients }))
            .sort((a, b) => b.clients.length - a.clients.length);
    }, [activities]);

    const TABS: { id: DealerDetailTab; label: string; icon: React.ElementType; badge?: number }[] = [
        { id: 'overview',  label: 'Overview',        icon: Layers   },
        { id: 'fleet',     label: 'Fleet Stock',     icon: Truck    },
        { id: 'activity',  label: 'Client Activity', icon: Users,  badge: openActivities > 0 ? openActivities : undefined },
        { id: 'team',      label: 'Sales Team',      icon: Star     },
    ];

    return (
        <div className="border-t border-border">
            {/* Tab bar */}
            <div className="flex border-b border-border bg-slate-50/60 overflow-x-auto">
                {TABS.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                'flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap shrink-0',
                                tab === t.id
                                    ? 'border-accent text-accent bg-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {t.label}
                            {t.badge !== undefined && (
                                <span className="ml-1 bg-amber-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="p-5 bg-white">

                {/* ══════════════════════════════════════
                    TAB: OVERVIEW
                ══════════════════════════════════════ */}
                {tab === 'overview' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                            {[
                                { label: 'Total Tracked',    value: dealer.units.length,     color: 'text-slate-700' },
                                { label: 'Floor Stock',      value: floorStock.length,       color: 'text-slate-500' },
                                { label: 'Named Clients',    value: clientEntries.length,    color: 'text-blue-600'  },
                                { label: 'Telematics Live',  value: activities.filter(a => a.telematics).length, color: 'text-emerald-600' },
                                { label: 'Open Activities',  value: openActivities,          color: openActivities > 0 ? 'text-amber-600' : 'text-emerald-600' },
                                { label: 'Sales Reps',       value: salesTeam.length,        color: 'text-purple-600'},
                                { label: 'Overdue Service',  value: overdueCount,            color: overdueCount > 0 ? 'text-red-600' : 'text-slate-400' },
                                { label: 'Due Soon',         value: dueSoonCount,            color: dueSoonCount > 0 ? 'text-amber-600' : 'text-slate-400' },
                            ].map(s => (
                                <div key={s.label} className="bg-slate-50 rounded-lg border border-slate-100 p-3 text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{s.label}</p>
                                    <p className={cn('text-xl font-black mt-1', s.color)}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Service alerts table */}
                        {(overdueCount > 0 || dueSoonCount > 0) && (
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Units Requiring Service Attention</p>
                                <div className="rounded-xl border border-border overflow-hidden max-h-72 overflow-y-auto">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 border-b border-border sticky top-0">
                                            <tr>
                                                {['Unit', 'Model', 'Client', 'Haul Type', 'Odometer', 'Status'].map(h => (
                                                    <th key={h} className="px-4 py-2 text-left font-black text-[9px] text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 bg-white">
                                            {dealer.units.filter(u => u.serviceStatus !== 'ok').map(u => (
                                                <tr key={u.unit} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="px-4 py-2 font-mono font-bold text-slate-700">{u.unit}</td>
                                                    <td className="px-4 py-2 text-slate-600">{u.model}</td>
                                                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{u.client || '(Floor Stock)'}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={cn('text-[9px] font-black px-2 py-0.5 rounded uppercase',
                                                            u.haulType === 'longhaul' ? 'bg-indigo-50 text-indigo-700' :
                                                            u.haulType === 'shorthaul' ? 'bg-fuchsia-50 text-fuchsia-700' :
                                                            'bg-slate-100 text-slate-500'
                                                        )}>{u.haulType}</span>
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-slate-500">{u.km.toLocaleString()} km</td>
                                                    <td className="px-4 py-2">
                                                        <span className={cn('text-[9px] font-black px-2 py-0.5 rounded',
                                                            u.serviceStatus === 'overdue'
                                                                ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                                                                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                                        )}>
                                                            {u.serviceStatus === 'overdue'
                                                                ? 'OVERDUE'
                                                                : `Due in ${u.distanceToService.toLocaleString()} km`
                                                            }
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: FLEET STOCK
                ══════════════════════════════════════ */}
                {tab === 'fleet' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Truck Inventory by Model</p>
                            <div className="flex flex-wrap gap-2 text-[9px]">
                                <span className="flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-600 font-black uppercase px-2.5 py-1 rounded-full">
                                    <Mail className="h-2.5 w-2.5" />Dispatch Emails
                                </span>
                                <span className="flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-600 font-black uppercase px-2.5 py-1 rounded-full">
                                    <MapPin className="h-2.5 w-2.5" />Geozone Reports
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-[11px] whitespace-nowrap">
                                <thead className="bg-slate-50 border-b border-border">
                                    <tr>
                                        {['Model', 'On Premises (In Stock)', 'Orders Awaiting Dispatch', 'Sold & Tracked', 'Total'].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-left font-black text-[9px] text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {modelInv.map(m => (
                                        <tr key={m.model} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3 font-bold text-slate-800">{m.model}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-black font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{m.inStock}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn('font-black font-mono px-2 py-0.5 rounded', m.orderedWaiting > 0 ? 'text-amber-600 bg-amber-50' : 'text-slate-300 bg-slate-50')}>
                                                    {m.orderedWaiting}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-black font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{m.sold}</span>
                                            </td>
                                            <td className="px-4 py-3 font-black font-mono text-slate-700">
                                                {m.inStock + m.orderedWaiting + m.sold}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                    <tr>
                                        <td className="px-4 py-2.5 font-black text-[9px] text-slate-400 uppercase tracking-widest">TOTAL</td>
                                        <td className="px-4 py-2.5 font-black font-mono text-emerald-600">{modelInv.reduce((s, m) => s + m.inStock, 0)}</td>
                                        <td className="px-4 py-2.5 font-black font-mono text-amber-600">{modelInv.reduce((s, m) => s + m.orderedWaiting, 0)}</td>
                                        <td className="px-4 py-2.5 font-black font-mono text-blue-600">{modelInv.reduce((s, m) => s + m.sold, 0)}</td>
                                        <td className="px-4 py-2.5 font-black font-mono text-slate-700">{modelInv.reduce((s, m) => s + m.inStock + m.orderedWaiting + m.sold, 0)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block shrink-0" />On Premises — at dealership, available for immediate delivery</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block shrink-0" />Awaiting Dispatch — ordered from factory, en-route or pending PDI</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block shrink-0" />Sold & Tracked — delivered to client, active on telematics</span>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: CLIENT ACTIVITY
                ══════════════════════════════════════ */}
                {tab === 'activity' && (
                    <div className="space-y-4">
                        {/* Status summary pills */}
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(STATUS_CFG) as ClientStatus[]).map(s => {
                                const count = activities.filter(a => a.status === s).length;
                                if (count === 0) return null;
                                const cfg  = STATUS_CFG[s];
                                const Icon = cfg.icon;
                                return (
                                    <span key={s} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wide', cfg.bg, cfg.border, cfg.color)}>
                                        <Icon className="h-3 w-3" />
                                        {count} {cfg.label}
                                    </span>
                                );
                            })}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                                <Wifi className="h-3 w-3" />
                                {activities.filter(a => a.telematics).length} Telematics Active
                            </span>
                        </div>

                        {activities.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-[12px] font-black uppercase">No client data available</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-border">
                                <table className="w-full text-[11px] whitespace-nowrap">
                                    <thead className="bg-slate-50 border-b border-border">
                                        <tr>
                                            {['Client', 'Trucks', 'Telematics', 'Sales Rep', 'Status', 'Notes', 'Last Contact'].map(h => (
                                                <th key={h} className="px-4 py-2.5 text-left font-black text-[9px] text-slate-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {activities.map(a => {
                                            const cfg  = STATUS_CFG[a.status];
                                            const Icon = cfg.icon;
                                            return (
                                                <tr key={a.name} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="px-4 py-2.5 font-bold text-slate-800">{a.name}</td>
                                                    <td className="px-4 py-2.5 font-mono font-bold text-center text-slate-600">{a.trucks}</td>
                                                    <td className="px-4 py-2.5">
                                                        {a.telematics
                                                            ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]"><Wifi className="h-3 w-3" />Active</span>
                                                            : <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[10px]">Pending</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-2.5 text-slate-600">{a.rep}</td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black', cfg.bg, cfg.color)}>
                                                            <Icon className="h-2.5 w-2.5" />{cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate" title={a.note}>{a.note}</td>
                                                    <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">{a.lastContact}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════
                    TAB: SALES TEAM
                ══════════════════════════════════════ */}
                {tab === 'team' && (
                    <div className="space-y-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {salesTeam.length} Sales Reps — {activities.length} Clients Allocated
                        </p>

                        {salesTeam.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-[12px] font-black uppercase">No client data available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {salesTeam.map(rep => {
                                    const totalTrucks  = rep.clients.reduce((s, c) => s + c.trucks, 0);
                                    const openItems    = rep.clients.filter(c => c.status !== 'active').length;
                                    const telCount     = rep.clients.filter(c => c.telematics).length;
                                    return (
                                        <div key={rep.name} className="bg-white border border-border rounded-xl p-4 shadow-sm">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="font-black text-slate-800">{rep.name}</p>
                                                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Sales Representative</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-slate-700">{rep.clients.length}</p>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Clients</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                <div className="bg-blue-50 rounded-lg py-2 text-center">
                                                    <p className="text-sm font-black text-blue-600">{totalTrucks}</p>
                                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Trucks</p>
                                                </div>
                                                <div className="bg-emerald-50 rounded-lg py-2 text-center">
                                                    <p className="text-sm font-black text-emerald-600">{telCount}</p>
                                                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Telematics</p>
                                                </div>
                                                <div className={cn('rounded-lg py-2 text-center', openItems > 0 ? 'bg-amber-50' : 'bg-slate-50')}>
                                                    <p className={cn('text-sm font-black', openItems > 0 ? 'text-amber-600' : 'text-slate-400')}>{openItems}</p>
                                                    <p className={cn('text-[8px] font-black uppercase tracking-widest', openItems > 0 ? 'text-amber-400' : 'text-slate-400')}>Open Items</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1 max-h-52 overflow-y-auto">
                                                {rep.clients.map(c => {
                                                    const cfg = STATUS_CFG[c.status];
                                                    return (
                                                        <div key={c.name} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                                                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[160px]" title={c.name}>{c.name}</span>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[9px] font-mono text-slate-400">{c.trucks}t</span>
                                                                <span className={cn('text-[8px] font-black px-1.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>{cfg.label}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────
type PageTab = 'network' | 'leaderboard';

const OEMDealerships: React.FC = () => {
    const [pageTab, setPageTab]         = useState<PageTab>('network');
    const [dealers, setDealers]         = useState<DealerGroup[]>([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [expandedDealer, setExpandedDealer] = useState<string | null>(null);
    const [search, setSearch]           = useState('');

    useEffect(() => {
        const loadFleetData = async () => {
            try {
                const response = await fetch('/fleet_condition.csv');
                if (!response.ok) throw new Error('CSV not found');
                const text = await response.text();

                Papa.parse<FleetCSVRow>(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const units: UnitRecord[] = results.data
                            .filter(row => row.dealer_id && row.unit)
                            .map(row => {
                                const km       = parseFloat(row.km) || 0;
                                const haulType: HaulType = HAUL_TYPES[row.unit] || 'unknown';
                                const interval = haulType === 'longhaul' ? 15000 : 10000;
                                const nextDue  = (Math.floor(km / interval) + 1) * interval;
                                const dist     = nextDue - km;
                                let serviceStatus: ServiceStatus = 'ok';
                                if (dist < 0) serviceStatus = 'overdue';
                                else if (dist <= 1500) serviceStatus = 'due_soon';
                                return {
                                    unit: row.unit, model: row.model || 'Powerstar', year: row.year || '2025',
                                    km, dealerId: row.dealer_id, client: row.client?.trim() || '',
                                    haulType, serviceInterval: interval, distanceToService: dist, serviceStatus,
                                };
                            });

                        const unitsByDealer = new Map<string, UnitRecord[]>();
                        units.forEach(u => {
                            if (!unitsByDealer.has(u.dealerId)) unitsByDealer.set(u.dealerId, []);
                            unitsByDealer.get(u.dealerId)!.push(u);
                        });

                        const dealerGroups: DealerGroup[] = DEALER_NAMES
                            .map(dealer => {
                                const dealerUnits = unitsByDealer.get(dealer.id) || [];
                                const clientMap   = new Map<string, UnitRecord[]>();
                                dealerUnits.forEach(u => {
                                    const key = u.client || '(Floor Stock)';
                                    if (!clientMap.has(key)) clientMap.set(key, []);
                                    clientMap.get(key)!.push(u);
                                });
                                const namedClientCount = Array.from(clientMap.keys()).filter(k => k !== '(Floor Stock)').length;
                                const alertCount = dealerUnits.filter(u => u.serviceStatus === 'overdue' || u.serviceStatus === 'due_soon').length;
                                return { id: dealer.id, name: dealer.name, targetUnits: dealer.targetUnits, units: dealerUnits, clientMap, namedClientCount, alertCount };
                            })
                            .filter(d => d.units.length > 0)
                            .sort((a, b) => b.units.length - a.units.length);

                        setDealers(dealerGroups);
                        setIsLoading(false);
                    },
                });
            } catch (err) {
                console.error('Fleet data load error:', err);
                setIsLoading(false);
            }
        };
        loadFleetData();
    }, []);

    const filtered = dealers.filter(d =>
        !search || d.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalTracked   = dealers.reduce((s, d) => s + d.units.length, 0);
    const totalClients   = dealers.reduce((s, d) => s + d.namedClientCount, 0);
    const totalAlerts    = dealers.reduce((s, d) => s + d.alertCount, 0);
    const totalFloor     = dealers.reduce((s, d) => s + (d.clientMap.get('(Floor Stock)') ?? []).length, 0);
    const networkTarget  = dealers.reduce((s, d) => s + d.targetUnits, 0);
    const coveragePct    = networkTarget > 0 ? Math.round((totalTracked / networkTarget) * 100) : 0;

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-accent/10 rounded-lg">
                            <Building2 className="h-6 w-6 text-accent" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Dealership Network</h1>
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Fleet inventory, client activity, telematics onboarding and sales team allocation across all franchised Powerstar dealerships.
                    </p>
                    {/* Page-level tab switcher */}
                    <div className="flex items-center gap-1 mt-3 p-1 bg-slate-100 border border-border rounded-xl w-fit">
                        {([
                            { id: 'network',     label: 'Dealership Network', icon: Building2 },
                            { id: 'leaderboard', label: 'Sales Leaderboard',  icon: Trophy    },
                        ] as { id: PageTab; label: string; icon: React.ElementType }[]).map(t => {
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setPageTab(t.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all',
                                        pageTab === t.id
                                            ? 'bg-white text-accent shadow-sm ring-1 ring-border'
                                            : 'text-slate-500 hover:text-slate-700'
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                    {/* Data feed badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Feeds:</span>
                        <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-600 font-black text-[9px] uppercase px-2.5 py-1 rounded-full">
                            <Mail className="h-2.5 w-2.5" />Dispatch Emails
                        </span>
                        <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-600 font-black text-[9px] uppercase px-2.5 py-1 rounded-full">
                            <MapPin className="h-2.5 w-2.5" />Geozone Reports
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 font-black text-[9px] uppercase px-2.5 py-1 rounded-full">
                            <Activity className="h-2.5 w-2.5" />Fleet Telematics
                        </span>
                    </div>
                </div>
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search dealership..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full border border-border rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 bg-white transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Leaderboard view */}
            {pageTab === 'leaderboard' && <SalesLeaderboard embedded />}

            {/* Network view */}
            {pageTab === 'network' && <React.Fragment>

            {/* Summary Strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Active Dealers',    value: isLoading ? '...' : dealers.length,    Icon: Building2,  color: 'text-slate-700',   bg: 'bg-slate-100'   },
                    { label: 'Trucks Tracked',    value: isLoading ? '...' : totalTracked,      Icon: Truck,      color: 'text-blue-700',    bg: 'bg-blue-100'    },
                    { label: 'On Premises',       value: isLoading ? '...' : totalFloor,        Icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-100' },
                    { label: 'Named Clients',     value: isLoading ? '...' : totalClients,      Icon: Users,      color: 'text-purple-700',  bg: 'bg-purple-100'  },
                    { label: 'Service Alerts',    value: isLoading ? '...' : totalAlerts,       Icon: AlertTriangle, color: totalAlerts > 0 ? 'text-red-700' : 'text-emerald-700', bg: totalAlerts > 0 ? 'bg-red-100' : 'bg-emerald-100' },
                    { label: `Coverage ${coveragePct}%`, value: isLoading ? '...' : `${coveragePct}%`, Icon: Wifi, color: coveragePct >= 80 ? 'text-emerald-700' : coveragePct >= 50 ? 'text-amber-700' : 'text-red-700', bg: 'bg-slate-100' },
                ].map(({ label, value, Icon, color, bg }) => (
                    <div key={label} className="bg-white border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className={cn('p-2 rounded-lg shrink-0', bg)}>
                            <Icon className={cn('h-4 w-4', color)} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
                            <p className={cn('text-xl font-black mt-0.5', color)}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dealer List */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 font-medium animate-pulse">Loading fleet data…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="h-40 flex items-center justify-center border border-border rounded-xl bg-white">
                    <p className="text-slate-400 text-sm">No dealerships match your search.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(dealer => {
                        const isExpanded  = expandedDealer === dealer.id;
                        const coveragePct = dealer.targetUnits > 0 ? Math.min(100, Math.round((dealer.units.length / dealer.targetUnits) * 100)) : 100;
                        const overdue     = dealer.units.filter(u => u.serviceStatus === 'overdue').length;
                        const dueSoon     = dealer.units.filter(u => u.serviceStatus === 'due_soon').length;
                        const floor       = (dealer.clientMap.get('(Floor Stock)') ?? []).length;

                        return (
                            <div key={dealer.id} className={cn('bg-white border rounded-xl shadow-sm overflow-hidden transition-all', isExpanded ? 'border-accent/40 ring-1 ring-accent/10' : 'border-border')}>
                                {/* Dealer row (clickable header) */}
                                <div
                                    className={cn('p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors', isExpanded && 'bg-slate-50/60 border-b border-border')}
                                    onClick={() => setExpandedDealer(isExpanded ? null : dealer.id)}
                                >
                                    <div className="flex items-center gap-4 min-w-[260px]">
                                        <div className={cn('p-3 rounded-lg shrink-0', isExpanded ? 'bg-accent/10' : 'bg-slate-100')}>
                                            <Building2 className={cn('h-5 w-5', isExpanded ? 'text-accent' : 'text-slate-600')} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800">{dealer.name}</h3>
                                            <p className="text-slate-400 text-xs mt-0.5">
                                                {dealer.units.length} tracked · {dealer.namedClientCount} clients · {floor} on premises
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 items-center justify-end gap-5 flex-wrap">
                                        {/* Coverage bar */}
                                        <div className="flex flex-col gap-1 min-w-[120px]">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coverage</span>
                                                <span className="text-[9px] font-black text-slate-600">{coveragePct}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full">
                                                <div className={cn('h-full rounded-full', coveragePct >= 80 ? 'bg-emerald-500' : coveragePct >= 50 ? 'bg-amber-500' : 'bg-red-400')} style={{ width: `${coveragePct}%` }} />
                                            </div>
                                            <span className="text-[8px] text-slate-400">{dealer.units.length}/{dealer.targetUnits} units</span>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {floor > 0 && (
                                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                                                    <Truck className="h-2.5 w-2.5" />{floor} In Stock
                                                </span>
                                            )}
                                            {overdue > 0 && (
                                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 ring-1 ring-red-200 text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                                                    <AlertTriangle className="h-2.5 w-2.5" />{overdue} Overdue
                                                </span>
                                            )}
                                            {dueSoon > 0 && (
                                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                                                    <Activity className="h-2.5 w-2.5" />{dueSoon} Due Soon
                                                </span>
                                            )}
                                            {!overdue && !dueSoon && (
                                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                                                    <Shield className="h-2.5 w-2.5" />All Clear
                                                </span>
                                            )}
                                        </div>

                                        <ChevronDown className={cn('h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300', isExpanded && 'rotate-180')} />
                                    </div>
                                </div>

                                {/* Expanded panel */}
                                {isExpanded && <DealerDetailPanel dealer={dealer} />}
                            </div>
                        );
                    })}
                </div>
            )}
            </React.Fragment>}
        </div>
    );
};

export default OEMDealerships;
