import React from 'react';
import StatCard from '@/components/cards/StatCard';
import FleetMap from '@/components/maps/FleetMap';
import SensorTrendChart from '@/components/charts/SensorTrendChart';
import { Activity, Fuel, ShieldAlert, Navigation, Gauge } from 'lucide-react';

const FleetHome: React.FC = () => {
    // Mock sensor data for trend chart
    const mockTempData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: `${i}:00`,
        temp: 85 + Math.random() * 20,
    }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Teichman Logistics</h1>
                    <p className="text-slate-400 mt-1">Fleet Health & Performance Intelligence Dashboard.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <StatCard title="Total Trucks" value="107" icon={Truck} className="lg:col-span-1" />
                <StatCard title="Moving Now" value="38" icon={Activity} variant="green" className="lg:col-span-1" />
                <StatCard title="Engine Health Alerts" value="4" icon={ShieldAlert} variant="red" className="lg:col-span-1" />
                <StatCard title="Total Distance (30d)" value="458,200 km" icon={Navigation} className="lg:col-span-1" />
                <StatCard title="Avg Driver Score" value="84/100" icon={Gauge} variant="blue" className="lg:col-span-1" />
                <StatCard title="Fuel Efficiency" value="32.4 L/100km" icon={Fuel} className="lg:col-span-1" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Real-time map */}
                <div className="lg:col-span-8 space-y-4">
                    <h3 className="text-xl font-bold">Live Fleet Status</h3>
                    <FleetMap />
                </div>

                {/* Engine Health Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            <ShieldAlert className="h-5 w-5 text-accent" />
                            Engine Protect Intelligence
                        </h3>

                        <div className="space-y-6">
                            <div className="p-4 bg-status-red/5 border border-status-red/20 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-status-red uppercase tracking-wider">CRITICAL TRIGGER</span>
                                    <span className="text-[10px] text-slate-500">22 mins ago</span>
                                </div>
                                <p className="text-sm font-bold text-white">Truck ST-085: Coolant Overtemp</p>
                                <p className="text-xs text-slate-400 mt-1">Value: 109°C | Threshold: 108°C</p>
                                <div className="mt-3 flex gap-2">
                                    <button className="px-3 py-1 bg-status-red text-white text-[10px] font-bold rounded">View Location</button>
                                    <button className="px-3 py-1 bg-white/5 text-white text-[10px] font-bold rounded">Log Contact</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Parameter Trends (Fleet Average)</h4>
                                <div>
                                    <div className="flex justify-between text-[11px] mb-2">
                                        <span className="text-slate-400">Coolant Temp Avg</span>
                                        <span className="text-white font-bold">92°C</span>
                                    </div>
                                    <SensorTrendChart data={mockTempData} dataKey="temp" height={100} threshold={103} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl bg-panel/50">
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            <Fuel className="h-5 w-5 text-status-green" />
                            Fuel Management
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center overflow-hidden">
                                <span className="text-sm text-slate-400">Monthly Est. Cost</span>
                                <span className="text-lg font-black text-white">R 2.45M</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-status-green w-[72%]" />
                            </div>
                            <p className="text-[10px] text-slate-500 italic text-center">Fuel theft probability: Low (2 incidents flagged)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetHome;

const Truck = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10h1" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
)
