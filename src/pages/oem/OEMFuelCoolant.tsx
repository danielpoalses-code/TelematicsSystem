import React from 'react';
import { Droplets, Fuel, TrendingDown, AlertTriangle, RefreshCw, Activity, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
    CartesianGrid, ReferenceLine, Label,
} from 'recharts';

interface Tank {
    id: string;
    name: string;
    type: 'diesel' | 'coolant';
    capacityL: number;
    currentL: number;
    reorderL: number;
    lastUpdated: string;
    sensorId: string | null;
    isLive: boolean;
}

const dieselTank: Tank = {
    id: 'diesel',
    name: 'Bulk Diesel Tank (PSN0922-B)',
    type: 'diesel',
    capacityL: 10000,
    currentL: 7664,
    reorderL: 3000,
    lastUpdated: '21 Feb 2026 — Sensor',
    sensorId: 'PSN0922_B_Bulk-Diesel-1',
    isLive: true,
};

const coolantTank: Tank = {
    id: 'coolant',
    name: 'Factory Coolant Reserve',
    type: 'coolant',
    capacityL: 5000,
    currentL: 3200,
    reorderL: 1000,
    lastUpdated: 'Mock Data — No Sensor',
    sensorId: null,
    isLive: false,
};

// Real 8-day sensor readings — PSN0922_B_Bulk-Diesel-1 (14–21 Feb 2026)
const RAW_DIESEL = [
    { day: '14 Feb', level: 8421 },
    { day: '15 Feb', level: 8421 },
    { day: '16 Feb', level: 5614 },
    { day: '17 Feb', level: 9800 },
    { day: '18 Feb', level: 8786 },
    { day: '19 Feb', level: 7365 },
    { day: '20 Feb', level: 5236 },
    { day: '21 Feb', level: 7664 },
];

// Mock 8-day data — Factory Coolant Reserve (14–21 Feb 2026)
const RAW_COOLANT = [
    { day: '14 Feb', level: 4200 },
    { day: '15 Feb', level: 4200 },
    { day: '16 Feb', level: 3800 },
    { day: '17 Feb', level: 3800 },
    { day: '18 Feb', level: 3500 },
    { day: '19 Feb', level: 4800 },
    { day: '20 Feb', level: 4500 },
    { day: '21 Feb', level: 3200 },
];

// Annotate with refill flag + delta
const annotate = (data: { day: string; level: number }[]) =>
    data.map((d, i) => ({
        ...d,
        delta:    i > 0 ? d.level - data[i - 1].level : 0,
        isRefill: i > 0 && d.level > data[i - 1].level,
    }));

const diesel8Days  = annotate(RAW_DIESEL);
const coolant8Days = annotate(RAW_COOLANT);

// Combined transaction log
const transactions = [
    { time: '21 Feb 2026', tank: 'Bulk Diesel (PSN0922-B)',   type: 'diesel',  action: 'refill', litres: 421,  by: 'Sensor', notes: 'Top-up delivery — 7,243 L → 7,664 L' },
    { time: '21 Feb 2026', tank: 'Bulk Diesel (PSN0922-B)',   type: 'diesel',  action: 'usage',  litres: 326,  by: 'Sensor', notes: 'Daily factory consumption' },
    { time: '21 Feb 2026', tank: 'Factory Coolant Reserve',   type: 'coolant', action: 'usage',  litres: 1300, by: 'Manual', notes: 'Batch service day — 12 units coolant top-up' },
    { time: '20 Feb 2026', tank: 'Bulk Diesel (PSN0922-B)',   type: 'diesel',  action: 'usage',  litres: 2129, by: 'Sensor', notes: 'Daily factory consumption' },
    { time: '20 Feb 2026', tank: 'Factory Coolant Reserve',   type: 'coolant', action: 'usage',  litres: 300,  by: 'Manual', notes: 'Routine top-ups — 3 units' },
    { time: '19 Feb 2026', tank: 'Bulk Diesel (PSN0922-B)',   type: 'diesel',  action: 'usage',  litres: 1422, by: 'Sensor', notes: 'Daily factory consumption' },
    { time: '19 Feb 2026', tank: 'Factory Coolant Reserve',   type: 'coolant', action: 'refill', litres: 1300, by: 'Manual', notes: 'Supplier delivery — coolant concentrate' },
    { time: '18 Feb 2026', tank: 'Bulk Diesel (PSN0922-B)',   type: 'diesel',  action: 'usage',  litres: 2334, by: 'Sensor', notes: 'Daily factory consumption' },
    { time: '18 Feb 2026', tank: 'Factory Coolant Reserve',   type: 'coolant', action: 'usage',  litres: 300,  by: 'Manual', notes: 'Routine top-ups — 3 units' },
    { time: '17 Feb 2026', tank: 'Bulk Diesel (PSN0922-B)',   type: 'diesel',  action: 'refill', litres: 9023, by: 'Sensor', notes: 'Major supplier delivery — 5,614 L → full' },
    { time: '16 Feb 2026', tank: 'Bulk Diesel (PSN0922-B)',   type: 'diesel',  action: 'usage',  litres: 2807, by: 'Sensor', notes: 'High consumption day' },
    { time: '16 Feb 2026', tank: 'Factory Coolant Reserve',   type: 'coolant', action: 'usage',  litres: 400,  by: 'Manual', notes: 'Service batch — 4 units' },
    { time: '14 Feb 2026', tank: 'Factory Coolant Reserve',   type: 'coolant', action: 'usage',  litres: 800,  by: 'Manual', notes: 'Service batch — 8 units' },
];

