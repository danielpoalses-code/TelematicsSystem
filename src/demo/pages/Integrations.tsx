import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Video, Bluetooth, Wifi, Satellite, Thermometer, Fuel, DoorOpen,
    BatteryFull, Plus, Check, Signal, Camera, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '../context/DemoContext';
import { PageFade, Card, DemoButton, SectionTitle } from '../components/ui';
import { seededRand } from '../data/fleets';

interface DeviceDef {
    id: string;
    name: string;
    kind: 'camera' | 'ble' | 'wifi' | 'gps';
    desc: string;
    icon: React.ReactNode;
}

const CATALOG: DeviceDef[] = [
    { id: 'dashcam-ai', name: 'AI Dashcam — Road + Cabin', kind: 'camera', desc: 'Dual-lens dashcam with driver fatigue & distraction detection. Live streaming and event clips.', icon: <Video size={20} /> },
    { id: 'cargo-cam', name: 'Cargo Bay Camera', kind: 'camera', desc: 'Wide-angle load-area camera with motion-triggered recording.', icon: <Camera size={20} /> },
    { id: 'ble-temp', name: 'BLE Temperature & Humidity Probe', kind: 'ble', desc: 'Wireless cold-chain probe, 2-year battery, ±0.3 °C accuracy.', icon: <Thermometer size={20} /> },
    { id: 'ble-door', name: 'BLE Door Sensor', kind: 'ble', desc: 'Magnetic open/close sensor for trailer and cargo doors.', icon: <DoorOpen size={20} /> },
    { id: 'fuel-probe', name: 'Capacitive Fuel Probe', kind: 'wifi', desc: 'High-resolution tank-level probe — detects refuels and drains in real time.', icon: <Fuel size={20} /> },
    { id: 'gps-asset', name: 'GPS Asset Tracker (battery)', kind: 'gps', desc: '5-year battery asset tracker for trailers, gensets and containers.', icon: <Satellite size={20} /> },
];

const KIND_BADGE: Record<DeviceDef['kind'], { label: string; icon: React.ReactNode; cls: string }> = {
    camera: { label: 'Video', icon: <Video size={11} />, cls: 'bg-purple-50 text-purple-600' },
    ble: { label: 'Bluetooth', icon: <Bluetooth size={11} />, cls: 'bg-blue-50 text-blue-600' },
    wifi: { label: 'WiFi', icon: <Wifi size={11} />, cls: 'bg-teal-50 text-teal-600' },
    gps: { label: 'GPS', icon: <Satellite size={11} />, cls: 'bg-amber-50 text-amber-600' },
};

