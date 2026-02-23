import React from 'react';
import { Fuel, Droplets, AlertTriangle, TrendingUp, History, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import EfficiencyChart from '../charts/EfficiencyChart';

const ResourceMonitor: React.FC = () => {
    const tanks = [
        { id: 'tank_1', name: 'Main Diesel Tank', type: 'diesel', level: 12400, capacity: 15000, status: 'good' },
        { id: 'tank_2', name: 'Reserve Diesel', type: 'diesel', level: 2100, capacity: 5000, status: 'low' },
        { id: 'tank_3', name: 'Coolant Bulk A', type: 'coolant', level: 850, capacity: 1000, status: 'good' },
    ];

    const currentBatch = {
        id: 'SKD-2024-001',
        model: 'Powerstar VX-3335',
        progress: 72,
        dieselUsage: [
            { name: 'Unit 1', actual: 45, target: 40 },
            { name: 'Unit 2', actual: 38, target: 40 },
            { name: 'Unit 3', actual: 42, target: 40 },
            { name: 'Unit 4', actual: 55, target: 40 }, // Alert: high usage
            { name: 'Unit 5', actual: 41, target: 40 },
        ],
        coolantUsage: [
            { name: 'Unit 1', actual: 12, target: 12 },
            { name: 'Unit 2', actual: 11.5, target: 12 },
            { name: 'Unit 3', actual: 14, target: 12 },
            { name: 'Unit 4', actual: 12, target: 12 },
            { name: 'Unit 5', actual: 12.5, target: 12 },
        ]
    };

    const recentAnomalies = [
        { id: '1', time: '02:45 AM', type: 'theft', liquid: 'diesel', amount: '-150L', tank: 'Main Diesel Tank', severity: 'critical' },
        { id: '2', time: 'Yesterday', type: 'wastage', liquid: 'coolant', amount: '+15L', tank: 'Coolant Bulk A', severity: 'medium' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tank Status Cards */}
                {tanks.map((tank) => (
                    <div key={tank.id} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 rounded-xl bg-card border border-white/5 flex items-center justify-center">
                                {tank.type === 'diesel' ? (
                                    <Fuel className={cn("h-5 w-5", tank.status === 'low' ? 'text-status-red' : 'text-status-amber')} />
                                ) : (
                                    <Droplets className="h-5 w-5 text-status-blue" />
                                )}
                            </div>
                            <span className={cn(
                                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                tank.status === 'good' ? "bg-status-green/10 text-status-green" : "bg-status-red/10 text-status-red animate-pulse"
                            )}>
                                {tank.status}
                            </span>
                        </div>

                        <h4 className="font-bold text-white mb-1">{tank.name}</h4>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-2xl font-black text-white">{tank.level.toLocaleString()} L</span>
                            <span className="text-xs text-slate-500">/ {tank.capacity.toLocaleString()} L</span>
                        </div>

                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    tank.type === 'diesel' ? 'bg-status-amber' : 'bg-status-blue'
                                )}
                                style={{ width: `${(tank.level / tank.capacity) * 100}%` }}
                            />
                        </div>

                        {tank.status === 'low' && (
                            <p className="text-[10px] text-status-red font-bold mt-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                REORDER REQUIRED
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SKD Efficiency Charts */}
                <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-accent" />
                                Efficiency Target Tracking
                            </h3>
                            <p className="text-xs text-slate-500">Batch: {currentBatch.id} ({currentBatch.model})</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-accent">{currentBatch.progress}%</span>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Build Progress</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Diesel Consumption per Unit</h4>
                            <EfficiencyChart data={currentBatch.dieselUsage} type="diesel" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Coolant Consumption per Unit</h4>
                            <EfficiencyChart data={currentBatch.coolantUsage} type="coolant" />
                        </div>
                    </div>
                </div>

                {/* Anomaly & Spillage Log */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-status-red" />
                            Anomaly & Loss Detection
                        </h3>
                        <button className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1">
                            <History className="h-3 w-3" />
                            View Full Log
                        </button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[500px]">
                        {recentAnomalies.map((anomaly) => (
                            <div key={anomaly.id} className="p-4 bg-card border border-white/5 rounded-xl group hover:border-white/10 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase",
                                            anomaly.severity === 'critical' ? "bg-status-red text-white" : "bg-status-amber text-black"
                                        )}>
                                            {anomaly.type}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold">{anomaly.time}</span>
                                    </div>
                                    <span className="text-sm font-black text-white">{anomaly.amount}</span>
                                </div>
                                <p className="text-xs text-slate-300 mb-1">{anomaly.tank}</p>
                                <div className="flex items-center justify-between mt-4 opacity-70 group-hover:opacity-100">
                                    <p className="text-[10px] text-slate-500 italic">Flagged for investigation by AI</p>
                                    <button className="text-[10px] font-bold text-accent px-2 py-1 bg-accent/10 rounded">Resolve</button>
                                </div>
                            </div>
                        ))}

                        <div className="mt-6 p-6 bg-accent/5 border border-accent/20 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Info className="h-20 w-20 text-accent" />
                            </div>
                            <h4 className="text-sm font-bold text-white mb-2">Build Analysis Insights</h4>
                            <ul className="space-y-2">
                                <li className="text-xs text-slate-400 flex items-start gap-2">
                                    <div className="h-1 w-1 rounded-full bg-accent mt-1.5 shrink-0" />
                                    Diesel usage is 8.5% above target for SKD-2024-001. Check calibration on pump nozzle 4.
                                </li>
                                <li className="text-xs text-slate-400 flex items-start gap-2">
                                    <div className="h-1 w-1 rounded-full bg-accent mt-1.5 shrink-0" />
                                    Unexpected 150L drop detected at 02:45 AM. Correlate with security camera feed on Gate 2.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceMonitor;
