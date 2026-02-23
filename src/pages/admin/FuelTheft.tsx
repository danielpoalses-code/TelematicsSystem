import React, { useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LTooltip } from 'react-leaflet';
import L from 'leaflet';
import {
    BarChart, Bar, XAxis, YAxis,
    Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import {
    Droplets, AlertTriangle, Clock,
    Factory, Building2, Package, Map as MapIcon,
    Globe, ShieldAlert, TrendingUp, Filter,
    ChevronDown, ChevronUp, Bell, Gauge,
    CheckCircle2, XCircle, Search as SearchIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Types ──────────────────────────────────────────────────────────────────────

type TheftZone   = 'factory' | 'dealership' | 'supplier' | 'province';
type TheftStatus = 'confirmed' | 'investigating' | 'false_positive';
type Confidence  = 'high' | 'medium' | 'low';
type SortBy      = 'volume' | 'events' | 'province';
type FilterZone  = 'all' | TheftZone;

interface TheftEvent {
    id: string;
    stock: string;
    model: string;
    lat: number;
    lng: number;
    province: string;
    zone: TheftZone;
    zoneName: string;
    litres: number;
    timestamp: string;
    confidence: Confidence;
    status: TheftStatus;
    method: string;
}

// ── Mock events ────────────────────────────────────────────────────────────────

const EVENTS: TheftEvent[] = [
    // Factory — KZN
    { id:'ft-001', stock:'ST-085', model:'VX 2642',  lat:-29.6450, lng:30.4140, province:'KwaZulu-Natal', zone:'factory',    zoneName:'PMB Assembly Plant', litres:120, timestamp:'2026-02-23T02:14:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    { id:'ft-002', stock:'ST-201', model:'VX 4035B', lat:-29.6458, lng:30.4132, province:'KwaZulu-Natal', zone:'factory',    zoneName:'PMB Assembly Plant', litres:85,  timestamp:'2026-02-22T22:40:00', confidence:'high',   status:'confirmed',     method:'Bulk pump' },
    { id:'ft-003', stock:'ST-317', model:'VX 2628',  lat:-29.6445, lng:30.4148, province:'KwaZulu-Natal', zone:'factory',    zoneName:'PMB Assembly Plant', litres:60,  timestamp:'2026-02-21T19:55:00', confidence:'medium', status:'investigating', method:'ISO drain' },
    // Dealerships — Gauteng
    { id:'ft-004', stock:'ST-112', model:'VX 2635A', lat:-25.864,  lng:28.165,  province:'Gauteng',       zone:'dealership', zoneName:'Centurion',          litres:200, timestamp:'2026-02-23T03:30:00', confidence:'high',   status:'confirmed',     method:'Inline siphon' },
    { id:'ft-005', stock:'ST-298', model:'VX 4042K', lat:-25.871,  lng:28.172,  province:'Gauteng',       zone:'dealership', zoneName:'Centurion',          litres:150, timestamp:'2026-02-22T20:10:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    { id:'ft-006', stock:'ST-066', model:'VX 4035B', lat:-26.235,  lng:28.371,  province:'Gauteng',       zone:'dealership', zoneName:'Brakpan',            litres:95,  timestamp:'2026-02-22T01:05:00', confidence:'medium', status:'investigating', method:'Bulk pump' },
    { id:'ft-007', stock:'ST-421', model:'VX 2635A', lat:-25.684,  lng:28.190,  province:'Gauteng',       zone:'dealership', zoneName:'Wonderboom',         litres:175, timestamp:'2026-02-21T23:50:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    { id:'ft-008', stock:'ST-531', model:'VX 2635A', lat:-26.095,  lng:27.994,  province:'Gauteng',       zone:'dealership', zoneName:'Randburg',           litres:40,  timestamp:'2026-02-20T15:22:00', confidence:'low',    status:'false_positive',method:'Sensor glitch' },
    // Dealerships — KZN
    { id:'ft-009', stock:'ST-033', model:'VX 2642',  lat:-29.616,  lng:30.392,  province:'KwaZulu-Natal', zone:'dealership', zoneName:'PMB',                litres:130, timestamp:'2026-02-23T01:00:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    { id:'ft-010', stock:'ST-041', model:'VX 2642',  lat:-28.753,  lng:31.893,  province:'KwaZulu-Natal', zone:'dealership', zoneName:'Empangeni',          litres:90,  timestamp:'2026-02-22T18:30:00', confidence:'medium', status:'investigating', method:'Inline siphon' },
    { id:'ft-011', stock:'ST-055', model:'VX 2635A', lat:-29.814,  lng:30.865,  province:'KwaZulu-Natal', zone:'dealership', zoneName:'Pinetown',           litres:220, timestamp:'2026-02-22T04:15:00', confidence:'high',   status:'confirmed',     method:'Bulk pump' },
    // Dealerships — Mpumalanga
    { id:'ft-012', stock:'ST-047', model:'VX 2628',  lat:-26.533,  lng:29.983,  province:'Mpumalanga',    zone:'dealership', zoneName:'Ermelo',             litres:160, timestamp:'2026-02-23T00:20:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    { id:'ft-013', stock:'ST-093', model:'VX 2628',  lat:-25.766,  lng:29.458,  province:'Mpumalanga',    zone:'dealership', zoneName:'Middelburg',         litres:75,  timestamp:'2026-02-22T09:45:00', confidence:'medium', status:'investigating', method:'Inline siphon' },
    { id:'ft-014', stock:'ST-412', model:'VX 2635A', lat:-25.475,  lng:30.985,  province:'Mpumalanga',    zone:'dealership', zoneName:'Nelspruit',          litres:110, timestamp:'2026-02-21T21:00:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    // Dealerships — Limpopo
    { id:'ft-015', stock:'ST-019', model:'VX 2642',  lat:-23.904,  lng:29.468,  province:'Limpopo',       zone:'dealership', zoneName:'Polokwane',          litres:185, timestamp:'2026-02-22T22:00:00', confidence:'high',   status:'confirmed',     method:'Bulk pump' },
    { id:'ft-016', stock:'ST-371', model:'VX 2635A', lat:-23.907,  lng:29.471,  province:'Limpopo',       zone:'dealership', zoneName:'Polokwane',          litres:55,  timestamp:'2026-02-21T11:30:00', confidence:'low',    status:'false_positive',method:'Sensor glitch' },
    // Dealerships — Western Cape
    { id:'ft-017', stock:'ST-028', model:'VX 2642',  lat:-33.882,  lng:18.694,  province:'Western Cape',  zone:'dealership', zoneName:'Brackenfell',        litres:140, timestamp:'2026-02-23T05:00:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    { id:'ft-018', stock:'ST-144', model:'VX 1627',  lat:-33.888,  lng:18.700,  province:'Western Cape',  zone:'dealership', zoneName:'Brackenfell',        litres:80,  timestamp:'2026-02-22T14:20:00', confidence:'medium', status:'investigating', method:'Inline siphon' },
    // Dealerships — Free State
    { id:'ft-019', stock:'ST-060', model:'VX 2628',  lat:-29.114,  lng:26.227,  province:'Free State',    zone:'dealership', zoneName:'Bloemfontein',       litres:100, timestamp:'2026-02-22T07:55:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    // Dealerships — Eastern Cape
    { id:'ft-020', stock:'ST-077', model:'VX 2642',  lat:-33.960,  lng:25.602,  province:'Eastern Cape',  zone:'dealership', zoneName:'Port Elizabeth',     litres:230, timestamp:'2026-02-23T00:10:00', confidence:'high',   status:'confirmed',     method:'Bulk pump' },
    // Suppliers — KZN
    { id:'ft-021', stock:'ST-611', model:'VX 2642',  lat:-29.618,  lng:30.402,  province:'KwaZulu-Natal', zone:'supplier',   zoneName:'Roadhogs',           litres:50,  timestamp:'2026-02-22T16:00:00', confidence:'medium', status:'investigating', method:'ISO drain' },
    { id:'ft-022', stock:'ST-612', model:'VX 2628',  lat:-29.615,  lng:30.395,  province:'KwaZulu-Natal', zone:'supplier',   zoneName:'Knight Bodies',      litres:70,  timestamp:'2026-02-21T08:30:00', confidence:'high',   status:'confirmed',     method:'Inline siphon' },
    // Suppliers — Gauteng
    { id:'ft-023', stock:'ST-613', model:'VX 2635A', lat:-25.940,  lng:28.150,  province:'Gauteng',       zone:'supplier',   zoneName:'Transpec',           litres:115, timestamp:'2026-02-22T11:00:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    { id:'ft-024', stock:'ST-614', model:'VX 4042K', lat:-25.965,  lng:28.212,  province:'Gauteng',       zone:'supplier',   zoneName:'Hennox',             litres:45,  timestamp:'2026-02-20T19:45:00', confidence:'low',    status:'false_positive',method:'Sensor glitch' },
    // Suppliers — Mpumalanga
    { id:'ft-025', stock:'ST-615', model:'VX 1729',  lat:-26.986,  lng:30.803,  province:'Mpumalanga',    zone:'supplier',   zoneName:'Anco Manufacturing', litres:95,  timestamp:'2026-02-22T03:20:00', confidence:'high',   status:'confirmed',     method:'Bulk pump' },
    // Province (en route) — Gauteng
    { id:'ft-026', stock:'ST-621', model:'VX 2642',  lat:-26.200,  lng:28.000,  province:'Gauteng',       zone:'province',   zoneName:'N14 Corridor',       litres:190, timestamp:'2026-02-22T23:00:00', confidence:'high',   status:'confirmed',     method:'Inline siphon' },
    // Province (en route) — Free State
    { id:'ft-027', stock:'ST-625', model:'VX 2642',  lat:-29.300,  lng:27.500,  province:'Free State',    zone:'province',   zoneName:'N1 Route',           litres:245, timestamp:'2026-02-23T01:40:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    // Province (en route) — Western Cape
    { id:'ft-028', stock:'ST-623', model:'VX 2628',  lat:-34.020,  lng:22.510,  province:'Western Cape',  zone:'province',   zoneName:'N2 Garden Route',    litres:160, timestamp:'2026-02-22T12:15:00', confidence:'medium', status:'investigating', method:'Bulk pump' },
    // Province (en route) — Mpumalanga
    { id:'ft-029', stock:'ST-624', model:'VX 2635A', lat:-25.850,  lng:29.600,  province:'Mpumalanga',    zone:'province',   zoneName:'N4 Maputo Corridor', litres:205, timestamp:'2026-02-21T20:30:00', confidence:'high',   status:'confirmed',     method:'ISO drain' },
    // Province (en route) — KZN
    { id:'ft-030', stock:'ST-622', model:'VX 4035B', lat:-28.250,  lng:29.100,  province:'KwaZulu-Natal', zone:'province',   zoneName:'N3 Van Reenen',      litres:130, timestamp:'2026-02-21T06:50:00', confidence:'high',   status:'confirmed',     method:'Inline siphon' },
];

// ── 7-day trend data (L stolen per zone per day) ───────────────────────────────

const TREND_DATA = [
    { day: 'Feb 17', factory:  80, dealership: 320, supplier:  90, province: 180 },
    { day: 'Feb 18', factory:   0, dealership: 410, supplier: 120, province: 200 },
    { day: 'Feb 19', factory: 120, dealership: 280, supplier:   0, province: 310 },
    { day: 'Feb 20', factory:  60, dealership: 350, supplier: 160, province:  90 },
    { day: 'Feb 21', factory: 180, dealership: 510, supplier:  95, province: 335 },
    { day: 'Feb 22', factory:  85, dealership: 620, supplier: 230, province: 570 },
    { day: 'Feb 23', factory: 265, dealership: 1010,supplier: 210, province: 730 },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const ZONE_COLORS: Record<TheftZone, string> = {
    factory:    '#f97316',
    dealership: '#10b981',
    supplier:   '#f59e0b',
    province:   '#94a3b8',
};
const ZONE_LABELS: Record<TheftZone, string> = {
    factory:    'Factory',
    dealership: 'Dealership',
    supplier:   'Supplier',
    province:   'In Province',
};
const ZONE_ICONS: Record<TheftZone, React.ElementType> = {
    factory:    Factory,
    dealership: Building2,
    supplier:   Package,
    province:   MapIcon,
};
const STATUS_COLOR: Record<TheftStatus, string> = {
    confirmed:      '#ef4444',
    investigating:  '#f59e0b',
    false_positive: '#94a3b8',
};
const STATUS_LABEL: Record<TheftStatus, string> = {
    confirmed:      'Confirmed',
    investigating:  'Investigating',
    false_positive: 'False Positive',
};
const CONF_COLOR: Record<Confidence, string> = {
    high:   '#ef4444',
    medium: '#f97316',
    low:    '#94a3b8',
};
const DARK_TILE      = 'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTR = '&copy; <a href="https://carto.com">CARTO</a>';
const SA_BOUNDS: L.LatLngBoundsLiteral = [[-35, 16.3], [-22, 33]];

const ALL_ZONES: TheftZone[] = ['factory', 'dealership', 'supplier', 'province'];

const FILTER_TABS: { key: FilterZone; label: string; icon: React.ElementType }[] = [
    { key: 'all',        label: 'All Events',  icon: Globe      },
    { key: 'factory',    label: 'Factory',     icon: Factory    },
    { key: 'dealership', label: 'Dealerships', icon: Building2  },
    { key: 'supplier',   label: 'Suppliers',   icon: Package    },
    { key: 'province',   label: 'In Province', icon: MapIcon    },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTs(iso: string): string {
    const hours = Math.round((Date.now() - new Date(iso).getTime()) / 36e5);
    if (hours < 1)  return '< 1h ago';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

/** Derive deterministic sensor snapshot from event data */
function getSensor(e: TheftEvent) {
    const tank = e.model.includes('4042') ? 500 : e.model.includes('4035') ? 450 :
                 e.model.includes('2642') ? 400 : e.model.includes('1729') ? 320 : 350;
    const durationMin = Math.max(8, Math.round(e.litres / 8));
    const dropPct     = Math.round(e.litres / tank * 100);
    // Pseudo-random seed from event id
    const seed = e.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const fuelBefore  = 60 + (seed % 36);
    const fuelAfter   = Math.max(3, fuelBefore - dropPct);
    const gpsAccuracy = e.confidence === 'high' ? 3 : e.confidence === 'medium' ? 14 : 32;
    const dropRate    = +(e.litres / durationMin).toFixed(1);
    const sensors     = e.confidence === 'high' ? 3 : e.confidence === 'medium' ? 2 : 1;
    return { tank, durationMin, fuelBefore, fuelAfter, gpsAccuracy, dropRate, sensors };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Interactive theft map */
const TheftMap: React.FC<{ events: TheftEvent[]; statusOverrides: Record<string, TheftStatus> }> = ({ events, statusOverrides }) => (
    <MapContainer bounds={SA_BOUNDS} style={{ height: '100%', width: '100%' }} scrollWheelZoom zoomControl>
        <TileLayer url={DARK_TILE} attribution={DARK_TILE_ATTR} />
        {events.map(e => {
            const s = statusOverrides[e.id] ?? e.status;
            return (
                <CircleMarker key={e.id} center={[e.lat, e.lng]}
                    radius={s === 'false_positive' ? 4 : 7}
                    pathOptions={{
                        color: STATUS_COLOR[s],
                        fillColor: ZONE_COLORS[e.zone],
                        fillOpacity: s === 'false_positive' ? 0.3 : 0.85,
                        weight: e.confidence === 'high' ? 2 : 1,
                    }}>
                    <LTooltip sticky>
                        <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: '1.7' }}>
                            <strong>{e.stock}</strong> — {e.model}<br />
                            Zone: <strong>{ZONE_LABELS[e.zone]}</strong> ({e.zoneName})<br />
                            Province: {e.province}<br />
                            <span style={{ color: STATUS_COLOR[s] }}>{STATUS_LABEL[s]}</span>
                            {' '}· {e.litres}L · {e.method}
                        </div>
                    </LTooltip>
                </CircleMarker>
            );
        })}
    </MapContainer>
);

/** 7-day stacked bar chart */
const TrendChart: React.FC<{ filter: FilterZone }> = ({ filter }) => {
    const zones = filter === 'all' ? ALL_ZONES : [filter as TheftZone];
    return (
        <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                    7-Day Theft Volume (L)
                </p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
                <BarChart data={TREND_DATA} barSize={22} barCategoryGap="30%">
                    <XAxis dataKey="day"
                        tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8' }}
                        axisLine={false} tickLine={false} />
                    <YAxis
                        tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#94a3b8' }}
                        axisLine={false} tickLine={false} width={32} />
                    <RTooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 10, padding: '8px 12px' }}
                        labelStyle={{ color: '#94a3b8', fontWeight: 900, marginBottom: 4 }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(value: number, name: string) =>
                            [`${value.toLocaleString()}L`, ZONE_LABELS[name as TheftZone] ?? name]
                        }
                    />
                    {zones.map(z => (
                        <Bar key={z} dataKey={z} stackId="a"
                            fill={ZONE_COLORS[z]}
                            opacity={0.85}
                            radius={[2, 2, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
            {/* Zone legend */}
            <div className="flex flex-wrap gap-3 mt-3">
                {zones.map(z => (
                    <div key={z} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-sm" style={{ background: ZONE_COLORS[z] }} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{ZONE_LABELS[z]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/** Expanded event detail panel */
const EventDetail: React.FC<{
    event: TheftEvent;
    status: TheftStatus;
    onStatusChange: (id: string, s: TheftStatus) => void;
}> = ({ event: e, status, onStatusChange }) => {
    const sd = getSensor(e);
    return (
        <div className="px-4 pb-4 pt-1 space-y-3 bg-slate-50 border-t border-slate-100">

            {/* Fuel level bars + sensor stats */}
            <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[160px] space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fuel Level</p>
                    {[
                        { label: 'Before', pct: sd.fuelBefore, color: '#10b981' },
                        { label: 'After',  pct: sd.fuelAfter,  color: '#ef4444' },
                    ].map(row => (
                        <div key={row.label}>
                            <div className="flex justify-between text-[8px] font-mono text-slate-500 mb-1">
                                <span>{row.label}</span>
                                <span>{row.pct}% · {Math.round(sd.tank * row.pct / 100)}L</span>
                            </div>
                            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                     style={{ width: `${row.pct}%`, background: row.color }} />
                            </div>
                        </div>
                    ))}
                    <p className="text-[8px] font-mono text-red-500 mt-1">
                        − {e.litres}L drained ({sd.dropPct ?? Math.round(e.litres / sd.tank * 100)}% of tank)
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 shrink-0">
                    {[
                        { label: 'Drain Rate',  value: `${sd.dropRate} L/min` },
                        { label: 'Duration',    value: `~${sd.durationMin} min` },
                        { label: 'GPS Accuracy',value: `±${sd.gpsAccuracy}m` },
                        { label: 'Sensors Hit', value: `${sd.sensors} / 3` },
                        { label: 'Tank Cap.',   value: `${sd.tank}L` },
                        { label: 'Confidence',  value: e.confidence.toUpperCase() },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white border border-slate-100 rounded-lg px-2.5 py-2">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-[11px] font-black text-slate-700 font-mono mt-0.5">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Method badge */}
            <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-slate-400 uppercase">Method:</span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-black">{e.method}</span>
                <span className="text-[8px] font-mono text-slate-400">{e.timestamp.replace('T', ' ').slice(0, 16)}</span>
            </div>

            {/* Status actions */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Update Status:</span>
                {(['confirmed', 'investigating', 'false_positive'] as TheftStatus[]).map(s => {
                    const active = status === s;
                    return (
                        <button key={s} onClick={() => onStatusChange(e.id, s)}
                            className={cn(
                                'px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all',
                                active
                                    ? 'bg-white shadow-sm'
                                    : 'bg-white/60 border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600'
                            )}
                            style={active ? { borderColor: STATUS_COLOR[s] + '80', color: STATUS_COLOR[s] } : {}}>
                            {STATUS_LABEL[s]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/** Province group card with expandable event rows */
const ProvinceCard: React.FC<{
    province: string;
    events: TheftEvent[];
    expandedId: string | null;
    onToggleExpand: (id: string) => void;
    statusOverrides: Record<string, TheftStatus>;
    onStatusChange: (id: string, s: TheftStatus) => void;
}> = ({ province, events, expandedId, onToggleExpand, statusOverrides, onStatusChange }) => {
    const totalLitres   = events.reduce((s, e) => s + e.litres, 0);
    const confirmedCount = events.filter(e => (statusOverrides[e.id] ?? e.status) === 'confirmed').length;
    const highConf      = events.filter(e => e.confidence === 'high').length;
    const byZone        = ALL_ZONES.map(z => ({ z, list: events.filter(e => e.zone === z) }))
                                   .filter(x => x.list.length > 0);
    const borderColor   = totalLitres > 500 ? '#ef4444' : totalLitres > 200 ? '#f97316' : '#f59e0b';

    return (
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-start justify-between"
                 style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}>
                <div>
                    <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{province}</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                        {confirmedCount} confirmed · {highConf} high-confidence · {events.length} total events
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black leading-none" style={{ color: borderColor }}>
                        {totalLitres.toLocaleString()}L
                    </p>
                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">stolen</p>
                </div>
            </div>

            {/* Zone breakdown bar */}
            <div className="flex h-1.5">
                {byZone.map(({ z, list }) => (
                    <div key={z} style={{ flex: list.length, background: ZONE_COLORS[z] }} />
                ))}
            </div>

            {/* Zone sections */}
            {byZone.map(({ z, list }) => {
                const Icon      = ZONE_ICONS[z];
                const zoneLitres = list.reduce((s, e) => s + e.litres, 0);
                return (
                    <div key={z} className="border-b border-slate-50 last:border-0">
                        {/* Zone sub-header */}
                        <div className="px-4 py-2 flex items-center justify-between bg-slate-50/60">
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded flex items-center justify-center"
                                     style={{ background: ZONE_COLORS[z] + '18' }}>
                                    <Icon style={{ height: 10, width: 10, color: ZONE_COLORS[z] }} />
                                </div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
                                    {ZONE_LABELS[z]}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">{list.length} event{list.length > 1 ? 's' : ''}</span>
                            </div>
                            <span className="text-[11px] font-black" style={{ color: ZONE_COLORS[z] }}>
                                {zoneLitres}L
                            </span>
                        </div>

                        {/* Event rows */}
                        <div>
                            {list.map(e => {
                                const s          = statusOverrides[e.id] ?? e.status;
                                const isExpanded = expandedId === e.id;
                                return (
                                    <div key={e.id} className="border-t border-slate-50 first:border-0">
                                        <button
                                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                                            onClick={() => onToggleExpand(e.id)}>
                                            <div className="h-1.5 w-1.5 rounded-full shrink-0"
                                                 style={{ background: STATUS_COLOR[s] }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-black text-slate-700 font-mono">{e.stock}</span>
                                                    <span className="text-[9px] text-slate-400">{e.model}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] text-slate-400">{e.zoneName}</span>
                                                    <span className="text-[9px] text-slate-200">·</span>
                                                    <span className="text-[9px] text-slate-400">{e.method}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[12px] font-black"
                                                   style={{ color: STATUS_COLOR[s] }}>{e.litres}L</p>
                                                <p className="text-[8px] font-mono text-slate-400">{fmtTs(e.timestamp)}</p>
                                            </div>
                                            <div className="h-1.5 w-1.5 rounded-full shrink-0"
                                                 style={{ background: CONF_COLOR[e.confidence] }}
                                                 title={`${e.confidence} confidence`} />
                                            {isExpanded
                                                ? <ChevronUp className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                                : <ChevronDown className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                                        </button>
                                        {isExpanded && (
                                            <EventDetail
                                                event={e}
                                                status={s}
                                                onStatusChange={onStatusChange}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/** Horizontal scrollable recent alerts strip */
const AlertsFeed: React.FC<{
    statusOverrides: Record<string, TheftStatus>;
    onToggleExpand: (id: string) => void;
}> = ({ statusOverrides, onToggleExpand }) => {
    const recent = useMemo(() =>
        [...EVENTS]
            .filter(e => (statusOverrides[e.id] ?? e.status) !== 'false_positive')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 6),
        [statusOverrides]
    );
    const activeCount = EVENTS.filter(e => (statusOverrides[e.id] ?? e.status) === 'confirmed').length;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Recent Alerts</p>
                <span className="text-[9px] font-black px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded-full">
                    {activeCount} active
                </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
                {recent.map(e => {
                    const s    = statusOverrides[e.id] ?? e.status;
                    const Icon = ZONE_ICONS[e.zone];
                    return (
                        <button key={e.id}
                            className="shrink-0 w-52 snap-start bg-white border border-border rounded-xl p-3 shadow-sm text-left hover:shadow-md transition-shadow cursor-pointer"
                            style={{ borderTopColor: STATUS_COLOR[s], borderTopWidth: 2 }}
                            onClick={() => onToggleExpand(e.id)}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[12px] font-black text-slate-800 font-mono">{e.stock}</span>
                                <div className="h-5 w-5 rounded flex items-center justify-center"
                                     style={{ background: ZONE_COLORS[e.zone] + '20' }}>
                                    <Icon style={{ height: 10, width: 10, color: ZONE_COLORS[e.zone] }} />
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-400 truncate">{e.province} · {e.zoneName}</p>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="text-[18px] font-black leading-none"
                                      style={{ color: STATUS_COLOR[s] }}>{e.litres}L</span>
                                <span className="text-[8px] text-slate-400 font-mono leading-none">{e.method}</span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between">
                                <span className="text-[8px] font-mono text-slate-400">{fmtTs(e.timestamp)}</span>
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded"
                                      style={{ background: STATUS_COLOR[s] + '18', color: STATUS_COLOR[s] }}>
                                    {STATUS_LABEL[s]}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const FuelTheft: React.FC = () => {
    const [filter,         setFilter]         = useState<FilterZone>('all');
    const [expandedId,     setExpandedId]     = useState<string | null>(null);
    const [statusOverrides,setStatusOverrides]= useState<Record<string, TheftStatus>>({});
    const [sortBy,         setSortBy]         = useState<SortBy>('volume');
    const [search,         setSearch]         = useState('');

    const handleStatusChange  = (id: string, s: TheftStatus) =>
        setStatusOverrides(prev => ({ ...prev, [id]: s }));

    const handleToggleExpand = (id: string) =>
        setExpandedId(prev => prev === id ? null : id);

    // Filtered + searched events
    const filtered = useMemo(() => {
        let ev = filter === 'all' ? EVENTS : EVENTS.filter(e => e.zone === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            ev = ev.filter(e =>
                e.stock.toLowerCase().includes(q)   ||
                e.model.toLowerCase().includes(q)   ||
                e.zoneName.toLowerCase().includes(q)||
                e.province.toLowerCase().includes(q)
            );
        }
        return ev;
    }, [filter, search]);

    // KPIs using overridden statuses
    const totalLitres    = filtered.reduce((s, e) => s + e.litres, 0);
    const confirmedCount = filtered.filter(e => (statusOverrides[e.id] ?? e.status) === 'confirmed').length;
    const investigatingC = filtered.filter(e => (statusOverrides[e.id] ?? e.status) === 'investigating').length;
    const highConfCount  = filtered.filter(e => e.confidence === 'high').length;
    const investigatingL = filtered
        .filter(e => (statusOverrides[e.id] ?? e.status) === 'investigating')
        .reduce((s, e) => s + e.litres, 0);

    // Province groups
    const provinceGroups = useMemo(() => {
        const map = new Map<string, TheftEvent[]>();
        filtered.forEach(e => {
            const arr = map.get(e.province) ?? [];
            arr.push(e);
            map.set(e.province, arr);
        });
        return Array.from(map.entries()).sort((a, b) => {
            if (sortBy === 'events')   return b[1].length - a[1].length;
            if (sortBy === 'province') return a[0].localeCompare(b[0]);
            return b[1].reduce((s, x) => s + x.litres, 0) - a[1].reduce((s, x) => s + x.litres, 0);
        });
    }, [filtered, sortBy]);

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-red-50 border border-red-200 rounded-xl">
                            <Droplets className="h-5 w-5 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Fuel Theft</h1>
                    </div>
                    <p className="text-[12px] text-slate-500 ml-[52px]">
                        Geo-zone fuel theft monitoring — factory, dealerships, suppliers and in-province routes.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2">
                        <SearchIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search stock, province…"
                            className="text-[11px] bg-transparent outline-none text-slate-700 placeholder:text-slate-300 w-36"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-[11px] font-black text-red-700 uppercase tracking-widest">
                            {confirmedCount} Confirmed Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent alerts feed */}
            <AlertsFeed statusOverrides={statusOverrides} onToggleExpand={handleToggleExpand} />

            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                    { label: 'Total Stolen',         value: `${totalLitres.toLocaleString()}L`, icon: Droplets,      color: '#ef4444' },
                    { label: 'Confirmed Theft',       value: confirmedCount,                     icon: AlertTriangle, color: '#ef4444' },
                    { label: 'Under Investigation',   value: investigatingC,                     icon: Clock,         color: '#f97316' },
                    { label: 'Investigating (L)',      value: `${investigatingL}L`,               icon: Gauge,         color: '#f97316' },
                    { label: 'High Confidence',       value: highConfCount,                      icon: TrendingUp,    color: '#10b981' },
                ].map(k => (
                    <div key={k.label} className="bg-white border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                             style={{ background: k.color + '18', border: `1px solid ${k.color}30` }}>
                            <k.icon style={{ color: k.color, height: 16, width: 16 }} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-800">{k.value}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight mt-0.5">{k.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Trend chart + zone chips */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <TrendChart filter={filter} />
                </div>
                <div className="grid grid-cols-2 gap-3 content-start">
                    {ALL_ZONES.map(z => {
                        const Icon    = ZONE_ICONS[z];
                        const zEvents = EVENTS.filter(e => e.zone === z);
                        const zLitres = zEvents.reduce((s, e) => s + e.litres, 0);
                        const zConfirmed = zEvents.filter(e => (statusOverrides[e.id] ?? e.status) === 'confirmed').length;
                        return (
                            <button key={z}
                                onClick={() => setFilter(prev => prev === z ? 'all' : z)}
                                className={cn(
                                    'bg-white border rounded-xl px-3 py-3 flex flex-col gap-2 shadow-sm transition-all text-left',
                                    filter === z ? 'ring-2' : 'hover:shadow-md'
                                )}
                                style={filter === z ? { ringColor: ZONE_COLORS[z], borderColor: ZONE_COLORS[z] + '60' } : {}}>
                                <div className="flex items-center justify-between">
                                    <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                                         style={{ background: ZONE_COLORS[z] + '18', border: `1px solid ${ZONE_COLORS[z]}30` }}>
                                        <Icon style={{ height: 13, width: 13, color: ZONE_COLORS[z] }} />
                                    </div>
                                    <span className="text-[8px] font-mono text-slate-400">{zEvents.length} events</span>
                                </div>
                                <div>
                                    <p className="text-[17px] font-black leading-none text-slate-800">{zLitres.toLocaleString()}L</p>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                        {ZONE_LABELS[z]}
                                    </p>
                                </div>
                                <p className="text-[8px] font-mono" style={{ color: '#ef4444' }}>
                                    {zConfirmed} confirmed
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {FILTER_TABS.map(t => {
                    const active = filter === t.key;
                    const c = t.key === 'all' ? '#6366f1' : ZONE_COLORS[t.key as TheftZone];
                    const count = t.key === 'all' ? EVENTS.length : EVENTS.filter(e => e.zone === t.key).length;
                    return (
                        <button key={t.key} onClick={() => setFilter(t.key)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all',
                                active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                            )}>
                            <t.icon className="h-3.5 w-3.5 shrink-0" style={{ color: active ? c : '#94a3b8' }} />
                            <span className="text-[11px] font-black tracking-tight"
                                  style={{ color: active ? c : '#64748b' }}>{t.label}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                                  style={{ background: (active ? c : '#94a3b8') + '18', color: active ? c : '#94a3b8' }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-slate-700/70 shadow-2xl" style={{ background: '#0f172a' }}>
                <div className="px-5 py-3 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">
                            Fuel Theft Events — {filtered.length} shown · {totalLitres.toLocaleString()}L
                        </p>
                    </div>
                    <div className="flex items-center gap-5 flex-wrap">
                        <div className="flex items-center gap-3">
                            {(['confirmed','investigating','false_positive'] as TheftStatus[]).map(s => (
                                <div key={s} className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                        {STATUS_LABEL[s]}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <span className="text-[9px] text-slate-600 font-mono">RING=STATUS · FILL=ZONE</span>
                    </div>
                </div>
                <div className="h-[480px]">
                    <TheftMap events={filtered} statusOverrides={statusOverrides} />
                </div>
            </div>

            {/* Province cards */}
            <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                            Province Breakdown
                            {search && <span className="ml-2 text-accent">(filtered)</span>}
                        </p>
                        <span className="text-[9px] font-mono text-slate-400">
                            {provinceGroups.length} provinces · click event rows to expand
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {(['volume', 'events', 'province'] as SortBy[]).map(s => (
                            <button key={s} onClick={() => setSortBy(s)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all',
                                    sortBy === s
                                        ? 'bg-accent/5 border-accent/20 text-accent'
                                        : 'bg-white border-border text-slate-400 hover:text-slate-600'
                                )}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {provinceGroups.length === 0 ? (
                    <div className="bg-white border border-border rounded-xl p-10 text-center">
                        <p className="text-slate-400 text-[12px] font-mono">No events match the current filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {provinceGroups.map(([prov, evts]) => (
                            <ProvinceCard key={prov}
                                province={prov}
                                events={evts}
                                expandedId={expandedId}
                                onToggleExpand={handleToggleExpand}
                                statusOverrides={statusOverrides}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-border">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-full">Confidence Legend</p>
                {[
                    { color: CONF_COLOR.high,   label: 'High — GPS + sensor correlation confirmed' },
                    { color: CONF_COLOR.medium,  label: 'Medium — sensor anomaly, no GPS lock'       },
                    { color: CONF_COLOR.low,     label: 'Low — flagged for manual review'             },
                ].map(x => (
                    <div key={x.label} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: x.color }} />
                        <span className="text-[9px] text-slate-400">{x.label}</span>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default FuelTheft;
