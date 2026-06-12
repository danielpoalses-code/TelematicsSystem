import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Circle, CircleMarker, Polygon, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Hexagon, CircleDot, Trash2, Check, X, Bell, LogIn, LogOut, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '../context/DemoContext';
import { MapBase } from '../components/MapBase';
import { geofenceAreaLabel, type Geofence } from '../data/geofences';
import { haversine, type LatLng } from '../data/routes';
import { DemoButton, Field, inputCls } from '../components/ui';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type DrawMode = null | 'polygon' | 'circle';

const DrawLayer: React.FC<{
    mode: DrawMode;
    points: LatLng[];
    radius: number;
    onAddPoint: (p: LatLng) => void;
    onPreview: (p: LatLng) => void;
}> = ({ mode, onAddPoint, onPreview }) => {
    useMapEvents({
        click(e) {
            if (mode) onAddPoint([e.latlng.lat, e.latlng.lng]);
        },
        mousemove(e) {
            if (mode) onPreview([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
};

const FlyToFence: React.FC<{ fence: Geofence | null }> = ({ fence }) => {
    const map = useMap();
    React.useEffect(() => {
        if (!fence) return;
        if (fence.type === 'circle') map.flyTo(fence.points[0], 13, { duration: 0.7 });
        else map.flyToBounds(fence.points as [number, number][], { duration: 0.7, padding: [60, 60] });
    }, [fence, map]);
    return null;
};

const Geofences: React.FC = () => {
    const { geofences, addGeofence, removeGeofence, updateGeofence } = useDemo();
    const [mode, setMode] = useState<DrawMode>(null);
    const [draftPoints, setDraftPoints] = useState<LatLng[]>([]);
    const [preview, setPreview] = useState<LatLng | null>(null);
    const [naming, setNaming] = useState<null | { type: 'polygon' | 'circle'; points: LatLng[]; radius?: number }>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [alertEnter, setAlertEnter] = useState(true);
    const [alertExit, setAlertExit] = useState(false);
    const [flyTo, setFlyTo] = useState<Geofence | null>(null);

    const startDraw = (m: Exclude<DrawMode, null>) => {
        setMode(m);
        setDraftPoints([]);
        setPreview(null);
        setNaming(null);
    };

    const cancelDraw = () => {
        setMode(null);
        setDraftPoints([]);
        setPreview(null);
    };

    const handleAddPoint = (p: LatLng) => {
        if (mode === 'circle') {
            if (draftPoints.length === 0) {
                setDraftPoints([p]);
            } else {
                const radius = Math.max(100, haversine(draftPoints[0], p));
                setNaming({ type: 'circle', points: [draftPoints[0]], radius });
                setMode(null);
            }
        } else if (mode === 'polygon') {
            setDraftPoints(prev => [...prev, p]);
        }
    };

    const finishPolygon = () => {
        if (draftPoints.length >= 3) {
            setNaming({ type: 'polygon', points: draftPoints });
            setMode(null);
        }
    };

    const saveFence = () => {
        if (!naming) return;
        addGeofence({
            id: `gf_${Date.now()}`,
            name: name.trim() || 'New geofence',
            color,
            type: naming.type,
            points: naming.points,
            radiusM: naming.radius,
            alertOnEnter: alertEnter,
            alertOnExit: alertExit,
        });
        setNaming(null);
        setDraftPoints([]);
        setName('');
    };

    const circleDraftRadius = mode === 'circle' && draftPoints.length === 1 && preview
        ? Math.max(100, haversine(draftPoints[0], preview))
        : 0;

    return (
        <div className="h-full flex">
            <aside className="w-[360px] shrink-0 bg-white border-r border-slate-200 flex flex-col z-[1000]">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800">Geofences</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Draw zones on the map — vehicles trigger enter/exit alerts automatically.</p>
                    <div className="flex gap-2 mt-3">
                        <DemoButton variant={mode === 'polygon' ? 'primary' : 'outline'} className="flex-1 !py-1.5 text-xs" onClick={() => mode === 'polygon' ? cancelDraw() : startDraw('polygon')}>
                            <Hexagon size={14} /> Polygon
                        </DemoButton>
                        <DemoButton variant={mode === 'circle' ? 'primary' : 'outline'} className="flex-1 !py-1.5 text-xs" onClick={() => mode === 'circle' ? cancelDraw() : startDraw('circle')}>
                            <CircleDot size={14} /> Circle
                        </DemoButton>
                    </div>
                    <AnimatePresence>
                        {mode && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden">
                                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 font-medium">
                                    {mode === 'polygon'
                                        ? `Click the map to add vertices (${draftPoints.length} placed). Finish with at least 3 points.`
                                        : draftPoints.length === 0 ? 'Click the map to set the centre.' : 'Move the mouse to size the circle, then click to confirm.'}
                                </div>
                                {mode === 'polygon' && (
                                    <div className="flex gap-2 mt-2">
                                        <DemoButton className="flex-1 !py-1.5 text-xs" onClick={finishPolygon} disabled={draftPoints.length < 3}>
                                            <Check size={13} /> Finish shape
                                        </DemoButton>
                                        <DemoButton variant="ghost" className="!py-1.5 text-xs" onClick={cancelDraw}><X size={13} /> Cancel</DemoButton>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    <AnimatePresence initial={false}>
                        {geofences.map(gf => (
                            <motion.div key={gf.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}
                                className="px-4 py-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setFlyTo(gf)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                        <span className="w-3.5 h-3.5 rounded shrink-0 border" style={{ backgroundColor: gf.color + '33', borderColor: gf.color }} />
                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold text-slate-700 truncate">{gf.name}</span>
                                            <span className="block text-[11px] text-slate-400">{gf.type === 'circle' ? 'Circle' : `Polygon · ${gf.points.length} pts`} · {geofenceAreaLabel(gf)}</span>
                                        </span>
                                    </button>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            title="Alert on enter"
                                            onClick={() => updateGeofence({ ...gf, alertOnEnter: !gf.alertOnEnter })}
                                            className={cn('p-1.5 rounded-md transition-colors', gf.alertOnEnter ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-slate-500')}
                                        >
                                            <LogIn size={14} />
                                        </button>
                                        <button
                                            title="Alert on exit"
                                            onClick={() => updateGeofence({ ...gf, alertOnExit: !gf.alertOnExit })}
                                            className={cn('p-1.5 rounded-md transition-colors', gf.alertOnExit ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-slate-500')}
                                        >
                                            <LogOut size={14} />
                                        </button>
                                        <button
                                            title="Delete"
                                            onClick={() => removeGeofence(gf.id)}
                                            className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="p-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-2">
                    <Bell size={12} /> Enter/exit alerts appear in Events and as popups.
                </div>
            </aside>

            <div className="flex-1 relative">
                <MapBase>
                    <FlyToFence fence={flyTo} />
                    <DrawLayer mode={mode} points={draftPoints} radius={circleDraftRadius} onAddPoint={handleAddPoint} onPreview={setPreview} />
                    {geofences.map(gf => gf.type === 'circle' ? (
                        <Circle key={gf.id} center={gf.points[0]} radius={gf.radiusM ?? 500}
                            pathOptions={{ color: gf.color, weight: 2, fillOpacity: 0.15 }} />
                    ) : (
                        <Polygon key={gf.id} positions={gf.points}
                            pathOptions={{ color: gf.color, weight: 2, fillOpacity: 0.15 }} />
                    ))}

                    {/* draft visuals */}
                    {mode === 'polygon' && draftPoints.length > 0 && (
                        <>
                            <Polyline positions={preview ? [...draftPoints, preview] : draftPoints} pathOptions={{ color: '#DC3545', dashArray: '6 6', weight: 2 }} />
                            {draftPoints.map((p, i) => (
                                <CircleMarker key={i} center={p} radius={5} pathOptions={{ color: '#fff', weight: 2, fillColor: '#DC3545', fillOpacity: 1 }} />
                            ))}
                        </>
                    )}
                    {mode === 'circle' && draftPoints.length === 1 && (
                        <>
                            <CircleMarker center={draftPoints[0]} radius={5} pathOptions={{ color: '#fff', weight: 2, fillColor: '#DC3545', fillOpacity: 1 }} />
                            {circleDraftRadius > 0 && (
                                <Circle center={draftPoints[0]} radius={circleDraftRadius} pathOptions={{ color: '#DC3545', dashArray: '6 6', weight: 2, fillOpacity: 0.08 }} />
                            )}
                        </>
                    )}
                    {naming && (naming.type === 'circle' ? (
                        <Circle center={naming.points[0]} radius={naming.radius ?? 500} pathOptions={{ color, weight: 2, fillOpacity: 0.2 }} />
                    ) : (
                        <Polygon positions={naming.points} pathOptions={{ color, weight: 2, fillOpacity: 0.2 }} />
                    ))}
                </MapBase>

                {/* naming dialog */}
                <AnimatePresence>
                    {naming && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[400px] bg-white rounded-2xl shadow-xl border border-slate-200 p-5"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Pencil size={16} className="text-accent" />
                                <h3 className="font-bold text-slate-800">Name your geofence</h3>
                            </div>
                            <div className="space-y-3">
                                <Field label="Name">
                                    <input autoFocus className={inputCls} value={name} onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Durban Harbour Depot" onKeyDown={e => e.key === 'Enter' && saveFence()} />
                                </Field>
                                <Field label="Colour">
                                    <div className="flex gap-2">
                                        {COLORS.map(c => (
                                            <button key={c} onClick={() => setColor(c)}
                                                className={cn('w-8 h-8 rounded-lg transition-transform hover:scale-110', color === c && 'ring-2 ring-offset-2 ring-slate-400')}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </Field>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                        <input type="checkbox" className="accent-accent" checked={alertEnter} onChange={e => setAlertEnter(e.target.checked)} />
                                        Alert on enter
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                        <input type="checkbox" className="accent-accent" checked={alertExit} onChange={e => setAlertExit(e.target.checked)} />
                                        Alert on exit
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-5">
                                <DemoButton variant="ghost" className="flex-1" onClick={() => { setNaming(null); setDraftPoints([]); }}>Discard</DemoButton>
                                <DemoButton className="flex-1" onClick={saveFence}><Check size={15} /> Save geofence</DemoButton>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Geofences;