// ── Custom chart components ───────────────────────────────────────────────────

// Dots: green pulse for refill events, solid colour for normal points
const EventDot = (color: string) => (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    if (payload.isRefill) {
        return (
            <g>
                <circle cx={cx} cy={cy} r={10} fill="#22c55e" fillOpacity={0.18} />
                <circle cx={cx} cy={cy} r={6}  fill="#22c55e" stroke="white" strokeWidth={2} />
            </g>
        );
    }
    return <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={1.5} />;
};

const ActiveDotComp = (color: string) => (props: any) => {
    const { cx, cy } = props;
    if (!cx || !cy) return null;
    return (
        <g>
            <circle cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.15} />
            <circle cx={cx} cy={cy} r={5.5} fill={color} stroke="white" strokeWidth={2} />
        </g>
    );
};

// Custom tooltip
const ChartTooltip = ({ active, payload, label, color, unit }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[140px]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
            <p className="text-xl font-black leading-none" style={{ color }}>{d.level.toLocaleString()} L</p>
            {d.delta !== 0 && (
                <div className={cn('flex items-center gap-1 mt-1.5 text-[10px] font-bold', d.isRefill ? 'text-emerald-600' : 'text-slate-400')}>
                    {d.isRefill
                        ? <><TrendingUp className="h-3 w-3" />+{Math.abs(d.delta).toLocaleString()} L refill</>
                        : <><TrendingDown className="h-3 w-3" />{d.delta.toLocaleString()} L</>
                    }
                </div>
            )}
            <p className="text-[9px] text-slate-300 mt-1">{unit}</p>
        </div>
    );
};

