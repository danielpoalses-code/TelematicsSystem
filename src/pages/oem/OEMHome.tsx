import React, { useState } from 'react';
import StatCard from '@/components/cards/StatCard';
import {
    Truck, Activity, AlertTriangle, WifiOff, Package, PlayCircle,
    ShieldAlert, CheckCircle2, Droplets, Box, ShieldCheck, FileWarning,
    ExternalLink, BatteryLow, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ResourceMonitor from '@/components/oem/ResourceMonitor';
import LogisticsPlanner from '@/components/oem/LogisticsPlanner';
import BuildQualityMonitor from '@/components/oem/BuildQualityMonitor';
import WarrantyManager from '@/components/oem/WarrantyManager';

type OEMTab = 'production' | 'logistics' | 'quality' | 'warranty';

import { dataService } from '@/services/DataService';

// ── Factory Battery Checks — 21.02.2026_Factory_Battery_Checks.xlsx ──────────
// ISO = ISO Switch disconnect event (cuts vehicle battery)
// Low = Battery Low voltage alarm
// Real data for top 5 groups; estimates for remaining 39 groups in report
const BATTERY_CHECKS = [
    { group: 'Powerstar Centurion',   iso: 353, low: 421, total: 774,  isReal: true  },
    { group: 'Powerstar Ermelo',      iso: 93,  low: 81,  total: 174,  isReal: true  },
    { group: 'Powerstar Middelburg',  iso: 90,  low: 69,  total: 159,  isReal: true  },
    { group: 'Active Fleet',          iso: 53,  low: 76,  total: 129,  isReal: true  },
    { group: 'Powerstar PMB',         iso: 41,  low: 57,  total: 98,   isReal: true  },
    { group: 'Powerstar Brakpan',     iso: 32,  low: 45,  total: 77,   isReal: false },
    { group: 'Powerstar Polokwane',   iso: 28,  low: 37,  total: 65,   isReal: false },
    { group: 'Powerstar Empangeni',   iso: 21,  low: 31,  total: 52,   isReal: false },
];

const BATTERY_ISO_TOTAL = 810;   // est. across all 44 groups
const BATTERY_LOW_TOTAL = 954;   // est.
const BATTERY_EVENTS_TOTAL = 1764;

const OEMHome: React.FC = () => {
    const { trucks, loading } = dataService.useTrucks();
    const [activeTab, setActiveTab] = useState<OEMTab>('production');

    const tabs = [
        { id: 'production', label: 'Production', icon: Droplets },
        { id: 'logistics',  label: 'Logistics',  icon: Box },
        { id: 'quality',    label: 'Quality',    icon: ShieldCheck },
        { id: 'warranty',   label: 'Warranty',   icon: FileWarning },
    ] as const;

    const maxBattery = Math.max(...BATTERY_CHECKS.map(b => b.total));

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Factory Management</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Live monitoring of factory health, resource levels, and assembly logistics.</p>
                </div>
            </div>

            {/* Fleet Overview — real numbers from offline_fleet_v3.xlsx */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Objects"  value="1,020"      icon={Truck} />
                <StatCard title="Online Moving"  value="200"         icon={Activity}      variant="green" trend={{ value: 5, isUp: true }} />
                <StatCard title="Stationary"     value="530"         icon={PlayCircle}    variant="blue" />
                <StatCard title="Alert / Idle"   value="45"          icon={AlertTriangle} variant="amber" />
                <StatCard title="Offline"        value="245 (24%)"   icon={WifiOff}       variant="red" />
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-border rounded-xl w-fit">
                {tabs.map((tab) => (
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
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'production' && (
                        <div className="space-y-8">

                            {/* Lifecycle Pipeline + Build Quality Metrics */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-white border border-border p-6 rounded-xl shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                            <Package className="h-4 w-4 text-accent" />
                                            Factory Lifecycle Pipeline
                                        </h2>
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded leading-none uppercase">Live View</span>
                                    </div>
                                    <div className="space-y-5">
                                        <FunnelStep label="Virtual Stockyard"  count={145} percentage={100} color="bg-blue-500"       description="Units in stock, awaiting build (Limiter, GPS Box, Harnesses)" />
                                        <FunnelStep label="TO BE DRIVEN"       count={10}  percentage={40}  color="bg-status-amber"   description="Built, waiting for PDI test drive to verify sensors" />
                                        <FunnelStep label="Quality Control Hold" count={5} percentage={15}  color="bg-accent"          description="Did not pass inspection, needs fix and re-check" isAlert />
                                        <FunnelStep label="Active Fleet / Ready" count={107} percentage={75} color="bg-status-green"   description="Passed all inspections, ready for dealership dispatch" />
                                    </div>
                                </div>
                                <div className="bg-white border border-border p-6 rounded-xl shadow-sm">
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
                                        <ShieldAlert className="h-4 w-4 text-accent" />
                                        Build Quality Metrics
                                    </h2>
                                    <div className="space-y-6">
                                        <MetricProgress label="First-Start Sensor Pass" value={94}  icon={CheckCircle2} />
                                        <MetricProgress label="Avg Install Time (7d)"   value={82}  icon={Activity}     unit="min" />
                                        <MetricProgress label="Rework rate"              value={4.2} icon={AlertTriangle} isInverse />
                                        <MetricProgress label="Engine protections"       value={1.8} icon={ShieldAlert}   isInverse />
                                    </div>
                                </div>
                            </div>

                            {/* Resource Management */}
                            <div className="pt-8 border-t border-border">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Resource Management</h2>
                                <p className="text-slate-500 mb-8 text-sm">Bulk Storage monitoring, SKU usage efficiency, and spillage detection.</p>
                                <ResourceMonitor />
                            </div>

                            {/* Factory Battery Checks */}
                            <div className="pt-8 border-t border-border">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                            <BatteryLow className="h-5 w-5 text-orange-500" />
                                            Factory Battery Checks
                                        </h2>
                                        <p className="text-slate-500 text-sm mt-1">
                                            ISO disconnect &amp; battery low alarms logged at factory, <span className="font-bold text-slate-700">14–21 Feb 2026</span>.
                                            Source: Factory_Battery_Checks report · 44 groups.
                                        </p>
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ISO Disconnects</p>
                                            <p className="text-2xl font-black text-red-600">{BATTERY_ISO_TOTAL.toLocaleString()}</p>
                                            <p className="text-[9px] text-slate-400">est. total</p>
                                        </div>
                                        <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Battery Low</p>
                                            <p className="text-2xl font-black text-orange-600">{BATTERY_LOW_TOTAL.toLocaleString()}</p>
                                            <p className="text-[9px] text-slate-400">est. total</p>
                                        </div>
                                        <div className="bg-white border border-border rounded-xl px-4 py-2 text-center shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Events</p>
                                            <p className="text-2xl font-black text-slate-800">{BATTERY_EVENTS_TOTAL.toLocaleString()}</p>
                                            <p className="text-[9px] text-slate-400">44 groups</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-4 border-b border-border flex items-center justify-between">
                                        <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Top Groups by Event Count</h3>
                                        <span className="text-[10px] text-slate-400">Showing 8 of 44 groups · 5 with real data</span>
                                    </div>
                                    <table className="w-full text-[12px]">
                                        <thead className="bg-slate-50 border-b border-border">
                                            <tr>
                                                {['Group', 'ISO Disconnect', 'Battery Low', 'Total Events', 'Distribution', 'Data'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left font-black text-[10px] text-slate-500 uppercase tracking-widest">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {BATTERY_CHECKS.map(row => (
                                                <tr key={row.group} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-bold text-slate-800">{row.group}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="h-3 w-3 text-red-500 shrink-0" />
                                                            <span className="font-mono font-bold text-red-600">{row.iso}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <BatteryLow className="h-3 w-3 text-orange-500 shrink-0" />
                                                            <span className="font-mono font-bold text-orange-600">{row.low}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-black text-slate-800">{row.total}</td>
                                                    <td className="px-4 py-3 w-40">
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-36">
                                                            <div
                                                                className={cn("h-full rounded-full", row.isReal ? 'bg-orange-400' : 'bg-slate-300')}
                                                                style={{ width: `${(row.total / maxBattery) * 100}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                                            row.isReal ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                                        )}>
                                                            {row.isReal ? 'Real' : 'Est.'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="px-4 py-3 border-t border-border bg-slate-50 text-[10px] text-slate-400 flex items-center justify-between">
                                        <span>Top 8 of 44 groups shown — <strong className="text-slate-600">5 groups with real extracted data</strong>, remaining 36 estimated.</span>
                                        <span className="font-mono">21.02.2026_Factory_Battery_Checks.xlsx</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'logistics' && <LogisticsPlanner />}
                    {activeTab === 'quality'   && <BuildQualityMonitor />}
                    {activeTab === 'warranty'  && <WarrantyManager />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const FunnelStep = ({ label, count, percentage, color, description, isAlert = false }: any) => (
    <div className={cn("relative group cursor-pointer transition-all duration-300 hover:translate-x-1", isAlert && "animate-pulse")}>
        <div className="flex items-center justify-between mb-2">
            <div>
                <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">{label}</span>
                <p className="text-[10px] text-slate-400 font-medium">{description}</p>
            </div>
            <span className="text-xl font-black text-slate-800">{count}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={cn("h-full rounded-full", color)} />
        </div>
    </div>
);

const MetricProgress = ({ label, value, icon: Icon, unit = '%', isInverse = false }: any) => {
    const isGood = isInverse ? value < 5 : value > 90;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", isGood ? "text-status-green" : "text-accent")} />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{label}</span>
                </div>
                <span className="text-sm font-black text-slate-800">{value}{unit}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", isGood ? "bg-status-green" : "bg-accent")} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
        </div>
    );
};

export default OEMHome;
