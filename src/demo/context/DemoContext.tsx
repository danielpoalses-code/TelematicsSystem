import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { PRESET_FLEETS, makeVehicle, type DemoVehicle, type VehicleSeed } from '../data/fleets';
import { DEFAULT_GEOFENCES, type Geofence } from '../data/geofences';
import { DEFAULT_RULES, type DemoAlert, type NotificationRule } from '../data/alerts';
import { createSimState, stepSimulation } from '../sim/engine';
import { pointAlong, ROUTES } from '../data/routes';

const TICK_MS = 1500;
const MAX_ALERTS = 300;
const MAX_TOASTS = 4;

export interface DemoContextValue {
    fleetName: string | null;
    vehicles: DemoVehicle[];
    alerts: DemoAlert[];
    toasts: DemoAlert[];
    rules: NotificationRule[];
    geofences: Geofence[];
    selectedVehicleId: string | null;
    unreadAlerts: number;

    selectPresetFleet: (presetId: string) => void;
    startCustomFleet: (name: string) => void;
    addVehicle: (seed: Omit<VehicleSeed, 'routeId' | 'startDist'> & { routeId?: string }) => void;
    removeVehicle: (id: string) => void;
    resetDemo: () => void;

    selectVehicle: (id: string | null) => void;
    acknowledgeAlert: (id: string) => void;
    acknowledgeAll: () => void;
    dismissToast: (id: string) => void;

    addGeofence: (gf: Geofence) => void;
    updateGeofence: (gf: Geofence) => void;
    removeGeofence: (id: string) => void;

    addRule: (rule: NotificationRule) => void;
    updateRule: (rule: NotificationRule) => void;
    removeRule: (id: string) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export const useDemo = (): DemoContextValue => {
    const ctx = useContext(DemoContext);
    if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
    return ctx;
};

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [fleetName, setFleetName] = useState<string | null>(null);
    const [vehicles, setVehicles] = useState<DemoVehicle[]>([]);
    const [alerts, setAlerts] = useState<DemoAlert[]>([]);
    const [toasts, setToasts] = useState<DemoAlert[]>([]);
    const [rules, setRules] = useState<NotificationRule[]>(DEFAULT_RULES);
    const [geofences, setGeofences] = useState<Geofence[]>(DEFAULT_GEOFENCES);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const simRef = useRef(createSimState());
    const rulesRef = useRef(rules);
    const geofencesRef = useRef(geofences);
    rulesRef.current = rules;
    geofencesRef.current = geofences;

    // main simulation loop
    useEffect(() => {
        if (vehicles.length === 0) return;
        const iv = setInterval(() => {
            setVehicles(prev => {
                const { vehicles: next, alerts: fresh } = stepSimulation(
                    prev, TICK_MS / 1000, rulesRef.current, geofencesRef.current, simRef.current,
                );
                if (fresh.length > 0) {
                    setAlerts(a => [...fresh, ...a].slice(0, MAX_ALERTS));
                    const popups = fresh.filter(f => f.severity !== 'info' || f.kind === 'geofence');
                    if (popups.length > 0) setToasts(t => [...popups, ...t].slice(0, MAX_TOASTS));
                }
                return next;
            });
        }, TICK_MS);
        return () => clearInterval(iv);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicles.length > 0]);

    // auto-expire toasts
    useEffect(() => {
        if (toasts.length === 0) return;
        const t = setTimeout(() => setToasts(prev => prev.slice(0, -1)), 6000);
        return () => clearTimeout(t);
    }, [toasts]);

    const initFleet = useCallback((name: string, seeds: VehicleSeed[]) => {
        simRef.current = createSimState();
        const vs = seeds.map((s, i) => {
            const v = makeVehicle(s, i);
            const { pos, heading } = pointAlong(v.routeId, v.routeDist);
            return { ...v, pos, heading };
        });
        setFleetName(name);
        setVehicles(vs);
        setAlerts([]);
        setToasts([]);
        setSelectedVehicleId(null);
    }, []);

    const selectPresetFleet = useCallback((presetId: string) => {
        const preset = PRESET_FLEETS.find(p => p.id === presetId);
        if (preset) initFleet(preset.name, preset.vehicles);
    }, [initFleet]);

    const startCustomFleet = useCallback((name: string) => {
        initFleet(name, []);
    }, [initFleet]);

    const addVehicle = useCallback((seed: Omit<VehicleSeed, 'routeId' | 'startDist'> & { routeId?: string }) => {
        setVehicles(prev => {
            const routeId = seed.routeId ?? ROUTES[prev.length % ROUTES.length].id;
            const v = makeVehicle({ ...seed, routeId, startDist: Math.random() * 8000 }, prev.length);
            const { pos, heading } = pointAlong(v.routeId, v.routeDist);
            return [...prev, { ...v, pos, heading }];
        });
    }, []);

    const removeVehicle = useCallback((id: string) => {
        setVehicles(prev => prev.filter(v => v.id !== id));
        setSelectedVehicleId(prev => (prev === id ? null : prev));
    }, []);

    const resetDemo = useCallback(() => {
        setFleetName(null);
        setVehicles([]);
        setAlerts([]);
        setToasts([]);
        setRules(DEFAULT_RULES);
        setGeofences(DEFAULT_GEOFENCES);
        setSelectedVehicleId(null);
        simRef.current = createSimState();
    }, []);

    const value = useMemo<DemoContextValue>(() => ({
        fleetName, vehicles, alerts, toasts, rules, geofences, selectedVehicleId,
        unreadAlerts: alerts.filter(a => !a.acknowledged).length,
        selectPresetFleet, startCustomFleet, addVehicle, removeVehicle, resetDemo,
        selectVehicle: setSelectedVehicleId,
        acknowledgeAlert: (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a)),
        acknowledgeAll: () => setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true }))),
        dismissToast: (id: string) => setToasts(prev => prev.filter(t => t.id !== id)),
        addGeofence: (gf: Geofence) => setGeofences(prev => [...prev, gf]),
        updateGeofence: (gf: Geofence) => setGeofences(prev => prev.map(g => g.id === gf.id ? gf : g)),
        removeGeofence: (id: string) => setGeofences(prev => prev.filter(g => g.id !== id)),
        addRule: (rule: NotificationRule) => setRules(prev => [...prev, rule]),
        updateRule: (rule: NotificationRule) => setRules(prev => prev.map(r => r.id === rule.id ? rule : r)),
        removeRule: (id: string) => setRules(prev => prev.filter(r => r.id !== id)),
    }), [fleetName, vehicles, alerts, toasts, rules, geofences, selectedVehicleId,
        selectPresetFleet, startCustomFleet, addVehicle, removeVehicle, resetDemo]);

    return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};