// ── SVG Bulk Storage Tank ────────────────────────────────────────────────────
const BulkTankSVG: React.FC<{ tank: Tank }> = ({ tank }) => {
    const pct        = (tank.currentL / tank.capacityL) * 100;
    const isCritical = tank.currentL <= tank.reorderL;
    const isWarning  = tank.currentL <= tank.reorderL * 1.4 && !isCritical;

    const okFill    = tank.type === 'coolant' ? '#06b6d4' : '#22c55e';
    const fillColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : okFill;

    const bX = 55, bY = 55, bW = 130, bH = 270;
    const cx = bX + bW / 2;
    const ry = 16;

    const fillH    = Math.max((bH * pct) / 100, 0);
    const fillY    = bY + bH - fillH;
    const reorderY = bY + bH - (bH * (tank.reorderL / tank.capacityL));

    return (
        <svg viewBox="0 0 260 430" className="w-full max-w-[210px] mx-auto overflow-visible">
            <defs>
                <clipPath id={`tc-${tank.id}`}>
                    <rect x={bX} y={bY} width={bW} height={bH} />
                </clipPath>
            </defs>

            {/* Tank body background */}
            <rect x={bX} y={bY} width={bW} height={bH} fill="#f1f5f9" />

            {/* Liquid fill — strictly clipped inside tank body */}
            {fillH > 0 && (
                <rect x={bX} y={fillY} width={bW} height={fillH}
                    fill={fillColor} fillOpacity={0.82}
                    clipPath={`url(#tc-${tank.id})`} />
            )}

            {/* Reorder threshold line */}
            <line x1={bX - 20} y1={reorderY} x2={bX + bW + 20} y2={reorderY}
                stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5,3" />
            <text x={bX + bW + 22} y={reorderY + 4} fontSize={8} fill="#ef4444" fontWeight="bold">MIN</text>

            {/* Gauge marks */}
            {[25, 50, 75, 100].map(m => {
                const mY = bY + bH - (bH * m / 100);
                return (
                    <g key={m}>
                        <line x1={bX + bW} y1={mY} x2={bX + bW + 9} y2={mY} stroke="#94a3b8" strokeWidth={1} />
                        <text x={bX + bW + 11} y={mY + 3.5} fontSize={7.5} fill="#94a3b8">{m}%</text>
                    </g>
                );
            })}

            {/* Tank border */}
            <rect x={bX} y={bY} width={bW} height={bH} fill="none" stroke="#cbd5e1" strokeWidth={2} />

            {/* Bottom cap */}
            <ellipse cx={cx} cy={bY + bH} rx={bW / 2} ry={ry}
                fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={2} />

            {/* Top cap */}
            <ellipse cx={cx} cy={bY} rx={bW / 2} ry={ry}
                fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={2} />

            {/* Inlet pipe */}
            <rect x={cx - 6} y={bY - ry - 24} width={12} height={24}
                fill="#cbd5e1" stroke="#94a3b8" strokeWidth={1.5} />
            <ellipse cx={cx} cy={bY - ry - 24} rx={6} ry={3.5} fill="#94a3b8" />

            {/* Drain valve */}
            <rect x={cx - 8} y={bY + bH + ry - 4} width={16} height={22}
                fill="#cbd5e1" stroke="#94a3b8" strokeWidth={1.5} />
            <rect x={cx - 22} y={bY + bH + ry + 15} width={44} height={7} rx={3}
                fill="#94a3b8" stroke="#64748b" strokeWidth={1} />

            {/* Text overlay */}
            <rect x={cx - 52} y={bY + bH / 2 - 32} width={104} height={62}
                rx={6} fill="white" fillOpacity={0.75} />
            <text x={cx} y={bY + bH / 2 - 4} fontSize={34} fontWeight="900"
                textAnchor="middle" fill="#1e293b"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {Math.round(pct)}%
            </text>
            <text x={cx} y={bY + bH / 2 + 18} fontSize={11.5}
                textAnchor="middle" fill="#475569" fontWeight="bold">
                {tank.currentL.toLocaleString()} L
            </text>
            <text x={cx} y={bY + bH / 2 + 32} fontSize={9}
                textAnchor="middle" fill="#94a3b8">
                of {tank.capacityL.toLocaleString()} L
            </text>
        </svg>
    );
};

