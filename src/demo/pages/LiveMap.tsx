import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Circle, Polygon, useMap } from 'react-leaflet';
import { Search, ChevronLeft, Hexagon, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '../context/DemoContext';
import { MapBase } from '../components/MapBase';
import { VehicleMarker } from '../components/VehicleMarker';
import { VehicleInfoCard } from '../components/VehicleInfoCard';
import { STATUS_COLOR, STATUS_LABEL, formatDuration, EmptyState, DemoButton } from '../components/ui';
import type { VehicleStatus } from '../data/fleets';

const FlyTo: React.FC<{ target: [number, number] | null }> = ({ target }) => {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo(target, Math.max(map.getZoom(), 13), { duration: 0.8 });
    }, [target, map]);
    return null;
};

const STATUS_FILTERS: (VehicleStatus | 'all')[] = ['all', 'moving', 'idling', 'parked'];

const LiveMap: React.FC = () => {
    const { vehicles, geofences, selectedVehicleId, selectVehicle, fleetName } = useDemo();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
    const [panelOpen, setPanelOpen] = useState(true);
    const [showGeofences, setShowGeofences] = useState(true);
    const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

    const filtered = useMemo(() => vehicles.filter(v => {
        if (statusFilter !== 'all' && v.status !== statusFilter) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return v.name.toLowerCase().includes(q) || v.reg.toLowerCase().includes(q) || v.driver.toLowerCase().includes(q);
    }), [vehicles, query, statusFilter]);

    const selected = vehicles.find(v => v.id === selectedVehicleId) ?? null;

    if (vehicles.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <EmptyState
                    icon={<Truck />}
                    title="No fleet loaded yet"
                    hint="Pick a pre-built fleet or create your own to see live vehicles on the map."
                    action={<DemoButton onClick={() => navigate('/demo')}>Choose a fleet</DemoButton>}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex">
            {/* side panel */}
            <motion.aside
                animate={{ width: panelOpen ? 340 : 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="shrink-0 bg-white border-r border-slate-200 overflow-hidden relative z-[1000]"
            >
                <div className="w-[340px] h-full flex flex-col">
                    <div className="p-4 border-b border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-slate-800">{fleetName}</h2>
                            <span className="text-xs text-slate-400 tabular-nums">{filtered.length}/{vehicles.length} shown</span>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search vehicle, reg or driver…"
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25 focus:bg-white transition-colors"
                            />
                        </div>
                        <div className="flex gap-1">
                            {STATUS_FILTERS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={cn(
                                        'flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold capitalize transition-colors',
                                        statusFilter === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <AnimatePresence initial={false}>
                            {filtered.map(v => (
                                <motion.button
                                    key={v.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => { selectVehicle(v.id); setFlyTarget([...v.pos]); }}
                                    className={cn(
                                        'w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3',
                                        selectedVehicleId === v.id && 'bg-red-50/60 hover:bg-red-50/60',
                                    )}
                                >
                                    <span className="relative shrink-0">
                                        <span className="w-3 h-3 rounded-full block" style={{ backgroundColor: STATUS_COLOR[v.status] }} />
                                        {v.status === 'moving' && (
                                            <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: STATUS_COLOR[v.status] }} />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold text-slate-700 truncate">{v.name}</span>
                                        <span className="block text-[11px] text-slate-400 truncate">{v.driver} · {v.reg}</span>
                                    </span>
                                    <span className="text-right shrink-0">
                                        <span className="block text-xs font-bold tabular-nums" style={{ color: STATUS_COLOR[v.status] }}>
                                            {v.status === 'moving' ? `${v.speedKmh.toFixed(0)} km/h` : STATUS_LABEL[v.status]}
                                        </span>
                                        <span className="block text-[10px] text-slate-400">{formatDuration(Date.now() - v.statusSince)}</span>
                                    </span>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="p-3 border-t border-slate-100 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer select-none">
                            <input type="checkbox" checked={showGeofences} onChange={e => setShowGeofences(e.target.checked)} className="accent-accent" />
                            <Hexagon size={13} /> Show geofences
                        </label>
                        <button onClick={() => navigate('/demo/fleet')} className="text-xs font-bold text-accent hover:underline">+ Add vehicle</button>
                    </div>
                </div>
            </motion.aside>

            {/* collapse handle */}
            <button
                onClick={() => setPanelOpen(o => !o)}
                className="absolute z-[1001] bg-white border border-slate-200 rounded-r-lg shadow-sm p-1 text-slate-400 hover:text-slate-700 transition-colors"
                style={{ left: panelOpen ? 340 : 0, top: '50%', transform: 'translateY(-50%)', transition: 'left 0.3s' }}
            >
                <ChevronLeft size={16} className={cn('transition-transform', !panelOpen && 'rotate-180')} />
            </button>

            {/* map */}
            <div className="flex-1 relative">
                <MapBase>
                    <FlyTo target={flyTarget} />
                    {showGeofences && geofences.map(gf => gf.type === 'circle' ? (
                        <Circle
                            key={gf.id}
                            center={gf.points[0]}
                            radius={gf.radiusM ?? 500}
                            pathOptions={{ color: gf.color, weight: 2, fillOpacity: 0.12 }}
                        />
                    ) : (
                        <Polygon
                            key={gf.id}
                            positions={gf.points}
                            pathOptions={{ color: gf.color, weight: 2, fillOpacity: 0.12 }}
                        />
                    ))}
                    {vehicles.map(v => (
                        <VehicleMarker
                            key={v.id}
                            vehicle={v}
                            selected={v.id === selectedVehicleId}
                            onClick={() => selectVehicle(v.id)}
                        />
                    ))}
                </MapBase>

                <AnimatePresence>
                    {selected && <VehicleInfoCard key={selected.id} vehicle={selected} onClose={() => selectVehicle(null)} />}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LiveMap;
