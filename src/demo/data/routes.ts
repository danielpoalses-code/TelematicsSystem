// Hand-traced route corridors around Pietermaritzburg / KZN (N3, R103, city loops).
// Vehicles ping-pong along these waypoint chains in the simulation.

export type LatLng = [number, number];

export interface DemoRoute {
    id: string;
    name: string;
    waypoints: LatLng[];
}

export const ROUTES: DemoRoute[] = [
    {
        id: 'n3-pmb-durban',
        name: 'N3 — PMB to Hammarsdale',
        waypoints: [
            [-29.6168, 30.3928], [-29.6255, 30.4090], [-29.6354, 30.4287],
            [-29.6500, 30.4480], [-29.6620, 30.4650], [-29.6760, 30.4870],
            [-29.6950, 30.5120], [-29.7130, 30.5340], [-29.7280, 30.5520],
            [-29.7330, 30.5730], [-29.7400, 30.5950], [-29.7560, 30.6230],
            [-29.7760, 30.6480], [-29.7920, 30.6700],
        ],
    },
    {
        id: 'r103-old-main',
        name: 'R103 — Old Main Road',
        waypoints: [
            [-29.6300, 30.4150], [-29.6420, 30.4330], [-29.6560, 30.4520],
            [-29.6700, 30.4730], [-29.6890, 30.4990], [-29.7060, 30.5230],
            [-29.7250, 30.5480], [-29.7390, 30.5810], [-29.7480, 30.6080],
        ],
    },
    {
        id: 'pmb-city-loop',
        name: 'PMB City Loop',
        waypoints: [
            [-29.6005, 30.3794], [-29.5950, 30.3920], [-29.5880, 30.4050],
            [-29.5960, 30.4180], [-29.6080, 30.4230], [-29.6190, 30.4120],
            [-29.6250, 30.3980], [-29.6180, 30.3850], [-29.6090, 30.3760],
        ],
    },
    {
        id: 'pmb-howick',
        name: 'N3 — PMB to Howick',
        waypoints: [
            [-29.6090, 30.3760], [-29.5930, 30.3560], [-29.5750, 30.3340],
            [-29.5560, 30.3100], [-29.5360, 30.2870], [-29.5160, 30.2640],
            [-29.4960, 30.2430], [-29.4810, 30.2280],
        ],
    },
    {
        id: 'pmb-wartburg',
        name: 'R33 — PMB to Wartburg',
        waypoints: [
            [-29.5880, 30.4050], [-29.5700, 30.4220], [-29.5500, 30.4400],
            [-29.5280, 30.4560], [-29.5050, 30.4750], [-29.4830, 30.4950],
            [-29.4570, 30.5210], [-29.4380, 30.5440],
        ],
    },
    {
        id: 'industrial-shuttle',
        name: 'Mkondeni Industrial Shuttle',
        waypoints: [
            [-29.6390, 30.4030], [-29.6440, 30.4130], [-29.6500, 30.4230],
            [-29.6450, 30.4330], [-29.6380, 30.4250], [-29.6330, 30.4140],
        ],
    },
    {
        id: 'thornville-richmond',
        name: 'R56 — Thornville to Richmond',
        waypoints: [
            [-29.6800, 30.3700], [-29.7000, 30.3640], [-29.7250, 30.3550],
            [-29.7530, 30.3430], [-29.7800, 30.3300], [-29.8120, 30.3120],
            [-29.8420, 30.2900],
        ],
    },
    {
        id: 'cato-ridge-loop',
        name: 'Cato Ridge Distribution Loop',
        waypoints: [
            [-29.7380, 30.5860], [-29.7300, 30.6000], [-29.7230, 30.6160],
            [-29.7330, 30.6280], [-29.7450, 30.6180], [-29.7480, 30.6010],
        ],
    },
];

const EARTH_R = 6371000;

export function haversine(a: LatLng, b: LatLng): number {
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const la1 = (a[0] * Math.PI) / 180;
    const la2 = (b[0] * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

export function bearing(a: LatLng, b: LatLng): number {
    const la1 = (a[0] * Math.PI) / 180;
    const la2 = (b[0] * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(la2);
    const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export interface RouteGeometry {
    route: DemoRoute;
    /** cumulative distance (m) at each waypoint */
    cum: number[];
    total: number;
}

const geomCache = new Map<string, RouteGeometry>();

export function routeGeometry(routeId: string): RouteGeometry {
    let g = geomCache.get(routeId);
    if (!g) {
        const route = ROUTES.find(r => r.id === routeId) ?? ROUTES[0];
        const cum: number[] = [0];
        for (let i = 1; i < route.waypoints.length; i++) {
            cum.push(cum[i - 1] + haversine(route.waypoints[i - 1], route.waypoints[i]));
        }
        g = { route, cum, total: cum[cum.length - 1] };
        geomCache.set(routeId, g);
    }
    return g;
}

/** Position + heading at a distance along the route. Distance is ping-ponged over 2×total. */
export function pointAlong(routeId: string, dist: number): { pos: LatLng; heading: number } {
    const { route, cum, total } = routeGeometry(routeId);
    const cycle = ((dist % (2 * total)) + 2 * total) % (2 * total);
    const forward = cycle <= total;
    const d = forward ? cycle : 2 * total - cycle;

    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const segStart = route.waypoints[i - 1];
    const segEnd = route.waypoints[i];
    const segLen = cum[i] - cum[i - 1] || 1;
    const t = Math.min(1, Math.max(0, (d - cum[i - 1]) / segLen));
    const pos: LatLng = [
        segStart[0] + (segEnd[0] - segStart[0]) * t,
        segStart[1] + (segEnd[1] - segStart[1]) * t,
    ];
    const hdg = forward ? bearing(segStart, segEnd) : bearing(segEnd, segStart);
    return { pos, heading: hdg };
}
