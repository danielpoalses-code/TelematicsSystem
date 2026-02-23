import React, { useState, useEffect } from 'react';
import {
    Wrench, CheckCircle, Clock, AlertTriangle, MapPin, Package,
    ChevronDown, ChevronRight, Truck, Gauge, ArrowRight, Calendar,
    Building2, TrendingUp, TrendingDown, DollarSign, Navigation, Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import { HAUL_TYPES, SHORT_HAUL_LIST, LONG_HAUL_LIST } from '@/data/haulTypes';
import { DEALER_NAMES } from '@/data/dealerships';

// --- Types ---

type ServiceStatus = 'overdue' | 'due_soon' | 'pending' | 'in_progress' | 'completed';
type ServiceType = 'major' | 'minor' | 'inspection';
type Urgency = 'critical' | 'high' | 'medium' | 'low';
type HaulType = 'shorthaul' | 'longhaul';

interface MasterServiceJob {
    id: string;
    stockNumber: string;
    model: string;
    client: string;
    serviceType: ServiceType;
    status: ServiceStatus;
    urgency: Urgency;
    haulType: HaulType;
    dueOdometer: number;
    currentOdometer: number;
    closestDealer: string;
    distanceKm: number;
    partsReady: boolean;
    partsRequired: { partNumber: string; description: string; available: boolean; valueZAR: number }[];
    completedDate: string | null;
    hasHaulInfo: boolean;
}

const mockPartsCatalog = [
    { partNumber: 'ENG-001-A', description: 'Fuel Injector Assembly', valueZAR: 15400 },
    { partNumber: 'FLT-003-A', description: 'Oil Filter (OEM Spec)', valueZAR: 450 },
    { partNumber: 'FLT-004-A', description: 'Air Filter Element', valueZAR: 850 },
    { partNumber: 'TRX-005-D', description: 'Gearbox Synchro Kit', valueZAR: 8900 },
    { partNumber: 'ENG-002-B', description: 'Turbo Charger Unit', valueZAR: 22000 },
    { partNumber: 'BRK-001-X', description: 'Brake Pad Set', valueZAR: 3200 },
];

// --- Config ---

const statusConfig: Record<ServiceStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
    overdue: { label: 'Overdue (Leakage Risk)', color: 'bg-red-50 text-red-600 ring-red-200', dot: 'bg-red-500', icon: AlertTriangle },
    due_soon: { label: 'Due Soon', color: 'bg-amber-50 text-amber-600 ring-amber-200', dot: 'bg-amber-400', icon: Clock },
    pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400', icon: Calendar },
    in_progress: { label: 'In Shop (Active)', color: 'bg-blue-50 text-blue-600 ring-blue-200', dot: 'bg-blue-500 animate-pulse', icon: Wrench },
    completed: { label: 'Retained (Completed)', color: 'bg-emerald-50 text-emerald-600 ring-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle },
};

const serviceTypeLabel: Record<ServiceType, string> = {
    major: '🔧 Major',
    minor: '🔩 Minor',
    inspection: '🔍 PDI / Insp',
};

// --- Helper Functions ---
function getHash(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

const OEMService: React.FC = () => {
    const [expandedDealer, setExpandedDealer] = useState<string | null>(null);
    const [jobs, setJobs] = useState<MasterServiceJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterHaul, setFilterHaul] = useState<'all' | HaulType>('all');

    useEffect(() => {
        const fetchFleetData = async () => {
            try {
                const response = await fetch('/fleet_condition.csv');
                if (!response.ok) throw new Error("Failed to load");
                const text = await response.text();

                const parsedJobs: MasterServiceJob[] = [];

                // Build dealer lookup by id
                const dealerById = new Map(DEALER_NAMES.map(d => [d.id, d]));

                Papa.parse<{ unit: string; model: string; year: string; km: string; dealer_id: string; client: string }>(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        results.data.forEach((row, i) => {
                            const currentUnit = row.unit?.trim();
                            const currentOdometer = parseFloat(row.km) || 0;
                            if (!currentUnit || currentOdometer <= 50) return;

                            const hash = getHash(currentUnit);
                            const hasHaulInfo = !!HAUL_TYPES[currentUnit];
                            const haulType: HaulType = HAUL_TYPES[currentUnit] || 'shorthaul';
                            const interval = haulType === 'shorthaul' ? 10000 : 15000;

                            const intervalsPassed = Math.floor(currentOdometer / interval);
                            const nextDueOdometer = (intervalsPassed + 1) * interval;
                            const distanceToNext = nextDueOdometer - currentOdometer;
                            const serviceType: ServiceType = (intervalsPassed % 4 === 3) ? 'major' : 'minor';
                            let dueOdo = nextDueOdometer;

                            let status: ServiceStatus = 'pending';
                            let urgency: Urgency = 'low';
                            if (distanceToNext <= 1500) {
                                status = 'due_soon';
                                urgency = distanceToNext <= 500 ? 'high' : 'medium';
                            } else if (distanceToNext > (interval - 1500)) {
                                status = 'overdue';
                                urgency = 'critical';
                                dueOdo = intervalsPassed * interval;
                            } else if (distanceToNext > (interval - 500)) {
                                status = 'completed';
                            }

                            // Use real dealer from CSV; fallback to hash
                            const dealer = dealerById.get(row.dealer_id) || DEALER_NAMES[hash % DEALER_NAMES.length];
                            const needsParts = ['overdue', 'due_soon', 'in_progress', 'completed'].includes(status);
                            const partsCount = (hash % 3) + 1;
                            const requiredParts = needsParts
                                ? Array.from({ length: partsCount }, (_, p) => ({
                                    ...mockPartsCatalog[(hash + p) % mockPartsCatalog.length],
                                    available: status === 'completed' ? true : ((hash + p) % 5 !== 0),
                                }))
                                : [];

                            parsedJobs.push({
                                id: `job-${currentUnit}-${i}`,
                                stockNumber: currentUnit,
                                model: row.model || 'Powerstar',
                                client: row.client?.trim() || 'Fleet Operator',
                                serviceType,
                                status,
                                urgency,
                                haulType,
                                currentOdometer,
                                dueOdometer: dueOdo,
                                closestDealer: dealer.name,
                                distanceKm: (hash % 45) + 2,
                                partsReady: requiredParts.every(p => p.available),
                                partsRequired: requiredParts,
                                completedDate: status === 'completed' ? 'Recent' : null,
                                hasHaulInfo,
                            });
                        });
                    },
                    // Run synchronously with worker: false not needed, this runs in complete callback
                });

                // Sort by urgency, then distance
                parsedJobs.sort((a, b) => {
                    const u = { critical: 4, high: 3, medium: 2, low: 1 };
                    return (u[b.urgency] - u[a.urgency]) || (a.distanceKm - b.distanceKm);
                });

                setJobs(parsedJobs);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to load fleet conditions", err);
                setIsLoading(false);
            }
        };

        fetchFleetData();
    }, []);

    // Filter logic
    const displayedJobs = jobs.filter(j => filterHaul === 'all' || j.haulType === filterHaul);

    // Filter Dealership Groupings dynamically
    const dealersGrouped = DEALER_NAMES.map((dealer) => ({
        id: dealer.id,
        name: dealer.name,
        jobs: displayedJobs.filter(j => j.closestDealer === dealer.name)
    }));

    const routingAlerts = displayedJobs.filter(j => j.status === 'overdue' || j.status === 'due_soon').slice(0, 6);

    const counts = {
        all: displayedJobs.length,
        completed: displayedJobs.filter(j => j.status === 'completed').length,
        pending: displayedJobs.filter(j => j.status === 'pending').length,
        due_soon: displayedJobs.filter(j => j.status === 'due_soon').length,
        overdue: displayedJobs.filter(j => j.status === 'overdue').length,
    };

    const overallRetention = counts.all > 0 ? Math.round((counts.completed / (counts.completed + counts.overdue)) * 100) || 100 : 0;
    const overallPartsRev = displayedJobs.filter(j => j.status === 'completed').flatMap(j => j.partsRequired).reduce((s, p) => s + p.valueZAR, 0);

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Service Scheduling & Tracking</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Live fleet condition tracking, dynamic haul intervals (10k/15k km), and predictive routing.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white hover:bg-slate-50 text-slate-600 border border-border px-4 py-2 rounded text-xs font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2">
                        <Upload className="h-3.5 w-3.5" />
                        Update Fleet Conditions
                    </button>
                    <button className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded text-xs font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        Network Map
                    </button>
                </div>
            </div>

            {/* Global Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Global Retention Rate</h3>
                    </div>
                    {isLoading ? <div className="h-8 bg-slate-100 animate-pulse rounded w-16 my-1" /> : (
                        <p className="text-3xl font-black text-slate-800">{overallRetention}<span className="text-xl text-slate-400">%</span></p>
                    )}
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Historical Completion vs Overdue</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <DollarSign className="h-5 w-5 text-accent" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Serviced Parts Revenue</h3>
                    </div>
                    {isLoading ? <div className="h-8 bg-slate-100 animate-pulse rounded w-24 my-1" /> : (
                        <p className="text-3xl font-black text-slate-800">
                            <span className="text-[16px] text-slate-400 font-normal mr-1">R</span>
                            {(overallPartsRev / 1000).toFixed(1)}k
                        </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">Sourced from telematics service alerts</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Leaked Jobs (Overdue)</h3>
                    </div>
                    {isLoading ? <div className="h-8 bg-slate-100 animate-pulse rounded w-12 my-1" /> : (
                        <p className="text-3xl font-black text-slate-800">{counts.overdue}<span className="text-xl text-slate-400 text-sm font-normal ml-2">jobs</span></p>
                    )}
                    <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Exceeded interval buffer</p>
                </div>
                <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <Truck className="h-5 w-5 text-blue-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Active Monitored Units</h3>
                    </div>
                    {isLoading ? <div className="h-8 bg-slate-100 animate-pulse rounded w-16 my-1" /> : (
                        <p className="text-3xl font-black text-slate-800">{counts.all}<span className="text-xl text-slate-400 text-sm font-normal ml-2">units</span></p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">Extracting live conditions</p>
                </div>
            </div>

            {/* Haul Type Filter */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-border w-fit">
                {(['all', 'shorthaul', 'longhaul'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterHaul(type)}
                        className={cn(
                            "px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                            filterHaul === type ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                    >
                        {type === 'all' ? 'All Fleet Types' : type === 'shorthaul' ? 'Short-Haul (10k)' : 'Long-Haul (15k)'}
                    </button>
                ))}
            </div>

            {/* Predictive Routing Alerts */}
            {routingAlerts.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2 mt-4">
                        <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-accent" />
                            Predictive Service Routing (Due / Overdue)
                        </h2>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">Action Required</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {routingAlerts.map(alert => {
                            const isOverdue = alert.status === 'overdue';
                            return (
                                <div key={alert.id} className="bg-white border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden transition-all hover:border-slate-300">
                                    {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />}
                                    {!isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />}

                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Truck className={cn("h-4 w-4", isOverdue ? "text-red-400" : "text-amber-400")} />
                                                <span className="text-[14px] font-black text-slate-800">{alert.stockNumber}</span>
                                                <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded", alert.haulType === 'longhaul' ? 'bg-indigo-50 text-indigo-600' : 'bg-fuchsia-50 text-fuchsia-600')}>
                                                    {alert.haulType === 'longhaul' ? 'Long-Haul (15k)' : 'Short-Haul (10k)'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 mt-2 bg-slate-50 px-2 py-1.5 rounded border border-border inline-flex">
                                                <span className={cn(isOverdue && "text-red-600 font-bold")}>Odo: {alert.currentOdometer.toLocaleString()}/{alert.dueOdometer.toLocaleString()} km</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-3 border border-border flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reroute To Dealership</p>
                                                <p className="text-[12px] font-black text-slate-700">{alert.closestDealer}</p>
                                            </div>
                                            <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-1 rounded">
                                                {alert.distanceKm} km away
                                            </span>
                                        </div>

                                        <div className="h-[1px] bg-border w-full" />

                                        <div className="flex items-center justify-between">
                                            {alert.partsReady ? (
                                                <p className="text-[10px] font-black text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded">
                                                    <CheckCircle className="h-3 w-3" /> All Parts Ready
                                                </p>
                                            ) : (
                                                <p className="text-[10px] font-black text-amber-600 flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                                    <Package className="h-3 w-3" /> Missing Parts
                                                </p>
                                            )}
                                            <button className="bg-slate-900 hover:bg-black text-white text-[9px] font-black uppercase py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-all">
                                                Dispatch <ArrowRight className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Fleet Master Catalog List */}
            <div className="bg-white border text-sm border-border rounded-xl p-5 shadow-sm mt-8 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <Truck className="h-5 w-5 text-accent" />
                    <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Fleet Master Catalog (Service Type Mapping)</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Short Haul */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Short-Haul & Construction (10k)
                            </h3>
                            <span className="text-[10px] bg-white border px-2 py-0.5 rounded font-mono font-bold text-slate-500">
                                {SHORT_HAUL_LIST.length} Units
                            </span>
                        </div>
                        <div className="h-64 overflow-y-auto border border-slate-100 rounded bg-slate-50/50 p-2 text-xs font-mono">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                {SHORT_HAUL_LIST.map(unit => (
                                    <div key={'sh-' + unit} className="px-2 py-1 bg-white border border-slate-100 rounded shadow-sm text-slate-600 truncate text-[10px] font-bold">
                                        {unit}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Long Haul */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Long-Haul Logistics (15k)
                            </h3>
                            <span className="text-[10px] bg-white border px-2 py-0.5 rounded font-mono font-bold text-slate-500">
                                {LONG_HAUL_LIST.length} Units
                            </span>
                        </div>
                        <div className="h-64 overflow-y-auto border border-slate-100 rounded bg-slate-50/50 p-2 text-xs font-mono">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                {LONG_HAUL_LIST.map(unit => (
                                    <div key={'lh-' + unit} className="px-2 py-1 bg-white border border-slate-100 rounded shadow-sm text-slate-600 truncate text-[10px] font-bold">
                                        {unit}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default OEMService;
