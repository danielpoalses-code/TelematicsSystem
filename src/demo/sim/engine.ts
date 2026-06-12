import { pointAlong } from '../data/routes';
import type { DemoVehicle } from '../data/fleets';
import { pointInGeofence, type Geofence } from '../data/geofences';
import { METRIC_META, type DemoAlert, type NotificationRule, type AlertMetric } from '../data/alerts';

let alertUid = 0;
const newAlertId = () => `al_${Date.now()}_${alertUid++}`;

export interface SimState {
    /** vehicleId -> set of geofence ids currently inside */
    insideGeofences: Map<string, Set<string>>;
    /** `${vehicleId}:${ruleId}` -> epoch ms when the rule may fire again */
    ruleCooldown: Map<string, number>;
}

export function createSimState(): SimState {
    return { insideGeofences: new Map(), ruleCooldown: new Map() };
}

const RULE_COOLDOWN_MS = 90_000;

function metricValue(v: DemoVehicle, metric: AlertMetric): number | null {
    switch (metric) {
        case 'speed': return v.speedKmh;
        case 'coolantC': return v.sensors.coolantC;
        case 'fuelPct': return v.sensors.fuelPct;
        case 'batteryV': return v.sensors.batteryV;
        case 'cargoTempC': return v.sensors.cargoTempC;
        case 'idleMin': return v.status === 'idling' ? (Date.now() - v.statusSince) / 60000 : 0;
    }
}

