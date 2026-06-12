import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Gauge, Thermometer, Fuel, BatteryFull, Droplets, Snowflake,
    User, History, X, Video, Clock,
} from 'lucide-react';
import type { DemoVehicle } from '../data/fleets';
import { STATUS_COLOR, STATUS_LABEL, formatDuration, DemoButton } from './ui';

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string; warn?: boolean }> = ({ icon, label, value, warn }) => (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${warn ? 'bg-red-50' : 'bg-slate-50'}`}>
        <span className={warn ? 'text-red-500' : 'text-slate-400'}>{icon}</span>
        <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">{label}</div>
            <div className={`text-sm font-bold tabular-nums ${warn ? 'text-red-600' : 'text-slate-700'}`}>{value}</div>
        </div>
    </div>
);

export const VehicleInfoCard: React.FC<{ vehicle: DemoVehicle; onClose: () => void }> = ({ vehicle: v, onClose }) => {
    const navigate = useNavigate();
    const s = v.sensors;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="absolute bottom-4 left-4 z-[1000] w-[340px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
            <div className="px-4 pt-3.5 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[v.status] }} />
                        <h3 className="font-bold text-slate-800 truncate">{v.name}</h3>
                        {v.cameraEquipped && <Video size={14} className="text-slate-400 shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>{v.reg}</span>
                        <span className="flex items-center gap-1"><User size={11} />{v.driver}</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"><X size={16} /></button>
            </div>

            <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: STATUS_COLOR[v.status] }}>
                    {STATUS_LABEL[v.status]} · {formatDuration(Date.now() - v.statusSince)}
                </span>
                <span className="text-slate-400 flex items-center gap-1 tabular-nums">
                    <Clock size={11} /> {v.odoKm.toFixed(0)} km · {v.engineHours.toFixed(0)} h
                </span>
            </div>

            <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                <Stat icon={<Gauge size={15} />} label="Speed" value={`${v.speedKmh.toFixed(0)} km/h`} warn={v.speedKmh > 100} />
                <Stat icon={<Thermometer size={15} />} label="Coolant" value={`${s.coolantC.toFixed(0)} °C`} warn={s.coolantC > 102} />
                <Stat icon={<Fuel size={15} />} label="Fuel" value={`${s.fuelPct.toFixed(0)} %`} warn={s.fuelPct < 15} />
                <Stat icon={<BatteryFull size={15} />} label="Battery" value={`${s.batteryV.toFixed(1)} V`} warn={s.batteryV < 23.5} />
                <Stat icon={<Droplets size={15} />} label="Oil pressure" value={`${s.oilBar.toFixed(1)} bar`} />
                {s.cargoTempC != null
                    ? <Stat icon={<Snowflake size={15} />} label="Cargo temp" value={`${s.cargoTempC.toFixed(1)} °C`} warn={s.cargoTempC > 8} />
                    : <Stat icon={<Gauge size={15} />} label="RPM" value={`${s.rpm.toFixed(0)}`} />}
            </div>

            <div className="px-4 pb-4 flex gap-2">
                <DemoButton variant="outline" className="flex-1 !py-1.5 text-xs" onClick={() => navigate(`/demo/history?vehicle=${v.id}`)}>
                    <History size={13} /> Movement history
                </DemoButton>
                {v.cameraEquipped && (
                    <DemoButton variant="outline" className="flex-1 !py-1.5 text-xs" onClick={() => navigate(`/demo/integrations?vehicle=${v.id}`)}>
                        <Video size={13} /> Live camera
                    </DemoButton>
                )}
            </div>
        </motion.div>
    );
};
