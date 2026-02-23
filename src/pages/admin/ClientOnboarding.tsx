import React, { useState } from 'react';
import {
    Wrench, Truck, Plus, CheckCircle2, Clock,
    ChevronRight, ChevronDown, Search, Building2, User,
    CalendarDays, Hash, Radio, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────
type RetroStatus = 'Assessment' | 'Hardware Ordered' | 'Installation Booked' | 'Installed' | 'Active';
type NewStatus   = 'Sale Confirmed' | 'Unit Allocated' | 'Out for Delivery' | 'Platform Activated';

interface RetroClient {
    id: string;
    client: string;
    contact: string;
    dealer: string;
    truckCount: number;
    truckModel: string;
    truckYear: number;
    status: RetroStatus;
    installDate?: string;
    techAssigned?: string;
    notes?: string;
}

interface NewClient {
    id: string;
    client: string;
    contact: string;
    dealer: string;
    truckCount: number;
    truckModel: string;
    status: NewStatus;
    deliveryDate?: string;
    activationDate?: string;
    unitNumbers?: string;
    notes?: string;
}

// ── Seeded Data ────────────────────────────────────────────────────────────────
const retroClients: RetroClient[] = [
    {
        id: 'RF-001', client: 'TJ Transport', contact: 'Tebogo Jacobs',
        dealer: 'Powerstar Polokwane', truckCount: 4, truckModel: 'VX2635', truckYear: 2020,
        status: 'Active', installDate: '08 Dec 2025', techAssigned: 'S. Khumalo',
        notes: 'All 4 units online and reporting. Client very happy with the system.',
    },
    {
        id: 'RF-002', client: 'Mpho Logistics', contact: 'Mpho Sithole',
        dealer: 'Powerstar Ermelo', truckCount: 3, truckModel: 'VX2635', truckYear: 2019,
        status: 'Active', installDate: '15 Jan 2026', techAssigned: 'D. Nkosi',
        notes: 'Retrofit complete. Client enrolled on Full Management Suite.',
    },
    {
        id: 'RF-003', client: 'Vusi Transport', contact: 'Vusi Ndlovu',
        dealer: 'Powerstar Centurion', truckCount: 2, truckModel: 'VX3335', truckYear: 2020,
        status: 'Installation Booked', installDate: '25 Feb 2026', techAssigned: 'T. Mahlangu',
    },
    {
        id: 'RF-004', client: 'Themba Haulage', contact: 'Themba Dube',
        dealer: 'Powerstar Pinetown TCD', truckCount: 5, truckModel: 'VX2642', truckYear: 2021,
        status: 'Hardware Ordered',
        notes: 'Hardware dispatched 18 Feb 2026. Awaiting delivery to Pinetown branch.',
    },
    {
        id: 'RF-005', client: 'Setshego Freight', contact: 'Setshego Molefe',
        dealer: 'Powerstar Brakpan', truckCount: 1, truckModel: 'WX2642', truckYear: 2018,
        status: 'Assessment',
        notes: 'Site assessment booked for 26 Feb 2026. Older wiring harness — may need adaptor.',
    },
];

const newClients: NewClient[] = [
    {
        id: 'NI-001', client: 'Zimasa Logistics', contact: 'Zimasa Dlamini',
        dealer: 'Powerstar Centurion', truckCount: 6, truckModel: 'VX3335',
        status: 'Platform Activated', activationDate: '10 Feb 2026',
        unitNumbers: '10620, 10621, 10622, 10623, 10624, 10625',
        notes: 'All 6 units live. Client using Full Management Suite.',
    },
    {
        id: 'NI-002', client: 'Nkosi Civils', contact: 'Lungelo Nkosi',
        dealer: 'Powerstar PMB – Almighty Equipment', truckCount: 3, truckModel: 'VX2635',
        status: 'Platform Activated', activationDate: '22 Jan 2026',
        unitNumbers: '10598, 10599, 10600',
    },
    {
        id: 'NI-003', client: 'Sizwe Heavy Haulage', contact: 'Sizwe Mokoena',
        dealer: 'Powerstar Ermelo', truckCount: 2, truckModel: 'VX2642',
        status: 'Out for Delivery', deliveryDate: '28 Feb 2026',
        notes: 'Units built and dispatched. ETA Ermelo 28 Feb.',
    },
    {
        id: 'NI-004', client: 'Cape Bulk Transport', contact: 'Francois du Toit',
        dealer: 'Powerstar Brackenfell', truckCount: 4, truckModel: 'VX2642',
        status: 'Unit Allocated',
        notes: 'Units allocated at factory. Delivery window 3–7 Mar 2026.',
    },
    {
        id: 'NI-005', client: 'Limpopo Haulage Co.', contact: 'Andani Makhado',
        dealer: 'Powerstar Polokwane', truckCount: 1, truckModel: 'VX3335',
        status: 'Sale Confirmed', deliveryDate: '10 Mar 2026',
        notes: 'Sale signed 20 Feb 2026. Unit to be built in next production run.',
    },
];

// ── Status config ──────────────────────────────────────────────────────────────
const retroStatusCfg: Record<RetroStatus, { color: string; bg: string; dot: string; step: number }> = {
    'Assessment':          { color: 'text-slate-600',  bg: 'bg-slate-100',  dot: 'bg-slate-400',  step: 1 },
    'Hardware Ordered':    { color: 'text-amber-700',  bg: 'bg-amber-50',   dot: 'bg-amber-400',  step: 2 },
    'Installation Booked': { color: 'text-blue-600',   bg: 'bg-blue-50',    dot: 'bg-blue-400',   step: 3 },
    'Installed':           { color: 'text-indigo-600', bg: 'bg-indigo-50',  dot: 'bg-indigo-400', step: 4 },
    'Active':              { color: 'text-green-700',  bg: 'bg-green-50',   dot: 'bg-green-500',  step: 5 },
};

const newStatusCfg: Record<NewStatus, { color: string; bg: string; dot: string; step: number }> = {
    'Sale Confirmed':      { color: 'text-slate-600',  bg: 'bg-slate-100', dot: 'bg-slate-400',  step: 1 },
    'Unit Allocated':      { color: 'text-amber-700',  bg: 'bg-amber-50',  dot: 'bg-amber-400',  step: 2 },
    'Out for Delivery':    { color: 'text-blue-600',   bg: 'bg-blue-50',   dot: 'bg-blue-400',   step: 3 },
    'Platform Activated':  { color: 'text-green-700',  bg: 'bg-green-50',  dot: 'bg-green-500',  step: 4 },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ label: string; color: string; bg: string; dot: string }> = ({ label, color, bg, dot }) => (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest', color, bg)}>
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
        {label}
    </span>
);

const PipelineBar: React.FC<{ step: number; total: number; color: string }> = ({ step, total, color }) => (
    <div className="flex gap-1 mt-2">
        {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={cn('h-1 flex-1 rounded-full', i < step ? color : 'bg-slate-100')} />
        ))}
    </div>
);

