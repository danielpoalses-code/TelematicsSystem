import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, Truck, Video, Snowflake, MapPin, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '../context/DemoContext';
import { DRIVER_POOL, VEHICLE_TYPE_LABEL, type VehicleType } from '../data/fleets';
import { ROUTES } from '../data/routes';
import { PageFade, Card, DemoButton, Field, inputCls, STATUS_COLOR, STATUS_LABEL, formatDuration, EmptyState } from '../components/ui';

const TYPES: VehicleType[] = ['truck', 'van', 'car', 'tanker'];

const FleetManager: React.FC = () => {
    const { vehicles, fleetName, addVehicle, removeVehicle, selectVehicle } = useDemo();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const isWelcome = params.get('welcome') === '1' && vehicles.length === 0;
    const [showForm, setShowForm] = useState(isWelcome);
    const [draft, setDraft] = useState({
        name: '', reg: '', type: 'truck' as VehicleType,
        driver: DRIVER_POOL[0], routeId: ROUTES[0].id,
        refrigerated: false, camera: true,
    });

    if (fleetName == null) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <EmptyState icon={<Truck />} title="No fleet yet" hint="Pick a pre-built fleet or create your own first."
                    action={<DemoButton onClick={() => navigate('/demo')}>Choose a fleet</DemoButton>} />
            </div>
        );
    }

    const save = () => {
        const n = vehicles.length + 1;
        addVehicle({
            name: draft.name.trim() || `Vehicle ${String(n).padStart(2, '0')}`,
            reg: draft.reg.trim() || `ND ${100 + Math.floor(Math.random() * 899)}-${100 + Math.floor(Math.random() * 899)}`,
            type: draft.type,
            driver: draft.driver,
            refrigerated: draft.refrigerated,
            camera: draft.camera,
            routeId: draft.routeId,
        });
        setDraft(d => ({ ...d, name: '', reg: '' }));
    };

    return (
        <PageFade className="h-full overflow-y-auto bg-slate-50">
            <div className="max-w-4xl mx-auto px-6 py-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">{fleetName}</h2>
                        <p className="text-sm text-slate-400">{vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} — new vehicles go live on the map within seconds.</p>
                    </div>
                    <DemoButton onClick={() => setShowForm(s => !s)}><Plus size={15} /> Add vehicle</DemoButton>
                </div>

                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <Card className="p-5 border-accent/30 ring-1 ring-accent/10">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={16} className="text-accent" />
                                    <h3 className="font-bold text-slate-800">New vehicle</h3>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <Field label="Vehicle name">
                                        <input className={inputCls} placeholder="e.g. PS 10080 — V3" value={draft.name}
                                            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                                    </Field>
                                    <Field label="Registration (optional)">
                                        <input className={inputCls} placeholder="auto-generated if empty" value={draft.reg}
                                            onChange={e => setDraft(d => ({ ...d, reg: e.target.value }))} />
                                    </Field>
                                    <Field label="Type">
                                        <div className="flex gap-2">
                                            {TYPES.map(t => (
                                                <button key={t} onClick={() => setDraft(d => ({ ...d, type: t }))}
                                                    className={cn('flex-1 rounded-lg px-2 py-2 text-xs font-bold border transition-all',
                                                        draft.type === t ? 'border-accent bg-red-50 text-accent' : 'border-slate-200 text-slate-400 hover:border-slate-300')}>
                                                    {VEHICLE_TYPE_LABEL[t]}
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                    <Field label="Driver">
                                        <select className={inputCls} value={draft.driver} onChange={e => setDraft(d => ({ ...d, driver: e.target.value }))}>
                                            {DRIVER_POOL.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Operating route">
                                        <select className={inputCls} value={draft.routeId} onChange={e => setDraft(d => ({ ...d, routeId: e.target.value }))}>
                                            {ROUTES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </Field>
                                    <div className="flex items-end gap-4 pb-1">
                                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                            <input type="checkbox" className="accent-accent" checked={draft.camera}
                                                onChange={e => setDraft(d => ({ ...d, camera: e.target.checked }))} />
                                            <Video size={14} className="text-slate-400" /> Dashcam
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                            <input type="checkbox" className="accent-accent" checked={draft.refrigerated}
                                                onChange={e => setDraft(d => ({ ...d, refrigerated: e.target.checked }))} />
                                            <Snowflake size={14} className="text-slate-400" /> Refrigerated
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-5">
                                    <DemoButton variant="ghost" onClick={() => setShowForm(false)}>Close</DemoButton>
                                    <DemoButton onClick={save}><Plus size={15} /> Add to fleet</DemoButton>
                                    {vehicles.length > 0 && (
                                        <DemoButton variant="outline" className="ml-auto" onClick={() => navigate('/demo/map')}>
                                            <MapPin size={14} /> See fleet on map
                                        </DemoButton>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {vehicles.length === 0 ? (
                    <EmptyState icon={<Truck />} title="Your fleet is empty"
                        hint="Add your first vehicle above — it will start driving on the live map immediately." />
                ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                        <AnimatePresence initial={false}>
                            {vehicles.map(v => (
                                <motion.div key={v.id} layout
                                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
                                    <Card className="p-4 flex items-center gap-3.5 hover:shadow-md transition-shadow">
                                        <span className="relative shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                            <Truck size={18} />
                                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: STATUS_COLOR[v.status] }} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold text-slate-800 truncate">{v.name}</span>
                                                {v.cameraEquipped && <Video size={12} className="text-slate-300 shrink-0" />}
                                                {v.refrigerated && <Snowflake size={12} className="text-sky-300 shrink-0" />}
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate">{v.reg} · {v.driver}</p>
                                            <p className="text-[11px] mt-0.5 font-semibold" style={{ color: STATUS_COLOR[v.status] }}>
                                                {STATUS_LABEL[v.status]} · {formatDuration(Date.now() - v.statusSince)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <button
                                                onClick={() => { selectVehicle(v.id); navigate('/demo/map'); }}
                                                className="p-1.5 rounded-md text-slate-300 hover:text-accent hover:bg-red-50 transition-colors" title="Locate on map">
                                                <MapPin size={15} />
                                            </button>
                                            <button onClick={() => removeVehicle(v.id)}
                                                className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </PageFade>
    );
};

export default FleetManager;
