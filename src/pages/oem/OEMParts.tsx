import React, { useState, useMemo } from 'react';
import {
    Globe, Factory, Building2, Package, ShoppingCart, Wrench,
    Archive, TrendingUp, Ship, AlertTriangle, Search,
    ChevronDown, ChevronRight, Users, Receipt, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PartStats {
    ordered:      number;
    received:     number;
    sold:         number;
    usedWorkshop: number;
    inStock:      number;
}
interface PartLine {
    name:         string;
    category:     'fast' | 'slow';
    ordered:      number;
    received:     number;
    sold:         number;
    usedWorkshop: number;
    inStock:      number;
}
interface DealerNode {
    name:    string;
    short:   string;
    region:  string;
    country: string;
    units:   number;
    idx:     number;
    stats:   PartStats;
    fast:    PartLine[];
    slow:    PartLine[];
}
interface Batch {
    no:           string;
    dateOrdered:  string;
    dateReceived: string | null;
    qty:          number;
    status:       'received' | 'in-transit';
}
interface PartLineDetailed extends PartLine {
    group:     string;
    unitPrice: number;
    lastBatch: Batch | null;
}
interface SaleRecord {
    date:      string;
    daysAgo:   number;
    part:      string;
    client:    string;
    qty:       number;
    unitPrice: number;
    total:     number;
}
interface ClientProfile {
    name:       string;
    orders:     number;
    totalSpend: number;
    lastOrder:  string;
    topPart:    string;
}

// ── Part definitions ──────────────────────────────────────────────────────────
const FAST_DEF: [string, number, number, number][] = [
    ['Tyres',                    4.2,  0.60, 1.00],
    ['Brake Pads (sets)',         3.8,  1.20, 0.70],
    ['Engine Oil (L)',            80,   30,   35  ],
    ['Coolant (L)',               30,   10,   12  ],
    ['Power Steering Fluid (L)',  10,   3,    4   ],
    ['Gearbox Oil (L)',           20,   6,    8   ],
    ['Wiper Blades',              2,    0.80, 0.60],
    ['Headlight Bulbs',           3,    1.50, 0.50],
    ['Tail Light Bulbs',          4,    2.00, 0.50],
    ['Brake Fluid (L)',           8,    2,    3   ],
];
const SLOW_DEF: [string, number, number, number][] = [
    ['Dashboard Assembly',  0.30, 0.05, 0.08],
    ['Front Bumper',        0.50, 0.10, 0.10],
    ['Rear Bumper',         0.40, 0.08, 0.08],
    ['Safety Belts (set)',  0.60, 0.10, 0.12],
    ['Steering Wheel',      0.30, 0.05, 0.06],
    ['Driver Seat',         0.40, 0.06, 0.08],
    ['Passenger Seat',      0.30, 0.05, 0.06],
    ['Door Hinges (pair)',  0.80, 0.10, 0.12],
    ['Windscreen',          0.40, 0.06, 0.08],
    ['Side Mirror (pair)',  0.60, 0.08, 0.10],
];

// ── Logical groupings ─────────────────────────────────────────────────────────
const PART_GROUP: Record<string, string> = {
    'Tyres':                    'Tyres & Braking',
    'Brake Pads (sets)':        'Tyres & Braking',
    'Brake Fluid (L)':          'Tyres & Braking',
    'Engine Oil (L)':           'Fluids & Lubricants',
    'Coolant (L)':              'Fluids & Lubricants',
    'Power Steering Fluid (L)': 'Fluids & Lubricants',
    'Gearbox Oil (L)':          'Fluids & Lubricants',
    'Wiper Blades':             'Lighting & Visibility',
    'Headlight Bulbs':          'Lighting & Visibility',
    'Tail Light Bulbs':         'Lighting & Visibility',
    'Dashboard Assembly':       'Interior & Safety',
    'Safety Belts (set)':       'Interior & Safety',
    'Steering Wheel':           'Interior & Safety',
    'Driver Seat':              'Interior & Safety',
    'Passenger Seat':           'Interior & Safety',
    'Front Bumper':             'Structural',
    'Rear Bumper':              'Structural',
    'Door Hinges (pair)':       'Structural',
    'Windscreen':               'Structural',
    'Side Mirror (pair)':       'Structural',
};
const GROUP_ORDER = ['Tyres & Braking', 'Fluids & Lubricants', 'Lighting & Visibility', 'Structural', 'Interior & Safety'];
interface GroupMeta { icon: string; color: string; bg: string; border: string; }
const GROUP_META: Record<string, GroupMeta> = {
    'Tyres & Braking':      { icon: '🛞', color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-100'  },
    'Fluids & Lubricants':  { icon: '⛽', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-100'    },
    'Lighting & Visibility':{ icon: '💡', color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-100'  },
    'Structural':           { icon: '🏗️', color: 'text-slate-700',  bg: 'bg-slate-100',  border: 'border-slate-200'   },
    'Interior & Safety':    { icon: '🪑', color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-100'  },
};

// ── Pricing (ZAR per unit) ────────────────────────────────────────────────────
const PART_PRICE: Record<string, number> = {
    'Tyres':                    3200,
    'Brake Pads (sets)':         850,
    'Engine Oil (L)':            180,
    'Coolant (L)':                95,
    'Power Steering Fluid (L)':  120,
    'Gearbox Oil (L)':           150,
    'Wiper Blades':              280,
    'Headlight Bulbs':           450,
    'Tail Light Bulbs':          320,
    'Brake Fluid (L)':           110,
    'Dashboard Assembly':      18500,
    'Front Bumper':             8200,
    'Rear Bumper':              7500,
    'Safety Belts (set)':       3200,
    'Steering Wheel':           5800,
    'Driver Seat':             12400,
    'Passenger Seat':          11800,
    'Door Hinges (pair)':       2800,
    'Windscreen':               9200,
    'Side Mirror (pair)':       3600,
};

// ── SA transport & fleet clients ──────────────────────────────────────────────
const SA_CLIENTS = [
    'Transnet Freight Rail',  'Barloworld Transport',    'Unitrans Logistics',
    'Value Logistics',         'Imperial Logistics',      'Bidvest Panalpina',
    'Bulk Carriers SA',        'Massdiscounters Fleet',   'Pioneer Foods Logistics',
    'Anglo American Mining',   'Sasol Logistics',         'Pick n Pay Distribution',
    'Shoprite Logistics',      'Murray & Roberts',        'Aveng Transport',
    'Ndodana Transport',       'Khuluma Haulage',         'Sunrise Carriers',
    'Ubuntu Fleet Services',   'Mafuta Logistics',        'TFD Network Africa',
    'Rennies Distribution',    'Cargo Carriers Ltd',      'RTT Group',
    'Wentworth Transport',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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
function genParts(units: number, defs: [string, number, number, number][], category: 'fast' | 'slow'): PartLine[] {
    const u = Math.max(units, 1);
    return defs.map(([name, ordM, soldM, wrkM]) => {
        const ordered      = Math.max(1, Math.round(u * ordM));
        const received     = Math.round(ordered * 0.91);
        const sold         = Math.max(0, Math.round(u * soldM));
        const usedWorkshop = Math.max(0, Math.round(u * wrkM));
        const inStock      = Math.max(0, received - sold - usedWorkshop);
        return { name, category, ordered, received, sold, usedWorkshop, inStock };
    });
}
function sumStats(parts: PartLine[]): PartStats {
    return parts.reduce((a, p) => ({
        ordered:      a.ordered      + p.ordered,
        received:     a.received     + p.received,
        sold:         a.sold         + p.sold,
        usedWorkshop: a.usedWorkshop + p.usedWorkshop,
        inStock:      a.inStock      + p.inStock,
    }), { ordered: 0, received: 0, sold: 0, usedWorkshop: 0, inStock: 0 });
}
function genLastBatch(part: PartLine, dealerIdx: number): Batch | null {
    if (part.ordered === 0) return null;
    const nameSeed = part.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng      = mkRng(dealerIdx * 53 + nameSeed);
    const ordDays  = rng(20, 200);
    const leadDays = rng(14, 35);
    const recvDays = ordDays - leadDays;
    const received = recvDays > 0;
    return {
        no:           `B-${rng(1000, 9999)}`,
        dateOrdered:  dateStr(ordDays),
        dateReceived: received ? dateStr(recvDays) : null,
        qty:          Math.max(1, Math.round(part.ordered * rng(30, 60) / 100)),
        status:       received ? 'received' : 'in-transit',
    };
}
function genSales(dealer: DealerNode): SaleRecord[] {
    const rng     = mkRng(dealer.idx * 7919 + 31337);
    const records: SaleRecord[] = [];
    for (const part of [...dealer.fast, ...dealer.slow]) {
        if (part.sold <= 0) continue;
        const price   = PART_PRICE[part.name] ?? 500;
        const txCount = Math.max(1, Math.min(8, rng(1, Math.min(8, part.sold))));
        let   remain  = part.sold;
        for (let i = 0; i < txCount && remain > 0; i++) {
            const qty     = i === txCount - 1 ? remain : Math.max(1, Math.round(remain * rng(20, 60) / 100));
            const client  = SA_CLIENTS[rng(0, SA_CLIENTS.length - 1)];
            const daysAgo = rng(1, 365);
            records.push({ date: dateStr(daysAgo), daysAgo, part: part.name, client, qty, unitPrice: price, total: qty * price });
            remain -= qty;
        }
    }
    records.sort((a, b) => a.daysAgo - b.daysAgo); // most recent (smallest daysAgo) first
    return records;
}
function genClients(sales: SaleRecord[]): ClientProfile[] {
    const map = new Map<string, ClientProfile>();
    for (const s of sales) {
        const c = map.get(s.client);
        if (c) { c.orders++; c.totalSpend += s.total; }
        else    { map.set(s.client, { name: s.client, orders: 1, totalSpend: s.total, lastOrder: s.date, topPart: s.part }); }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
}

// ── Dealer list ───────────────────────────────────────────────────────────────
const RAW: Array<[string, string, string, string, number]> = [
    ['Powerstar Centurion',              'Centurion',        'Gauteng',       'South Africa', 243],
    ['Powerstar Ermelo',                 'Ermelo',           'Mpumalanga',    'South Africa', 87 ],
    ['Powerstar Empangeni',              'Empangeni',        'KwaZulu-Natal', 'South Africa', 66 ],
    ['Powerstar Pinetown TCD',           'Pinetown',         'KwaZulu-Natal', 'South Africa', 50 ],
    ['Powerstar Brackenfell',            'Brackenfell',      'Western Cape',  'South Africa', 45 ],
    ['Powerstar Brakpan',                'Brakpan',          'Gauteng',       'South Africa', 37 ],
    ['Powerstar Polokwane',              'Polokwane',        'Limpopo',       'South Africa', 35 ],
    ['Powerstar PMB – Almighty',         'PMB',              'KwaZulu-Natal', 'South Africa', 30 ],
    ['Powerstar Namibia – Windhoek',     'Windhoek',         'Khomas',        'Namibia',      28 ],
    ['Powerstar Namibia – Swakopmund',   'Swakopmund',       'Erongo',        'Namibia',      24 ],
    ['Powerstar Zimbabwe – Harare',      'Harare',           'Harare',        'Zimbabwe',     11 ],
    ['Powerstar Middelburg',             'Middelburg',       'Mpumalanga',    'South Africa', 8  ],
    ['Powerstar Port Elizabeth',         'Port Elizabeth',   'Eastern Cape',  'South Africa', 5  ],
    ['Powerstar Bloemfontein',           'Bloemfontein',     'Free State',    'South Africa', 3  ],
    ['Powerstar Wonderboom',             'Wonderboom',       'Gauteng',       'South Africa', 3  ],
    ['Powerstar Kimberly',               'Kimberly',         'Northern Cape', 'South Africa', 3  ],
    ['Powerstar Botswana',               'Gaborone',         'Gaborone',      'Botswana',     3  ],
    ['Powerstar Nelspruit',              'Nelspruit',        'Mpumalanga',    'South Africa', 2  ],
    ['Powerstar Mozambique – Matola',    'Matola',           'Maputo',        'Mozambique',   2  ],
    ['Powerstar Upington',               'Upington',         'Northern Cape', 'South Africa', 2  ],
    ['Powerstar Schweizer-Reneke',       'Schweizer-Reneke', 'North West',    'South Africa', 1  ],
    ['Powerstar Mozambique – Maputo',    'Maputo',           'Maputo',        'Mozambique',   1  ],
    ['Powerstar George',                 'George',           'Western Cape',  'South Africa', 1  ],
    ['Powerstar Swaziland – Matsapha',   'Matsapha',         'Manzini',       'Eswatini',     0  ],
];
const FLAGS: Record<string, string> = {
    'South Africa': '🇿🇦', 'Namibia': '🇳🇦', 'Zimbabwe': '🇿🇼',
    'Botswana': '🇧🇼',     'Mozambique': '🇲🇿', 'Eswatini': '🇸🇿',
};
const DEALERS: DealerNode[] = RAW.map(([name, short, region, country, units], idx) => {
    const fast = genParts(units, FAST_DEF, 'fast');
    const slow = genParts(units, SLOW_DEF, 'slow');
    const fS   = sumStats(fast);
    const sS   = sumStats(slow);
    return {
        name, short, region, country, units, idx, fast, slow,
        stats: {
            ordered:      fS.ordered      + sS.ordered,
            received:     fS.received     + sS.received,
            sold:         fS.sold         + sS.sold,
            usedWorkshop: fS.usedWorkshop + sS.usedWorkshop,
            inStock:      fS.inStock      + sS.inStock,
        },
    };
});

// ── Aggregate totals ──────────────────────────────────────────────────────────
const NETWORK_STATS: PartStats = DEALERS.reduce((a, d) => ({
    ordered:      a.ordered      + d.stats.ordered,
    received:     a.received     + d.stats.received,
    sold:         a.sold         + d.stats.sold,
    usedWorkshop: a.usedWorkshop + d.stats.usedWorkshop,
    inStock:      a.inStock      + d.stats.inStock,
}), { ordered: 0, received: 0, sold: 0, usedWorkshop: 0, inStock: 0 });

const FACTORY_STATS: PartStats = (() => {
    const ordered  = Math.round(NETWORK_STATS.received * 1.28);
    const received = Math.round(ordered * 0.91);
    const sold     = NETWORK_STATS.received;
    const workshop = 2800;
    return { ordered, received, sold, usedWorkshop: workshop, inStock: Math.max(0, received - sold - workshop) };
})();
const GLOBAL_STATS: PartStats = (() => {
    const ordered = Math.round(FACTORY_STATS.ordered * 1.12);
    return { ordered, received: FACTORY_STATS.ordered, sold: FACTORY_STATS.ordered, usedWorkshop: 0, inStock: Math.round(FACTORY_STATS.ordered * 0.07) };
})();

// ── Metric config ─────────────────────────────────────────────────────────────
const METRICS = [
    { key: 'ordered',      label: 'Ordered',  mini: 'ORD', color: 'text-slate-600',   darkColor: 'text-slate-200',   bg: 'bg-slate-50',    darkBg: 'bg-white/8',          icon: ShoppingCart },
    { key: 'received',     label: 'Received', mini: 'RCV', color: 'text-blue-600',    darkColor: 'text-blue-200',    bg: 'bg-blue-50',     darkBg: 'bg-blue-400/15',      icon: Package      },
    { key: 'sold',         label: 'Sold',     mini: 'SLD', color: 'text-emerald-600', darkColor: 'text-emerald-200', bg: 'bg-emerald-50',  darkBg: 'bg-emerald-400/15',   icon: TrendingUp   },
    { key: 'usedWorkshop', label: 'Workshop', mini: 'WRK', color: 'text-purple-600',  darkColor: 'text-purple-200',  bg: 'bg-purple-50',   darkBg: 'bg-purple-400/15',    icon: Wrench       },
    { key: 'inStock',      label: 'In Stock', mini: 'STK', color: 'text-indigo-600',  darkColor: 'text-indigo-200',  bg: 'bg-indigo-50',   darkBg: 'bg-indigo-400/15',    icon: Archive      },
] as const;

// ── Full metric bar ───────────────────────────────────────────────────────────
function MetricBar({ stats, dark = false }: { stats: PartStats; dark?: boolean }) {
    return (
        <div className="grid grid-cols-5 gap-2">
            {METRICS.map(m => {
                const Icon = m.icon;
                const val  = stats[m.key as keyof PartStats];
                return (
                    <div key={m.key} className={cn('rounded-xl p-3 flex flex-col items-center border', dark ? cn(m.darkBg, 'border-white/10') : cn(m.bg, 'border-slate-100'))}>
                        <Icon className={cn('h-3.5 w-3.5 mb-1', dark ? m.darkColor : m.color)} />
                        <p className={cn('text-base font-black tabular-nums leading-none', dark ? m.darkColor : m.color)}>
                            {val >= 10000 ? `${(val / 1000).toFixed(0)}k` : val.toLocaleString()}
                        </p>
                        <p className={cn('text-[8px] font-black uppercase tracking-wide mt-1', dark ? 'text-white/40' : 'text-slate-400')}>{m.label}</p>
                    </div>
                );
            })}
        </div>
    );
}

// ── Compact metric strip ──────────────────────────────────────────────────────
function MiniMetrics({ stats }: { stats: PartStats }) {
    return (
        <div className="grid grid-cols-5 gap-0.5">
            {METRICS.map(m => {
                const val     = stats[m.key as keyof PartStats];
                const display = val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val);
                return (
                    <div key={m.key} className={cn('rounded py-1 flex flex-col items-center', m.bg)}>
                        <p className={cn('text-[10px] font-black tabular-nums leading-none', m.color)}>{display}</p>
                        <p className="text-[7px] font-bold text-slate-400 leading-none mt-0.5">{m.mini}</p>
                    </div>
                );
            })}
        </div>
    );
}

// ── Dealer detail panel ───────────────────────────────────────────────────────
type DetailTab = 'stock' | 'sales' | 'clients';

function DealerDetailPanel({ dealer, onClose }: { dealer: DealerNode; onClose: () => void }) {
    const [tab, setTab] = useState<DetailTab>('stock');

    // Build detailed parts with group + price + last batch
    const detailedParts = useMemo<PartLineDetailed[]>(() =>
        [...dealer.fast, ...dealer.slow].map(p => ({
            ...p,
            group:     PART_GROUP[p.name] ?? 'Other',
            unitPrice: PART_PRICE[p.name] ?? 0,
            lastBatch: genLastBatch(p, dealer.idx),
        })), [dealer]);

    // Group by logical category
    const grouped = useMemo(() =>
        GROUP_ORDER.map(g => ({ name: g, parts: detailedParts.filter(p => p.group === g) }))
                   .filter(g => g.parts.length > 0)
    , [detailedParts]);

    const sales   = useMemo(() => genSales(dealer),   [dealer]);
    const clients = useMemo(() => genClients(sales),  [sales]);

    const totalStockValue = detailedParts.reduce((s, p) => s + p.inStock * p.unitPrice, 0);
    const totalSalesValue = sales.reduce((s, r) => s + r.total, 0);

    const TABS: { id: DetailTab; label: string; icon: React.ElementType }[] = [
        { id: 'stock',   label: 'Parts Inventory', icon: Layers  },
        { id: 'sales',   label: 'Sales Ledger',    icon: Receipt },
        { id: 'clients', label: 'Client Base',     icon: Users   },
    ];

    return (
        <div className="bg-white border border-accent/20 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">

            {/* ── Header ── */}
            <div className="p-5 border-b border-border bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-3xl leading-none">{FLAGS[dealer.country] ?? '🌍'}</span>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dealership Parts Detail</p>
                        <h3 className="font-black text-slate-800 text-lg leading-tight">{dealer.name}</h3>
                        <p className="text-[10px] text-slate-500">{dealer.region} · {dealer.country} · {dealer.units} tracked units</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 self-start sm:self-auto">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock Value</p>
                        <p className="text-sm font-black text-indigo-600">R {totalStockValue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sales Revenue</p>
                        <p className="text-sm font-black text-emerald-600">R {totalSalesValue.toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 border border-border rounded-lg px-3 py-1.5 transition-colors">
                        Close ×
                    </button>
                </div>
            </div>

            {/* ── Tab bar ── */}
            <div className="flex border-b border-border bg-slate-50/40 overflow-x-auto">
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
                        </button>
                    );
                })}
            </div>

            <div className="p-5">

                {/* ══════════════════════════════════════════
                    TAB: PARTS INVENTORY
                ══════════════════════════════════════════ */}
                {tab === 'stock' && (
                    <div className="space-y-6">

                        {/* Summary bar */}
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">All Parts — Overall Summary</p>
                            <MetricBar stats={dealer.stats} />
                        </div>

                        {/* Grouped tables */}
                        {grouped.map(g => {
                            const meta = GROUP_META[g.name] ?? { icon: '📦', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };
                            return (
                                <div key={g.name}>
                                    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3', meta.bg, meta.border)}>
                                        <span className="text-sm leading-none">{meta.icon}</span>
                                        <span className={cn('text-[10px] font-black uppercase tracking-widest', meta.color)}>{g.name}</span>
                                    </div>
                                    <div className="overflow-x-auto rounded-xl border border-border">
                                        <table className="w-full text-[11px] whitespace-nowrap">
                                            <thead className="bg-slate-50 border-b border-border">
                                                <tr>
                                                    {['Part', 'Date Ordered', 'Date Received', 'Ordered', 'Received', 'Sold', 'Workshop', 'In Stock', 'Unit Price (R)', 'Stock Value (R)'].map(h => (
                                                        <th key={h} className="px-3 py-2.5 text-left font-black text-[9px] text-slate-400 uppercase tracking-widest">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 bg-white">
                                                {g.parts.map(p => {
                                                    const stockValue = p.inStock * p.unitPrice;
                                                    const lowStock   = p.inStock <= 0
                                                        ? 'text-red-600 bg-red-50 ring-1 ring-red-200'
                                                        : p.category === 'fast' && p.inStock < 20
                                                            ? 'text-amber-600 bg-amber-50 ring-1 ring-amber-200'
                                                            : p.category === 'slow' && p.inStock < 3
                                                                ? 'text-amber-600 bg-amber-50 ring-1 ring-amber-200'
                                                                : 'text-indigo-600 bg-indigo-50';
                                                    return (
                                                        <tr key={p.name} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-3 py-2.5 font-bold text-slate-700">{p.name}</td>
                                                            <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">
                                                                {p.lastBatch?.dateOrdered ?? '—'}
                                                            </td>
                                                            <td className="px-3 py-2.5 font-mono text-[10px]">
                                                                {p.lastBatch?.status === 'received'
                                                                    ? <span className="text-emerald-600 font-bold">{p.lastBatch.dateReceived}</span>
                                                                    : <span className="text-amber-500 font-bold">In Transit</span>
                                                                }
                                                            </td>
                                                            <td className="px-3 py-2.5 font-mono text-slate-500">{p.ordered.toLocaleString()}</td>
                                                            <td className="px-3 py-2.5 font-mono font-bold text-blue-600">{p.received.toLocaleString()}</td>
                                                            <td className="px-3 py-2.5 font-mono font-bold text-emerald-600">{p.sold.toLocaleString()}</td>
                                                            <td className="px-3 py-2.5 font-mono font-bold text-purple-600">{p.usedWorkshop.toLocaleString()}</td>
                                                            <td className="px-3 py-2.5">
                                                                <span className={cn('font-black font-mono px-2 py-0.5 rounded text-[11px]', lowStock)}>
                                                                    {p.inStock.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2.5 font-mono text-slate-600">{p.unitPrice.toLocaleString()}</td>
                                                            <td className="px-3 py-2.5 font-mono font-bold text-slate-700">{stockValue.toLocaleString()}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    TAB: SALES LEDGER
                ══════════════════════════════════════════ */}
                {tab === 'sales' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
                                <p className="text-2xl font-black text-emerald-600">R {totalSalesValue.toLocaleString()}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 pb-1">{sales.length} transactions · most recent first</p>
                        </div>

                        {sales.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-[12px] font-black uppercase">No sales recorded</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-border">
                                <table className="w-full text-[11px] whitespace-nowrap">
                                    <thead className="bg-slate-50 border-b border-border">
                                        <tr>
                                            {['Date', 'Part', 'Client', 'Qty', 'Unit Price (R)', 'Total (R)'].map(h => (
                                                <th key={h} className="px-4 py-2.5 text-left font-black text-[9px] text-slate-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {sales.map((s, i) => (
                                            <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">{s.date}</td>
                                                <td className="px-4 py-2.5 font-bold text-slate-700">{s.part}</td>
                                                <td className="px-4 py-2.5 text-slate-600">{s.client}</td>
                                                <td className="px-4 py-2.5 font-mono text-slate-500 text-center">{s.qty.toLocaleString()}</td>
                                                <td className="px-4 py-2.5 font-mono text-slate-600">{s.unitPrice.toLocaleString()}</td>
                                                <td className="px-4 py-2.5 font-mono font-black text-emerald-600">{s.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    TAB: CLIENT BASE
                ══════════════════════════════════════════ */}
                {tab === 'clients' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{clients.length} Active Clients — Ranked by Total Spend</p>
                        </div>

                        {clients.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-[12px] font-black uppercase">No client data</p>
                                <p className="text-[10px] mt-1">This dealership has no recorded sales</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {clients.map((c, i) => (
                                    <div
                                        key={c.name}
                                        className={cn(
                                            'rounded-xl border p-4 bg-white transition-shadow hover:shadow-md',
                                            i === 0 ? 'border-amber-200 ring-1 ring-amber-100' : 'border-border'
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{c.name}</p>
                                                <p className="text-[9px] text-slate-400 mt-0.5 truncate">Top part: {c.topPart}</p>
                                            </div>
                                            {i === 0 && (
                                                <span className="ml-2 shrink-0 text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                    #1
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-center">
                                            <div className="bg-slate-50 rounded-lg py-2">
                                                <p className="text-sm font-black text-slate-700">{c.orders}</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Orders</p>
                                            </div>
                                            <div className="bg-emerald-50 rounded-lg py-2">
                                                <p className="text-[11px] font-black text-emerald-600">
                                                    R {c.totalSpend >= 1000000
                                                        ? `${(c.totalSpend / 1000000).toFixed(1)}M`
                                                        : c.totalSpend >= 1000
                                                            ? `${(c.totalSpend / 1000).toFixed(0)}k`
                                                            : c.totalSpend.toLocaleString()}
                                                </p>
                                                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Spend</p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg py-2">
                                                <p className="text-[9px] font-bold text-blue-600 leading-tight">{c.lastOrder}</p>
                                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Last Order</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OEMParts() {
    const [expandedDealer, setExpandedDealer] = useState<string | null>(null);
    const [search, setSearch]                 = useState('');
    const [catFilter, setCatFilter]           = useState<'all' | 'fast' | 'slow'>('all');

    const filteredDealers = DEALERS.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())   ||
        d.region.toLowerCase().includes(search.toLowerCase()) ||
        d.country.toLowerCase().includes(search.toLowerCase())
    );
    const selectedDealer = expandedDealer ? DEALERS.find(d => d.name === expandedDealer) ?? null : null;

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Parts Logistics</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                    Supply chain hierarchy — global suppliers → Powerstar Factory HQ → {DEALERS.length}-dealership distribution network across 6 countries.
                </p>
            </div>

            {/* ════════════════════════════════════════════════════════
                TIER 1 — GLOBAL SUPPLIERS
            ════════════════════════════════════════════════════════ */}
            <div className="flex flex-col items-center">
                <div className="w-full max-w-3xl bg-gradient-to-br from-blue-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-blue-800/40">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-400/20 rounded-xl border border-blue-400/20">
                                <Globe className="h-5 w-5 text-blue-300" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Tier 1 — Global Supply Origin</p>
                                <h2 className="text-base font-black text-white">Global Suppliers — China</h2>
                                <p className="text-[10px] text-blue-300/80">Yuchai Group · FAW Jiefang · Wuhan Engine Co. · +13 OEM vendors</p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <div className="bg-amber-400/20 border border-amber-400/30 rounded-xl px-3 py-2 text-center">
                                <p className="text-[8px] font-black text-amber-300 uppercase tracking-widest">In Transit</p>
                                <p className="text-xl font-black text-amber-200">3</p>
                                <p className="text-[8px] text-amber-400">containers · ETA Mar 2026</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
                                <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Vendors</p>
                                <p className="text-xl font-black text-white">16</p>
                                <p className="text-[8px] text-white/40">active suppliers</p>
                            </div>
                        </div>
                    </div>
                    <MetricBar stats={GLOBAL_STATS} dark />
                </div>

                {/* Connector: global → factory */}
                <div className="flex flex-col items-center py-1">
                    <div className="w-px h-7 bg-slate-300" />
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                        <Ship className="h-3 w-3 text-blue-400" />
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Ocean Freight → Durban Port</span>
                    </div>
                    <div className="w-px h-7 bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>

                {/* ════════════════════════════════════════════════════════
                    TIER 2 — POWERSTAR FACTORY HQ
                ════════════════════════════════════════════════════════ */}
                <div className="w-full max-w-3xl bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 shadow-xl border border-slate-600/40">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
                                <Factory className="h-5 w-5 text-slate-200" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tier 2 — Central Warehouse & Distribution HQ</p>
                                <h2 className="text-base font-black text-white">Powerstar Factory HQ</h2>
                                <p className="text-[10px] text-slate-400">Pietermaritzburg, KwaZulu-Natal · Main parts warehouse &amp; dispatch hub</p>
                            </div>
                        </div>
                        <div className="bg-emerald-400/20 border border-emerald-400/30 rounded-xl px-3 py-2 text-center shrink-0">
                            <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest">Dispatching to</p>
                            <p className="text-xl font-black text-emerald-200">{DEALERS.length}</p>
                            <p className="text-[8px] text-emerald-400">dealerships · 6 countries</p>
                        </div>
                    </div>
                    <MetricBar stats={FACTORY_STATS} dark />
                </div>

                {/* Connector: factory → dealer network */}
                <div className="flex flex-col items-center py-1">
                    <div className="w-px h-7 bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════
                TIER 3 — DISTRIBUTION NETWORK
            ════════════════════════════════════════════════════════ */}
            <div className="space-y-5">

                {/* Section label */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-slate-200" />
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                            Tier 3 — Distribution Network · {DEALERS.length} Dealerships · 6 Countries
                        </span>
                    </div>
                    <div className="flex-1 border-t border-slate-200" />
                </div>

                {/* Network-wide total */}
                <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Combined Network Total — All {DEALERS.length} Dealerships
                    </p>
                    <MetricBar stats={NETWORK_STATS} />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 border border-border rounded-xl">
                        {([
                            { id: 'all',  label: 'All Parts'      },
                            { id: 'fast', label: '⚡ Fast Moving'  },
                            { id: 'slow', label: '🔩 Slow Moving'  },
                        ] as const).map(f => (
                            <button
                                key={f.id}
                                onClick={() => setCatFilter(f.id)}
                                className={cn(
                                    'px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all',
                                    catFilter === f.id
                                        ? 'bg-white text-accent shadow-sm ring-1 ring-border'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter dealerships…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="border border-border rounded-lg py-1.5 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent/40 bg-white w-44"
                        />
                    </div>
                </div>

                {/* Dealer grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {filteredDealers.map(dealer => {
                        const isExpanded   = expandedDealer === dealer.name;
                        const displayStats =
                            catFilter === 'fast' ? sumStats(dealer.fast) :
                            catFilter === 'slow' ? sumStats(dealer.slow) :
                            dealer.stats;
                        const criticalLow  = displayStats.inStock < 15;

                        return (
                            <button
                                key={dealer.name}
                                onClick={() => setExpandedDealer(isExpanded ? null : dealer.name)}
                                className={cn(
                                    'text-left bg-white border rounded-xl p-3 shadow-sm transition-all hover:shadow-md group',
                                    isExpanded
                                        ? 'border-accent ring-1 ring-accent/20 shadow-md'
                                        : criticalLow
                                            ? 'border-amber-200 ring-1 ring-amber-100'
                                            : 'border-border'
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-base leading-none">{FLAGS[dealer.country] ?? '🌍'}</span>
                                    {criticalLow && !isExpanded && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                                    {isExpanded
                                        ? <ChevronDown  className="h-3 w-3 text-accent shrink-0" />
                                        : <ChevronRight className="h-3 w-3 text-slate-300 shrink-0 group-hover:text-slate-500 transition-colors" />
                                    }
                                </div>
                                <p className="text-[11px] font-black text-slate-800 leading-tight mb-0.5 truncate" title={dealer.name}>
                                    {dealer.short}
                                </p>
                                <p className="text-[9px] text-slate-400 mb-2 truncate">
                                    {dealer.units} units · {dealer.region}
                                </p>
                                <MiniMetrics stats={displayStats} />
                            </button>
                        );
                    })}
                </div>

                {/* Expanded dealer detail */}
                {selectedDealer && (
                    <DealerDetailPanel
                        dealer={selectedDealer}
                        onClose={() => setExpandedDealer(null)}
                    />
                )}

            </div>
        </div>
    );
}