const RetroCard: React.FC<{ client: RetroClient }> = ({ client }) => {
    const [open, setOpen] = useState(false);
    const cfg = retroStatusCfg[client.status];
    return (
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-start gap-4 hover:bg-slate-50/40 transition-colors text-left">
                <div className="p-2.5 rounded-xl bg-orange-50 shrink-0">
                    <Wrench className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-[13px] font-black text-slate-800">{client.client}</p>
                        <StatusBadge label={client.status} color={cfg.color} bg={cfg.bg} dot={cfg.dot} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{client.dealer}</p>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                            <Truck className="h-3 w-3" /> {client.truckCount}× {client.truckModel} ({client.truckYear})
                        </span>
                        {client.installDate && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <CalendarDays className="h-3 w-3" /> {client.installDate}
                            </span>
                        )}
                    </div>
                    <PipelineBar step={cfg.step} total={5} color={cfg.dot.replace('bg-', 'bg-')} />
                </div>
                {open ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-1" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />}
            </button>
            {open && (
                <div className="border-t border-border p-4 bg-slate-50/40 grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
                    <Detail icon={User}         label="Contact"       value={client.contact} />
                    <Detail icon={Building2}    label="Dealer"        value={client.dealer} />
                    <Detail icon={Hash}         label="Ref"           value={client.id} />
                    {client.techAssigned && <Detail icon={Wrench} label="Technician" value={client.techAssigned} />}
                    {client.installDate   && <Detail icon={CalendarDays} label="Install Date" value={client.installDate} />}
                    {client.notes && (
                        <div className="col-span-2 md:col-span-3 bg-white border border-border rounded-lg p-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                            <p className="text-[11px] text-slate-600">{client.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const NewInstallCard: React.FC<{ client: NewClient }> = ({ client }) => {
    const [open, setOpen] = useState(false);
    const cfg = newStatusCfg[client.status];
    return (
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-start gap-4 hover:bg-slate-50/40 transition-colors text-left">
                <div className="p-2.5 rounded-xl bg-green-50 shrink-0">
                    <Zap className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-[13px] font-black text-slate-800">{client.client}</p>
                        <StatusBadge label={client.status} color={cfg.color} bg={cfg.bg} dot={cfg.dot} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{client.dealer}</p>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                            <Truck className="h-3 w-3" /> {client.truckCount}× {client.truckModel} (new)
                        </span>
                        {(client.activationDate || client.deliveryDate) && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <CalendarDays className="h-3 w-3" />
                                {client.activationDate ? `Activated ${client.activationDate}` : `Delivery ${client.deliveryDate}`}
                            </span>
                        )}
                    </div>
                    <PipelineBar step={cfg.step} total={4} color={cfg.dot} />
                </div>
                {open ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-1" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />}
            </button>
            {open && (
                <div className="border-t border-border p-4 bg-slate-50/40 grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
                    <Detail icon={User}         label="Contact"         value={client.contact} />
                    <Detail icon={Building2}    label="Dealer"          value={client.dealer} />
                    <Detail icon={Hash}         label="Ref"             value={client.id} />
                    {client.deliveryDate   && <Detail icon={CalendarDays} label="Delivery Date"   value={client.deliveryDate} />}
                    {client.activationDate && <Detail icon={Radio}        label="Activated"       value={client.activationDate} />}
                    {client.unitNumbers    && <Detail icon={Truck}        label="Unit Numbers"    value={client.unitNumbers} />}
                    {client.notes && (
                        <div className="col-span-2 md:col-span-3 bg-white border border-border rounded-lg p-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                            <p className="text-[11px] text-slate-600">{client.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Detail: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-[11px] font-bold text-slate-700">{value}</p>
        </div>
    </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
type Tab = 'retro' | 'new';

const ClientOnboarding: React.FC = () => {
    const [tab, setTab] = useState<Tab>('retro');
    const [search, setSearch] = useState('');

    const filteredRetro = retroClients.filter(c =>
        c.client.toLowerCase().includes(search.toLowerCase()) ||
        c.dealer.toLowerCase().includes(search.toLowerCase()) ||
        c.status.toLowerCase().includes(search.toLowerCase())
    );
    const filteredNew = newClients.filter(c =>
        c.client.toLowerCase().includes(search.toLowerCase()) ||
        c.dealer.toLowerCase().includes(search.toLowerCase()) ||
        c.status.toLowerCase().includes(search.toLowerCase())
    );

    const retroActive  = retroClients.filter(c => c.status === 'Active').length;
    const retroPending = retroClients.filter(c => c.status !== 'Active').length;

    return (
        <div className="p-4 lg:p-10 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Client Onboarding</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Track retro-fit installations and new truck activations</p>
                </div>
                <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm transition-all">
                    <Plus className="h-3.5 w-3.5" />
                    Register New Client
                </button>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: 'Retro Fits — Active',  value: retroActive,  icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50'  },
                    { label: 'Retro Fits — Pending', value: retroPending, icon: Clock,        color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="bg-white border border-border rounded-xl p-5 shadow-sm">
                            <div className={cn('p-2.5 rounded-xl w-fit mb-3', kpi.bg)}>
                                <Icon className={cn('h-4 w-4', kpi.color)} />
                            </div>
                            <p className={cn('text-3xl font-black', kpi.color)}>{kpi.value}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-tight">{kpi.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tab bar + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1 w-fit">
                    <button
                        onClick={() => setTab('retro')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
                            tab === 'retro' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        <Wrench className="h-3.5 w-3.5" />
                        Retro Fits
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px]', tab === 'retro' ? 'bg-orange-50 text-orange-600' : 'bg-slate-200 text-slate-500')}>
                            {retroClients.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setTab('new')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
                            tab === 'new' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        <Zap className="h-3.5 w-3.5" />
                        Clients Onboarded
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px]', tab === 'new' ? 'bg-green-50 text-green-600' : 'bg-slate-200 text-slate-500')}>
                            {newClients.length}
                        </span>
                    </button>
                </div>

                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search client, dealer or status…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full border border-border rounded-lg py-2 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent/40 bg-white"
                    />
                </div>
            </div>

            {/* Section description */}
            {tab === 'retro' ? (
                <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <Wrench className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black text-orange-700 uppercase tracking-widest">Retro Fits</p>
                        <p className="text-[11px] text-orange-600 mt-0.5">Existing Powerstar clients with older trucks (pre-telematics) who have requested the system be installed. Tracks assessment through to activation.</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                    <Zap className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black text-green-700 uppercase tracking-widest">Clients Onboarded</p>
                        <p className="text-[11px] text-green-700 mt-0.5">Clients who purchased a new Powerstar truck with the telematics system pre-installed at the factory. Tracks from sale confirmation through to platform activation.</p>
                    </div>
                </div>
            )}

            {/* Client list */}
            <div className="space-y-3">
                {tab === 'retro' && (
                    filteredRetro.length === 0
                        ? <p className="text-sm text-slate-400 text-center py-8">No retro-fit clients match your search.</p>
                        : filteredRetro.map(c => <RetroCard key={c.id} client={c} />)
                )}
                {tab === 'new' && (
                    filteredNew.length === 0
                        ? <p className="text-sm text-slate-400 text-center py-8">No onboarded clients match your search.</p>
                        : filteredNew.map(c => <NewInstallCard key={c.id} client={c} />)
                )}
            </div>

        </div>
    );
};

export default ClientOnboarding;
