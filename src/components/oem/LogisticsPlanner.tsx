import React from 'react';
import { Box, Ship, AlertCircle, BarChart3, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const LogisticsPlanner: React.FC = () => {
    const inventory = [
        { id: 'p1', name: 'Euro 2 ECU Mainframe', sku: 'PS-ECU-001', stock: 12, global: 45, reorder: 20, speed: 'fast', leadTime: '90 Days' },
        { id: 'p2', name: 'High-Temp Coolant Sensor', sku: 'PS-SEN-HT', stock: 156, global: 890, reorder: 200, speed: 'slow', leadTime: '30 Days' },
        { id: 'p3', name: 'Galileo 10x GPS Module', sku: 'PS-TEL-G10', stock: 8, global: 124, reorder: 50, speed: 'fast', leadTime: '90 Days' },
    ];

    const chinaOrders = [
        { ref: 'CO-9921', status: 'In Transit (Ocean)', eta: '2024-05-12', progress: 65, origin: 'SHANGHAI', destination: 'DURBAN' },
        { ref: 'CO-9844', status: 'Customs Hold', eta: '2024-03-20', progress: 85, origin: 'BEIJING', destination: 'JOHANNESBURG', alert: true },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Global Stock Overview */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Box className="h-5 w-5 text-accent" />
                            Global Parts Inventory
                        </h3>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-400">Total SKU: 1,420</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase">Part / SKU</th>
                                    <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase">Factory Stock</th>
                                    <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase">Global Pool</th>
                                    <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase">Movement</th>
                                    <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase">Lead Time</th>
                                    <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {inventory.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/[0.02]">
                                        <td className="py-4">
                                            <p className="text-sm font-bold text-white">{item.name}</p>
                                            <p className="text-[10px] text-slate-500">{item.sku}</p>
                                        </td>
                                        <td className="py-4 text-sm font-mono text-white">{item.stock}</td>
                                        <td className="py-4 text-sm font-mono text-slate-400">{item.global}</td>
                                        <td className="py-4">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                item.speed === 'fast' ? "bg-status-amber/10 text-status-amber" : "bg-status-blue/10 text-status-blue"
                                            )}>
                                                {item.speed}
                                            </span>
                                        </td>
                                        <td className="py-4 text-xs text-slate-400">{item.leadTime}</td>
                                        <td className="py-4">
                                            {item.stock < item.reorder ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-status-red uppercase">
                                                    <AlertCircle className="h-3 w-3" /> Critical Low
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-status-green uppercase">Optimal</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tracking Orders (China) */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                        <Ship className="h-5 w-5 text-status-blue" />
                        Supply Chain (Overseas)
                    </h3>

                    <div className="space-y-4 flex-1">
                        {chinaOrders.map((order) => (
                            <div key={order.ref} className="p-4 bg-card border border-white/5 rounded-xl space-y-3 group hover:border-white/10 transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-black text-white">{order.ref}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">{order.status}</p>
                                    </div>
                                    {order.alert && <AlertCircle className="h-4 w-4 text-status-red animate-pulse" />}
                                </div>

                                <div className="flex items-center gap-2 py-1">
                                    <span className="text-[9px] font-bold text-slate-400">{order.origin}</span>
                                    <div className="h-px flex-1 bg-white/5 relative">
                                        <div
                                            className="absolute inset-y-0 left-0 bg-status-blue transition-all duration-1000"
                                            style={{ width: `${order.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400">{order.destination}</span>
                                </div>

                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 font-medium flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> ETA: {order.eta}
                                    </span>
                                    <button className="text-accent flex items-center gap-1 font-bold">
                                        Track <ArrowRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-status-amber/5 border border-status-amber/20 rounded-xl">
                        <p className="text-xs font-bold text-status-amber mb-1 italic flex items-center gap-2">
                            <BarChart3 className="h-3 w-3" /> Renee's Supply Insight
                        </p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            Slow-moving Chassis parts currently 114% overstock. Recommend pause on Q3 orders. Fast-moving ECUs requires emergency air-freight batch.
                        </p>
                    </div>
                </div>
            </div>

            {/* Global Fleet Service Scheduler (Demand Correlation) */}
            <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-status-green" />
                            Global Fleet Service Intelligence
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Predictive parts distribution based on live engine hours and location.</p>
                    </div>
                    <button className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent-hover transition-colors">
                        Distribute Parts to Dealers
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ServiceZoneCard
                        zone="Gauteng North"
                        load="High"
                        partsStatus="Stocked"
                        closestDealer="Centurion"
                        upcomingServices={84}
                    />
                    <ServiceZoneCard
                        zone="Western Cape"
                        load="Medium"
                        partsStatus="Pending"
                        closestDealer="Brackenfell"
                        upcomingServices={32}
                        isWarning
                    />
                    <ServiceZoneCard
                        zone="Mpumalanga"
                        load="Low"
                        partsStatus="Stocked"
                        closestDealer="Ermelo"
                        upcomingServices={12}
                    />
                    <ServiceZoneCard
                        zone="KZN Coast"
                        load="Critical"
                        partsStatus="Shortage"
                        closestDealer="Empangeni"
                        upcomingServices={45}
                        isCritical
                    />
                </div>
            </div>
        </div>
    );
};

const ServiceZoneCard = ({ zone, load, partsStatus, closestDealer, upcomingServices, isWarning, isCritical }: any) => (
    <div className={cn(
        "p-4 rounded-xl border transition-all",
        isCritical ? "bg-status-red/5 border-status-red/20" : isWarning ? "bg-status-amber/5 border-status-amber/20" : "bg-white/5 border-white/5"
    )}>
        <div className="flex justify-between items-start mb-3">
            <h4 className="text-xs font-bold text-white">{zone}</h4>
            <span className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                isCritical ? "bg-status-red text-white" : isWarning ? "bg-status-amber text-black" : "bg-white/10 text-slate-400"
            )}>
                {load} Load
            </span>
        </div>
        <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Upcoming Services:</span>
                <span className="text-white font-bold">{upcomingServices} Units</span>
            </div>
            <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Parts Status:</span>
                <span className={cn("font-bold", partsStatus === 'Shortage' ? "text-status-red" : "text-slate-300")}>{partsStatus}</span>
            </div>
            <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Main Hub:</span>
                <span className="text-white font-bold">{closestDealer}</span>
            </div>
        </div>
    </div>
);

export default LogisticsPlanner;
