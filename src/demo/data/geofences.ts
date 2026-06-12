import { haversine, type LatLng } from './routes';

export interface Geofence {
    id: string;
    name: string;
    color: string;
    type: 'polygon' | 'circle';
    /** polygon vertices, or [center] for circle */
    points: LatLng[];
    radiusM?: number;
    alertOnEnter: boolean;
    alertOnExit: boolean;
    builtIn?: boolean;
}

export const DEFAULT_GEOFENCES: Geofence[] = [
    {
        id: 'gf_depot',
        name: 'Main Depot — Mkondeni',
        color: '#22c55e',
        type: 'polygon',
        points: [
            [-29.6360, 30.4000], [-29.6360, 30.4090], [-29.6430, 30.4090], [-29.6430, 30.4000],
        ],
        alertOnEnter: true,
        alertOnExit: true,
        builtIn: true,
    },
    {
        id: 'gf_cato',
        name: 'Cato Ridge DC',
        color: '#3b82f6',
        type: 'circle',
        points: [[-29.7350, 30.6090]],
        radiusM: 1800,
        alertOnEnter: true,
        alertOnExit: false,
        builtIn: true,
    },
    {
        id: 'gf_howick',
        name: 'Howick Customer Site',
        color: '#f59e0b',
        type: 'circle',
        points: [[-29.4860, 30.2320]],
        radiusM: 1500,
        alertOnEnter: true,
        alertOnExit: true,
        builtIn: true,
    },
    {
        id: 'gf_norisk',
        name: 'No-Go Zone — Richmond South',
        color: '#ef4444',
        type: 'polygon',
        points: [
            [-29.8000, 30.2700], [-29.8000, 30.3300], [-29.8600, 30.3300], [-29.8600, 30.2700],
        ],
        alertOnEnter: true,
        alertOnExit: false,
        builtIn: true,
    },
];

export function pointInGeofence(p: LatLng, gf: Geofence): boolean {
    if (gf.type === 'circle') {
        return haversine(p, gf.points[0]) <= (gf.radiusM ?? 0);
    }
    // ray casting
    let inside = false;
    const pts = gf.points;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [yi, xi] = pts[i];
        const [yj, xj] = pts[j];
        const intersect =
            yi > p[0] !== yj > p[0] &&
            p[1] < ((xj - xi) * (p[0] - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

export function geofenceAreaLabel(gf: Geofence): string {
    if (gf.type === 'circle') {
        const a = Math.PI * (gf.radiusM ?? 0) ** 2;
        return formatArea(a);
    }
    // shoelace on roughly-planar local coords
    const pts = gf.points;
    if (pts.length < 3) return '—';
    const lat0 = (pts[0][0] * Math.PI) / 180;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(lat0);
    let sum = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][1] * mPerDegLng, yi = pts[i][0] * mPerDegLat;
        const xj = pts[j][1] * mPerDegLng, yj = pts[j][0] * mPerDegLat;
        sum += xj * yi - xi * yj;
    }
    return formatArea(Math.abs(sum) / 2);
}

function formatArea(m2: number): string {
    if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`;
    if (m2 >= 10_000) return `${(m2 / 10_000).toFixed(2)} ha`;
    return `${Math.round(m2)} m²`;
}
