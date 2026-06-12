import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleMarker, Polyline, useMap } from 'react-leaflet';
import { Play, Pause, MapPin, Route as RouteIcon, Clock, Gauge, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '../context/DemoContext';
import { MapBase } from '../components/MapBase';
import { generateDayActivity, tripTrail, type Trip } from '../sim/history';
import { formatClock, formatDuration, EmptyState, DemoButton, Field, inputCls } from '../components/ui';
import type { LatLng } from '../data/routes';

const FitTrail: React.FC<{ trail: LatLng[] }> = ({ trail }) => {
    const map = useMap();
    useEffect(() => {
        if (trail.length > 1) {
            map.fitBounds(trail as [number, number][], { padding: [40, 40] });
        }
    }, [trail, map]);
    return null;
};

const DAY_OPTIONS = [
    { offset: 0, label: 'Today' },
    { offset: 1, label: 'Yesterday' },
    { offset: 2, label: '2 days ago' },
    { offset: 3, label: '3 days ago' },
    { offset: 4, label: '4 days ago' },
    { offset: 5, label: '5 days ago' },
    { offset: 6, label: '6 days ago' },
];

const History: React.FC = () => {
    const { vehicles } = useDemo();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [vehicleId, setVehicleId] = useState<string>(params.get('vehicle') ?? vehicles[0]?.id ?? '');
    const [dayOffset, setDayOffset] = useState(0);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [playing, setPlaying] = useState(false);
    const [playPos, setPlayPos] = useState(0); // 0..1
    const rafRef = useRef<number>();

    const vehicle = vehicles.find(v => v.id === vehicleId) ?? vehicles[0];

    const activity = useMemo(
        () => (vehicle ? generateDayActivity(vehicle, dayOffset) : { trips: [], parkings: [] }),
        [vehicle, dayOffset],
    );

    useEffect(() => {
        setSelectedTrip(activity.trips[0] ?? null);
        setPlaying(false);
        setPlayPos(0);
    }, [activity]);

    const trail = useMemo(() => (selectedTrip ? tripTrail(selectedTrip) : []), [selectedTrip]);

    // playback animation
    useEffect(() => {
        if (!playing) return;
        let last = performance.now();
        const step = (now: number) => {
            const dt = (now - last) / 1000;
            last = now;
            setPlayPos(p => {
                const np = p + dt / 18; // full trip in ~18 s
                if (np >= 1) { setPlaying(false); return 1; }
                return np;
            });
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [playing]);

    const playMarker: LatLng | null = useMemo(() => {
        if (trail.length < 2) return null;
        const idx = Math.min(trail.length - 1, Math.floor(playPos * (trail.length - 1)));
        return trail[idx];
    }, [trail, playPos]);

    if (vehicles.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <EmptyState icon={<Truck />} title="No fleet loaded" hint="Load a fleet to explore movement history."
                    action={<DemoButton onClick={() => navigate('/demo')}>Choose a fleet</DemoButton>} />
            </div>
        );
    }

    return (
        <div className="h-full flex">
            <aside className="w-[380px] shrink-0 bg-white border-r border-slate-200 flex flex-col z-[1000]">
                <div className="p-4 border-b border-slate-100 space-y-3">
                    <h2 className="font-bold text-slate-800">Movement history</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Vehicle">
                            <select className={inputCls} value={vehicle?.id} onChange={e => setVehicleId(e.target.value)}>
                                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Day">
                            <select className={inputCls} value={dayOffset} onChange={e => setDayOffset(Number(e.target.value))}>
                                {DAY_OPTIONS.map(d => <option key={d.offset} value={d.offset}>{d.label}</option>)}
                            </select>
                        </Field>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {activity.trips.map((t, i) => {
                        const parking = activity.parkings[i];
                        const active = selectedTrip?.id === t.id;
                        return (
                            <React.Fragment key={t.id}>
                                <motion.button
                                    layout
                                    onClick={() => { setSelectedTrip(t); setPlaying(false); setPlayPos(0); }}
                                    whileTap={{ scale: 0.99 }}
                                    className={cn(
                                        'w-full text-left rounded-xl border p-3 transition-all',
                                        active ? 'border-accent bg-red-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white',
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <RouteIcon size={14} className={active ? 'text-accent' : 'text-slate-400'} />
                                            Trip {i + 1}
                                        </span>
                                        <span className="text-xs text-slate-400 tabular-nums">
                                            {formatClock(t.startTime)} → {formatClock(t.endTime)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2.5 text-center">
                                        <div className="rounded-lg bg-white border border-slate-100 py-1.5">
                                            <div className="text-sm font-bold text-slate-700 tabular-nums">{t.distanceKm.toFixed(1)}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">km</div>
                                        </div>
                                        <div className="rounded-lg bg-white border border-slate-100 py-1.5">
                                            <div className="text-sm font-bold text-slate-700 tabular-nums">{formatDuration(t.endTime - t.startTime)}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">duration</div>
                                        </div>
                                        <div className="rounded-lg bg-white border border-slate-100 py-1.5">
                                            <div className={cn('text-sm font-bold tabular-nums', t.maxSpeed > 100 ? 'text-red-500' : 'text-slate-700')}>{t.maxSpeed.toFixed(0)}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">max km/h</div>
                                        </div>
                                    </div>
                                </motion.button>
                                {parking && (
                                    <div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-400">
                                        <MapPin size={12} className="text-blue-400" />
                                        Parked · {parking.label} · {formatDuration(parking.endTime - parking.startTime)}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {selectedTrip && (
                    <div className="p-4 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { if (playPos >= 1) setPlayPos(0); setPlaying(p => !p); }}
                                className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-md shadow-red-200 hover:bg-accent-hover transition-colors"
                            >
                                {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                            </motion.button>
                            <input
                                type="range" min={0} max={1000} value={playPos * 1000}
                                onChange={e => { setPlaying(false); setPlayPos(Number(e.target.value) / 1000); }}
                                className="flex-1 accent-accent"
                            />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1"><Clock size={11} /> Trip playback</span>
                            <span className="flex items-center gap-1 tabular-nums"><Gauge size={11} /> avg {selectedTrip.avgSpeed.toFixed(0)} km/h · {selectedTrip.fuelUsedL.toFixed(1)} L fuel</span>
                        </div>
                    </div>
                )}
            </aside>

            <div className="flex-1 relative">
                <MapBase>
                    {trail.length > 1 && (
                        <>
                            <FitTrail trail={trail} />
                            <Polyline positions={trail} pathOptions={{ color: '#DC3545', weight: 4, opacity: 0.85 }} />
                            <CircleMarker center={trail[0]} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#22c55e', fillOpacity: 1 }} />
                            <CircleMarker center={trail[trail.length - 1]} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#DC3545', fillOpacity: 1 }} />
                        </>
                    )}
                    {activity.parkings.map((p, i) => (
                        <CircleMarker key={i} center={p.pos} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.9 }} />
                    ))}
                    {playMarker && (
                        <CircleMarker center={playMarker} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#1e293b', fillOpacity: 1 }} />
                    )}
                </MapBase>
            </div>
        </div>
    );
};

export default History;
