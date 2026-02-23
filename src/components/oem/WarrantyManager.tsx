import React from 'react';
import { ShieldCheck, FileWarning, Activity, UserCircle, HardDrive, Search, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const WarrantyManager: React.FC = () => {
    const claims = [
        {
            id: 'CLM-772',
            truck: 'ST-1045',
            part: 'Turbocharger Module',
            status: 'investigating',
            fault: 'component_failure',
            limpMode: true,
            behaviorAlerts: ['High Engine Temp (104C)', 'Excessive Idling'],
            date: '2024-02-18'
        },
        {
            id: 'CLM-768',
            truck: 'ST-1092',
            part: 'Clutch Assembly',
            status: 'rejected',
            fault: 'driver_abuse',
            limpMode: false,
            behaviorAlerts: ['Severe Over-revving', 'Harsh Gear Change'],
            date: '2024-02-15'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Claim Analytics */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-accent" />
                            Telematics-Linked Warranty Claims
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent w-64"
                                placeholder="Search Stock # or Part SKU..."
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {claims.map((claim) => (
                            <div key={claim.id} className="p-4 bg-white/5 border border-white/5 rounded-xl group hover:border-white/10 transition-all">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5",
                                            claim.status === 'rejected' ? "bg-status-red/10 text-status-red" : "bg-accent/10 text-accent"
                                        )}>
                                            {claim.status === 'rejected' ? <XCircle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-white">{claim.truck}</span>
                                                <span className="text-xs text-slate-500">• {claim.part}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Claim ID: {claim.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-right">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                                claim.status === 'rejected' ? "bg-status-red text-white" : "bg-status-amber text-black"
                                            )}>
                                                {claim.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Activity className="h-3 w-3" /> Telematics Data Correlation
                                        </h4>
                                        {claim.behaviorAlerts.map((alert, i) => (
                                            <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300">
                                                <div className="h-1 w-1 rounded-full bg-status-red" />
                                                {alert}
                                            </div>
                                        ))}
                                        {claim.limpMode && (
                                            <p className="text-[10px] text-accent font-black italic flex items-center gap-1">
                                                <Zap className="h-3 w-3" /> ENGINE PROTECTION (LIMP MODE) TRIGGERED
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2 flex flex-col justify-end">
                                        <div className="p-3 bg-card rounded-lg border border-white/5">
                                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                                <span className="font-bold text-white uppercase italic">AI Conclusion: </span>
                                                {claim.fault === 'driver_abuse'
                                                    ? "Significant mismatch between sensor thresholds and driver inputs. Abuse detected."
                                                    : "Component failure confirmed within normal operating parameters. Approving repair."}
                                            </p>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button className="text-[10px] font-bold text-slate-400 flex items-center gap-1 hover:text-white transition-all">
                                                <FileWarning className="h-3 w-3" /> Pull Report
                                            </button>
                                            <button className="text-[10px] font-bold text-accent px-3 py-1 bg-accent/10 rounded flex items-center gap-1 hover:bg-accent/20 transition-all">
                                                View Deep-Dive <ExternalLink className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Claim Intelligence */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                            <HardDrive className="h-5 w-5 text-status-blue" />
                            Warranty Savings (MTD)
                        </h3>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-black text-white">R 142,500</span>
                            <span className="text-xs text-status-green font-bold">↑ 12% vs last mo</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed mb-6">
                            Savings realized through telematics-based rejection of abuse-driven warranty claims.
                        </p>

                        <div className="space-y-4">
                            <MetricMini label="Protection Unit Uptime" value="100%" color="bg-status-green" />
                            <MetricMini label="Limp Mode Effectiveness" value="94%" color="bg-status-blue" />
                            <MetricMini label="Engine Saves (Projected)" value="8 Units" color="bg-accent" />
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl bg-accent/5 border border-accent/20">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-accent" />
                            Operational Efficiency
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            "By linking engine protection data to service planning, we've reduced major engine repair downtime by 40% across the fleet."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricMini = ({ label, value, color }: any) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400 font-bold uppercase">{label}</span>
            <span className="text-white font-black">{value}</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={cn("h-full", color)} style={{ width: value.includes('%') ? value : '80%' }} />
        </div>
    </div>
);

const Zap = ({ className }: any) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

export default WarrantyManager;
