import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, MapPin, X } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { SEVERITY_STYLE, formatClock } from './ui';

export const Toasts: React.FC = () => {
    const { toasts, dismissToast } = useDemo();

    return (
        <div className="fixed bottom-5 right-5 z-[2000] flex flex-col gap-2 w-[340px] pointer-events-none">
            <AnimatePresence>
                {toasts.map(t => {
                    const sev = SEVERITY_STYLE[t.severity];
                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: 60, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 60, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                            className="pointer-events-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                        >
                            <div className={`h-1 ${sev.dot}`} />
                            <div className="p-3 flex gap-3">
                                <div className={`shrink-0 w-8 h-8 rounded-full ${sev.bg} ${sev.text} flex items-center justify-center`}>
                                    {t.kind === 'geofence' ? <MapPin size={15} /> : <Bell size={15} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold text-slate-800 truncate">{t.title}</span>
                                        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{formatClock(t.time)}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.detail}</p>
                                </div>
                                <button
                                    onClick={() => dismissToast(t.id)}
                                    className="shrink-0 self-start text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
