import React, { useState } from 'react';
import {
    Cpu, Zap, Droplets, Wind, Wrench, Truck,
    Gauge, CheckCircle2, AlertTriangle, Factory, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type InjectionType = 'common_rail' | 'mechanical';

const AXLE_LABELS: Record<string, string> = {
    '4x2': '4×2 Chassis',
    '4x4': '4×4 All-Wheel Drive',
    '6x4': '6×4 Chassis Cab',
    '6x6': '6×6 All-Wheel Drive',
    '8x4': '8×4 Chassis Cab',
};
type AxleConfig = '4x2' | '4x4' | '6x4' | '6x6' | '8x4';
type CabType = 'day' | 'sleeper';
type SpecTabKey = 'engine' | 'electrical' | 'fluids' | 'air' | 'wiring';

interface EngineSpec {
    code: string;
    displacement: number; // litres
    hp: number;
    kw: number;
    rpmPower: number;
    torqueNm: number;
    torqueRpmLow: number;
    torqueRpmHigh: number;
    emissionStd: string;
    injection: InjectionType;
}

interface TruckModel {
    id: string;
    name: string;
    axle: AxleConfig;
    cab: CabType;
    gvm: number;    // kg
    gcm?: number;   // kg, tractor units only
    wheelbaseSWB: number; // mm
    wheelbaseLWB?: number; // mm
    useCases: string[];
    engine: EngineSpec;
    tyres: string;
    inFleet: boolean;
    is5thWheel: boolean;
    wiringNotes: string[];
}

// ── Full Technical Data ────────────────────────────────────────────────────────

const MODELS: TruckModel[] = [
    {
        id: 'vx1627',
        name: 'VX 1627',
        axle: '4x2',
        cab: 'day',
        gvm: 16000,
        wheelbaseSWB: 5500,
        useCases: ['Urban freight', 'Light distribution', 'Municipal delivery'],
        engine: {
            code: 'WP7-270 E30',
            displacement: 7.14,
            hp: 270,
            kw: 199,
            rpmPower: 2300,
            torqueNm: 1100,
            torqueRpmLow: 1200,
            torqueRpmHigh: 1600,
            emissionStd: 'Euro 3',
            injection: 'common_rail',
        },
        tyres: '12 R22.5 Radial',
        inFleet: false,
        is5thWheel: false,
        wiringNotes: [
            'Has ECU (common rail Euro 3) — do NOT splice directly into engine harness.',
            'Use relay isolation when tapping switched power near engine bay.',
            'ECU can throw fault codes if power supply is disturbed — always use proper relay circuits.',
            'Still 24V system; standard chassis harness taps remain valid for body/ancillary circuits.',
            'Fuse/relay box located on passenger side of firewall inside cab.',
        ],
    },
    {
        id: 'vx1729',
        name: 'VX 1729',
        axle: '4x4',
        cab: 'day',
        gvm: 17000,
        wheelbaseSWB: 4500,
        useCases: ['Agriculture', 'Military / off-road', 'Water tanker off-road', 'Remote freight'],
        engine: {
            code: 'WP10-290 E32',
            displacement: 9.726,
            hp: 290,
            kw: 213,
            rpmPower: 2200,
            torqueNm: 1160,
            torqueRpmLow: 1200,
            torqueRpmHigh: 1600,
            emissionStd: 'Euro 2',
            injection: 'mechanical',
        },
        tyres: '14.00 R20 cross-ply, off-road rated',
        inFleet: false,
        is5thWheel: false,
        wiringNotes: [
            'No ECU — mechanical injection; engine harness may be tapped directly using standard relay wiring.',
            'Front axle has transfer case Hi/Lo and diff lock wiring — do not interfere with diff-lock solenoid circuit.',
            'Transfer case selector switch wiring runs along left chassis rail to cab switch panel.',
            '4×4 front axle engagement solenoid is 24V; confirm relay ratings before adding ancillary loads.',
        ],
    },
    {
        id: 'vx2628',
        name: 'VX 2628',
        axle: '6x4',
        cab: 'day',
        gvm: 26000,
        wheelbaseSWB: 4175,
        wheelbaseLWB: 5175,
        useCases: ['Tippers (SWB)', 'Water tankers', 'Concrete mixers', 'Waste compactors', 'Freight'],
        engine: {
            code: 'WP10-290 E32',
            displacement: 9.726,
            hp: 290,
            kw: 213,
            rpmPower: 2200,
            torqueNm: 1160,
            torqueRpmLow: 1200,
            torqueRpmHigh: 1600,
            emissionStd: 'Euro 2',
            injection: 'mechanical',
        },
        tyres: '315/80 R22.5 Radial, 10-stud steel rim',
        inFleet: true,
        is5thWheel: false,
        wiringNotes: [
            'No ECU — simplest wiring platform in the range; direct relay tapping is safe on all circuits.',
            'PTO solenoid off gearbox activates hydraulic pump for tipper / tanker bodies — 24V solenoid, typically fused at 15A.',
            'PTO trigger wire runs from cab switch along left chassis rail to gearbox mount.',
            'Standard cab harness terminates at firewall; chassis harness runs to rear of frame for body connectors.',
            'Most common fleet model — all technicians should be familiar with this chassis layout.',
        ],
    },
    {
        id: 'vx2635a',
        name: 'VX 2635A',
        axle: '6x6',
        cab: 'day',
        gvm: 26000,
        wheelbaseSWB: 5175,
        useCases: ['Military', 'Mining off-road', 'Off-road water tanker', 'Waste compaction'],
        engine: {
            code: 'WP10-340 E32',
            displacement: 9.726,
            hp: 340,
            kw: 250,
            rpmPower: 2200,
            torqueNm: 1350,
            torqueRpmLow: 1200,
            torqueRpmHigh: 1600,
            emissionStd: 'Euro 2',
            injection: 'mechanical',
        },
        tyres: '14.00 R20 cross-ply, off-road',
        inFleet: true,
        is5thWheel: false,
        wiringNotes: [
            'No ECU — mechanical injection; direct relay wiring applies.',
            '6×6 transfer case wiring for all-wheel drive engagement — additional solenoid circuit vs 6×4.',
            'Front axle is driven — front axle engagement solenoid on left chassis rail near transfer case.',
            'Diff lock wiring for all three axles: front, mid, rear — confirm wiring diagram before adding any ancillary switches.',
            'Transfer case Hi/Lo switch wiring in cab — do not share switching circuits with body controls.',
        ],
    },
    {
        id: 'vx2642s',
        name: 'VX 2642S',
        axle: '6x4',
        cab: 'sleeper',
        gvm: 26000,
        gcm: 65000,
        wheelbaseSWB: 4175,
        useCases: ['Long-haul tautliner', 'Flatbed semi-trailer', 'Side-tipper semi-trailer'],
        engine: {
            code: 'WP12-420 E32',
            displacement: 11.596,
            hp: 420,
            kw: 309,
            rpmPower: 2200,
            torqueNm: 1750,
            torqueRpmLow: 1300,
            torqueRpmHigh: 1400,
            emissionStd: 'Euro 2',
            injection: 'mechanical',
        },
        tyres: '315/80 R22.5 Radial',
        inFleet: true,
        is5thWheel: true,
        wiringNotes: [
            'No ECU — mechanical injection; engine harness may be tapped via relay.',
            'Tractor unit — chassis harness is shorter (no body rear connectors past 5th wheel coupling).',
            'Trailer socket: 7-pin ISO 1185 (24N standard), located at rear of chassis cross-member.',
            'Sleeper cab adds extra lighting circuits — interior bunk light, auxiliary 12V socket in sleeper bay.',
            'GCM 65,000kg — gross combination must be monitored; do not add heavy body ancillaries past 5th wheel without load calculation.',
            'Fifth-wheel coupling indicator switch (if fitted) wires into cab dashboard harness.',
        ],
    },
    {
        id: 'vx3335',
        name: 'VX 3335',
        axle: '6x4',
        cab: 'day',
        gvm: 33000,
        wheelbaseSWB: 4175,
        wheelbaseLWB: 5175,
        useCases: ['High-mass tippers', 'Water tankers', 'Waste compaction'],
        engine: {
            code: 'WP10-340 E32',
            displacement: 9.726,
            hp: 340,
            kw: 250,
            rpmPower: 2200,
            torqueNm: 1350,
            torqueRpmLow: 1200,
            torqueRpmHigh: 1600,
            emissionStd: 'Euro 2',
            injection: 'mechanical',
        },
        tyres: '315/80 R22.5 Radial',
        inFleet: true,
        is5thWheel: false,
        wiringNotes: [
            'No ECU — same wiring platform as VX 2628 but heavier GVM 33t chassis.',
            'Often runs LWB 5,175mm wheelbase for tankers — chassis harness extension may be required for rear body.',
            'PTO solenoid configuration identical to VX 2628; same relay/fuse layout.',
            'Higher GVM means heavier suspension load — avoid routing wiring through suspension articulation points.',
        ],
    },
    {
        id: 'vx4035b',
        name: 'VX 4035B',
        axle: '8x4',
        cab: 'day',
        gvm: 40000,
        gcm: 75000,
        wheelbaseSWB: 5025,
        useCases: ['Heavy mining', 'Heavy tippers', 'Water tanker'],
        engine: {
            code: 'WP10-340 E32',
            displacement: 9.726,
            hp: 340,
            kw: 250,
            rpmPower: 2200,
            torqueNm: 1350,
            torqueRpmLow: 1200,
            torqueRpmHigh: 1600,
            emissionStd: 'Euro 2',
            injection: 'mechanical',
        },
        tyres: '315/80 R22.5 Radial',
        inFleet: false,
        is5thWheel: false,
        wiringNotes: [
            'No ECU — mechanical injection; direct relay wiring applies.',
            'Dual steer axles — two front axle brake circuits; each has independent ABS / brake sensor wiring.',
            'Additional air lines for the 8×4 extra braking circuit — confirm 3rd air tank plumbing before adding air-operated accessories.',
            '8×4 chassis has an additional crossmember axle air circuit; all four axle brake circuits must remain isolated.',
            'Body rear harness connector at rear crossmember — standard 7-pin body connector.',
        ],
    },
    {
        id: 'vx4042k',
        name: 'VX 4042K',
        axle: '8x4',
        cab: 'day',
        gvm: 40000,
        gcm: 75000,
        wheelbaseSWB: 5025,
        useCases: ['Highest-capacity rigid', 'Mining', 'Heavy tippers'],
        engine: {
            code: 'WP12-420 E32',
            displacement: 11.596,
            hp: 420,
            kw: 309,
            rpmPower: 2200,
            torqueNm: 1750,
            torqueRpmLow: 1300,
            torqueRpmHigh: 1400,
            emissionStd: 'Euro 2',
            injection: 'mechanical',
        },
        tyres: '315/80 R22.5 Radial',
        inFleet: false,
        is5thWheel: false,
        wiringNotes: [
            'No ECU — WP12 engine (larger than VX 4035B) but same wiring approach.',
            'Dual steer axles — identical dual front-axle circuit layout to VX 4035B.',
            'WP12 engine has larger starter motor (7.5kW) — confirm charging circuit capacity before adding large ancillary loads.',
            'Additional air lines for extra braking circuit — same 3rd air tank note as VX 4035B.',
            'Highest-capacity rigid in range — prioritise battery isolator accessibility for emergency shutdown.',
        ],
    },

    // ── V3 Range ──────────────────────────────────────────────────────────────────
    {
        id: 'v32646',
        name: 'V3 2646',
        axle: '6x4',
        cab: 'day',
        gvm: 26000,
        gcm: 65000,
        wheelbaseSWB: 3975,
        useCases: ['Long-haul tautliner', 'Container carrier', 'Flatbed semi-trailer', 'Refrigerated semi-trailer'],
        engine: {
            code: 'WP12.460N E3',
            displacement: 11.596,
            hp: 460,
            kw: 338,
            rpmPower: 1900,
            torqueNm: 2110,
            torqueRpmLow: 1000,
            torqueRpmHigh: 1400,
            emissionStd: 'Euro 3',
            injection: 'common_rail',
        },
        tyres: '315/80 R22.5 Radial',
        inFleet: false,
        is5thWheel: true,
        wiringNotes: [
            'Has ECU — Euro 3 common rail WP12 engine; NEVER splice directly into the engine harness.',
            'Use relay isolation and proper fuse ratings for any switched 24V taps near the engine bay.',
            'Retarder (FHB320B exhaust brake) circuit runs separately on chassis rail — do not interfere.',
            'Front disc brakes are ABS-equipped — ABS sensor wiring at front axle must not be cut or disturbed.',
            'If AMT variant: CAN bus is present for transmission — do not attempt direct relay tapping of transmission circuits; use manufacturer-approved interface only.',
            'Trailer socket: 7-pin ISO 1185 (24N) at rear cross-member — same location as VX 2642S.',
            'Significantly higher torque (2,110 Nm) and power (460 HP) than VX range — confirm earthing integrity and charging output after any installation.',
        ],
    },
];

// ── Per-Model Photos ───────────────────────────────────────────────────────────

const MODEL_PHOTOS: Record<string, string> = {
    vx1627:  '/photos/IMG_3648.jpeg',   // At Foton dealership — lighter truck
    vx1729:  '/photos/IMG_1296.jpeg',   // Bigger roof rack — off-road variant
    vx2628:  '/photos/IMG_1301.jpeg',   // Clean front view POWERSTAR 6x4
    vx2635a: '/photos/IMG_1469.jpeg',   // VX 2635 badge visible on door
    vx2642s: '/photos/IMG_1277.jpeg',   // 2642 badge on cab, sleeper style
    vx3335:  '/photos/IMG_3637.jpeg',   // Heavy 6x4 front view
    vx4035b: '/photos/IMG_1466.jpeg',   // Heavier-cab 8x4 style
    vx4042k: '/photos/IMG_4492.jpeg',   // Warehouse setting, heavy chassis
    v32646:  '/photos/IMG_1311.jpeg',   // Row of Powerstar trucks, long-haul variant
};

// ── Common Specs ───────────────────────────────────────────────────────────────

const COMMON_ELECTRICAL = {
    voltage: '24V DC',
    batteries: '2× 12V batteries wired in series (N200, 180–200Ah each)',
    batteryLocation: 'Left chassis rail, behind cab steps',
    isolator: 'Battery isolation switch on battery box (LHS chassis rail) — orange indicator ring. Always open before maintenance work.',
    alternator: '28V, 70–90A — charges at 27.6–28V regulated',
    starter: '24V, 5.5kW or 7.5kW pinion-engagement (WP12 uses 7.5kW)',
    wiring: 'Cab harness → firewall grommet → chassis harness. No CAN bus on mechanical-injection models. Fuse/relay box on firewall (passenger side). Chassis earth to frame rail at multiple points.',
    telematics: {
        unit: 'Galileo Sky telematics unit',
        unitLocation: 'Left-hand dashboard, below instrument cluster — green power LED',
        limiter: 'Speed limiter module co-located with Galileo unit — red LED indicator',
        limiterNote: 'Speed limiter is a legal fitment — do not tamper with or bypass.',
        gpsAntenna: 'GPS/GNSS antenna mounted on cab roof (magnetic base, watertight cable entry at rear edge of roof)',
        gpsNote: 'Route GPS antenna cable along headliner / A-pillar to dashboard unit. Keep away from engine harness to avoid RF interference.',
    },
};

const COMMON_FLUIDS = {
    engineOil: { spec: 'CH-4 grade, 15W-40 or 20W-50', capacityWP10: '28–30L (WP10)', capacityWP12: '32–35L (WP12)', interval: 'Every 15,000–20,000km' },
    gearbox: { spec: '85W-90 or 80W-90 GL-4', capacity: '10–12L', unit: '12JS Fast Gearbox (all models)' },
    diffOil: { spec: '85W-90 GL-5', note: 'Per axle — multi-axle models require separate fill for each diff housing' },
    coolant: { spec: 'Ethylene glycol 50/50 with distilled water', capacityWP10: '40–45L total system (WP10)', pressureCap: '~100kPa (1 bar)', overflow: 'Expansion overflow tank — check level at overflow first, not header tank under pressure', expansionTankLocation: 'Coolant expansion tank located on exterior rear wall of cab, below the rear cab window — accessible from ground level without opening the hood.' },
    fuel: { capacity: '400L', material: 'Steel or aluminium tank', spec: 'Diesel only — do NOT use petrol or mixed fuels' },
};

const COMMON_AIR = {
    system: 'Dual-circuit compressed air brakes — three-tank layout: Auxiliary (wet) tank under cab, Main Air Tank 1 on LHS chassis rail, Main Air Tank 2 on RHS chassis rail.',
    tanks: [
        {
            name: 'Auxiliary (Wet) Air Tank — Under Cab',
            position: 'Centred under cab floor, between driver and passenger seat',
            desc: 'First vessel after the air compressor. Catches moisture, oil mist and carryover before air enters the brake circuits. Acts as a buffer reservoir. Drain daily — pull cord at base of tank before first trip.',
        },
        {
            name: 'Main Air Tank 1 — LHS Chassis Rail',
            position: 'Left-hand side chassis rail, forward of rear axle group',
            desc: 'Primary brake circuit reservoir. Feeds the front axle (service) brake circuit. Protected from Main Air Tank 2 by a check valve — partial braking is maintained if one circuit loses pressure.',
        },
        {
            name: 'Main Air Tank 2 — RHS Chassis Rail',
            position: 'Right-hand side chassis rail, mirrored to Main Air Tank 1',
            desc: 'Secondary brake circuit reservoir. Feeds the rear axle (service) brake circuit. Also supplies the spring brake (park brake) release circuit. Drain regularly — this tank is furthest from the compressor.',
        },
    ],
    chargeRange: '700–800kPa (system charges to this range under normal operation)',
    governorCutout: 'Governor cuts at ~800kPa maximum',
    governorReengage: 'Governor re-engages below 650kPa (compressor restarts)',
    warningThreshold: '~550kPa — audible buzzer and warning light activate. Vehicle must not be operated below this level.',
    drainReminder: 'Drain ALL THREE tanks every morning before departure: Auxiliary tank under cab (pull cord), Main Air 1 — LHS rail, Main Air 2 — RHS rail. Moisture in brake circuits causes corrosion and valve damage.',
};

// ── Per-Model Scene Backgrounds ────────────────────────────────────────────────
// SVG elements rendered inside TruckSchematic's <svg> before the zoom group.
// viewBox is 700 × 280.

const ModelSceneBackground: React.FC<{ id: string }> = ({ id }) => {

    if (id === 'vx1627') {
        // Urban night city — 4x2 urban freight
        return (
            <>
                <defs>
                    <linearGradient id="bg_vx1627" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#020910" />
                        <stop offset="100%" stopColor="#091524" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="700" height="280" fill="url(#bg_vx1627)" />
                {/* Building silhouettes — left cluster */}
                <rect x="0"   y="200" width="38"  height="80" fill="#060d1a" />
                <rect x="8"   y="180" width="22"  height="100" fill="#070e1c" />
                <rect x="32"  y="212" width="28"  height="68" fill="#060c19" />
                <rect x="58"  y="225" width="22"  height="55" fill="#070e1c" />
                {/* Window lights — left buildings */}
                <rect x="12"  y="188" width="4"  height="3" fill="#1e3a5f" opacity="0.7" />
                <rect x="12"  y="196" width="4"  height="3" fill="#1e3a5f" opacity="0.5" />
                <rect x="22"  y="190" width="3"  height="3" fill="#162d4f" opacity="0.6" />
                <rect x="22"  y="199" width="3"  height="3" fill="#162d4f" opacity="0.8" />
                {/* Building silhouettes — right cluster */}
                <rect x="622" y="195" width="40"  height="85" fill="#060d1a" />
                <rect x="648" y="175" width="24"  height="105" fill="#070e1c" />
                <rect x="668" y="208" width="32"  height="72" fill="#060c19" />
                {/* Window lights — right */}
                <rect x="654" y="182" width="4"  height="3" fill="#1e3a5f" opacity="0.6" />
                <rect x="654" y="191" width="4"  height="3" fill="#1e3a5f" opacity="0.4" />
                <rect x="663" y="185" width="3"  height="3" fill="#162d4f" opacity="0.7" />
                {/* Street lamp — left */}
                <line x1="58" y1="238" x2="58" y2="270" stroke="#0d1e30" strokeWidth="1.2" />
                <line x1="58" y1="238" x2="70" y2="234" stroke="#0d1e30" strokeWidth="1" />
                <circle cx="70" cy="233" r="2.5" fill="#fef9c3" opacity="0.35" />
                {/* Street lamp — right */}
                <line x1="640" y1="240" x2="640" y2="270" stroke="#0d1e30" strokeWidth="1.2" />
                <line x1="640" y1="240" x2="628" y2="236" stroke="#0d1e30" strokeWidth="1" />
                <circle cx="628" cy="235" r="2.5" fill="#fef9c3" opacity="0.35" />
                {/* Ground/road horizon */}
                <rect x="0" y="262" width="700" height="18" fill="#04090f" opacity="0.7" />
                <line x1="0" y1="262" x2="700" y2="262" stroke="#0d1e30" strokeWidth="0.7" opacity="0.6" />
            </>
        );
    }

    if (id === 'vx1729') {
        // Bush/off-road terrain — 4x4 all-terrain
        return (
            <>
                <defs>
                    <linearGradient id="bg_vx1729" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#04100a" />
                        <stop offset="70%" stopColor="#081808" />
                        <stop offset="100%" stopColor="#0a1c0a" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="700" height="280" fill="url(#bg_vx1729)" />
                {/* Distant hills */}
                <path d="M 0,240 Q 80,218 180,228 Q 280,238 380,214 Q 470,196 560,210 Q 640,222 700,215 L 700,280 L 0,280 Z"
                      fill="#060e06" opacity="0.9" />
                {/* Tree line — left */}
                <path d="M 0,225 Q 12,205 24,222 Q 36,204 48,220 Q 60,202 72,218 Q 84,200 96,216 Q 108,206 120,222 L 120,265 L 0,265 Z"
                      fill="#051008" opacity="0.85" />
                {/* Individual tree shapes left */}
                <polygon points="20,205 14,230 26,230" fill="#050e06" opacity="0.7" />
                <polygon points="50,202 43,225 57,225" fill="#050e06" opacity="0.6" />
                <polygon points="82,200 74,226 90,226" fill="#050e06" opacity="0.7" />
                {/* Tree line — right */}
                <path d="M 580,220 Q 596,200 612,218 Q 628,198 644,215 Q 660,200 676,216 Q 690,204 700,218 L 700,265 L 580,265 Z"
                      fill="#051008" opacity="0.85" />
                <polygon points="600,202 593,225 607,225" fill="#050e06" opacity="0.7" />
                <polygon points="634,198 626,222 642,222" fill="#050e06" opacity="0.6" />
                <polygon points="668,200 660,226 676,226" fill="#050e06" opacity="0.7" />
                {/* Rough ground texture */}
                <path d="M 0,265 Q 80,260 160,268 Q 240,262 350,266 Q 460,260 560,268 Q 640,262 700,265 L 700,280 L 0,280 Z"
                      fill="#060c06" opacity="0.9" />
                {/* Stars (clear night sky) */}
                <circle cx="120" cy="22" r="0.9" fill="#c8d5e0" opacity="0.6" />
                <circle cx="280" cy="14" r="1.1" fill="#c8d5e0" opacity="0.7" />
                <circle cx="450" cy="30" r="0.8" fill="#c8d5e0" opacity="0.5" />
                <circle cx="600" cy="18" r="1.0" fill="#c8d5e0" opacity="0.6" />
                <circle cx="680" cy="42" r="0.7" fill="#c8d5e0" opacity="0.5" />
            </>
        );
    }

    if (id === 'vx2628') {
        // Open highway — most common 6x4 general freight
        return (
            <>
                <defs>
                    <linearGradient id="bg_vx2628" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#040c18" />
                        <stop offset="100%" stopColor="#081825" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="700" height="280" fill="url(#bg_vx2628)" />
                {/* Road receding to horizon — perspective trapezoid */}
                <path d="M 280,210 L 420,210 L 700,270 L 0,270 Z" fill="#050c16" opacity="0.75" />
                {/* Road edge lines */}
                <line x1="280" y1="210" x2="0"   y2="270" stroke="#0a1c30" strokeWidth="0.9" opacity="0.6" />
                <line x1="420" y1="210" x2="700" y2="270" stroke="#0a1c30" strokeWidth="0.9" opacity="0.6" />
                {/* Centre-line dashes */}
                <line x1="348" y1="215" x2="345" y2="227" stroke="#0d2035" strokeWidth="1.5" strokeDasharray="6 7" opacity="0.5" />
                <line x1="350" y1="232" x2="348" y2="250" stroke="#0d2035" strokeWidth="1.8" strokeDasharray="7 8" opacity="0.45" />
                {/* Flat scrub horizon */}
                <path d="M 0,205 Q 200,198 350,202 Q 500,198 700,205 L 700,218 L 0,218 Z"
                      fill="#060e1c" opacity="0.75" />
                {/* Distant lights — road-side (faint) */}
                <circle cx="80"  cy="207" r="1.2" fill="#fef3c7" opacity="0.2" />
                <circle cx="618" cy="204" r="1.2" fill="#fef3c7" opacity="0.2" />
                {/* Stars */}
                <circle cx="80"  cy="28" r="1.0" fill="#c8d5e0" opacity="0.55" />
                <circle cx="200" cy="16" r="0.8" fill="#c8d5e0" opacity="0.5" />
                <circle cx="380" cy="22" r="1.1" fill="#c8d5e0" opacity="0.6" />
                <circle cx="560" cy="12" r="0.9" fill="#c8d5e0" opacity="0.5" />
                <circle cx="660" cy="35" r="0.8" fill="#c8d5e0" opacity="0.45" />
            </>
        );
    }

    if (id === 'vx2635a') {
        // Extreme off-road / mine — 6x6
        return (
            <>
                <defs>
                    <linearGradient id="bg_vx2635a" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#120a06" />
                        <stop offset="100%" stopColor="#1e1208" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="700" height="280" fill="url(#bg_vx2635a)" />
                {/* Rocky terrain — left embankment */}
                <path d="M 0,160 L 55,180 L 45,205 L 65,220 L 50,245 L 0,245 Z"
                      fill="#130c06" opacity="0.85" />
                <path d="M 0,180 L 40,195 L 30,215 L 50,230 L 0,230 Z"
                      fill="#160e08" opacity="0.7" />
                {/* Rocky terrain — right embankment */}
                <path d="M 700,160 L 645,180 L 655,205 L 635,220 L 650,245 L 700,245 Z"
                      fill="#130c06" opacity="0.85" />
                <path d="M 700,180 L 660,195 L 670,215 L 650,230 L 700,230 Z"
                      fill="#160e08" opacity="0.7" />
                {/* Rock strata — left wall */}
                <line x1="0" y1="175" x2="55"  y2="182" stroke="#1e1208" strokeWidth="0.8" opacity="0.6" />
                <line x1="0" y1="192" x2="50"  y2="198" stroke="#1e1208" strokeWidth="0.8" opacity="0.5" />
                <line x1="0" y1="210" x2="55"  y2="215" stroke="#1e1208" strokeWidth="0.8" opacity="0.6" />
                {/* Rock strata — right wall */}
                <line x1="700" y1="175" x2="645" y2="182" stroke="#1e1208" strokeWidth="0.8" opacity="0.6" />
                <line x1="700" y1="192" x2="650" y2="198" stroke="#1e1208" strokeWidth="0.8" opacity="0.5" />
                <line x1="700" y1="210" x2="645" y2="215" stroke="#1e1208" strokeWidth="0.8" opacity="0.6" />
                {/* Mine floor / earth */}
                <path d="M 0,258 Q 80,250 180,256 Q 300,262 420,253 Q 540,246 700,255 L 700,280 L 0,280 Z"
                      fill="#0e0a06" opacity="0.9" />
                {/* Dust haze */}
                <ellipse cx="100" cy="205" rx="40" ry="8" fill="#2a1408" opacity="0.12" />
                <ellipse cx="590" cy="200" rx="38" ry="7" fill="#2a1408" opacity="0.12" />
            </>
        );
    }

    if (id === 'vx2642s') {
        // Long-haul night highway — sleeper tractor
        return (
            <>
                <defs>
                    <linearGradient id="bg_vx2642s" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#01040c" />
                        <stop offset="100%" stopColor="#030910" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="700" height="280" fill="url(#bg_vx2642s)" />
                {/* Stars */}
                <circle cx="48"  cy="22" r="1.1" fill="#dde6ef" opacity="0.65" />
                <circle cx="148" cy="12" r="0.9" fill="#dde6ef" opacity="0.55" />
                <circle cx="270" cy="36" r="1.2" fill="#dde6ef" opacity="0.7"  />
                <circle cx="390" cy="10" r="0.8" fill="#dde6ef" opacity="0.5"  />
                <circle cx="500" cy="28" r="1.0" fill="#dde6ef" opacity="0.6"  />
                <circle cx="608" cy="18" r="1.1" fill="#dde6ef" opacity="0.65" />
                <circle cx="680" cy="44" r="0.8" fill="#dde6ef" opacity="0.5"  />
                <circle cx="110" cy="62" r="0.8" fill="#dde6ef" opacity="0.45" />
                <circle cx="340" cy="78" r="0.9" fill="#dde6ef" opacity="0.5"  />
                <circle cx="560" cy="55" r="0.8" fill="#dde6ef" opacity="0.45" />
                <circle cx="660" cy="90" r="0.7" fill="#dde6ef" opacity="0.4"  />
                {/* Milky way hint */}
                <ellipse cx="350" cy="45" rx="180" ry="10" fill="#0a1530" opacity="0.18" />
                {/* Long straight road — strong vanishing point */}
                <path d="M 240,280 L 332,215 L 368,215 L 460,280 Z" fill="#050c16" opacity="0.8" />
                {/* Road edges */}
                <line x1="240" y1="280" x2="332" y2="215" stroke="#0a1c30" strokeWidth="1" opacity="0.7" />
                <line x1="460" y1="280" x2="368" y2="215" stroke="#0a1c30" strokeWidth="1" opacity="0.7" />
                {/* Road centre dashes */}
                <rect x="349" y="222" width="3" height="7"  fill="#0d2035" opacity="0.55" />
                <rect x="349" y="237" width="3" height="8"  fill="#0d2035" opacity="0.5"  />
                <rect x="349" y="253" width="3" height="9"  fill="#0d2035" opacity="0.45" />
                <rect x="349" y="270" width="3" height="10" fill="#0d2035" opacity="0.4"  />
                {/* Oncoming truck headlights (far horizon) */}
                <circle cx="346" cy="217" r="1.2" fill="#fef3c7" opacity="0.45" />
                <circle cx="354" cy="217" r="1.2" fill="#fef3c7" opacity="0.45" />
                {/* Road shoulder flat scrub */}
                <path d="M 0,215 Q 150,208 240,212 L 240,222 L 0,222 Z" fill="#04090e" opacity="0.7" />
                <path d="M 460,212 Q 550,207 700,215 L 700,222 L 460,222 Z" fill="#04090e" opacity="0.7" />
            </>
        );
    }

    if (id === 'vx3335') {
        // Water / industrial infrastructure — water tankers, waste
        return (
            <>
                <defs>
                    <linearGradient id="bg_vx3335" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#040c18" />
                        <stop offset="100%" stopColor="#071c2c" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="700" height="280" fill="url(#bg_vx3335)" />
                {/* Rolling terrain */}
                <path d="M 0,230 Q 140,216 280,224 Q 420,232 560,215 Q 640,208 700,218 L 700,280 L 0,280 Z"
                      fill="#050e1a" opacity="0.9" />
                {/* Water tower — right side */}
                <rect x="628" y="175" width="14" height="52" fill="#071018" />
                <ellipse cx="635" cy="177" rx="24" ry="16" fill="#071018" />
                <line x1="619" y1="185" x2="609" y2="210" stroke="#071018" strokeWidth="1.5" />
                <line x1="651" y1="185" x2="661" y2="210" stroke="#071018" strokeWidth="1.5" />
                {/* Pipeline along ground */}
                <line x1="0"   y1="252" x2="700" y2="250" stroke="#060f1c" strokeWidth="3.5" opacity="0.6" />
                <line x1="0"   y1="257" x2="700" y2="255" stroke="#060f1c" strokeWidth="2"   opacity="0.4" />
                {/* Pipeline joints */}
                {[80, 200, 340, 480, 620].map(x => (
                    <rect key={x} x={x} y="248" width="5" height="8" fill="#071220" opacity="0.7" />
                ))}
                {/* Pumping station — left */}
                <rect x="28" y="212" width="50" height="32" fill="#060e1c" />
                <rect x="30" y="205" width="12" height="10" fill="#060e1c" />
                <rect x="46" y="208" width="8"  height="7"  fill="#060e1c" />
                {/* Reflection shimmer on water surface */}
                <path d="M 120,240 Q 200,237 300,242 Q 400,238 500,241" fill="none" stroke="#0d2035" strokeWidth="0.8" opacity="0.5" />
            </>
        );
    }

    if (id === 'vx4035b') {
        // Heavy mining / quarry — 8x4
        return (
            <>
                <defs>
                    <linearGradient id="bg_vx4035b" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#100908" />
                        <stop offset="100%" stopColor="#180e08" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="700" height="280" fill="url(#bg_vx4035b)" />
                {/* Mine wall — left terraced face */}
                <path d="M 0,148 L 75,162 L 62,185 L 78,205 L 60,228 L 0,228 Z"
                      fill="#130b06" opacity="0.8" />
                <path d="M 0,180 L 60,190 L 50,210 L 68,228 L 0,228 Z"
                      fill="#160d08" opacity="0.6" />
                {/* Mine wall — right terraced face */}
                <path d="M 700,148 L 625,162 L 638,185 L 622,205 L 640,228 L 700,228 Z"
                      fill="#130b06" opacity="0.8" />
                <path d="M 700,180 L 640,190 L 650,210 L 632,228 L 700,228 Z"
                      fill="#160d08" opacity="0.6" />
                {/* Rock strata — left */}
                <line x1="0" y1="162" x2="72"  y2="168" stroke="#1e1008" strokeWidth="1" opacity="0.5" />
                <line x1="0" y1="180" x2="68"  y2="185" stroke="#1e1008" strokeWidth="1" opacity="0.5" />
                <line x1="0" y1="198" x2="70"  y2="202" stroke="#1e1008" strokeWidth="1" opacity="0.5" />
                {/* Rock strata — right */}
                <line x1="700" y1="162" x2="628" y2="168" stroke="#1e1008" strokeWidth="1" opacity="0.5" />
                <line x1="700" y1="180" x2="632" y2="185" stroke="#1e1008" strokeWidth="1" opacity="0.5" />
                <line x1="700" y1="198" x2="630" y2="202" stroke="#1e1008" strokeWidth="1" opacity="0.5" />
                {/* Ore/spoil piles — both sides */}
                <path d="M 0,248 Q 35,238 70,252 Q 100,244 130,258 L 130,280 L 0,280 Z"
                      fill="#0e0a06" />
                <path d="M 570,250 Q 600,240 635,254 Q 665,244 700,256 L 700,280 L 570,280 Z"
                      fill="#0e0a06" />
                {/* Conveyor belt — left */}
                <line x1="0"   y1="222" x2="88"  y2="178" stroke="#160c06" strokeWidth="4" opacity="0.55" />
                <line x1="2"   y1="224" x2="88"  y2="178" stroke="#1a0e08" strokeWidth="1" opacity="0.4" />
                {/* Conveyor belt — right */}
                <line x1="700" y1="222" x2="612" y2="178" stroke="#160c06" strokeWidth="4" opacity="0.55" />
                <line x1="698" y1="224" x2="612" y2="178" stroke="#1a0e08" strokeWidth="1" opacity="0.4" />
                {/* Dust haze */}
                <ellipse cx="90"  cy="185" rx="45" ry="10" fill="#301606" opacity="0.1" />
                <ellipse cx="610" cy="185" rx="45" ry="10" fill="#301606" opacity="0.1" />
            </>
        );
    }

    if (id === 'vx4042k') {
        // Deep open-cut mine — highest capacity 8x4
        return (
            <>
                <defs>
                    <linearGradient id="bg_vx4042k" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d0606" />
                        <stop offset="100%" stopColor="#1a0a08" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="700" height="280" fill="url(#bg_vx4042k)" />
                {/* Deep pit — dramatic stepped walls, left side */}
                <path d="M 0,100 L 0,280 L 95,280 L 95,250 L 78,230 L 88,205 L 70,182 L 82,160 L 75,135 L 80,100 Z"
                      fill="#120808" opacity="0.75" />
                {/* Deep pit — right side */}
                <path d="M 700,100 L 700,280 L 605,280 L 605,250 L 622,230 L 612,205 L 630,182 L 618,160 L 625,135 L 620,100 Z"
                      fill="#120808" opacity="0.75" />
                {/* Inner wall step-down — left */}
                <path d="M 0,140 L 0,280 L 50,280 L 50,255 L 38,238 L 48,215 L 35,195 L 42,140 Z"
                      fill="#150a08" opacity="0.5" />
                {/* Inner wall step-down — right */}
                <path d="M 700,140 L 700,280 L 650,280 L 650,255 L 662,238 L 652,215 L 665,195 L 658,140 Z"
                      fill="#150a08" opacity="0.5" />
                {/* Rock strata lines — left deep wall */}
                {[130, 158, 186, 214, 242].map(y => (
                    <line key={y} x1="0" y1={y} x2={78} y2={y + 3} stroke="#220e0a" strokeWidth="1" opacity="0.55" />
                ))}
                {/* Rock strata lines — right deep wall */}
                {[130, 158, 186, 214, 242].map(y => (
                    <line key={y} x1="700" y1={y} x2={622} y2={y + 3} stroke="#220e0a" strokeWidth="1" opacity="0.55" />
                ))}
                {/* Pit floor */}
                <path d="M 0,268 Q 180,260 350,264 Q 520,258 700,268 L 700,280 L 0,280 Z"
                      fill="#0e0808" />
                {/* Iron-ore haze */}
                <ellipse cx="350" cy="260" rx="200" ry="12" fill="#3d1208" opacity="0.07" />
                {/* Mine level bench markers */}
                <rect x="78"  y="205" width="18" height="2" fill="#220e0a" opacity="0.6" />
                <rect x="70"  y="228" width="22" height="2" fill="#220e0a" opacity="0.6" />
                <rect x="604" y="205" width="18" height="2" fill="#220e0a" opacity="0.6" />
                <rect x="608" y="228" width="22" height="2" fill="#220e0a" opacity="0.6" />
            </>
        );
    }

    if (id === 'v32646') {
        // Long-haul open highway — V3 range truck tractor
        return (
            <>
                <defs>
                    <linearGradient id="bg_v32646" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#010408" />
                        <stop offset="100%" stopColor="#020810" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="700" height="280" fill="url(#bg_v32646)" />
                {/* Stars */}
                <circle cx="55"  cy="18" r="1.1" fill="#dde6ef" opacity="0.7"  />
                <circle cx="160" cy="10" r="0.9" fill="#dde6ef" opacity="0.6"  />
                <circle cx="290" cy="32" r="1.2" fill="#dde6ef" opacity="0.75" />
                <circle cx="400" cy="8"  r="0.8" fill="#dde6ef" opacity="0.5"  />
                <circle cx="510" cy="24" r="1.0" fill="#dde6ef" opacity="0.65" />
                <circle cx="618" cy="16" r="1.1" fill="#dde6ef" opacity="0.7"  />
                <circle cx="680" cy="40" r="0.8" fill="#dde6ef" opacity="0.5"  />
                <circle cx="118" cy="58" r="0.8" fill="#dde6ef" opacity="0.45" />
                <circle cx="350" cy="74" r="0.9" fill="#dde6ef" opacity="0.5"  />
                <circle cx="560" cy="52" r="0.8" fill="#dde6ef" opacity="0.45" />
                {/* Milky way */}
                <ellipse cx="350" cy="42" rx="185" ry="10" fill="#0a1228" opacity="0.2" />
                {/* Long straight road */}
                <path d="M 238,280 L 330,215 L 370,215 L 462,280 Z" fill="#040a14" opacity="0.85" />
                <line x1="238" y1="280" x2="330" y2="215" stroke="#08162a" strokeWidth="1" opacity="0.75" />
                <line x1="462" y1="280" x2="370" y2="215" stroke="#08162a" strokeWidth="1" opacity="0.75" />
                {/* Dashes */}
                <rect x="349" y="222" width="3" height="7"  fill="#0d1e35" opacity="0.6" />
                <rect x="349" y="237" width="3" height="8"  fill="#0d1e35" opacity="0.55" />
                <rect x="349" y="253" width="3" height="9"  fill="#0d1e35" opacity="0.5"  />
                <rect x="349" y="270" width="3" height="10" fill="#0d1e35" opacity="0.45" />
                {/* Oncoming truck headlights (faint) */}
                <circle cx="345" cy="218" r="1.3" fill="#fef3c7" opacity="0.5" />
                <circle cx="355" cy="218" r="1.3" fill="#fef3c7" opacity="0.5" />
                {/* Scrub shoulder */}
                <path d="M 0,215 Q 150,207 238,213 L 238,223 L 0,223 Z" fill="#030810" opacity="0.75" />
                <path d="M 462,213 Q 550,207 700,215 L 700,223 L 462,223 Z" fill="#030810" opacity="0.75" />
            </>
        );
    }

    // Fallback — neutral dark
    return <rect x="0" y="0" width="700" height="280" fill="#0f172a" />;
};

// ── Full Truck Side-Profile Illustration SVG ──────────────────────────────────
// Photorealistic-inspired side profile based on real Powerstar VX trucks.
// White cab with dark visor/POWERSTAR branding, full chassis visible.

const TruckHeroSVG: React.FC<{ model: TruckModel }> = ({ model }) => {
    const { axle, cab, is5thWheel } = model;

    const W = 1000, H = 380;
    const groundY = 344;
    const wheelR  = 45;
    const wheelCY = groundY - wheelR;   // 299

    const isSleeper = cab === 'sleeper';
    const cabFX     = 80;
    const cabW      = isSleeper ? 244 : 200;
    const cabRX     = cabFX + cabW;                // 280 day / 324 sleeper
    const cabTopY   = isSleeper ? 86 : 104;        // roof Y

    const chassisEndX = 936;
    const railTopY    = wheelCY + 8;               // 307
    const railH       = 14;

    const axles: number[] = (() => {
        if (axle === '4x2' || axle === '4x4') return [cabFX + 145, chassisEndX - 185];
        if (axle === '6x4' || axle === '6x6') return [cabFX + 145, chassisEndX - 200, chassisEndX - 100];
        return [cabFX + 118, cabFX + 208, chassisEndX - 200, chassisEndX - 100]; // 8x4
    })();

    const firstRear  = axles[axle === '8x4' ? 2 : 1];
    const lastAxle   = axles[axles.length - 1];
    // 8x4 has a 2nd front axle at cabFX+208=288 which coincides with battery box.
    // Push battery 28px further back on 8x4 so it clears both steer axles.
    const battX      = cabRX + (axle === '8x4' ? 36 : 8);
    const battRX     = battX + 58;
    const compY      = railTopY + 2;
    // Air system — split layout per spec:
    //   AUX (wet) under cab, Air 1 & Air 2 side-by-side just after battery/ISO switch
    const auxTankX   = Math.round((cabFX + axles[0]) / 2) - 12; // under cab, between seats
    const mainAirX   = battRX + 20;                              // both tanks here — LHS near, RHS far (depth offset)
    const fuelStartX = firstRear - 150;
    const fuelEndX   = lastAxle + 18;
    const fuelMidX   = (fuelStartX + fuelEndX) / 2;
    const fuelH      = 38;
    const exhX       = cabRX - 14;
    const sid        = model.id;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id={`hsky${sid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#020c1a" />
                    <stop offset="100%" stopColor="#071525" />
                </linearGradient>
                <linearGradient id={`hcab${sid}`} x1="0" y1="0" x2="0.2" y2="1">
                    <stop offset="0%"   stopColor="#f6f6f6" />
                    <stop offset="100%" stopColor="#d4d4d4" />
                </linearGradient>
                <linearGradient id={`hchs${sid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3a4756" />
                    <stop offset="100%" stopColor="#1e2a38" />
                </linearGradient>
                <radialGradient id={`htyr${sid}`} cx="38%" cy="38%" r="62%">
                    <stop offset="0%"   stopColor="#282828" />
                    <stop offset="100%" stopColor="#0e0e0e" />
                </radialGradient>
            </defs>

            {/* Sky background */}
            <rect width={W} height={H} fill={`url(#hsky${sid})`} />
            <ellipse cx={W * 0.43} cy={groundY} rx={460} ry={28} fill="#0b2038" opacity="0.5" />

            {/* Ground */}
            <rect x="0" y={groundY} width={W} height={H - groundY} fill="#08101a" />
            <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#162030" strokeWidth="1" opacity="0.8" />

            {/* Ground shadow under truck */}
            <ellipse cx={(cabFX + chassisEndX) / 2 + 15} cy={groundY + 5}
                     rx={(chassisEndX - cabFX) / 2 + 22} ry={9} fill="black" opacity="0.38" />

            {/* ── CHASSIS RAILS ── */}
            <rect x={cabFX + 4} y={railTopY - 11} width={chassisEndX - cabFX - 4} height={railH - 2}  fill={`url(#hchs${sid})`} rx="2" />
            <rect x={cabFX + 4} y={railTopY + 5}  width={chassisEndX - cabFX - 4} height={railH}      fill={`url(#hchs${sid})`} rx="2" />
            {[1,2,3,4,5,6].map(i => {
                const sp = (chassisEndX - cabRX - 16) / 7;
                const cx = cabRX + 8 + sp * i;
                return <rect key={i} x={cx - 3} y={railTopY - 11} width={6} height={railH + 14} fill="#263444" rx="1" />;
            })}
            <rect x={chassisEndX} y={railTopY - 9} width={14} height={railH + 16} fill="#3a4756" rx="2" />

            {/* ── BATTERY BOX ── */}
            <rect x={battX} y={compY} width={battRX - battX} height={22} fill="#3c2e0e" rx="3" stroke="#5c4a1e" strokeWidth="0.8" />
            <text x={(battX + battRX) / 2} y={compY + 14} textAnchor="middle" fill="#c8a030" fontSize="7.5" fontFamily="monospace" fontWeight="bold">24V</text>
            {/* Battery isolation switch — mounted on battery box */}
            <rect x={battRX + 2} y={compY + 2} width={14} height={18} fill="#1a2030" rx="2" stroke="#3a5060" strokeWidth="0.8" />
            <circle cx={battRX + 9} cy={compY + 9} r={4.5} fill="#c07020" opacity="0.85" />
            <circle cx={battRX + 9} cy={compY + 9} r={2.2} fill="#e09030" />
            <text x={battRX + 9} y={compY + 19} textAnchor="middle" fill="#6a8098" fontSize="4.5" fontFamily="monospace">ISO</text>

            {/* ══ AIR SYSTEM ══════════════════════════════════════════════════════════════
                AUX (wet) tank  — under cab, between seats, on chassis beneath cab floor
                Main Air 1      — LHS (near) chassis rail  ─┐  both side-by-side
                Main Air 2      — RHS (far) chassis rail   ─┘  just after battery
            ═══════════════════════════════════════════════════════════════════════════ */}

            {/* AUX / Wet air tank — under cab between the seats */}
            <rect x={auxTankX} y={compY - 2} width={26} height={28} fill="#1e3040" rx="12" stroke="#2e4860" strokeWidth="0.9" />
            <text x={auxTankX + 13} y={compY + 7}  textAnchor="middle" fill="#6090b8" fontSize="5"   fontFamily="monospace" fontWeight="bold">AUX</text>
            <text x={auxTankX + 13} y={compY + 17} textAnchor="middle" fill="#486880" fontSize="4.5" fontFamily="monospace">WET</text>
            {/* Dashed air line: aux → main air tanks */}
            <line x1={auxTankX + 26} y1={compY + 12} x2={mainAirX} y2={compY + 11}
                  stroke="#2e4860" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.65" />

            {/* Main Air Tank 2 — RHS far rail (rendered first = behind LHS tank) */}
            <rect x={mainAirX + 4} y={compY + 5} width={26} height={22} fill="#1e2c3c" rx="11" stroke="#2c3c4c" strokeWidth="0.8" opacity="0.75" />
            <text x={mainAirX + 17} y={compY + 14} textAnchor="middle" fill="#50687a" fontSize="5"   fontFamily="monospace">AIR 2</text>
            <text x={mainAirX + 17} y={compY + 22} textAnchor="middle" fill="#3a5060" fontSize="4.5" fontFamily="monospace">RHS</text>

            {/* Main Air Tank 1 — LHS near rail (rendered on top = in front) */}
            <rect x={mainAirX} y={compY} width={28} height={24} fill="#283848" rx="12" stroke="#384e60" strokeWidth="0.9" />
            <text x={mainAirX + 14} y={compY + 9}  textAnchor="middle" fill="#7090aa" fontSize="5"   fontFamily="monospace" fontWeight="bold">AIR 1</text>
            <text x={mainAirX + 14} y={compY + 18} textAnchor="middle" fill="#506880" fontSize="4.5" fontFamily="monospace">LHS</text>

            {/* ── FUEL TANKS (left / near side) ── */}
            <rect x={fuelStartX} y={compY + 1} width={fuelEndX - fuelStartX} height={fuelH} fill="#283848" rx="5" />
            <rect x={fuelStartX + 1} y={compY + 2} width={fuelEndX - fuelStartX - 2} height={fuelH - 2} fill="none" stroke="#3a4e60" strokeWidth="0.7" rx="4" opacity="0.8" />
            <text x={fuelMidX} y={compY + fuelH / 2 - 5} textAnchor="middle" fill="#608098" fontSize="7.5" fontFamily="monospace" fontWeight="bold">DIESEL</text>
            <text x={fuelMidX} y={compY + fuelH / 2 + 5} textAnchor="middle" fill="#486880" fontSize="7.5" fontFamily="monospace">400L</text>
            <text x={fuelMidX} y={compY + fuelH / 2 + 15} textAnchor="middle" fill="#3a5068" fontSize="5"   fontFamily="monospace">LHS</text>

            {/* ── 5TH WHEEL (tractor only) ── */}
            {is5thWheel && (
                <g>
                    <polygon points={`${lastAxle-44},${railTopY-2} ${lastAxle+44},${railTopY-2} ${lastAxle+28},${railTopY-16} ${lastAxle-28},${railTopY-16}`} fill="#1e2c40" stroke="#4a6080" strokeWidth="1" />
                    <circle cx={lastAxle} cy={railTopY - 10} r={18} fill="none" stroke="#4a6080" strokeWidth="1.2" />
                    <text x={lastAxle} y={railTopY - 7} textAnchor="middle" fill="#6a8098" fontSize="5" fontFamily="monospace">5TH WHL</text>
                </g>
            )}

            {/* ── EXHAUST STACK ── */}
            <rect x={exhX - 4} y={cabTopY - 50} width={8} height={railTopY - cabTopY + 58} fill="#2a3848" rx="3" />
            <rect x={exhX - 7} y={cabTopY - 50} width={14} height={30} fill="#1e2a38" rx="3" opacity="0.6" />
            <ellipse cx={exhX} cy={cabTopY - 50} rx={5.5} ry={3.2} fill="#384858" />
            <circle cx={exhX - 1} cy={cabTopY - 60} r={4.5} fill="#182030" opacity="0.28" />
            <circle cx={exhX + 3} cy={cabTopY - 68} r={3.5} fill="#182030" opacity="0.16" />

            {/* ── CAB BODY (white) ── */}
            {/* Drop shadow */}
            <rect x={cabFX + 3} y={cabTopY + 3} width={cabW - 3} height={wheelCY - cabTopY + 2} fill="black" opacity="0.1" rx="5" />
            {/* Main side panel */}
            <rect x={cabFX + 3} y={cabTopY}     width={cabW - 3} height={wheelCY - cabTopY + 2} fill={`url(#hcab${sid})`} rx="4" />

            {/* Front-face edge (3-D depth cue — visible as narrow strip from side) */}
            <rect x={cabFX - 2} y={cabTopY + 5} width={11} height={wheelCY - cabTopY - 2} fill="#c8d0d8" rx="2" />
            <rect x={cabFX - 2} y={cabTopY + 5} width={5}  height={wheelCY - cabTopY - 2} fill="#dce4ec" rx="2" opacity="0.55" />

            {/* ── POWERSTAR VISOR STRIP (top of cab — the most distinctive feature) ── */}
            <rect x={cabFX + 3} y={cabTopY}     width={cabW - 3} height={22} rx="4" fill="#1a1a1a" />
            <rect x={cabFX + 3} y={cabTopY + 18} width={cabW - 3} height={6}        fill="#222222" />
            <text
                x={cabFX + 14 + (cabW - 26) * 0.25}
                y={cabTopY + 15}
                fill="#dd1818"
                fontSize="10"
                fontFamily="Arial Black, Arial, sans-serif"
                fontWeight="900"
                letterSpacing="1.5"
            >POWERSTAR</text>

            {/* Windshield — angled polygon visible from side (slight backward rake) */}
            <polygon
                points={`${cabFX+4},${cabTopY+24} ${cabFX+4},${cabTopY+94} ${cabFX+40},${cabTopY+94} ${cabFX+32},${cabTopY+24}`}
                fill="#9ec8e8" opacity="0.65"
            />
            <polygon
                points={`${cabFX+2},${cabTopY+23} ${cabFX+2},${cabTopY+96} ${cabFX+42},${cabTopY+96} ${cabFX+34},${cabTopY+23}`}
                fill="none" stroke="#d0d0d0" strokeWidth="1.8"
            />
            <line x1={cabFX+10} y1={cabTopY+28} x2={cabFX+18} y2={cabTopY+88} stroke="white" strokeWidth="2" opacity="0.1" />

            {/* Side window */}
            <rect x={cabFX + 52} y={cabTopY + 26} width={cabW - 75} height={58} fill="#90b8d8" opacity="0.48" rx="3" />
            <rect x={cabFX + 50} y={cabTopY + 24} width={cabW - 71} height={62} fill="none" stroke="#cccccc" strokeWidth="1.5" rx="4" />
            <line x1={cabFX+58} y1={cabTopY+28} x2={cabFX+60} y2={cabTopY+82} stroke="white" strokeWidth="2.5" opacity="0.1" />

            {/* Sleeper section (VX 2642S only) */}
            {isSleeper && (
                <>
                    <rect x={cabFX + cabW - 58} y={cabTopY - 18} width={58} height={wheelCY - cabTopY + 20} fill="#e6e6e6" rx="3" />
                    <rect x={cabFX + cabW - 52} y={cabTopY - 14} width={44} height={44} fill="#88b0cc" opacity="0.42" rx="3" />
                    <line x1={cabFX + cabW - 58} y1={cabTopY - 18} x2={cabFX + cabW - 58} y2={wheelCY} stroke="#d0d0d0" strokeWidth="1.5" />
                </>
            )}

            {/* ── COOLANT EXPANSION TANK — exterior rear wall of cab, below rear window ── */}
            {/* Mounted on outside of cab's rear face, just below the glass level */}
            <rect x={cabRX + 2} y={cabTopY + 56} width={18} height={26} fill="#1a3028" rx="3" stroke="#2a5840" strokeWidth="0.8" />
            <rect x={cabRX + 4} y={cabTopY + 58} width={14} height={22} fill="none" stroke="#3a7050" strokeWidth="0.6" rx="2" opacity="0.7" />
            <text x={cabRX + 11} y={cabTopY + 67} textAnchor="middle" fill="#3a9060" fontSize="5"   fontFamily="monospace" fontWeight="bold">CLT</text>
            <text x={cabRX + 11} y={cabTopY + 77} textAnchor="middle" fill="#2a6040" fontSize="4.5" fontFamily="monospace">EXP</text>
            {/* Small coolant pipe stub going up toward engine */}
            <line x1={cabRX + 11} y1={cabTopY + 56} x2={cabRX + 11} y2={cabTopY + 40}
                  stroke="#2a5840" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.55" />

            {/* Door divider line */}
            <line x1={cabRX - 46} y1={cabTopY + 22} x2={cabRX - 46} y2={wheelCY - 6} stroke="#c0c0c0" strokeWidth="1" opacity="0.7" />

            {/* Door handle */}
            <rect x={cabRX - 46} y={cabTopY + 98} width={18} height={5} fill="#9aa2b0" rx="2.5" />

            {/* ══ GALILEO TELEMATICS, SPEED LIMITER & GPS — inside cab, left-hand dashboard ══ */}
            {/* Dashboard tray below the side window (left / near side — driver can reach from right) */}
            <rect x={cabFX + 52} y={cabTopY + 108} width={cabW - 78} height={28} fill="#1e1e1e" rx="3" opacity="0.8" />
            {/* Galileo unit */}
            <rect x={cabFX + 56} y={cabTopY + 112} width={28} height={16} fill="#141420" rx="2" stroke="#2a3860" strokeWidth="0.7" />
            <circle cx={cabFX + 63} cy={cabTopY + 117} r={3} fill="#18b840" opacity="0.9" />   {/* green status LED */}
            <rect x={cabFX + 68}  y={cabTopY + 113} width={14} height={6} fill="#1a1a2a" rx="1" opacity="0.8" />   {/* small screen */}
            <text x={cabFX + 56 + 14} y={cabTopY + 126} textAnchor="middle" fill="#4a6898" fontSize="4.5" fontFamily="monospace">GALILEO</text>
            {/* Speed limiter */}
            <rect x={cabFX + 88} y={cabTopY + 112} width={24} height={16} fill="#1a1414" rx="2" stroke="#3a2a2a" strokeWidth="0.7" />
            <circle cx={cabFX + 95} cy={cabTopY + 117} r={2.5} fill="#e04020" opacity="0.9" />  {/* amber/red status */}
            <text x={cabFX + 88 + 12} y={cabTopY + 126} textAnchor="middle" fill="#6a4848" fontSize="4.5" fontFamily="monospace">LIMITER</text>
            {/* GPS antenna — mounted on cab roof */}
            <rect x={cabFX + 98} y={cabTopY - 4}  width={18} height={5}  fill="#2a2a2a" rx="2" />   {/* antenna base */}
            <rect x={cabFX + 104} y={cabTopY - 14} width={6}  height={12} fill="#1e1e1e" />          {/* antenna mast */}
            <rect x={cabFX + 100} y={cabTopY - 16} width={14} height={4}  fill="#242424" rx="2" />   {/* antenna top bar */}
            {/* Wire from GPS antenna down into cab */}
            <line x1={cabFX + 107} y1={cabTopY} x2={cabFX + 107} y2={cabTopY + 112}
                  stroke="#1a1a1a" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.5" />

            {/* Horizontal belt line */}
            <rect x={cabFX + 5} y={cabTopY + 97} width={cabW - 8} height={2.5} fill="#c0c0c0" opacity="0.55" />

            {/* Lower skirt trim */}
            <rect x={cabFX + 5} y={wheelCY - 12} width={cabW - 8} height={4} fill="#b8b8b8" />

            {/* Steps below door */}
            <rect x={cabRX - 56} y={wheelCY + 4}  width={46} height={10} fill="#8090a0" rx="2" />
            <rect x={cabRX - 56} y={wheelCY + 16} width={46} height={9}  fill="#6a7888" rx="2" />

            {/* ── MIRROR ARM + MIRROR HEAD ── */}
            <line x1={cabFX + 9} y1={cabTopY + 46} x2={cabFX + 9} y2={cabTopY + 24} stroke="#7888a0" strokeWidth="4" strokeLinecap="round" />
            <line x1={cabFX + 9} y1={cabTopY + 24} x2={cabFX - 16} y2={cabTopY + 22} stroke="#7888a0" strokeWidth="4" strokeLinecap="round" />
            <rect x={cabFX - 26} y={cabTopY + 13} width={14} height={24} fill="#b8c0cc" stroke="#8898a8" strokeWidth="1" rx="3" />
            <rect x={cabFX - 24} y={cabTopY + 15} width={10} height={18} fill="#788898" opacity="0.75" rx="2" />

            {/* Front bumper bar */}
            <rect x={cabFX - 4} y={wheelCY - 28} width={12} height={10} fill="#8898b0" rx="2" />
            <rect x={cabFX - 6} y={wheelCY - 20} width={8}  height={5}  fill="#6a7890" rx="1" />

            {/* ── WHEELS ── */}
            {axles.map((ax, idx) => {
                const isRear   = axle === '8x4' ? idx >= 2 : idx >= 1;
                const isDriven =
                    axle === '4x4' || axle === '6x6' ||
                    (axle === '4x2' && idx === 1) ||
                    (axle === '6x4' && idx > 0)   ||
                    (axle === '8x4' && idx >= 2);
                const hubCol = isDriven ? '#c07020' : '#6a7888';
                return (
                    <g key={idx}>
                        {isRear && <circle cx={ax} cy={wheelCY} r={wheelR + 7} fill="#141414" stroke="#1e1e1e" strokeWidth="1.5" />}
                        <circle cx={ax} cy={wheelCY} r={wheelR}         fill={`url(#htyr${sid})`} />
                        <circle cx={ax} cy={wheelCY} r={wheelR}         fill="none" stroke="#242424" strokeWidth="3.5" />
                        <circle cx={ax} cy={wheelCY} r={wheelR * 0.73}  fill="#18202e" />
                        <circle cx={ax} cy={wheelCY} r={wheelR * 0.57}  fill="#1c2838" stroke="#324454" strokeWidth="0.8" />
                        {[0, 51.4, 102.9, 154.3, 205.7, 257.1, 308.6].map((ang, bi) => (
                            <circle key={bi}
                                cx={ax + Math.cos(ang * Math.PI / 180) * wheelR * 0.57}
                                cy={wheelCY + Math.sin(ang * Math.PI / 180) * wheelR * 0.57}
                                r={2.8} fill="#38485a" />
                        ))}
                        <circle cx={ax} cy={wheelCY} r={wheelR * 0.32} fill={hubCol} opacity="0.85" />
                        <circle cx={ax} cy={wheelCY} r={wheelR * 0.17} fill="#181818" />
                        <line x1={ax} y1={railTopY + railH / 2} x2={ax} y2={wheelCY - wheelR}
                              stroke="#3a4e60" strokeWidth="5" strokeLinecap="round" />
                    </g>
                );
            })}
        </svg>
    );
};

// ── Model Hero ─────────────────────────────────────────────────────────────────

const ModelHero: React.FC<{ model: TruckModel }> = ({ model }) => {
    return (
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900 animate-in fade-in duration-500">

            {/* Full truck SVG illustration */}
            <div className="relative h-[360px] lg:h-[460px]">
                <TruckHeroSVG key={model.id} model={model} />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-transparent" />

                {/* Top-left injection badge */}
                <div className="absolute top-4 left-4">
                    {model.engine.injection === 'common_rail' ? (
                        <div className="flex items-center gap-1.5 bg-amber-500/25 border border-amber-400/50 backdrop-blur-sm rounded-xl px-3 py-1.5">
                            <AlertTriangle className="h-3 w-3 text-amber-300 shrink-0" />
                            <span className="text-[9px] font-black text-amber-200 uppercase tracking-wider">ECU Fitted — Common Rail</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-green-500/25 border border-green-400/50 backdrop-blur-sm rounded-xl px-3 py-1.5">
                            <CheckCircle2 className="h-3 w-3 text-green-300 shrink-0" />
                            <span className="text-[9px] font-black text-green-200 uppercase tracking-wider">No ECU — Mechanical</span>
                        </div>
                    )}
                </div>

                {/* Top-right status badges */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                    {model.inFleet && (
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-green-500/25 border border-green-400/50 backdrop-blur-sm text-green-300 rounded-full tracking-widest">
                            ● In Fleet
                        </span>
                    )}
                    {model.is5thWheel && (
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-purple-500/25 border border-purple-400/50 backdrop-blur-sm text-purple-300 rounded-full tracking-widest">
                            5th Wheel
                        </span>
                    )}
                    <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-white/10 border border-white/20 backdrop-blur-sm text-white/70 rounded-full">
                        {model.axle.toUpperCase()}
                    </span>
                </div>

                {/* Bottom name + GVM */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1.5">POWERSTAR</p>
                            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">{model.name}</h2>
                            <p className="text-slate-400 text-[12px] mt-2 font-mono">
                                {AXLE_LABELS[model.axle]}{model.cab === 'sleeper' ? ' · Sleeper Cab' : ' · Day Cab'}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="leading-none">
                                <span className="text-5xl font-black text-white">{(model.gvm / 1000).toFixed(0)}</span>
                                <span className="text-2xl font-black text-slate-400">t</span>
                            </p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">GVM</p>
                            {model.gcm && (
                                <p className="text-[10px] font-mono text-slate-500 mt-0.5">GCM {(model.gcm / 1000).toFixed(0)}t</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-slate-700/60 divide-x divide-slate-700/40">
                {[
                    { label: 'Engine',      value: model.engine.code,                                          sub: model.engine.emissionStd },
                    { label: 'Power',       value: `${model.engine.hp} HP`,                                    sub: `${model.engine.kw} kW` },
                    { label: 'Peak Torque', value: `${model.engine.torqueNm.toLocaleString()} Nm`,             sub: `${model.engine.torqueRpmLow}–${model.engine.torqueRpmHigh} rpm` },
                    { label: 'Wheelbase',   value: `${model.wheelbaseSWB.toLocaleString()} mm`,                sub: model.wheelbaseLWB ? `LWB: ${model.wheelbaseLWB.toLocaleString()} mm` : 'SWB only' },
                ].map(stat => (
                    <div key={stat.label} className="px-5 py-4">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                        <p className="text-[14px] font-black text-white mt-1 leading-none">{stat.value}</p>
                        <p className="text-[9px] font-mono text-slate-500 mt-0.5">{stat.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── SVG Schematic ──────────────────────────────────────────────────────────────

interface SchematicProps {
    model: TruckModel;
    activeTab: SpecTabKey;
}

const TruckSchematic: React.FC<SchematicProps> = ({ model, activeTab }) => {
    const { axle, cab, is5thWheel, name } = model;
    const wheelR = 38;
    const wheelCY = 238;

    // Axle x positions
    const axlePositions: number[] = (() => {
        if (axle === '4x2' || axle === '4x4') return [95, 530];
        if (axle === '6x4' || axle === '6x6') return [95, 470, 565];
        // 8x4
        return [70, 155, 490, 580];
    })();

    // Wheel fill colours — driven axles get orange hub highlight
    const wheelFill = (idx: number): { outer: string; hub: string } => {
        if (axle === '4x4') return { outer: '#475569', hub: '#f97316' }; // all driven
        if (axle === '6x6') return { outer: '#475569', hub: '#f97316' }; // all driven
        if (axle === '4x2') {
            return idx === 0
                ? { outer: '#475569', hub: '#94a3b8' }   // front — not driven
                : { outer: '#475569', hub: '#f97316' };   // rear driven
        }
        if (axle === '6x4') {
            return idx === 0
                ? { outer: '#475569', hub: '#94a3b8' }
                : { outer: '#475569', hub: '#f97316' };
        }
        // 8x4 — first two are steer (not driven), last two driven
        return idx < 2
            ? { outer: '#475569', hub: '#94a3b8' }
            : { outer: '#475569', hub: '#f97316' };
    };

    // Cab geometry
    const cabXStart = 20;
    const cabXEnd = cab === 'sleeper' ? 280 : 220;
    const cabTopY = cab === 'sleeper' ? 68 : 80;
    const cabBottomY = 185;

    // Fuel tank midpoint
    const firstRearAxleX = axlePositions[axle === '8x4' ? 2 : 1];
    const lastAxleX = axlePositions[axlePositions.length - 1];
    const fuelTankX = Math.round((firstRearAxleX + lastAxleX) / 2) - 35;
    const fuelTankY = 148;

    // Battery box just behind cab
    const battX = cabXEnd + 8;
    const battY = 158;

    // Air tanks ahead of rear axles
    const airTankBaseX = firstRearAxleX - 95;

    // Exhaust stack
    const exhaustX = cabXEnd - 18;

    // ── Zoom config per tab ──
    // Each tab zooms into the logical location of that section on the truck.
    // Formula: translate(cx*(1-s), cy*(1-s)) scale(s) centres the zoom on (cx,cy).
    const zoomMap: Record<SpecTabKey, { cx: number; cy: number; s: number; label: string; color: string }> = {
        engine:     { cx: cabXStart + (cabXEnd - cabXStart) / 2, cy: 132,             s: 2.0, label: 'Engine Bay',         color: '#f97316' },
        electrical: { cx: battX + 25,                            cy: battY + 14,      s: 3.5, label: 'Battery Box',        color: '#fbbf24' },
        fluids:     { cx: fuelTankX + 35,                        cy: fuelTankY + 22,  s: 2.8, label: 'Fuel Tank',          color: '#3b82f6' },
        air:        { cx: airTankBaseX + 48,                     cy: 163,             s: 3.5, label: 'Air System',         color: '#06b6d4' },
        wiring:     { cx: cabXStart + 30,                        cy: 115,             s: 2.5, label: 'Firewall & Wiring',  color: '#a78bfa' },
    };
    const zc = zoomMap[activeTab];
    const groupTransform = `translate(${zc.cx * (1 - zc.s)}px, ${zc.cy * (1 - zc.s)}px) scale(${zc.s})`;

    return (
        <svg
            viewBox="0 0 700 280"
            className="w-full h-auto"
            aria-label={`${name} side-view schematic`}
        >
            <defs>
                {/* Arrowhead marker */}
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
                </marker>
                {/* Ground shadow gradient */}
                <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                {/* Cab gradient */}
                <linearGradient id="cabGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
                </linearGradient>
                {/* Chassis gradient */}
                <linearGradient id="chassisGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#334155" />
                </linearGradient>
            </defs>

            {/* ── Per-model environment background (static, behind zoom group) ── */}
            <ModelSceneBackground id={model.id} />

            {/* ── Animated zoom group — all truck content sits inside here ── */}
            <g style={{
                transform: groupTransform,
                transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>

            {/* Ground line */}
            <rect x="0" y="270" width="700" height="10" fill="url(#groundGrad)" />
            <line x1="10" y1="270" x2="690" y2="270" stroke="#334155" strokeWidth="1" />

            {/* ── Chassis Rails ── */}
            <rect x="25" y="185" width="645" height="6" fill="url(#chassisGrad)" rx="1" />
            <rect x="25" y="197" width="645" height="6" fill="url(#chassisGrad)" rx="1" />

            {/* Rear chassis bumper */}
            <rect x="658" y="182" width="12" height="28" fill="#334155" rx="2" />

            {/* ── Cab ── */}
            {cab === 'day' ? (
                <g>
                    {/* Main cab body */}
                    <rect x={cabXStart} y={cabTopY} width={cabXEnd - cabXStart} height={cabBottomY - cabTopY} fill="url(#cabGrad)" rx="4" />
                    {/* Windshield */}
                    <polygon
                        points={`${cabXStart + 4},${cabTopY + 6} ${cabXStart + 4},${cabTopY + 65} ${cabXStart + 35},${cabTopY + 65} ${cabXStart + 28},${cabTopY + 6}`}
                        fill="#bfdbfe"
                        opacity="0.7"
                    />
                    {/* Side window */}
                    <rect x={cabXStart + 48} y={cabTopY + 10} width={cabXEnd - cabXStart - 62} height={50} fill="#bfdbfe" opacity="0.5" rx="3" />
                    {/* Door handle */}
                    <rect x={cabXEnd - 25} y={cabTopY + 75} width={14} height={4} fill="#93c5fd" rx="2" />
                    {/* Cab step */}
                    <rect x={cabXEnd - 15} y={cabBottomY} width={20} height={10} fill="#1e3a8a" rx="1" />
                </g>
            ) : (
                <g>
                    {/* Main cab body (day section) */}
                    <rect x={cabXStart} y={80} width={220 - cabXStart} height={cabBottomY - 80} fill="url(#cabGrad)" rx="4" />
                    {/* Sleeper section — raised roof */}
                    <rect x={220} y={cabTopY} width={60} height={cabBottomY - cabTopY} fill="#1d4ed8" rx="3" />
                    {/* Raised roof filler */}
                    <polygon points={`${210},80 ${220},80 ${220},${cabTopY} ${210},${cabTopY + 12}`} fill="#1e40af" />
                    {/* Windshield */}
                    <polygon
                        points={`${cabXStart + 4},86 ${cabXStart + 4},151 ${cabXStart + 35},151 ${cabXStart + 28},86`}
                        fill="#bfdbfe"
                        opacity="0.7"
                    />
                    {/* Day cab side window */}
                    <rect x={cabXStart + 48} y={90} width={145} height={50} fill="#bfdbfe" opacity="0.5" rx="3" />
                    {/* Sleeper window */}
                    <rect x={226} y={cabTopY + 10} width={44} height={35} fill="#bfdbfe" opacity="0.4" rx="3" />
                    {/* Door handle */}
                    <rect x={195} y={155} width={14} height={4} fill="#93c5fd" rx="2" />
                    {/* Cab step */}
                    <rect x={cabXEnd - 15} y={cabBottomY} width={20} height={10} fill="#1e3a8a" rx="1" />
                </g>
            )}

            {/* ── Exhaust Stack ── */}
            <rect x={exhaustX} y={cabTopY - 60} width={10} height={62} fill="#1e293b" rx="2" />
            <ellipse cx={exhaustX + 5} cy={cabTopY - 60} rx={6} ry={4} fill="#334155" />
            {/* Exhaust smoke dots */}
            <circle cx={exhaustX + 5} cy={cabTopY - 66} r={3} fill="#475569" opacity="0.4" />
            <circle cx={exhaustX + 8} cy={cabTopY - 72} r={2} fill="#475569" opacity="0.25" />

            {/* ── Fuel Tank ── */}
            <rect x={fuelTankX} y={fuelTankY} width={70} height={45} fill="#1d4ed8" opacity="0.8" rx="4" />
            <rect x={fuelTankX + 2} y={fuelTankY + 2} width={66} height={41} fill="none" stroke="#3b82f6" strokeWidth="1" rx="3" opacity="0.6" />
            <text x={fuelTankX + 35} y={fuelTankY + 16} textAnchor="middle" fill="#93c5fd" fontSize="7" fontFamily="monospace" fontWeight="bold">DIESEL</text>
            <text x={fuelTankX + 35} y={fuelTankY + 28} textAnchor="middle" fill="#bfdbfe" fontSize="8" fontFamily="monospace" fontWeight="bold">400L</text>

            {/* ── Battery Box ── */}
            <rect x={battX} y={battY} width={50} height={28} fill="#92400e" opacity="0.9" rx="3" />
            <rect x={battX + 2} y={battY + 2} width={46} height={24} fill="none" stroke="#f59e0b" strokeWidth="1" rx="2" opacity="0.7" />
            <text x={battX + 25} y={battY + 11} textAnchor="middle" fill="#fde68a" fontSize="6" fontFamily="monospace" fontWeight="bold">24V</text>
            <text x={battX + 25} y={battY + 21} textAnchor="middle" fill="#fcd34d" fontSize="5.5" fontFamily="monospace">BATT×2</text>

            {/* ── Air Tanks (3 cylinders) ── */}
            {[0, 1, 2].map(i => (
                <g key={i}>
                    <rect
                        x={airTankBaseX + i * 36}
                        y={155}
                        width={30}
                        height={20}
                        fill="#334155"
                        rx="10"
                        stroke="#475569"
                        strokeWidth="1"
                    />
                    <text
                        x={airTankBaseX + i * 36 + 15}
                        y={168}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="5.5"
                        fontFamily="monospace"
                    >
                        {i === 0 ? 'WET' : i === 1 ? 'PRI' : 'SEC'}
                    </text>
                </g>
            ))}

            {/* ── 5th Wheel (tractor only) ── */}
            {is5thWheel && (
                <g>
                    <polygon
                        points={`${lastAxleX - 30},185 ${lastAxleX + 30},185 ${lastAxleX + 20},175 ${lastAxleX - 20},175`}
                        fill="#374151"
                        stroke="#6b7280"
                        strokeWidth="1"
                    />
                    <text x={lastAxleX} y={183} textAnchor="middle" fill="#9ca3af" fontSize="6" fontFamily="monospace">5TH WHL</text>
                </g>
            )}

            {/* ── Wheels ── */}
            {axlePositions.map((ax, idx) => {
                const { outer, hub } = wheelFill(idx);
                return (
                    <g key={idx}>
                        {/* Tyre */}
                        <circle cx={ax} cy={wheelCY} r={wheelR} fill={outer} />
                        {/* Rim */}
                        <circle cx={ax} cy={wheelCY} r={wheelR * 0.72} fill="#1e293b" />
                        {/* Hub */}
                        <circle cx={ax} cy={wheelCY} r={wheelR * 0.38} fill={hub} opacity="0.9" />
                        {/* Hub bolts */}
                        {[0, 60, 120, 180, 240, 300].map(angle => (
                            <circle
                                key={angle}
                                cx={ax + Math.cos((angle * Math.PI) / 180) * wheelR * 0.55}
                                cy={wheelCY + Math.sin((angle * Math.PI) / 180) * wheelR * 0.55}
                                r={2.5}
                                fill="#475569"
                            />
                        ))}
                        {/* Dual rear wheels for multi-axle rear positions */}
                        {((axle === '6x4' || axle === '6x6') && idx > 0) ||
                            (axle === '8x4' && idx >= 2) ? (
                            <circle cx={ax} cy={wheelCY} r={wheelR + 6} fill="none" stroke={outer} strokeWidth="5" opacity="0.5" />
                        ) : null}
                    </g>
                );
            })}

            {/* ── Axle Lines ── */}
            {axlePositions.map((ax, idx) => (
                <line key={idx} x1={ax} y1={185} x2={ax} y2={197} stroke="#64748b" strokeWidth="3" />
            ))}

            {/* ── Model Name Watermark ── */}
            <text
                x={cabXEnd + (670 - cabXEnd) / 2}
                y={145}
                textAnchor="middle"
                fill="#1e40af"
                fontSize="28"
                fontFamily="monospace"
                fontWeight="black"
                opacity="0.12"
                letterSpacing="4"
            >
                {name}
            </text>

            {/* ── Callout Lines & Labels ── */}

            {/* Engine callout */}
            <line
                x1={cabXStart + (cabXEnd - cabXStart) / 2}
                y1={cabTopY + 20}
                x2={cabXStart + (cabXEnd - cabXStart) / 2 - 30}
                y2={cabTopY - 18}
                stroke="#64748b"
                strokeWidth="0.8"
                markerEnd="url(#arrow)"
            />
            <rect x={cabXStart + 2} y={cabTopY - 34} width={52} height={16} fill="#0f172a" stroke="#334155" strokeWidth="1" rx="3" />
            <text x={cabXStart + 28} y={cabTopY - 23} textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" fontWeight="bold">ENGINE</text>

            {/* Battery callout */}
            <line x1={battX + 25} y1={battY} x2={battX + 25} y2={battY - 22} stroke="#64748b" strokeWidth="0.8" markerEnd="url(#arrow)" />
            <rect x={battX} y={battY - 36} width={52} height={16} fill="#0f172a" stroke="#334155" strokeWidth="1" rx="3" />
            <text x={battX + 26} y={battY - 25} textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">BATTERY</text>

            {/* Fuel callout */}
            <line x1={fuelTankX + 35} y1={fuelTankY + 45} x2={fuelTankX + 35} y2={fuelTankY + 60} stroke="#64748b" strokeWidth="0.8" markerEnd="url(#arrow)" />
            <rect x={fuelTankX + 2} y={fuelTankY + 60} width={68} height={16} fill="#0f172a" stroke="#334155" strokeWidth="1" rx="3" />
            <text x={fuelTankX + 36} y={fuelTankY + 71} textAnchor="middle" fill="#60a5fa" fontSize="7" fontFamily="monospace" fontWeight="bold">FUEL TANK</text>

            {/* Air system callout */}
            <line
                x1={airTankBaseX + 48}
                y1={155}
                x2={airTankBaseX + 48}
                y2={135}
                stroke="#64748b"
                strokeWidth="0.8"
                markerEnd="url(#arrow)"
            />
            <rect x={airTankBaseX + 14} y={118} width={68} height={16} fill="#0f172a" stroke="#334155" strokeWidth="1" rx="3" />
            <text x={airTankBaseX + 48} y={129} textAnchor="middle" fill="#a5f3fc" fontSize="7" fontFamily="monospace" fontWeight="bold">AIR TANKS</text>

            {/* Axle config callout — last axle */}
            {(() => {
                const ax = axlePositions[axlePositions.length - 1];
                return (
                    <>
                        <line x1={ax} y1={wheelCY + wheelR} x2={ax + 20} y2={wheelCY + wheelR + 20} stroke="#64748b" strokeWidth="0.8" markerEnd="url(#arrow)" />
                        <rect x={ax + 10} y={wheelCY + wheelR + 18} width={60} height={16} fill="#0f172a" stroke="#334155" strokeWidth="1" rx="3" />
                        <text x={ax + 40} y={wheelCY + wheelR + 29} textAnchor="middle" fill="#f97316" fontSize="7" fontFamily="monospace" fontWeight="bold">{axle.toUpperCase()}</text>
                    </>
                );
            })()}

            {/* 5th wheel callout */}
            {is5thWheel && (
                <>
                    <line x1={lastAxleX} y1={175} x2={lastAxleX + 25} y2={155} stroke="#64748b" strokeWidth="0.8" markerEnd="url(#arrow)" />
                    <rect x={lastAxleX + 18} y={138} width={68} height={16} fill="#0f172a" stroke="#334155" strokeWidth="1" rx="3" />
                    <text x={lastAxleX + 52} y={149} textAnchor="middle" fill="#c084fc" fontSize="7" fontFamily="monospace" fontWeight="bold">5TH WHEEL</text>
                </>
            )}

            {/* ── Highlight / Glow Overlays ── */}

            {/* Engine — glowing ring around cab */}
            {activeTab === 'engine' && (
                <rect
                    x={cabXStart - 5} y={cabTopY - 5}
                    width={cabXEnd - cabXStart + 10} height={cabBottomY - cabTopY + 10}
                    fill="none" stroke="#f97316" strokeWidth="1.8" rx="7" opacity="0.9"
                    style={{ filter: 'drop-shadow(0 0 6px #f97316)' }}
                />
            )}

            {/* Electrical — glowing ring around battery box */}
            {activeTab === 'electrical' && (
                <rect
                    x={battX - 5} y={battY - 5} width={60} height={38}
                    fill="none" stroke="#fbbf24" strokeWidth="1.8" rx="6" opacity="0.9"
                    style={{ filter: 'drop-shadow(0 0 6px #fbbf24)' }}
                />
            )}

            {/* Fluids — glowing ring around fuel tank */}
            {activeTab === 'fluids' && (
                <rect
                    x={fuelTankX - 5} y={fuelTankY - 5} width={80} height={55}
                    fill="none" stroke="#3b82f6" strokeWidth="1.8" rx="7" opacity="0.9"
                    style={{ filter: 'drop-shadow(0 0 6px #3b82f6)' }}
                />
            )}

            {/* Air — glowing ring around all three air tanks */}
            {activeTab === 'air' && (
                <rect
                    x={airTankBaseX - 5} y={150} width={118} height={30}
                    fill="none" stroke="#06b6d4" strokeWidth="1.8" rx="13" opacity="0.9"
                    style={{ filter: 'drop-shadow(0 0 6px #06b6d4)' }}
                />
            )}

            {/* Wiring — glowing ring on windshield / firewall face of cab */}
            {activeTab === 'wiring' && (
                <rect
                    x={cabXStart - 5} y={cabTopY - 5}
                    width={55} height={cabBottomY - cabTopY + 10}
                    fill="none" stroke="#a78bfa" strokeWidth="1.8" rx="5" opacity="0.9"
                    style={{ filter: 'drop-shadow(0 0 6px #a78bfa)' }}
                />
            )}

            </g>{/* end zoom group */}
        </svg>
    );
};

// ── Spec Tab Components ────────────────────────────────────────────────────────

const KV: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[140px] shrink-0 pt-0.5">{label}</span>
        <span className={cn("text-[12px] font-semibold leading-relaxed", highlight ? "text-accent" : "text-slate-700")}>{value}</span>
    </div>
);

const SPEC_TABS: { key: SpecTabKey; label: string; icon: React.ElementType }[] = [
    { key: 'engine',     label: 'Engine',       icon: Cpu      },
    { key: 'electrical', label: 'Electrical',   icon: Zap      },
    { key: 'fluids',     label: 'Fluids',       icon: Droplets },
    { key: 'air',        label: 'Air System',   icon: Wind     },
    { key: 'wiring',     label: 'Wiring Notes', icon: Wrench   },
];

const EngineTab: React.FC<{ model: TruckModel }> = ({ model }) => {
    const e = model.engine;
    return (
        <div className="space-y-4">
            {e.injection === 'common_rail' ? (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest">ECU Fitted — Common Rail Injection</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                            This model has an electronic control unit managing fuel delivery. Do not splice into the engine harness.
                            Use relay isolation for any ancillary 24V taps near the engine bay.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black text-green-800 uppercase tracking-widest">No ECU — Mechanical Injection</p>
                        <p className="text-[11px] text-green-700 mt-0.5">
                            Fully mechanical injection pump. No engine management ECU to disturb.
                            Standard relay-based wiring practices apply throughout.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-accent" /> Engine Specifications
                </p>
                <KV label="Engine Code" value={e.code} highlight />
                <KV label="Displacement" value={`${e.displacement}L — 6-cylinder inline`} />
                <KV label="Configuration" value="Turbocharged, intercooled, direct injection, 4-stroke diesel" />
                <KV label="Compression Ratio" value="17:1" />
                <KV label="Power Output" value={`${e.hp} HP (${e.kw} kW) @ ${e.rpmPower.toLocaleString()} rpm`} />
                <KV label="Peak Torque" value={`${e.torqueNm.toLocaleString()} Nm @ ${e.torqueRpmLow.toLocaleString()}–${e.torqueRpmHigh.toLocaleString()} rpm`} />
                <KV label="Emission Standard" value={e.emissionStd} />
                <KV label="Injection System" value={e.injection === 'common_rail' ? 'Common Rail (electronically controlled)' : 'Mechanical injection pump (no ECU)'} />
            </div>

            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Gauge className="h-3.5 w-3.5 text-accent" /> Performance Summary
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Power', value: `${e.hp} HP`, sub: `${e.kw} kW` },
                        { label: 'Torque', value: `${e.torqueNm.toLocaleString()}`, sub: 'Nm peak' },
                        { label: 'Displacement', value: `${e.displacement}L`, sub: '6-cyl inline' },
                        { label: 'Emission', value: e.emissionStd, sub: e.injection === 'common_rail' ? 'Common Rail' : 'Mechanical' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-lg font-black text-slate-800">{stat.value}</p>
                            <p className="text-[9px] text-slate-500">{stat.sub}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ElectricalTab: React.FC<{ model: TruckModel }> = ({ model }) => (
    <div className="space-y-4">
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-accent" /> Electrical System
            </p>
            <KV label="System Voltage" value={COMMON_ELECTRICAL.voltage} highlight />
            <KV label="Battery Configuration" value={COMMON_ELECTRICAL.batteries} />
            <KV label="Battery Location" value={COMMON_ELECTRICAL.batteryLocation} />
            <KV label="Battery Isolator" value={COMMON_ELECTRICAL.isolator} />
            <KV label="Alternator" value={COMMON_ELECTRICAL.alternator} />
            <KV label="Starter Motor" value={COMMON_ELECTRICAL.starter} />
        </div>

        {/* Telematics & Fleet Electronics */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-accent" /> Telematics &amp; Fleet Electronics
            </p>
            <KV label="Unit" value={COMMON_ELECTRICAL.telematics.unit} highlight />
            <KV label="Location" value={COMMON_ELECTRICAL.telematics.unitLocation} />
            <KV label="Speed Limiter" value={COMMON_ELECTRICAL.telematics.limiter} />
            <KV label="GPS Antenna" value={COMMON_ELECTRICAL.telematics.gpsAntenna} />
            <div className="mt-3 space-y-2">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700">
                        <span className="font-black">GPS antenna routing:</span> {COMMON_ELECTRICAL.telematics.gpsNote}
                    </p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-700">
                        <span className="font-black">Speed limiter:</span> {COMMON_ELECTRICAL.telematics.limiterNote}
                    </p>
                </div>
            </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Wiring Architecture</p>
            <p className="text-[12px] text-slate-600 leading-relaxed">{COMMON_ELECTRICAL.wiring}</p>
            {model.engine.injection === 'mechanical' && (
                <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-green-700">
                        <span className="font-black">No CAN bus</span> — mechanical injection models have no engine management network.
                        Standard 24V relay-based switching is safe on all circuits.
                    </p>
                </div>
            )}
            {model.engine.injection === 'common_rail' && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700">
                        <span className="font-black">ECU present</span> — engine harness carries ECU signal lines.
                        Use isolated relays for any switched loads near the engine bay. Never splice into engine harness wiring.
                    </p>
                </div>
            )}
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 space-y-1.5">
            <p className="font-black text-slate-700 text-[12px] mb-2">General Notes — All Models</p>
            <p>• Earth all body additions to chassis frame rail (not cab bodywork or painted surfaces).</p>
            <p>• Always open battery isolation switch (LHS chassis rail, orange ring) before any installation or maintenance work.</p>
            <p>• 24V charging circuit: do not parallel 12V accessories without a proper voltage converter.</p>
            <p>• Fuse all additional circuits at the load — minimum 15A for solenoids, 5A for signal circuits.</p>
            <p>• Galileo/telematics power tap: use a dedicated switched 24V relay — do not piggyback off ignition fuse.</p>
        </div>
    </div>
);

const FluidsTab: React.FC<{ model: TruckModel }> = ({ model }) => {
    const isWP12 = model.engine.code.startsWith('WP12');
    return (
        <div className="space-y-4">
            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Droplets className="h-3.5 w-3.5 text-accent" /> Engine Oil
                </p>
                <KV label="Specification" value={COMMON_FLUIDS.engineOil.spec} highlight />
                <KV label="Capacity" value={isWP12 ? COMMON_FLUIDS.engineOil.capacityWP12 : COMMON_FLUIDS.engineOil.capacityWP10} />
                <KV label="Change Interval" value={COMMON_FLUIDS.engineOil.interval} />
            </div>
            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Gearbox Oil</p>
                <KV label="Unit" value={COMMON_FLUIDS.gearbox.unit} />
                <KV label="Specification" value={COMMON_FLUIDS.gearbox.spec} highlight />
                <KV label="Capacity" value={COMMON_FLUIDS.gearbox.capacity} />
            </div>
            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Differential Oil</p>
                <KV label="Specification" value={COMMON_FLUIDS.diffOil.spec} highlight />
                <KV label="Note" value={COMMON_FLUIDS.diffOil.note} />
                {(model.axle === '6x4' || model.axle === '6x6' || model.axle === '8x4') && (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-[11px] text-blue-700">
                        <span className="font-black">{model.axle.toUpperCase()} note:</span> Multiple diff housings — check and fill each axle diff independently.
                    </div>
                )}
            </div>
            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Coolant</p>
                <KV label="Specification" value={COMMON_FLUIDS.coolant.spec} highlight />
                <KV label="System Capacity" value={isWP12 ? 'Approx 45–50L total system (WP12)' : COMMON_FLUIDS.coolant.capacityWP10} />
                <KV label="Pressure Cap" value={COMMON_FLUIDS.coolant.pressureCap} />
                <KV label="Overflow / Level" value={COMMON_FLUIDS.coolant.overflow} />
                <KV label="Expansion Tank Location" value={COMMON_FLUIDS.coolant.expansionTankLocation} />
                <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700">
                        <span className="font-black">Check coolant level at the expansion tank</span> — accessible from ground on exterior rear cab wall, below rear window. Do not open the header tank cap when the engine is hot or under pressure.
                    </p>
                </div>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Fuel</p>
                <KV label="Tank Capacity" value={COMMON_FLUIDS.fuel.capacity} highlight />
                <KV label="Tank Material" value={COMMON_FLUIDS.fuel.material} />
                <KV label="Fuel Type" value={COMMON_FLUIDS.fuel.spec} />
            </div>
        </div>
    );
};

const AIR_TANK_COLORS = [
    { bg: 'bg-sky-50', border: 'border-sky-200', numBg: 'bg-sky-100', numBorder: 'border-sky-300', numText: 'text-sky-700', badge: 'Under Cab' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', numBg: 'bg-emerald-100', numBorder: 'border-emerald-300', numText: 'text-emerald-700', badge: 'LHS Rail' },
    { bg: 'bg-violet-50', border: 'border-violet-200', numBg: 'bg-violet-100', numBorder: 'border-violet-300', numText: 'text-violet-700', badge: 'RHS Rail' },
];

const AirTab: React.FC = () => (
    <div className="space-y-4">
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Wind className="h-3.5 w-3.5 text-accent" /> System Overview
            </p>
            <p className="text-[12px] text-slate-700 font-semibold mb-3">{COMMON_AIR.system}</p>
            <KV label="Charge Range" value={COMMON_AIR.chargeRange} highlight />
            <KV label="Governor Cut-out" value={COMMON_AIR.governorCutout} />
            <KV label="Governor Re-engage" value={COMMON_AIR.governorReengage} />
            <KV label="Warning Threshold" value={COMMON_AIR.warningThreshold} />
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Three-Tank Layout</p>
            <div className="space-y-3">
                {COMMON_AIR.tanks.map((tank, i) => {
                    const c = AIR_TANK_COLORS[i];
                    return (
                        <div key={i} className={cn('flex gap-3 rounded-xl p-3 border', c.bg, c.border)}>
                            <div className="flex flex-col items-center gap-1.5 shrink-0">
                                <div className={cn('h-8 w-8 rounded-lg border flex items-center justify-center', c.numBg, c.numBorder)}>
                                    <span className={cn('text-[10px] font-black', c.numText)}>{i + 1}</span>
                                </div>
                                <span className={cn('text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border', c.numBg, c.numBorder, c.numText)}>
                                    {c.badge}
                                </span>
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-slate-700">{tank.name}</p>
                                <p className="text-[10px] font-semibold text-slate-400 mt-0.5 mb-1">{tank.position}</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{tank.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
                <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest">Daily Drain Reminder</p>
                <p className="text-[11px] text-amber-700 mt-1">{COMMON_AIR.drainReminder}</p>
            </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
            {[
                { label: 'Max Pressure', value: '800 kPa', color: 'text-red-600' },
                { label: 'Governor Re-engage', value: '650 kPa', color: 'text-amber-600' },
                { label: 'Warning Buzzer', value: '550 kPa', color: 'text-orange-600' },
            ].map(p => (
                <div key={p.label} className="bg-white border border-border rounded-xl p-3 text-center shadow-sm">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.label}</p>
                    <p className={cn("text-xl font-black", p.color)}>{p.value}</p>
                </div>
            ))}
        </div>
    </div>
);

const WiringTab: React.FC<{ model: TruckModel }> = ({ model }) => (
    <div className="space-y-4">
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-accent" /> {model.name} — Model-Specific Notes
            </p>
            <div className="space-y-2.5">
                {model.wiringNotes.map((note, i) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
                        <span className="text-[10px] font-black text-accent mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                        <p className="text-[12px] text-slate-600 leading-relaxed">{note}</p>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">General Notes — All Models</p>
            <div className="space-y-2">
                {[
                    '24V ONLY — never connect 12V-rated devices directly to the 24V system without a converter.',
                    'Earth all body additions to chassis frame rail at a bare metal contact point.',
                    'Battery isolator switch must be accessible and labelled — safety requirement on all installations.',
                    'PTO trigger: 24V solenoid signal from cab switch via chassis harness to gearbox PTO outlet — fuse at 15A.',
                    'Do not share earth returns between telematics and body electrical circuits.',
                    'After any wiring work: verify charging voltage at batteries (27.6–28V) and check for fault codes on ECU models.',
                ].map((note, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600 py-1.5 border-b border-slate-50 last:border-0">
                        <span className="text-accent font-black shrink-0 mt-0.5">•</span>
                        <span className="leading-relaxed">{note}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

const TruckModels: React.FC = () => {
    const [selectedModelId, setSelectedModelId] = useState<string>(MODELS[0].id);
    const [specTab,         setSpecTab]         = useState<SpecTabKey>('engine');
    const [overviewMode,    setOverviewMode]    = useState(true);

    const model = MODELS.find(m => m.id === selectedModelId) ?? MODELS[0];

    const selectModel = (id: string) => {
        setSelectedModelId(id);
        setSpecTab('engine');
        setOverviewMode(true);
    };

    const selectTab = (tab: SpecTabKey) => {
        setSpecTab(tab);
        setOverviewMode(false);
    };

    const axleLabel = (axle: AxleConfig): string => {
        const map: Record<AxleConfig, string> = {
            '4x2': '4×2', '4x4': '4×4', '6x4': '6×4', '6x6': '6×6', '8x4': '8×4',
        };
        return map[axle];
    };

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-accent/10 border border-accent/20 rounded-xl">
                            <Truck className="h-5 w-5 text-accent" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Truck Models</h1>
                    </div>
                    <p className="text-slate-500 text-sm">
                        Powerstar VX &amp; V3 range — {MODELS.length} models. Full technical specifications, visual schematics, and wiring notes.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                        <Factory className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                            {MODELS.filter(m => m.inFleet).length} Active in Fleet
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                        <Truck className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                            {MODELS.length} Models Total
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Model Selector Tabs ── */}
            <div className="overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
                <div className="flex gap-2 min-w-max">
                    {MODELS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => selectModel(m.id)}
                            className={cn(
                                "flex flex-col items-start gap-1.5 px-4 py-3 rounded-xl border transition-all duration-150 min-w-[108px] text-left",
                                selectedModelId === m.id
                                    ? "bg-accent/5 border-accent/30 ring-1 ring-accent/20"
                                    : "bg-white border-border hover:bg-slate-50 hover:border-slate-300"
                            )}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className={cn(
                                    "text-[13px] font-black tracking-tight",
                                    selectedModelId === m.id ? "text-accent" : "text-slate-800"
                                )}>
                                    {m.name}
                                </span>
                                {m.inFleet && (
                                    <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" title="In Fleet" />
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={cn(
                                    "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                                    selectedModelId === m.id ? "bg-accent/10 text-accent" : "bg-slate-100 text-slate-500"
                                )}>
                                    {axleLabel(m.axle)}
                                </span>
                                {m.cab === 'sleeper' && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                                        SLP
                                    </span>
                                )}
                                {m.inFleet && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                                        Fleet
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                OVERVIEW MODE — photo hero + use cases + component launcher
            ══════════════════════════════════════════════════════════════ */}
            {overviewMode && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-5">

                    {/* Photo hero */}
                    <ModelHero model={model} />

                    {/* Use cases + key stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Typical Applications</p>
                            <div className="flex flex-wrap gap-2">
                                {model.useCases.map(use => (
                                    <span key={use}
                                        className="text-[11px] font-semibold bg-accent/5 text-accent border border-accent/15 px-3 py-1.5 rounded-full">
                                        {use}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Cpu className="h-3.5 w-3.5 text-accent" /> Engine Snapshot
                            </p>
                            <KV label="Engine" value={model.engine.code} highlight />
                            <KV label="Displacement" value={`${model.engine.displacement}L — 6-cyl inline`} />
                            <KV label="Torque" value={`${model.engine.torqueNm.toLocaleString()} Nm`} />
                            <KV label="Tyres" value={model.tyres} />
                        </div>
                    </div>

                    {/* Component launcher tiles */}
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                            Select a component — zooms the schematic to that section
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {SPEC_TABS.map(t => {
                                type TC = { bg: string; border: string; text: string; icon: string; ring: string };
                                const tabColors: Record<string, TC> = {
                                    engine:     { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  icon: 'text-orange-500',  ring: 'hover:ring-orange-300'  },
                                    electrical: { bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-700',  icon: 'text-yellow-500',  ring: 'hover:ring-yellow-300'  },
                                    fluids:     { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    icon: 'text-blue-500',    ring: 'hover:ring-blue-300'    },
                                    air:        { bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-700',    icon: 'text-cyan-500',    ring: 'hover:ring-cyan-300'    },
                                    wiring:     { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  icon: 'text-violet-500',  ring: 'hover:ring-violet-300'  },
                                };
                                const c = tabColors[t.key];
                                const Icon = t.icon;
                                return (
                                    <button key={t.key} onClick={() => selectTab(t.key)}
                                        className={cn(
                                            'flex flex-col items-center gap-3 p-5 rounded-xl border transition-all text-center hover:shadow-md hover:ring-2',
                                            c.bg, c.border, c.ring
                                        )}>
                                        <div className={cn('h-10 w-10 rounded-xl border flex items-center justify-center', c.bg, c.border)}>
                                            <Icon className={cn('h-5 w-5', c.icon)} />
                                        </div>
                                        <span className={cn('text-[11px] font-black uppercase tracking-widest', c.text)}>{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                DETAIL MODE — zoomed schematic + spec content
            ══════════════════════════════════════════════════════════════ */}
            {!overviewMode && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-5">

                    {/* Back button + spec tab row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={() => setOverviewMode(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-xl text-[11px] font-black text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Overview
                        </button>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                            {SPEC_TABS.map(t => {
                                const Icon = t.icon;
                                return (
                                    <button key={t.key} onClick={() => selectTab(t.key)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                            specTab === t.key
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-400 hover:text-slate-700"
                                        )}>
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Two-column: SVG schematic (zoomed) + spec content */}
                    <div className="grid grid-cols-1 xl:grid-cols-[55%_45%] gap-6">

                        {/* Left — SVG schematic (zoomed to active tab) */}
                        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        {model.name} —{' '}
                                        <span className={{
                                            engine:     'text-orange-400',
                                            electrical: 'text-yellow-400',
                                            fluids:     'text-blue-400',
                                            air:        'text-cyan-400',
                                            wiring:     'text-violet-400',
                                        }[specTab]}>
                                            {{
                                                engine:     'Engine Bay',
                                                electrical: 'Battery Box',
                                                fluids:     'Fuel Tank',
                                                air:        'Air System',
                                                wiring:     'Firewall & Wiring',
                                            }[specTab]}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                        <div className="h-2 w-3 rounded-sm bg-orange-500 opacity-80" /> Driven
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                        <div className="h-2 w-3 rounded-sm bg-slate-400 opacity-60" /> Steer
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 overflow-hidden">
                                <TruckSchematic model={model} activeTab={specTab} />
                            </div>
                            <div className="px-5 py-2.5 border-t border-slate-700 flex flex-wrap gap-4 text-[9px] text-slate-500">
                                <span>COE — Cab Over Engine layout</span>
                                <span>Not to scale</span>
                                <span>24V electrical system</span>
                                {model.is5thWheel && <span className="text-purple-400 font-black">Tractor Unit — 5th Wheel</span>}
                            </div>
                        </div>

                        {/* Right — Spec tab content */}
                        <div>
                            {specTab === 'engine'     && <EngineTab model={model} />}
                            {specTab === 'electrical' && <ElectricalTab model={model} />}
                            {specTab === 'fluids'     && <FluidsTab model={model} />}
                            {specTab === 'air'        && <AirTab />}
                            {specTab === 'wiring'     && <WiringTab model={model} />}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TruckModels;