/** Advance every vehicle by dt seconds; returns new vehicle objects + freshly raised alerts. */
export function stepSimulation(
    vehicles: DemoVehicle[],
    dtSec: number,
    rules: NotificationRule[],
    geofences: Geofence[],
    sim: SimState,
): { vehicles: DemoVehicle[]; alerts: DemoAlert[] } {
    const now = Date.now();
    const alerts: DemoAlert[] = [];

    const next = vehicles.map(v => {
        const nv: DemoVehicle = { ...v, sensors: { ...v.sensors } };

        // --- state machine: occasionally change status ---
        const r = Math.random();
        if (nv.status === 'moving') {
            if (r < 0.0012) { nv.status = 'idling'; nv.statusSince = now; nv.targetSpeed = 0; }
        } else if (nv.status === 'idling') {
            if (r < 0.004) { nv.status = 'moving'; nv.statusSince = now; nv.targetSpeed = 55 + Math.random() * 40; }
            else if (r < 0.006) { nv.status = 'parked'; nv.statusSince = now; nv.ignition = false; }
        } else if (nv.status === 'parked') {
            if (r < 0.0015) { nv.status = 'moving'; nv.statusSince = now; nv.ignition = true; nv.targetSpeed = 55 + Math.random() * 40; }
        }

        // --- speed dynamics ---
        if (nv.status === 'moving') {
            nv.ignition = true;
            // wander the target speed; rare overspeed burst to trip the demo speeding rule
            if (Math.random() < 0.01) nv.targetSpeed = 50 + Math.random() * 45;
            if (Math.random() < 0.0025) nv.targetSpeed = 102 + Math.random() * 18;
            const accel = nv.targetSpeed > nv.speedKmh ? 6 : -9;
            nv.speedKmh = Math.max(0, Math.min(125, nv.speedKmh + accel * dtSec * Math.random()));
        } else {
            nv.speedKmh = Math.max(0, nv.speedKmh - 25 * dtSec);
        }

        // --- movement along route ---
        if (nv.speedKmh > 1) {
            nv.routeDist += (nv.speedKmh / 3.6) * dtSec;
            nv.odoKm += (nv.speedKmh / 3600) * dtSec;
        }
        const { pos, heading } = pointAlong(nv.routeId, nv.routeDist);
        nv.pos = pos;
        if (nv.speedKmh > 1) nv.heading = heading;

        // --- sensors ---
        const s = nv.sensors;
        if (nv.ignition) {
            nv.engineHours += dtSec / 3600;
            s.rpm = nv.status === 'idling' || nv.speedKmh < 2
                ? 700 + Math.random() * 80
                : 1100 + nv.speedKmh * 9 + Math.random() * 120;
            const targetCoolant = 86 + nv.speedKmh / 12;
            s.coolantC += (targetCoolant - s.coolantC) * 0.02 + (Math.random() - 0.5) * 0.4;
            // rare overheating excursion
            if (Math.random() < 0.0006) s.coolantC = 103 + Math.random() * 5;
            s.oilBar = 3.5 + s.rpm / 2000 + (Math.random() - 0.5) * 0.1;
            s.fuelPct = Math.max(0, s.fuelPct - (nv.speedKmh / 3.6) * dtSec * 0.00012);
            // occasional refuel when parked at low fuel
            s.batteryV = 27.4 + (Math.random() - 0.5) * 0.3;
        } else {
            s.rpm = 0;
            s.oilBar = 0;
            s.coolantC += (28 - s.coolantC) * 0.005;
            s.batteryV = 24.6 + (Math.random() - 0.5) * 0.2;
            if (Math.random() < 0.0008) s.batteryV = 23.0 + Math.random() * 0.4;
            if (s.fuelPct < 12 && Math.random() < 0.003) s.fuelPct = 95; // refuelled
        }
        if (s.cargoTempC != null) {
            const target = nv.ignition ? 3 : 6;
            s.cargoTempC += (target - s.cargoTempC) * 0.01 + (Math.random() - 0.5) * 0.25;
            if (Math.random() < 0.0005) s.cargoTempC = 8.5 + Math.random() * 3; // door left open
        }

        return nv;
    });

    // --- rule evaluation ---
    for (const v of next) {
        for (const rule of rules) {
            if (!rule.enabled) continue;
            const val = metricValue(v, rule.metric);
            if (val == null) continue;
            const breached = rule.operator === 'gt' ? val > rule.threshold : val < rule.threshold;
            if (!breached) continue;
            const key = `${v.id}:${rule.id}`;
            const readyAt = sim.ruleCooldown.get(key) ?? 0;
            if (now < readyAt) continue;
            sim.ruleCooldown.set(key, now + RULE_COOLDOWN_MS);
            const meta = METRIC_META[rule.metric];
            alerts.push({
                id: newAlertId(),
                time: now,
                vehicleId: v.id,
                vehicleName: v.name,
                severity: rule.severity,
                kind: 'sensor',
                title: rule.name,
                detail: `${meta.label} ${rule.operator === 'gt' ? 'reached' : 'dropped to'} ${val.toFixed(1)} ${meta.unit} (limit ${rule.threshold} ${meta.unit}) — driver ${v.driver}`,
                pos: v.pos,
                acknowledged: false,
            });
        }

        // --- geofence transitions ---
        let inside = sim.insideGeofences.get(v.id);
        if (!inside) { inside = new Set(); sim.insideGeofences.set(v.id, inside); }
        for (const gf of geofences) {
            const isIn = pointInGeofence(v.pos, gf);
            const wasIn = inside.has(gf.id);
            if (isIn && !wasIn) {
                inside.add(gf.id);
                if (gf.alertOnEnter) {
                    alerts.push({
                        id: newAlertId(), time: now, vehicleId: v.id, vehicleName: v.name,
                        severity: gf.name.toLowerCase().includes('no-go') ? 'critical' : 'info',
                        kind: 'geofence',
                        title: `Entered ${gf.name}`,
                        detail: `${v.name} (${v.driver}) entered geofence "${gf.name}" at ${v.speedKmh.toFixed(0)} km/h`,
                        pos: v.pos, acknowledged: false,
                    });
                }
            } else if (!isIn && wasIn) {
                inside.delete(gf.id);
                if (gf.alertOnExit) {
                    alerts.push({
                        id: newAlertId(), time: now, vehicleId: v.id, vehicleName: v.name,
                        severity: 'info', kind: 'geofence',
                        title: `Exited ${gf.name}`,
                        detail: `${v.name} (${v.driver}) left geofence "${gf.name}"`,
                        pos: v.pos, acknowledged: false,
                    });
                }
            }
        }
    }

    return { vehicles: next, alerts };
}
