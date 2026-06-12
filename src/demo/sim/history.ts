import { ROUTES, pointAlong, routeGeometry, type LatLng } from '../data/routes';
import { seededRand, type DemoVehicle } from '../data/fleets';

export interface Trip {
    id: string;
    vehicleId: string;
    day: string; // yyyy-MM-dd
    startTime: number;
    endTime: number;
    distanceKm: number;
    maxSpeed: number;
    avgSpeed: number;
    fuelUsedL: number;
    routeId: string;
    startDist: number;
    endDist: number;
    harshBraking: number;
    harshAccel: number;
    overSpeedEvents: number;
}

export interface Parking {
    vehicleId: string;
    day: string;
    startTime: number;
    endTime: number;
    pos: LatLng;
    label: string;
}

export interface DayStats {
    day: string;
    distanceKm: number;
    drivingHours: number;
    idleHours: number;
    fuelUsedL: number;
    alerts: number;
}

const PARK_LABELS = ['Main Depot', 'Customer site', 'Truck stop — N3', 'Fuel station', 'Overnight yard', 'Workshop'];

function dayKey(d: Date): string {
    return d.toISOString().slice(0, 10);
}

/** Deterministically generate trips + parkings for one vehicle on one day offset (0 = today). */
export function generateDayActivity(v: DemoVehicle, dayOffset: number): { trips: Trip[]; parkings: Parking[] } {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);
    const day = dayKey(date);
    const base = v.seed + dayOffset * 101;

    const tripCount = 2 + Math.floor(seededRand(base, 1) * 3); // 2–4 trips
    const trips: Trip[] = [];
    const parkings: Parking[] = [];

    let clock = date.getTime() + (5 + seededRand(base, 2) * 3) * 3600_000; // start 05:00–08:00
    const routeIdx = v.seed % ROUTES.length;

    for (let t = 0; t < tripCount; t++) {
        const routeId = ROUTES[(routeIdx + t) % ROUTES.length].id;
        const geom = routeGeometry(routeId);
        const durMin = 35 + seededRand(base, 10 + t) * 110;
        const avgSpeed = 38 + seededRand(base, 20 + t) * 40;
        const distanceKm = (avgSpeed * durMin) / 60;
        const startDist = seededRand(base, 30 + t) * geom.total;
        const endTime = clock + durMin * 60_000;
        trips.push({
            id: `trip_${v.id}_${day}_${t}`,
            vehicleId: v.id,
            day,
            startTime: clock,
            endTime,
            distanceKm,
            maxSpeed: avgSpeed + 18 + seededRand(base, 40 + t) * 30,
            avgSpeed,
            fuelUsedL: distanceKm * (v.type === 'truck' || v.type === 'tanker' ? 0.42 : 0.11) * (0.9 + seededRand(base, 50 + t) * 0.25),
            routeId,
            startDist,
            endDist: startDist + distanceKm * 1000,
            harshBraking: Math.floor(seededRand(base, 60 + t) * 4),
            harshAccel: Math.floor(seededRand(base, 70 + t) * 3),
            overSpeedEvents: Math.floor(seededRand(base, 80 + t) * 3),
        });
        const parkMin = 25 + seededRand(base, 90 + t) * 140;
        const parkEnd = endTime + parkMin * 60_000;
        parkings.push({
            vehicleId: v.id,
            day,
            startTime: endTime,
            endTime: parkEnd,
            pos: pointAlong(routeId, startDist + distanceKm * 1000).pos,
            label: PARK_LABELS[Math.floor(seededRand(base, 100 + t) * PARK_LABELS.length)],
        });
        clock = parkEnd;
    }
    return { trips, parkings };
}

/** Trail polyline for a trip, sampled along its route. */
export function tripTrail(trip: Trip, samples = 80): LatLng[] {
    const pts: LatLng[] = [];
    for (let i = 0; i <= samples; i++) {
        const d = trip.startDist + ((trip.endDist - trip.startDist) * i) / samples;
        pts.push(pointAlong(trip.routeId, d).pos);
    }
    return pts;
}

export function generateRangeActivity(v: DemoVehicle, days: number): { trips: Trip[]; parkings: Parking[] } {
    const trips: Trip[] = [];
    const parkings: Parking[] = [];
    for (let d = days - 1; d >= 0; d--) {
        const a = generateDayActivity(v, d);
        trips.push(...a.trips);
        parkings.push(...a.parkings);
    }
    return { trips, parkings };
}

export function dailyStats(v: DemoVehicle, days: number): DayStats[] {
    const out: DayStats[] = [];
    for (let d = days - 1; d >= 0; d--) {
        const { trips } = generateDayActivity(v, d);
        const date = new Date();
        date.setDate(date.getDate() - d);
        const distanceKm = trips.reduce((s, t) => s + t.distanceKm, 0);
        const drivingHours = trips.reduce((s, t) => s + (t.endTime - t.startTime), 0) / 3600_000;
        out.push({
            day: dayKey(date),
            distanceKm,
            drivingHours,
            idleHours: 0.3 + seededRand(v.seed + d, 7) * 1.6,
            fuelUsedL: trips.reduce((s, t) => s + t.fuelUsedL, 0),
            alerts: Math.floor(seededRand(v.seed + d, 8) * 6),
        });
    }
    return out;
}

/** Hourly engine-health series for the engine report (last 24h). */
export function engineHealthSeries(v: DemoVehicle): { hour: string; coolantC: number; batteryV: number; rpm: number; oilBar: number }[] {
    const out = [];
    for (let h = 23; h >= 0; h--) {
        const t = new Date(Date.now() - h * 3600_000);
        const driving = seededRand(v.seed, h * 3 + 1) > 0.35;
        out.push({
            hour: `${String(t.getHours()).padStart(2, '0')}:00`,
            coolantC: driving ? 84 + seededRand(v.seed, h * 3 + 2) * 14 : 30 + seededRand(v.seed, h * 3 + 2) * 10,
            batteryV: 24 + seededRand(v.seed, h * 3 + 3) * 4,
            rpm: driving ? 1100 + seededRand(v.seed, h * 3 + 4) * 900 : 0,
            oilBar: driving ? 3.6 + seededRand(v.seed, h * 3 + 5) * 1.4 : 0,
        });
    }
    return out;
}

/** Fuel level series with refuel / suspected-drain markers (last 7 days, 4h step). */
export function fuelSeries(v: DemoVehicle): { time: string; level: number; event?: 'refuel' | 'drain' }[] {
    const out: { time: string; level: number; event?: 'refuel' | 'drain' }[] = [];
    let level = 40 + seededRand(v.seed, 0) * 50;
    for (let i = 7 * 6; i >= 0; i--) {
        const t = new Date(Date.now() - i * 4 * 3600_000);
        const r = seededRand(v.seed, i * 11);
        let event: 'refuel' | 'drain' | undefined;
        if (level < 18 && r > 0.5) { level = 92 + r * 6; event = 'refuel'; }
        else if (r > 0.985) { level = Math.max(5, level - 25); event = 'drain'; }
        else level = Math.max(3, level - r * 6);
        out.push({
            time: `${t.getDate()}/${t.getMonth() + 1} ${String(t.getHours()).padStart(2, '0')}h`,
            level: Math.round(level * 10) / 10,
            event,
        });
    }
    return out;
}
