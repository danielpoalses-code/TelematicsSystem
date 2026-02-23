import React, { useState } from 'react';
import {
    Box, Plus, History, AlertTriangle, Cpu, Radio,
    ChevronDown, ChevronRight, ArrowRight, Globe, MapPin,
    Package, Building2, Factory, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────
type OrderStatus = 'draft' | 'submitted' | 'confirmed' | 'in_transit' | 'customs' | 'received';
type OrderedBy = 'khulu' | 'factory';
type SupplierTab = 'galileo' | 'pmb';

/** Three-way split: Khulu warehouse / Factory complete kits / Factory loose units */
interface ThreeWayStock {
    khulu: number;           // Khulu Digital warehouse
    factoryComplete: number; // Factory — full kit (with harnesses / pedal interface)
    factoryLoose: number;    // Factory — loose units for swap-outs
    buffer: number;
    allocated: number;
}

/** Simple two-location stock for individual harness/cable lines */
interface SimpleStock {
    khulu: number;
    factory: number;
}

interface SupplierOrder {
    id: string;
    ref: string;
    orderedBy: OrderedBy;
    items: { description: string; qty: number; unitPrice: number }[];
    status: OrderStatus;
    origin: 'China' | 'Local';
    orderDate: string;
    expectedArrival: string;
    notes: string;
}

// ── Stock Data ─────────────────────────────────────────────────────────────────
const galileoStock: ThreeWayStock = {
    khulu:           18,
    factoryComplete:  6,   // complete kits (Galileo + limiter harness + pedal interface)
    factoryLoose:     2,   // bare Galileo units — swap-outs for faulty devices
    buffer:          30,
    allocated:      142,
};

const hansComboStock: ThreeWayStock = {
    khulu:           0,
    factoryComplete: 0,   // complete combos (limiter+GPS + all harnesses)
    factoryLoose:    0,   // loose limiter+GPS units, no harnesses
    buffer:         20,
    allocated:      68,
};

const hansHarnesses: Record<string, { label: string; desc: string; stock: SimpleStock }> = {
    orange: {
        label: 'Orange Harness',
        desc: 'Main vehicle power & signal harness — orange sheath.',
        stock: { khulu: 0, factory: 0 },
    },
    purple: {
        label: 'Purple Harness',
        desc: 'Secondary signal harness — purple sheath.',
        stock: { khulu: 0, factory: 0 },
    },
    limiterGalileo: {
        label: 'Limiter ↔ Galileo Harness',
        desc: 'Dedicated harness bridging the Hans limiter to the Galileo unit.',
        stock: { khulu: 0, factory: 0 },
    },
    rjCable: {
        label: 'RJ Cable (Limiter → GPS)',
        desc: 'RJ-style data cable that runs from the limiter board to the GPS module.',
        stock: { khulu: 0, factory: 0 },
    },
    black: {
        label: 'Black Harness',
        desc: 'Ground / earth harness — black sheath.',
        stock: { khulu: 0, factory: 0 },
    },
};

// ── Orders ─────────────────────────────────────────────────────────────────────
const galileoOrders: SupplierOrder[] = [
    {
        id: 'g1', ref: 'GAL-KH-2024-012', orderedBy: 'khulu',
        items: [{ description: 'Galileo 10x GPS Unit', qty: 50, unitPrice: 3200 }],
        status: 'in_transit', origin: 'China',
        orderDate: '2024-01-10', expectedArrival: '2024-04-10',
        notes: 'Ordered by Khulu Digital. Sea freight via Durban port.',
    },
    {
        id: 'g2', ref: 'GAL-KH-2024-008', orderedBy: 'khulu',
        items: [{ description: 'Galileo 10x GPS Unit', qty: 100, unitPrice: 3050 }],
        status: 'received', origin: 'China',
        orderDate: '2023-09-01', expectedArrival: '2023-12-15',
        notes: 'Ordered by Khulu Digital. Received and split between Khulu & Factory.',
    },
    {
        id: 'g3', ref: 'GAL-FC-2024-009', orderedBy: 'factory',
        items: [{ description: 'Galileo 10x GPS Unit', qty: 30, unitPrice: 3100 }],
        status: 'received', origin: 'China',
        orderDate: '2023-10-11', expectedArrival: '2024-01-20',
        notes: 'Ordered by Powerstar Factory. Stock held at factory for immediate SKD use.',
    },
];

const pmbOrders: SupplierOrder[] = [
    {
        id: 'p1', ref: 'PMB-KH-2024-019', orderedBy: 'khulu',
        items: [
            { description: 'Hans Limiter + GPS Combo', qty: 30, unitPrice: 4800 },
            { description: 'Orange Harness', qty: 30, unitPrice: 850 },
            { description: 'Purple Harness', qty: 30, unitPrice: 750 },
            { description: 'Limiter ↔ Galileo Harness', qty: 30, unitPrice: 620 },
            { description: 'RJ Cable (Limiter → GPS)', qty: 30, unitPrice: 280 },
            { description: 'Black Harness', qty: 30, unitPrice: 400 },
        ],
        status: 'submitted', origin: 'Local',
        orderDate: '2024-02-15', expectedArrival: '2024-02-28',
        notes: 'Ordered by Khulu Digital. Urgent restock — delivered to Khulu warehouse first.',
    },
    {
        id: 'p2', ref: 'PMB-FC-2024-011', orderedBy: 'factory',
        items: [
            { description: 'Hans Limiter + GPS Combo', qty: 20, unitPrice: 4800 },
            { description: 'Orange Harness', qty: 20, unitPrice: 850 },
            { description: 'Black Harness', qty: 20, unitPrice: 400 },
        ],
        status: 'received', origin: 'Local',
        orderDate: '2024-01-08', expectedArrival: '2024-01-20',
        notes: 'Ordered by Powerstar Factory. Received and allocated to current SKD batch.',
    },
];

// ── Status config ──────────────────────────────────────────────────────────────
const orderStatusConfig: Record<OrderStatus, { label: string; color: string }> = {
    draft:      { label: 'Draft',      color: 'bg-slate-100 text-slate-500'    },
    submitted:  { label: 'Submitted',  color: 'bg-blue-50 text-blue-600'       },
    confirmed:  { label: 'Confirmed',  color: 'bg-indigo-50 text-indigo-600'   },
    in_transit: { label: 'In Transit', color: 'bg-amber-50 text-amber-600'     },
    customs:    { label: 'Customs',    color: 'bg-orange-50 text-orange-700'   },
    received:   { label: 'Received',   color: 'bg-emerald-50 text-emerald-600' },
};

// ── Three-Way Stock Card ───────────────────────────────────────────────────────
const ThreeWayStockCard: React.FC<{
    label: string;
    partNumber?: string;
    desc: string;
    icon: React.ElementType;
    completeLabel: string;
    looseLabel: string;
    data: ThreeWayStock;
}> = ({ label, partNumber, desc, icon: Icon, completeLabel, looseLabel, data }) => {
    const total = data.khulu + data.factoryComplete + data.factoryLoose;
    const isLow = total > 0 && total < data.buffer;
    const isCritical = total === 0;

    return (
        <div className={cn(
            "bg-white border rounded-xl p-5 shadow-sm space-y-4",
            isCritical ? "border-red-200 ring-1 ring-red-100" : isLow ? "border-amber-200" : "border-border"
        )}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", isCritical ? "bg-red-50" : isLow ? "bg-amber-50" : "bg-slate-50")}>
                        <Icon className={cn("h-4 w-4", isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-slate-400")} />
                    </div>
                    <div>
                        <p className="text-[12px] font-black text-slate-800">{label}</p>
                        {partNumber && <p className="text-[9px] font-mono text-slate-400">{partNumber}</p>}
                    </div>
                </div>
                <span className={cn("text-[9px] font-black uppercase px-2 py-1 rounded shrink-0",
                    isCritical ? "bg-red-50 text-red-600" : isLow ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                )}>
                    {isCritical ? '⚠ Out of Stock' : isLow ? 'Low Stock' : `${total} units`}
                </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>

            {/* Three-way split */}
            <div className="grid grid-cols-3 gap-2">
                {/* Khulu Digital */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-2">
                        <Building2 className="h-3 w-3 text-accent" />
                        <p className="text-[8px] font-black text-accent uppercase tracking-wider">Khulu Digital</p>
                    </div>
                    <p className={cn("text-2xl font-black", data.khulu === 0 ? "text-red-500" : "text-slate-800")}>{data.khulu}</p>
                    <p className="text-[8px] text-slate-400 leading-tight mt-0.5">warehouse</p>
                </div>

                {/* Factory — Complete */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-2">
                        <Factory className="h-3 w-3 text-blue-500" />
                        <p className="text-[8px] font-black text-blue-500 uppercase tracking-wider">Factory</p>
                    </div>
                    <p className={cn("text-2xl font-black", data.factoryComplete === 0 ? "text-red-500" : "text-slate-800")}>{data.factoryComplete}</p>
                    <p className="text-[8px] text-slate-500 leading-tight mt-0.5">{completeLabel}</p>
                </div>

                {/* Factory — Loose */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-2">
                        <Layers className="h-3 w-3 text-slate-400" />
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Factory</p>
                    </div>
                    <p className={cn("text-2xl font-black", data.factoryLoose === 0 ? "text-red-500" : "text-slate-800")}>{data.factoryLoose}</p>
                    <p className="text-[8px] text-slate-500 leading-tight mt-0.5">{looseLabel}</p>
                </div>
            </div>

            {/* Progress bar */}
            <div>
                <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                    <span>Combined: {total} / {data.buffer} buffer</span>
                    <span>{data.allocated} allocated</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-px">
                    <div className="h-full bg-accent rounded-l-full transition-all"
                        style={{ width: `${Math.min((data.khulu / data.buffer) * 100, 100)}%` }} />
                    <div className="h-full bg-blue-400 transition-all"
                        style={{ width: `${Math.min((data.factoryComplete / data.buffer) * 100, 100)}%` }} />
                    <div className="h-full bg-slate-300 rounded-r-full transition-all"
                        style={{ width: `${Math.min((data.factoryLoose / data.buffer) * 100, 100)}%` }} />
                </div>
                <div className="flex gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-[9px] text-slate-400"><div className="h-1.5 w-2.5 rounded bg-accent" /> Khulu</div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400"><div className="h-1.5 w-2.5 rounded bg-blue-400" /> Complete</div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400"><div className="h-1.5 w-2.5 rounded bg-slate-300" /> Loose</div>
                </div>
            </div>
        </div>
    );
};

// ── Harness Stock Panel ────────────────────────────────────────────────────────
const HarnessPanel: React.FC = () => (
    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Box className="h-4 w-4 text-accent" />
                Harnesses &amp; Cables
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Individual harness and cable stock included in Hans combo installations</p>
        </div>
        <div className="divide-y divide-slate-50">
            {Object.entries(hansHarnesses).map(([key, { label, desc, stock }]) => {
                const total = stock.khulu + stock.factory;
                return (
                    <div key={key} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-slate-800">{label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <div className="text-center bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 min-w-[72px]">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Building2 className="h-2.5 w-2.5 text-accent" />
                                    <p className="text-[8px] font-black text-accent uppercase tracking-wider">Khulu</p>
                                </div>
                                <p className={cn("text-xl font-black", stock.khulu === 0 ? "text-red-500" : "text-slate-800")}>{stock.khulu}</p>
                            </div>
                            <div className="text-center bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-2 min-w-[72px]">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Factory className="h-2.5 w-2.5 text-blue-500" />
                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-wider">Factory</p>
                                </div>
                                <p className={cn("text-xl font-black", stock.factory === 0 ? "text-red-500" : "text-slate-800")}>{stock.factory}</p>
                            </div>
                            <div className="text-center bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 min-w-[72px]">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Total</p>
                                <p className={cn("text-xl font-black", total === 0 ? "text-red-500" : "text-slate-700")}>{total}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

// ── Orders Table ───────────────────────────────────────────────────────────────
const OrdersTable: React.FC<{
    orders: SupplierOrder[];
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
}> = ({ orders, expandedId, setExpandedId }) => (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Package className="h-4 w-4 text-accent" />
                Purchase Orders
            </h3>
            <span className="text-[10px] text-slate-400">{orders.length} records</span>
        </div>
        <div className="divide-y divide-slate-50">
            {orders.map(order => {
                const isExpanded = expandedId === order.id;
                const cfg = orderStatusConfig[order.status];
                const total = order.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
                const byKhulu = order.orderedBy === 'khulu';
                return (
                    <div key={order.id}>
                        <div
                            className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                    <span className="font-black text-[13px] text-slate-800">{order.ref}</span>
                                    <span className={cn("flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                        byKhulu ? "bg-accent/10 text-accent" : "bg-blue-50 text-blue-600"
                                    )}>
                                        {byKhulu ? <Building2 className="h-3 w-3" /> : <Factory className="h-3 w-3" />}
                                        {byKhulu ? 'Khulu' : 'Factory'}
                                    </span>
                                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                        order.origin === 'China' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                                    )}>
                                        {order.origin === 'China'
                                            ? <><Globe className="inline h-3 w-3 mr-0.5" />China</>
                                            : <><MapPin className="inline h-3 w-3 mr-0.5" />Local</>}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400">{order.items.map(i => `${i.description} ×${i.qty}`).join(' · ')}</p>
                            </div>
                            <div className="hidden md:block text-right shrink-0">
                                <p className="font-black text-slate-800 text-[13px]">R {total.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400">{order.orderDate} → {order.expectedArrival}</p>
                            </div>
                            <span className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0", cfg.color)}>{cfg.label}</span>
                            {isExpanded
                                ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                                : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                        </div>

                        {isExpanded && (
                            <div className="px-5 pb-5 bg-slate-50/50 border-t border-border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Line Items</p>
                                        <div className="space-y-2">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-[12px] bg-white border border-border rounded-lg px-4 py-2.5">
                                                    <span className="font-medium text-slate-700">{item.description}</span>
                                                    <span className="font-black text-slate-800">
                                                        ×{item.qty} @ R{item.unitPrice.toLocaleString()} = <span className="text-accent">R{(item.qty * item.unitPrice).toLocaleString()}</span>
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between text-[12px] pt-1">
                                                <span className="font-black text-slate-500">Total</span>
                                                <span className="font-black text-slate-900">R {total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</p>
                                        <div className="bg-white border border-border rounded-lg p-4 text-[12px] text-slate-600 italic">{order.notes}</div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 bg-accent hover:bg-accent-hover text-white text-[10px] font-black uppercase py-2 rounded-lg flex items-center justify-center gap-1 transition-all">
                                                Update Status <ArrowRight className="h-3 w-3" />
                                            </button>
                                            <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase py-2 rounded-lg transition-all">
                                                <History className="h-3 w-3 inline mr-1" /> History
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
const HardwareStock: React.FC = () => {
    const [tab, setTab] = useState<SupplierTab>('galileo');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const galileoTotal = galileoStock.khulu + galileoStock.factoryComplete + galileoStock.factoryLoose;
    const hansTotal    = hansComboStock.khulu + hansComboStock.factoryComplete + hansComboStock.factoryLoose;

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Hardware Orders</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Stock split by holder — Khulu Digital warehouse, Factory complete kits, and Factory loose units.
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded text-xs font-black uppercase tracking-widest shadow-sm transition-all">
                    <Plus className="h-3.5 w-3.5" />
                    New Purchase Order
                </button>
            </div>

            {/* Stock Alerts */}
            {(galileoTotal < galileoStock.buffer || hansTotal === 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[12px] text-amber-800">
                        <span className="font-black">Stock Alert: </span>
                        {galileoTotal < galileoStock.buffer && (
                            <span>Galileo combined stock ({galileoTotal}) is below buffer ({galileoStock.buffer}). </span>
                        )}
                        {hansTotal === 0 && (
                            <span>Hans Limiter + GPS Combos are out of stock at all locations. </span>
                        )}
                    </div>
                </div>
            )}

            {/* Supplier Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {([
                    ['galileo', '📡 Galileo (GPS Units)'],
                    ['pmb',     '🔧 Hans (Limiter + GPS)'],
                ] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={cn(
                            "px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                            tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── GALILEO TAB ── */}
            {tab === 'galileo' && (
                <div className="space-y-6">
                    <ThreeWayStockCard
                        label="Galileo 10x GPS Unit"
                        partNumber="GAL-10X-GPS"
                        desc="Primary tracking device installed in all Powerstar trucks. Factory-fit during SKD assembly."
                        icon={Radio}
                        completeLabel="complete kits (with limiter harness + pedal interface)"
                        looseLabel="loose units — swap faulty devices"
                        data={galileoStock}
                    />

                    {/* Legend explaining the two factory stocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <Factory className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest">Factory — Complete Kits</p>
                                <p className="text-[11px] text-blue-600 mt-0.5">
                                    Full installation bundle: Galileo unit + limiter harness + pedal interface.
                                    Ready to fit directly onto a new truck during SKD assembly.
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
                            <Layers className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Factory — Loose Units</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Bare Galileo devices only — no harness or pedal interface.
                                    Used to swap out faulty or damaged units on existing installed trucks.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-border rounded-xl p-5 text-[11px] space-y-1 text-slate-500 shadow-sm">
                        <p className="font-black text-slate-700 text-[12px] mb-2">Supplier: Galileo — Global (China / EU)</p>
                        <p><span className="font-black text-slate-600">Lead Time:</span> ~90 days (sea freight, Durban port)</p>
                        <p><span className="font-black text-slate-600">Unit Price:</span> ~R 3,050 – R 3,200 per unit</p>
                        <p><span className="font-black text-slate-600">Warehouse:</span> Khulu receives and splits stock to factory as needed</p>
                    </div>

                    <OrdersTable orders={galileoOrders} expandedId={expandedId} setExpandedId={setExpandedId} />
                </div>
            )}

            {/* ── HANS TAB ── */}
            {tab === 'pmb' && (
                <div className="space-y-6">
                    <ThreeWayStockCard
                        label="Hans Limiter + GPS Combo"
                        partNumber="PMB-LIM-GPS"
                        desc="Speed limiter and GPS module combined. One combo unit per truck installation, supplied with a full harness set."
                        icon={Cpu}
                        completeLabel="complete combos (with all harnesses)"
                        looseLabel="loose units — no harnesses"
                        data={hansComboStock}
                    />

                    {/* Legend */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                            <Factory className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest">Factory — Complete Combos</p>
                                <p className="text-[11px] text-blue-600 mt-0.5">
                                    Full kit: Limiter + GPS unit packaged with orange, purple, black harnesses,
                                    the limiter↔Galileo harness, and the RJ cable. Ready for SKD assembly.
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
                            <Layers className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Factory — Loose Units</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Bare Limiter + GPS unit only — no harnesses.
                                    Used to replace faulty limiters on already-installed trucks.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Harnesses */}
                    <HarnessPanel />

                    <div className="bg-white border border-border rounded-xl p-5 text-[11px] space-y-1 text-slate-500 shadow-sm">
                        <p className="font-black text-slate-700 text-[12px] mb-2">Supplier: Hans (PMB Local) — KwaZulu-Natal</p>
                        <p><span className="font-black text-slate-600">Lead Time:</span> ~10 working days</p>
                        <p><span className="font-black text-slate-600">Each complete install requires:</span> 1× Combo + Orange + Purple + Black harnesses + Limiter↔Galileo harness + RJ cable</p>
                        <p><span className="font-black text-slate-600">Note:</span> Orders can be placed by Khulu or by the Factory independently</p>
                    </div>

                    <OrdersTable orders={pmbOrders} expandedId={expandedId} setExpandedId={setExpandedId} />
                </div>
            )}
        </div>
    );
};

export default HardwareStock;
