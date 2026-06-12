import type { LatLng } from './routes';

export type VehicleType = 'truck' | 'van' | 'car' | 'tanker';
export type VehicleStatus = 'moving' | 'idling' | 'parked' | 'offline';

export interface SensorState {
    coolantC: number;
    rpm: number;
    fuelPct: number;
    batteryV: number;
    oilBar: number;
    cargoTempC: number | null; // only refrigerated units
}

export interface DemoVehicle {
    id: string;
    name: string;
    reg: string;
    type: VehicleType;
    driver: string;
    refrigerated: boolean;
    cameraEquipped: boolean;
    routeId: string;
    /** distance along route, metres */
    routeDist: number;
    speedKmh: number;
    targetSpeed: number;
    heading: number;
    pos: LatLng;
    status: VehicleStatus;
    statusSince: number; // epoch ms
    ignition: boolean;
    odoKm: number;
    engineHours: number;
    sensors: SensorState;
    /** seed for deterministic per-vehicle pseudo-random history */
    seed: number;
}

export interface FleetPreset {
    id: string;
    name: string;
    description: string;
    vehicles: VehicleSeed[];
}

export interface VehicleSeed {
    name: string;
    reg: string;
    type: VehicleType;
    driver: string;
    refrigerated?: boolean;
    camera?: boolean;
    routeId: string;
    startDist: number;
    startStatus?: VehicleStatus;
}

export const DRIVER_POOL = [
    'Sipho Ndlovu', 'Johan van der Merwe', 'Thabo Mokoena', 'Pieter Botha',
    'Lindiwe Dlamini', 'Kobus Pretorius', 'Musa Khumalo', 'Riaan Steyn',
    'Nomvula Zungu', 'Andile Mbatha', 'Dawie Fourie', 'Sbu Cele',
];

export const PRESET_FLEETS: FleetPreset[] = [
    {
        id: 'logistics',
        name: 'KZN Logistics Fleet',
        description: '12 vehicles — long-haul trucks, regional vans and a fuel tanker running the N3 corridor.',
        vehicles: [
            { name: 'PS 10075 — V3', reg: 'ND 142-776', type: 'truck', driver: 'Sipho Ndlovu', camera: true, routeId: 'n3-pmb-durban', startDist: 2000 },
            { name: 'PS 9649', reg: 'NP 88-441', type: 'truck', driver: 'Johan van der Merwe', camera: true, routeId: 'n3-pmb-durban', startDist: 14000 },
            { name: 'PS 9864', reg: 'ND 305-118', type: 'truck', driver: 'Thabo Mokoena', routeId: 'r103-old-main', startDist: 6000 },
            { name: 'PS 10752', reg: 'NP 67-204', type: 'truck', driver: 'Pieter Botha', camera: true, routeId: 'n3-pmb-durban', startDist: 26000 },
            { name: 'Reefer 04 — Cold Chain', reg: 'ND 511-902', type: 'truck', driver: 'Lindiwe Dlamini', refrigerated: true, camera: true, routeId: 'pmb-howick', startDist: 3000 },
            { name: 'Reefer 07 — Cold Chain', reg: 'ND 511-903', type: 'truck', driver: 'Kobus Pretorius', refrigerated: true, routeId: 'pmb-wartburg', startDist: 5000 },
            { name: 'Tanker 01 — Bulk Diesel', reg: 'NP 23-667', type: 'tanker', driver: 'Musa Khumalo', routeId: 'thornville-richmond', startDist: 8000 },
            { name: 'Van 12 — Parts Express', reg: 'NPN 4521', type: 'van', driver: 'Riaan Steyn', routeId: 'pmb-city-loop', startDist: 1000 },
            { name: 'Van 15 — Parts Express', reg: 'NPN 4530', type: 'van', driver: 'Nomvula Zungu', routeId: 'industrial-shuttle', startDist: 400 },
            { name: 'Bakkie 03 — Site Crew', reg: 'NPS 1190', type: 'car', driver: 'Andile Mbatha', routeId: 'cato-ridge-loop', startDist: 900, startStatus: 'idling' },
            { name: 'PS 7459 — V3.b', reg: 'ND 798-340', type: 'truck', driver: 'Dawie Fourie', routeId: 'r103-old-main', startDist: 12000, startStatus: 'parked' },
            { name: 'PS 7460 — V3', reg: 'ND 798-341', type: 'truck', driver: 'Sbu Cele', routeId: 'pmb-city-loop', startDist: 2500, startStatus: 'parked' },
        ],
    },
    {
        id: 'construction',
        name: 'Construction & Plant',
        description: '7 vehicles — tippers, a water tanker and crew bakkies shuttling between sites.',
        vehicles: [
            { name: 'Tipper 01', reg: 'NP 90-112', type: 'truck', driver: 'Sipho Ndlovu', routeId: 'industrial-shuttle', startDist: 200 },
            { name: 'Tipper 02', reg: 'NP 90-113', type: 'truck', driver: 'Thabo Mokoena', camera: true, routeId: 'industrial-shuttle', startDist: 1500 },
            { name: 'Tipper 03', reg: 'NP 90-114', type: 'truck', driver: 'Kobus Pretorius', routeId: 'cato-ridge-loop', startDist: 600 },
            { name: 'Water Tanker', reg: 'ND 455-781', type: 'tanker', driver: 'Musa Khumalo', routeId: 'thornville-richmond', startDist: 4000 },
            { name: 'Lowbed — Plant Moves', reg: 'ND 230-967', type: 'truck', driver: 'Johan van der Merwe', camera: true, routeId: 'n3-pmb-durban', startDist: 9000 },
            { name: 'Crew Bakkie 1', reg: 'NPS 2208', type: 'car', driver: 'Andile Mbatha', routeId: 'pmb-city-loop', startDist: 800 },
            { name: 'Crew Bakkie 2', reg: 'NPS 2209', type: 'car', driver: 'Sbu Cele', routeId: 'pmb-howick', startDist: 2000, startStatus: 'parked' },
        ],
    },
    {
        id: 'coldchain',
        name: 'Cold Chain Distribution',
        description: '5 refrigerated vehicles with live cargo-temperature sensors and door monitoring.',
        vehicles: [
            { name: 'Reefer Alpha', reg: 'ND 600-101', type: 'truck', driver: 'Lindiwe Dlamini', refrigerated: true, camera: true, routeId: 'n3-pmb-durban', startDist: 5000 },
            { name: 'Reefer Bravo', reg: 'ND 600-102', type: 'truck', driver: 'Nomvula Zungu', refrigerated: true, camera: true, routeId: 'pmb-howick', startDist: 1500 },
            { name: 'Reefer Charlie', reg: 'ND 600-103', type: 'truck', driver: 'Pieter Botha', refrigerated: true, routeId: 'pmb-wartburg', startDist: 7000 },
            { name: 'Chiller Van 1', reg: 'NPN 7811', type: 'van', driver: 'Riaan Steyn', refrigerated: true, routeId: 'pmb-city-loop', startDist: 300 },
            { name: 'Chiller Van 2', reg: 'NPN 7812', type: 'van', driver: 'Dawie Fourie', refrigerated: true, routeId: 'industrial-shuttle', startDist: 700, startStatus: 'parked' },
        ],
    },
];

