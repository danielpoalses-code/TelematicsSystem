import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Wrench, Snowflake, ArrowRight, Plus, Radio, MapPin, BellRing, Video } from 'lucide-react';
import { PRESET_FLEETS } from '../data/fleets';
import { useDemo } from '../context/DemoContext';
import { DemoButton, Field, inputCls } from '../components/ui';

const PRESET_ICON: Record<string, React.ReactNode> = {
    logistics: <Truck size={22} />,
    construction: <Wrench size={22} />,
    coldchain: <Snowflake size={22} />,
};

const FEATURES = [
    { icon: <MapPin size={15} />, text: 'Live tracking on real roads' },
    { icon: <BellRing size={15} />, text: 'Threshold alerts & geofences' },
    { icon: <Video size={15} />, text: 'Dashcam & sensor integrations' },
];

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const { selectPresetFleet, startCustomFleet } = useDemo();
    const [customName, setCustomName] = useState('');
    const [mode, setMode] = useState<'choose' | 'custom'>('choose');

    const startPreset = (id: string) => {
        selectPresetFleet(id);
        navigate('/demo/map');
    };

    const startCustom = () => {
        startCustomFleet(customName.trim() || 'My Fleet');
        navigate('/demo/fleet?welcome=1');
    };

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-red-50/40">
            <div className="max-w-5xl mx-auto px-6 py-14">
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm mb-6">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Interactive sandbox — no sign-up needed</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                        Take Power<span className="text-accent">Tech</span> for a drive
                    </h1>
                    <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-lg">
                        A fully simulated fleet — live positions, sensor alerts, geofences, reports and camera
                        integrations. Play with everything; nothing here touches real data.
                    </p>
                    <div className="flex items-center justify-center gap-5 mt-6 flex-wrap">
                        {FEATURES.map(f => (
                            <span key={f.text} className="flex items-center gap-1.5 text-sm text-slate-500">
                                <span className="text-accent">{f.icon}</span>{f.text}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {mode === 'choose' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                        <div className="grid md:grid-cols-3 gap-5">
                            {PRESET_FLEETS.map((p, i) => (
                                <motion.button
                                    key={p.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + i * 0.08 }}
                                    whileHover={{ y: -4, boxShadow: '0 12px 32px -8px rgba(220,53,69,0.18)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => startPreset(p.id)}
                                    className="text-left bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-colors hover:border-accent/40 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-red-50 text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                                        {PRESET_ICON[p.id] ?? <Truck size={22} />}
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg">{p.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{p.description}</p>
                                    <span className="inline-flex items-center gap-1.5 text-accent text-sm font-bold mt-4 group-hover:gap-2.5 transition-all">
                                        Launch fleet <ArrowRight size={15} />
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-center mt-8">
                            <button
                                onClick={() => setMode('custom')}
                                className="inline-flex items-center gap-2 text-slate-500 hover:text-accent font-semibold text-sm transition-colors"
                            >
                                <Plus size={16} /> Or build your own fleet from scratch
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {mode === 'custom' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
                    >
                        <div className="w-12 h-12 rounded-xl bg-red-50 text-accent flex items-center justify-center mb-4">
                            <Radio size={22} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Name your fleet</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-5">You'll add vehicles on the next screen — they go live on the map immediately.</p>
                        <Field label="Fleet name">
                            <input
                                autoFocus
                                className={inputCls}
                                placeholder="e.g. Khulu Digital Logistics"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && startCustom()}
                            />
                        </Field>
                        <div className="flex gap-2 mt-6">
                            <DemoButton variant="outline" className="flex-1" onClick={() => setMode('choose')}>Back</DemoButton>
                            <DemoButton className="flex-1" onClick={startCustom}>Create fleet <ArrowRight size={15} /></DemoButton>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Landing;