// ── Tank Card (SVG + stats) ───────────────────────────────────────────────────
const TankCard: React.FC<{ tank: Tank }> = ({ tank }) => {
    const pct        = (tank.currentL / tank.capacityL) * 100;
    const isCritical = tank.currentL <= tank.reorderL;

    const isDiesel    = tank.type === 'diesel';
    const iconEl      = isDiesel
        ? <Fuel className="h-4 w-4 text-amber-600" />
        : <Droplets className="h-4 w-4 text-cyan-500" />;
    const sensorBadge = tank.isLive
        ? <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest">Live · PSN0922-B</span>
        : <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-widest">Mock Data</span>;
    const sensorBarBg  = isDiesel ? 'bg-amber-50 border-amber-100' : 'bg-cyan-50 border-cyan-100';
    const sensorIconCl = isDiesel ? 'text-amber-500' : 'text-cyan-500';
    const statusOkBg   = isDiesel ? 'bg-emerald-50' : 'bg-cyan-50';
    const statusOkText = isDiesel ? 'text-emerald-600' : 'text-cyan-600';

    return (
        <div className="bg-white border border-border rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
            <div className="flex items-center gap-2 mb-6">
                {iconEl}
                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{tank.name}</h3>
                {sensorBadge}
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="flex-shrink-0 w-full sm:w-[210px]">
                    <BulkTankSVG tank={tank} />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Level</p>
                        <p className="text-2xl font-black text-slate-800">{tank.currentL.toLocaleString()} L</p>
                        <p className="text-[10px] text-slate-400 mt-1">{Math.round(pct)}% of capacity</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tank Capacity</p>
                        <p className="text-2xl font-black text-slate-800">{tank.capacityL.toLocaleString()} L</p>
                        <p className="text-[10px] text-slate-400 mt-1">Bulk storage</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reorder Threshold</p>
                        <p className="text-2xl font-black text-slate-800">{tank.reorderL.toLocaleString()} L</p>
                        <p className="text-[10px] text-slate-400 mt-1">Place order below this level</p>
                    </div>
                    <div className={cn('rounded-xl p-4', isCritical ? 'bg-red-50' : statusOkBg)}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tank Status</p>
                        <p className={cn('text-2xl font-black', isCritical ? 'text-red-600' : statusOkText)}>
                            {isCritical ? 'Critical' : pct > 60 ? 'Good' : 'Monitor'}
                        </p>
                        {isCritical
                            ? <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1 font-bold"><AlertTriangle className="h-3 w-3" /> Reorder now</p>
                            : <p className={cn('text-[10px] mt-1', statusOkText)}>Sufficient level</p>
                        }
                    </div>
                    <div className={cn('col-span-2 border rounded-xl px-4 py-3 flex items-center gap-3', sensorBarBg)}>
                        <Activity className={cn('h-3.5 w-3.5 flex-shrink-0', sensorIconCl)} />
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Reading</p>
                            <p className="text-[11px] font-bold text-slate-700 mt-0.5">{tank.lastUpdated}</p>
                        </div>
                        {tank.sensorId && (
                            <div className="ml-auto text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sensor ID</p>
                                <p className="text-[11px] font-bold text-slate-700 font-mono mt-0.5">{tank.sensorId}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Trend chart card ──────────────────────────────────────────────────────────
interface TrendChartProps {
    title:        string;
    data:         ReturnType<typeof annotate>;
    color:        string;
    colorLight:   string;
    gradId:       string;
    domain:       [number, number];
    reorderY:     number;
    reorderLabel: string;
    isLive:       boolean;
    unit:         string;
    kpis:         { label: string; value: string; icon: React.ElementType; color: string }[];
    note:         string;
}

const TrendChart: React.FC<TrendChartProps> = ({
    title, data, color, colorLight, gradId, domain, reorderY, reorderLabel,
    isLive, unit, kpis, note,
}) => (
    <div className="bg-white border border-border rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{title}</h3>
            </div>
            {isLive
                ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">● Live Sensor</span>
                : <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Mock Data</span>
            }
        </div>
        <p className="text-[10px] text-slate-400 mb-4 ml-5">{note}</p>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2 mb-5">
            {kpis.map(k => {
                const Icon = k.icon;
                return (
                    <div key={k.label} className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <Icon className={cn('h-3.5 w-3.5 shrink-0', k.color)} />
                        <div className="min-w-0">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{k.label}</p>
                            <p className={cn('text-[11px] font-black truncate leading-tight mt-0.5', k.color)}>{k.value}</p>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={color}      stopOpacity={0.50} />
                        <stop offset="35%"  stopColor={color}      stopOpacity={0.22} />
                        <stop offset="75%"  stopColor={colorLight}  stopOpacity={0.08} />
                        <stop offset="100%" stopColor={colorLight}  stopOpacity={0}    />
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                />
                <YAxis
                    domain={domain}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                    width={32}
                />

                {/* Reorder threshold line */}
                <ReferenceLine y={reorderY} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5} strokeOpacity={0.7}>
                    <Label
                        value={reorderLabel}
                        position="insideTopRight"
                        fontSize={9}
                        fill="#ef4444"
                        fontWeight={700}
                        offset={4}
                    />
                </ReferenceLine>

                <Tooltip
                    content={<ChartTooltip color={color} unit={unit} />}
                    cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 2', strokeOpacity: 0.4 }}
                />

                <Area
                    type="basis"
                    dataKey="level"
                    stroke={color}
                    strokeWidth={3}
                    fill={`url(#${gradId})`}
                    dot={EventDot(color) as any}
                    activeDot={ActiveDotComp(color) as any}
                />
            </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-2 rounded" style={{ background: color }} />
                {unit}
            </span>
            <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
                Refill event
            </span>
            <span className="flex items-center gap-1.5">
                <span className="inline-block w-7 border-t-2 border-red-400 border-dashed" />
                Reorder level
            </span>
        </div>
    </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const OEMFuelCoolant: React.FC = () => {
    // Diesel KPIs
    const dieselAvgDaily   = Math.round((326 + 2129 + 1422 + 2334 + 2807) / 5);
    const dieselDaysLeft   = Math.round((dieselTank.currentL - dieselTank.reorderL) / dieselAvgDaily);
    // Coolant KPIs
    const coolantAvgDaily  = Math.round((1300 + 300 + 300 + 400 + 800) / 5);
    const coolantDaysLeft  = Math.round((coolantTank.currentL - coolantTank.reorderL) / coolantAvgDaily);

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Fuel & Coolant Levels</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Factory bulk storage monitoring, consumption tracking, and reorder alerts.</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition-all">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Sync Readings
                </button>
            </div>

            {/* Tank visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TankCard tank={dieselTank} />
                <TankCard tank={coolantTank} />
            </div>

            {/* Trend charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrendChart
                    title="Diesel — 14–21 Feb 2026"
                    data={diesel8Days}
                    color="#f59e0b"
                    colorLight="#fef3c7"
                    gradId="gradDiesel"
                    domain={[0, 10500]}
                    reorderY={dieselTank.reorderL}
                    reorderLabel={`Reorder ${dieselTank.reorderL.toLocaleString()} L`}
                    isLive={dieselTank.isLive}
                    unit="PSN0922-B · Bulk Diesel"
                    note="Spike 17 Feb = refill +9,023 L. Top-up +421 L on 21 Feb."
                    kpis={[
                        { label: 'Current Level',    value: `${dieselTank.currentL.toLocaleString()} L`, icon: Fuel,        color: 'text-amber-600'   },
                        { label: 'Avg Daily Usage',  value: `${dieselAvgDaily.toLocaleString()} L/day`,  icon: TrendingDown, color: 'text-slate-500'   },
                        { label: 'Est. Days to Min', value: `~${dieselDaysLeft} days`,                   icon: Clock,        color: dieselDaysLeft <= 3 ? 'text-red-600' : 'text-emerald-600' },
                    ]}
                />
                <TrendChart
                    title="Coolant — 14–21 Feb 2026"
                    data={coolant8Days}
                    color="#06b6d4"
                    colorLight="#cffafe"
                    gradId="gradCoolant"
                    domain={[0, 5500]}
                    reorderY={coolantTank.reorderL}
                    reorderLabel={`Reorder ${coolantTank.reorderL.toLocaleString()} L`}
                    isLive={coolantTank.isLive}
                    unit="Factory Coolant Reserve"
                    note="19 Feb supplier refill +1,300 L. Batch draw-down −1,300 L on 21 Feb."
                    kpis={[
                        { label: 'Current Level',    value: `${coolantTank.currentL.toLocaleString()} L`, icon: Droplets,    color: 'text-cyan-600'    },
                        { label: 'Avg Daily Usage',  value: `${coolantAvgDaily.toLocaleString()} L/day`,  icon: TrendingDown, color: 'text-slate-500'   },
                        { label: 'Est. Days to Min', value: `~${coolantDaysLeft} days`,                    icon: Clock,        color: coolantDaysLeft <= 4 ? 'text-amber-600' : 'text-emerald-600' },
                    ]}
                />
            </div>

            {/* Combined transaction log */}
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Tank Transaction Log</h3>
                    <span className="text-[10px] text-slate-400 font-medium">{transactions.length} events — 14–21 Feb 2026</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                        <thead className="bg-slate-50 border-b border-border">
                            <tr>
                                {['Date', 'Tank', 'Type', 'Action', 'Litres', 'Recorded By', 'Notes'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left font-black text-[10px] text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.time}</td>
                                    <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{row.tank}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded',
                                            row.type === 'diesel' ? 'bg-amber-50 text-amber-700' : 'bg-cyan-50 text-cyan-700')}>
                                            {row.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn('text-[10px] font-black uppercase px-2 py-0.5 rounded', {
                                            'bg-emerald-50 text-emerald-600': row.action === 'refill',
                                            'bg-slate-100 text-slate-600':    row.action === 'usage',
                                            'bg-red-50 text-red-600':         row.action === 'wastage' || row.action === 'theft',
                                        })}>
                                            {row.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{row.litres.toLocaleString()} L</td>
                                    <td className="px-4 py-3 text-slate-500">{row.by}</td>
                                    <td className="px-4 py-3 text-slate-400">{row.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OEMFuelCoolant;