let uid = 0;
export function makeVehicle(seedDef: VehicleSeed, index: number): DemoVehicle {
    const seed = hashCode(seedDef.reg + seedDef.name);
    const status = seedDef.startStatus ?? 'moving';
    return {
        id: `veh_${Date.now()}_${uid++}_${index}`,
        name: seedDef.name,
        reg: seedDef.reg,
        type: seedDef.type,
        driver: seedDef.driver,
        refrigerated: !!seedDef.refrigerated,
        cameraEquipped: !!seedDef.camera,
        routeId: seedDef.routeId,
        routeDist: seedDef.startDist,
        speedKmh: status === 'moving' ? 55 + (seed % 25) : 0,
        targetSpeed: 60 + (seed % 30),
        heading: 0,
        pos: [0, 0],
        status,
        statusSince: Date.now() - (seed % 7200) * 1000,
        ignition: status === 'moving' || status === 'idling',
        odoKm: 42000 + (seed % 180000),
        engineHours: 1200 + (seed % 9000),
        sensors: {
            coolantC: status === 'moving' ? 84 + (seed % 6) : 35,
            rpm: status === 'moving' ? 1400 : status === 'idling' ? 750 : 0,
            fuelPct: 35 + (seed % 60),
            batteryV: 24.4 + (seed % 10) / 10,
            oilBar: status === 'moving' ? 4.2 : 0,
            cargoTempC: seedDef.refrigerated ? 2 + (seed % 4) : null,
        },
        seed,
    };
}

export function hashCode(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

/** Deterministic pseudo-random in [0,1) from a seed + step — used for stable report data. */
export function seededRand(seed: number, step: number): number {
    const x = Math.sin(seed * 9301 + step * 49297) * 233280;
    return x - Math.floor(x);
}

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
    truck: 'Truck',
    van: 'Van',
    car: 'Light vehicle',
    tanker: 'Tanker',
};