/** Fake animated "live" camera feed rendered with SVG. */
const FakeFeed: React.FC<{ seed: number; label: string }> = ({ seed, label }) => {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const iv = setInterval(() => setTick(t => t + 1), 900);
        return () => clearInterval(iv);
    }, []);
    const dashOffset = (tick * 14) % 56;
    const sway = Math.sin(tick / 2 + seed) * 6;
    return (
        <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video">
            <svg viewBox="0 0 320 180" className="w-full h-full">
                <rect width="320" height="90" fill="#1e2a3a" />
                <rect y="90" width="320" height="90" fill="#2d3748" />
                {/* road */}
                <polygon points="120,180 200,180 172,90 148,90" fill="#374151" />
                <line x1="160" y1="180" x2="160" y2="90" stroke="#fbbf24" strokeWidth="3" strokeDasharray="14 14"
                    strokeDashoffset={dashOffset} style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
                {/* horizon hills */}
                <path d={`M0,90 Q80,${70 + sway} 160,88 T320,90 L320,90 L0,90 Z`} fill="#16202e" />
                {/* a "vehicle" ahead */}
                <rect x={150 + sway} y={96} width="22" height="14" rx="2" fill="#94a3b8" />
                <rect x={153 + sway} y={99} width="16" height="5" rx="1" fill="#475569" />
            </svg>
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 rounded px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white tracking-wider">LIVE</span>
            </div>
            <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/80 bg-black/40 rounded px-1.5 py-0.5">
                {label} · {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

const Integrations: React.FC = () => {
    const { vehicles } = useDemo();
    const [params] = useSearchParams();
    const [paired, setPaired] = useState<Record<string, 'pairing' | 'paired'>>({});
    const [streamFor, setStreamFor] = useState<string | null>(params.get('vehicle'));

    const cameraVehicles = useMemo(() => vehicles.filter(v => v.cameraEquipped), [vehicles]);
    const streamVehicle = cameraVehicles.find(v => v.id === streamFor) ?? null;

    const pair = (id: string) => {
        setPaired(p => ({ ...p, [id]: 'pairing' }));
        setTimeout(() => setPaired(p => ({ ...p, [id]: 'paired' })), 1600);
    };

    return (
        <PageFade className="h-full overflow-y-auto bg-slate-50">
            <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Integrations & devices</h2>
                    <p className="text-sm text-slate-400">The platform connects to dashcams, Bluetooth & WiFi sensors and standalone GPS devices — pair anything below to see it in action.</p>
                </div>

                {/* live cameras */}
                <section>
                    <SectionTitle title="Live dashcams" subtitle={`${cameraVehicles.length} camera-equipped vehicles in your fleet`} />
                    {cameraVehicles.length === 0 ? (
                        <Card className="p-8 text-center text-sm text-slate-400">No camera-equipped vehicles in this fleet — add one in My Fleet with the camera option enabled.</Card>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cameraVehicles.map(v => (
                                <motion.button
                                    key={v.id}
                                    whileHover={{ y: -3 }}
                                    onClick={() => setStreamFor(v.id)}
                                    className="text-left bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-accent/40 transition-colors"
                                >
                                    <FakeFeed seed={v.seed} label={v.reg} />
                                    <div className="flex items-center justify-between mt-2.5 px-1">
                                        <span className="text-sm font-bold text-slate-700 truncate">{v.name}</span>
                                        <span className="flex items-center gap-1 text-[11px] text-green-600 font-bold"><Signal size={11} /> Online</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </section>

                {/* device catalogue */}
                <section>
                    <SectionTitle title="Add-on hardware" subtitle="Pair extra sensors and devices to any vehicle — readings flow into alerts and reports automatically" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        {CATALOG.map(d => {
                            const state = paired[d.id];
                            const badge = KIND_BADGE[d.kind];
                            return (
                                <Card key={d.id} className="p-5 flex gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">{d.icon}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-sm font-bold text-slate-800">{d.name}</h4>
                                            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', badge.cls)}>{badge.icon}{badge.label}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{d.desc}</p>
                                        <div className="mt-3">
                                            {state === 'paired' ? (
                                                <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 rounded-full px-3 py-1.5">
                                                    <Check size={13} /> Paired — streaming data
                                                </motion.span>
                                            ) : state === 'pairing' ? (
                                                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                                        className="w-3.5 h-3.5 border-2 border-slate-300 border-t-accent rounded-full" />
                                                    Pairing…
                                                </span>
                                            ) : (
                                                <DemoButton variant="outline" className="!py-1.5 text-xs" onClick={() => pair(d.id)}>
                                                    <Plus size={13} /> Pair device
                                                </DemoButton>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                {/* paired sensor live values */}
                {Object.values(paired).some(s => s === 'paired') && (
                    <section>
                        <SectionTitle title="Live sensor readings" subtitle="From devices paired this session" />
                        <div className="grid sm:grid-cols-3 gap-3">
                            {paired['ble-temp'] === 'paired' && <LiveValue icon={<Thermometer size={15} />} label="BLE Probe — Trailer 1" value={`${(3.2 + seededRand(7, Math.floor(Date.now() / 5000)) * 1.4).toFixed(1)} °C`} />}
                            {paired['ble-door'] === 'paired' && <LiveValue icon={<DoorOpen size={15} />} label="Door Sensor — Trailer 1" value={seededRand(11, Math.floor(Date.now() / 20000)) > 0.8 ? 'OPEN' : 'Closed'} />}
                            {paired['fuel-probe'] === 'paired' && <LiveValue icon={<Fuel size={15} />} label="Fuel Probe — Tank A" value={`${(62 + seededRand(13, Math.floor(Date.now() / 8000)) * 3).toFixed(1)} %`} />}
                            {paired['gps-asset'] === 'paired' && <LiveValue icon={<Satellite size={15} />} label="Asset Tracker — Genset 04" value="Fixed · 12 sats" />}
                            {paired['dashcam-ai'] === 'paired' && <LiveValue icon={<Video size={15} />} label="AI Dashcam" value="Recording · no fatigue events" />}
                            {paired['cargo-cam'] === 'paired' && <LiveValue icon={<Camera size={15} />} label="Cargo Camera" value="Standby · motion armed" />}
                            <LiveValue icon={<BatteryFull size={15} />} label="Gateway battery" value="100 % · charging" />
                        </div>
                    </section>
                )}
            </div>

            {/* full-screen stream modal */}
            <AnimatePresence>
                {streamVehicle && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setStreamFor(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                                <div>
                                    <h3 className="font-bold text-slate-800">{streamVehicle.name} — road camera</h3>
                                    <p className="text-xs text-slate-400">{streamVehicle.driver} · {streamVehicle.speedKmh.toFixed(0)} km/h</p>
                                </div>
                                <button onClick={() => setStreamFor(null)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-4">
                                <FakeFeed seed={streamVehicle.seed} label={streamVehicle.reg} />
                                <p className="text-[11px] text-slate-400 mt-3 text-center">
                                    Simulated stream — in production this is a live H.264 feed with two-way audio, event bookmarks and cloud clip retrieval.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PageFade>
    );
};

const LiveValue: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <Card className="p-3.5 flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">{icon}</span>
        <div className="min-w-0">
            <div className="text-[11px] text-slate-400 font-bold truncate">{label}</div>
            <div className="text-sm font-black text-slate-700 tabular-nums">{value}</div>
        </div>
        <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
    </Card>
);

export default Integrations;
