import React from 'react';
import { ShieldCheck, Battery, WifiOff, AlertTriangle, FileText, CheckCircle2, Zap, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

const BuildQualityMonitor: React.FC = () => {
    const yardHealth = {
        totalUnits: 145,
        activeDevices: 132,
        sensorPassRate: 94,
        batteryWarnings: 12
    };

    const offlineAnalysis = [
        { reason: 'ISO Switch Activated', count: 8, description: 'Purposely disconnected for longevity', type: 'info' },
        { reason: 'Flat Battery', count: 4, description: 'Voltage dropped below 11.8V (requires charge)', type: 'warning' },
        { reason: 'Signal/Data Loss', count: 1, description: 'Out of range or recharge rule required', type: 'alert' }
    ];

    const recentEvents = [
        { id: 'ev1', truck: 'ST-1088', event: 'Battery Low (11.5V)', stage: 'Virtual Stockyard', severity: 'high', time: '10m ago' },
        { id: 'ev2', truck: 'ST-1102', event: 'Coolant Sensor Offline', stage: 'QC Hold', severity: 'critical', time: '1h ago' },
        { id: 'ev3', truck: 'ST-1095', event: 'ISO Switch Toggled', stage: 'To Be Driven', severity: 'low', time: '3h ago' }
    ];

    return (
        <div className="space-y-6">
            {/* Top Intelligence Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <HealthMetricCard label="Sensor Pass Rate" value={`${yardHealth.sensorPassRate}%`} icon={CheckCircle2} color="text-status-green" />
                <HealthMetricCard label="Active Yard Devices" value={yardHealth.activeDevices} icon={Zap} color="text-accent" />
                <HealthMetricCard label="Battery Health Alerts" value={yardHealth.batteryWarnings} icon={Battery} color="text-status-amber" isWarning />
                <HealthMetricCard label="Build QC Holds" value="5" icon={ShieldCheck} color="text-status-red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Offline Reason Analysis (User Requirement) */}
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                        <WifiOff className="h-5 w-5 text-slate-400" />
                        Offline Root Cause Analysis
                    </h3>
                    <div className="space-y-4">
                        {offlineAnalysis.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-all">
                                <div className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                    item.type === 'info' ? "bg-blue-500/10 text-blue-400" : item.type === 'warning' ? "bg-status-amber/10 text-status-amber" : "bg-status-red/10 text-status-red"
                                )}>
                                    {item.type === 'info' ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-white text-sm">{item.reason}</h4>
                                        <span className="text-xl font-black text-white">{item.count}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quality Alerts & Yard Watch */}
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-status-amber" />
                            Build Quality & Yard Watch
                        </h3>
                        <button className="flex items-center gap-2 text-[10px] font-bold text-accent px-3 py-1 bg-accent/10 rounded-full hover:bg-accent/20 transition-all">
                            <FileText className="h-3.5 w-3.5" />
                            Pull Quality Report
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentEvents.map((event) => (
                            <div key={event.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-white/5 group hover:bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full shadow-[0_0_8px]",
                                        event.severity === 'critical' ? "bg-status-red shadow-status-red/50" : event.severity === 'high' ? "bg-status-amber shadow-status-amber/50" : "bg-blue-400 shadow-blue-400/50"
                                    )} />
                                    <div>
                                        <p className="text-xs font-bold text-white">{event.truck}</p>
                                        <p className="text-[10px] text-slate-400">{event.event}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{event.stage}</p>
                                    <p className="text-[9px] text-slate-400 mt-1">{event.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-xl relative overflow-hidden">
                        <div className="relative z-10 flex items-start gap-3">
                            <Box className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-white mb-1">Productivity Insight</h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    Sensor connection errors are down 12% following the new wiring harness protocol. Recommended: Perform battery sweep on Gate 3 stock to avoid flat cells.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HealthMetricCard = ({ label, value, icon: Icon, color, isWarning }: any) => (
    <div className="glass-panel p-4 rounded-xl relative overflow-hidden group">
        <div className="flex items-center gap-3 relative z-10">
            <div className={cn("h-8 w-8 rounded-lg bg-card border border-white/5 flex items-center justify-center", color)}>
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">{label}</p>
                <span className={cn("text-lg font-black text-white", isWarning && "text-status-amber")}>{value}</span>
            </div>
        </div>
        {isWarning && <div className="absolute inset-0 bg-status-amber/5 animate-pulse" />}
    </div>
);

export default BuildQualityMonitor;
