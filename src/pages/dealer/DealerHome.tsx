import React, { useState } from 'react';
import StatCard from '@/components/cards/StatCard';
import { ClipboardList, AlertTriangle, Truck, Wrench, Package, ShieldAlert, UserPlus, Lightbulb, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ClientOnboarding from '@/pages/dealer/ClientOnboarding';
import SalesEnablement from '@/components/dealer/SalesEnablement';

type DealerTab = 'overview' | 'onboarding' | 'sales';

const DealerHome: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DealerTab>('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Truck },
        { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
        { id: 'sales', label: 'Sales', icon: Lightbulb },
    ] as const;

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Dealership Operations</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Fleet intelligence, predictive scheduling, and client growth tools.</p>
                </div>
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
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <StatCard title="Total Trucks" value="249" icon={Truck} />
                                <StatCard title="Active Offline" value="84" icon={AlertTriangle} variant="red" />
                                <StatCard title="In Service Bay" value="12" icon={Wrench} variant="blue" />
                                <StatCard title="Open Faults" value="38" icon={AlertTriangle} variant="amber" />
                                <StatCard title="Engine Protections" value="5" icon={ShieldAlertLucide} variant="red" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4 text-accent" />
                                            Predictive Scheduling
                                        </h2>
                                        <button className="text-[11px] font-black text-accent hover:underline uppercase tracking-tight">View All Overdue</button>
                                    </div>

                                    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                                        <table className="w-full text-left text-[12px]">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-border">
                                                <tr>
                                                    <th className="px-6 py-4">Asset / Client</th>
                                                    <th className="px-6 py-4">Odometer</th>
                                                    <th className="px-6 py-4">Next</th>
                                                    <th className="px-6 py-4">Gap</th>
                                                    <th className="px-6 py-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {[
                                                    { truck: 'ST-001 (Teichman)', odo: '45,200', next: '45,000', remaining: '-200', status: 'overdue' },
                                                    { truck: 'ST-042 (Unitrans)', odo: '12,150', next: '15,000', remaining: '2,850', status: 'upcoming' },
                                                    { truck: 'ST-109 (Teichman)', odo: '8,900', next: '10,000', remaining: '1,100', status: 'attention' },
                                                ].map((row, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-black text-slate-700 uppercase tracking-tight">{row.truck}</td>
                                                        <td className="px-6 py-4 text-slate-500 font-medium">{row.odo} km</td>
                                                        <td className="px-6 py-4 text-slate-500 font-medium">{row.next} km</td>
                                                        <td className={cn(
                                                            "px-6 py-4 font-mono font-black",
                                                            row.status === 'overdue' ? "text-accent" : row.status === 'attention' ? "text-status-amber" : "text-status-green"
                                                        )}>
                                                            {row.remaining} km
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-tight",
                                                                row.status === 'overdue' ? "bg-accent/10 text-accent" :
                                                                    row.status === 'attention' ? "bg-status-amber/10 text-status-amber" :
                                                                        "bg-status-green/10 text-status-green"
                                                            )}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white border border-border p-5 rounded-xl shadow-sm">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
                                            <Package className="h-4 w-4 text-accent" />
                                            Logistics Planning
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-medium">Oil Filters</span>
                                                <span className="font-black text-slate-800">42 units</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-medium">Fuel Filters</span>
                                                <span className="font-black text-slate-800">38 units</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-medium">Coolant (5L)</span>
                                                <span className="font-black text-slate-800">15 units</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-status-amber/5 border border-status-amber/10 p-5 rounded-xl">
                                        <h3 className="text-sm font-black text-status-amber uppercase tracking-widest flex items-center gap-2 mb-4">
                                            <AlertTriangle className="h-4 w-4" />
                                            Active Faults
                                        </h3>
                                        <div className="space-y-4">
                                            <p className="text-[11px] text-slate-500 font-medium">38 trucks currently reporting check-engine flags.</p>
                                            <button className="w-full bg-status-amber hover:bg-status-amber/90 text-white py-2 rounded text-[11px] font-black transition-all uppercase tracking-wider">
                                                Review Severe Flags (12)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'onboarding' && <ClientOnboarding />}
                    {activeTab === 'sales' && <SalesEnablement />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const ShieldAlertLucide = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
);

export default DealerHome;
