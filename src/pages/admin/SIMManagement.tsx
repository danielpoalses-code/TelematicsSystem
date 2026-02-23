import React, { useState } from 'react';
import {
    Smartphone, Globe, ShieldCheck, Search, AlertTriangle, Plus,
    TrendingUp, ChevronDown, ChevronRight, ArrowRight, Truck,
    Warehouse, Signal, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
type SimProvider = 'vodacom' | 'bics';
type SimStatus = 'active' | 'dormant' | 'suspended' | 'high_usage' | 'unallocated';
type OrderStatus = 'draft' | 'submitted' | 'processing' | 'dispatched' | 'received';

interface SimStock {
    inStock: number;       // held by Khulu (unallocated, in warehouse)
    deployed: number;      // active in trucks across the fleet
    dormant: number;       // assigned but dormant/inactive
    suspended: number;     // suspended
    total: number;
}

interface SimCard {
    iccid: string;
    provider: SimProvider;
    assignedTruck: string | null;
    client: string | null;
    status: SimStatus;
    usage30d: string;
    lastActive: string;
    crossBorder: boolean;
    msisdn: string;
}

interface SimOrder {
    id: string;
    ref: string;
    provider: SimProvider;
    qty: number;
    simType: string;
    status: OrderStatus;
    orderDate: string;
    expectedArrival: string;
    unitCost: number;
}

// --- Real stock numbers ---
const vodacomStock: SimStock = {
    inStock: 232,
    deployed: 894,
    dormant: 41,
    suspended: 15,
    total: 1182,
};

const bicsStock: SimStock = {
    inStock: 99,
    deployed: 261,
    dormant: 14,
    suspended: 5,
    total: 379,
};

// --- Sample inventory rows (representative sample) ---
const simCards: SimCard[] = [
    { iccid: '8927030924001', provider: 'vodacom', assignedTruck: 'ST-2024-001', client: 'Teichman Logistics', status: 'active', usage30d: '1.2 GB', lastActive: '10 min ago', crossBorder: false, msisdn: '+27 82 XXX 0001' },
    { iccid: '8927030924002', provider: 'vodacom', assignedTruck: 'ST-2024-002', client: 'Teichman Logistics', status: 'active', usage30d: '0.9 GB', lastActive: '2 min ago', crossBorder: false, msisdn: '+27 82 XXX 0002' },
    { iccid: '8927030924003', provider: 'vodacom', assignedTruck: 'ST-2024-003', client: 'Molapo Fleet', status: 'high_usage', usage30d: '18.4 GB', lastActive: '1 min ago', crossBorder: false, msisdn: '+27 82 XXX 0003' },
    { iccid: '8927030924004', provider: 'vodacom', assignedTruck: null, client: null, status: 'unallocated', usage30d: '0 MB', lastActive: '—', crossBorder: false, msisdn: '+27 82 XXX 0004' },
    { iccid: '8944120000001', provider: 'bics', assignedTruck: 'ST-2024-001', client: 'Teichman Logistics', status: 'active', usage30d: '12 MB', lastActive: '10 min ago', crossBorder: true, msisdn: '+357 99 XXX 001' },
    { iccid: '8944120000002', provider: 'bics', assignedTruck: 'ST-2024-005', client: 'Sithole Haulage', status: 'active', usage30d: '284 MB', lastActive: '22 min ago', crossBorder: true, msisdn: '+357 99 XXX 002' },
    { iccid: '8944120000003', provider: 'bics', assignedTruck: 'ST-2024-007', client: 'Khumalo Transport', status: 'dormant', usage30d: '0 MB', lastActive: '4 days ago', crossBorder: false, msisdn: '+357 99 XXX 003' },
    { iccid: '8944120000004', provider: 'bics', assignedTruck: null, client: null, status: 'unallocated', usage30d: '0 MB', lastActive: '—', crossBorder: false, msisdn: '+357 99 XXX 004' },
];

const simOrders: SimOrder[] = [
    { id: 'o1', ref: 'SC-VO-2024-031', provider: 'vodacom', qty: 100, simType: 'Vodacom M2M IoT Data SIM', status: 'received', orderDate: '2024-01-15', expectedArrival: '2024-01-22', unitCost: 45 },
    { id: 'o2', ref: 'SC-BI-2024-018', provider: 'bics', qty: 50, simType: 'BICS International Roaming SIM', status: 'dispatched', orderDate: '2024-02-01', expectedArrival: '2024-02-21', unitCost: 280 },
    { id: 'o3', ref: 'SC-VO-2024-035', provider: 'vodacom', qty: 150, simType: 'Vodacom M2M IoT Data SIM', status: 'submitted', orderDate: '2024-02-18', expectedArrival: '2024-02-28', unitCost: 45 },
];

const simStatusConfig: Record<SimStatus, { label: string; color: string; dot: string }> = {
    active: { label: 'Active', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
    dormant: { label: 'Dormant', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
    suspended: { label: 'Suspended', color: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
    high_usage: { label: 'High Usage', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400 animate-pulse' },
    unallocated: { label: 'In Stock', color: 'bg-blue-50 text-blue-500', dot: 'bg-blue-400' },
};

const orderStatusConfig: Record<OrderStatus, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-500' },
    submitted: { label: 'Submitted', color: 'bg-blue-50 text-blue-600' },
    processing: { label: 'Processing', color: 'bg-indigo-50 text-indigo-600' },
    dispatched: { label: 'Dispatched', color: 'bg-amber-50 text-amber-600' },
    received: { label: 'Received', color: 'bg-emerald-50 text-emerald-600' },
};

// ── Network Scene Background ──────────────────────────────────────────────────
// Line-art illustration: satellite → cell towers → Galileo on truck
const NetworkSceneBackground: React.FC = () => {
    // Stars: [x, y, r, opacity]
    const stars: [number, number, number, number][] = [
        [60,22,1.1,.9],[180,14,.8,.7],[310,38,1.0,.8],[480,10,1.3,.9],[620,28,.9,.6],
        [760,18,1.1,.8],[870,42,1.0,.7],[1010,16,1.2,.9],[1120,35,.8,.6],[1320,24,1.0,.8],
        [100,62,.9,.7],[240,80,1.1,.6],[420,58,1.3,.9],[580,74,.8,.7],[730,50,1.0,.8],
        [860,68,.9,.7],[995,55,1.2,.8],[1140,78,.7,.6],[1280,48,1.1,.9],[1390,68,.8,.7],
        [45,105,.8,.6],[190,118,1.0,.8],[355,98,1.2,.7],[510,112,.9,.6],[685,102,1.1,.8],
        [825,90,.8,.7],[970,122,1.3,.9],[1085,108,.9,.6],[1240,95,.7,.8],[1360,115,1.0,.7],
        [140,148,.9,.5],[300,135,1.0,.7],[460,150,.8,.6],[700,140,1.1,.8],[950,145,.9,.6],
        [1070,130,1.2,.7],[1200,152,.8,.5],[1340,138,1.0,.6],
    ];

    // Tower structures: [baseX, baseY (on hill), topY, height]
    const towers = [
        { bx: 285, by: 490, ty: 330, label: 'T1' },
        { bx: 720, by: 530, ty: 340, label: 'T2' },  // main — truck connects here
        { bx: 1105, by: 478, ty: 318, label: 'T3' },
    ];

    const drawTower = (t: typeof towers[0], idx: number) => {
        const spread = 22; // half-width at base
        const topSpread = 3;
        const braces = 5;
        const xs = (n: number) => t.bx - spread + (spread - topSpread) * n / braces; // left leg x at brace n
        const xr = (n: number) => t.bx + spread - (spread - topSpread) * n / braces; // right leg x
        const yt = (n: number) => t.by - (t.by - t.ty) * n / braces;
        return (
            <g key={idx} opacity="0.7">
                {/* Left leg */}
                <line x1={t.bx - spread} y1={t.by} x2={t.bx - topSpread} y2={t.ty}
                      stroke="#2d4a6f" strokeWidth="1.2" />
                {/* Right leg */}
                <line x1={t.bx + spread} y1={t.by} x2={t.bx + topSpread} y2={t.ty}
                      stroke="#2d4a6f" strokeWidth="1.2" />
                {/* Cross braces */}
                {Array.from({ length: braces }).map((_, n) => (
                    <line key={n}
                          x1={xs(n)} y1={yt(n)} x2={xr(n)} y2={yt(n)}
                          stroke="#1e3a5f" strokeWidth="0.8" />
                ))}
                {/* Diagonal cross-bracing (alternating) */}
                {Array.from({ length: braces - 1 }).map((_, n) => (
                    n % 2 === 0
                        ? <line key={n} x1={xs(n)} y1={yt(n)} x2={xr(n + 1)} y2={yt(n + 1)} stroke="#1e3a5f" strokeWidth="0.6" />
                        : <line key={n} x1={xr(n)} y1={yt(n)} x2={xs(n + 1)} y2={yt(n + 1)} stroke="#1e3a5f" strokeWidth="0.6" />
                ))}
                {/* Mast above main structure */}
                <line x1={t.bx} y1={t.ty} x2={t.bx} y2={t.ty - 28}
                      stroke="#2d4a6f" strokeWidth="1.0" />
                {/* Antenna arms */}
                <line x1={t.bx - 12} y1={t.ty - 14} x2={t.bx + 12} y2={t.ty - 14}
                      stroke="#2d4a6f" strokeWidth="1.0" />
                <line x1={t.bx - 8}  y1={t.ty - 20} x2={t.bx + 8}  y2={t.ty - 20}
                      stroke="#2d4a6f" strokeWidth="0.8" />
                {/* Blink dot at very top */}
                <circle cx={t.bx} cy={t.ty - 30} r="2.5"
                        fill="#ef4444" opacity="0.9" className="blink-dot"
                        style={{ animationDelay: `${idx * 0.6}s` }} />
                {/* Signal rings (two expanding rings per tower) */}
                <circle cx={t.bx} cy={t.ty - 28} r="12"
                        fill="none" stroke="#3b82f6" strokeWidth="0.8"
                        className="tower-pulse"
                        style={{ animationDelay: `${idx * 0.8}s`, transformOrigin: `${t.bx}px ${t.ty - 28}px` }} />
                <circle cx={t.bx} cy={t.ty - 28} r="12"
                        fill="none" stroke="#3b82f6" strokeWidth="0.6"
                        className="tower-pulse-2"
                        style={{ animationDelay: `${idx * 0.8 + 1.2}s`, transformOrigin: `${t.bx}px ${t.ty - 28}px` }} />
            </g>
        );
    };

    return (
        <svg
            viewBox="0 0 1400 900"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 w-full h-full"
            aria-hidden
        >
            <defs>
                <style>{`
                    @keyframes signalFlow1 {
                        from { stroke-dashoffset: 500; }
                        to   { stroke-dashoffset: 0; }
                    }
                    @keyframes signalFlow2 {
                        from { stroke-dashoffset: 800; }
                        to   { stroke-dashoffset: 0; }
                    }
                    @keyframes backhaul {
                        from { stroke-dashoffset: 600; }
                        to   { stroke-dashoffset: 0; }
                    }
                    @keyframes towerPulse {
                        0%   { transform: scale(1);   opacity: 0.7; }
                        100% { transform: scale(4.2); opacity: 0; }
                    }
                    @keyframes blinkDot {
                        0%,100% { opacity: 1; }
                        50%     { opacity: 0.15; }
                    }
                    @keyframes satPulse {
                        0%,100% { transform: scale(1);   opacity: 0.5; }
                        50%     { transform: scale(3.3); opacity: 0.1; }
                    }
                    @keyframes galileoPing {
                        0%,100% { opacity: 0.9; }
                        50%     { opacity: 0.2; }
                    }
                    .signal-line-1 { stroke-dasharray: 14 28; animation: signalFlow1 3.5s linear infinite; }
                    .signal-line-2 { stroke-dasharray: 14 28; animation: signalFlow2 5.5s linear infinite; }
                    .backhaul-line { stroke-dasharray: 8 20; animation: backhaul 8s linear infinite; }
                    .tower-pulse   { animation: towerPulse 2.8s ease-out infinite; }
                    .tower-pulse-2 { animation: towerPulse 2.8s ease-out 1.4s infinite; }
                    .blink-dot     { animation: blinkDot 1.6s ease-in-out infinite; }
                    .sat-ping      { animation: satPulse 3s ease-out infinite; }
                    .galileo-ping  { animation: galileoPing 2s ease-in-out infinite; }
                `}</style>

                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#010b18" />
                    <stop offset="45%"  stopColor="#04111e" />
                    <stop offset="80%"  stopColor="#071828" />
                    <stop offset="100%" stopColor="#0a1f30" />
                </linearGradient>
                <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#0a1f30" />
                    <stop offset="100%" stopColor="#071220" />
                </linearGradient>
            </defs>

            {/* ── Sky ── */}
            <rect x="0" y="0" width="1400" height="900" fill="url(#skyGrad)" />

            {/* ── Stars ── */}
            {stars.map(([x, y, r, op], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="#e2e8f0" opacity={op} />
            ))}

            {/* ── Atmosphere / Karman line hint ── */}
            <line x1="0" y1="200" x2="1400" y2="200"
                  stroke="#0d2540" strokeWidth="0.6" opacity="0.7" />
            <text x="1380" y="197" textAnchor="end" fill="#1e3a5f"
                  fontSize="9" fontFamily="monospace" opacity="0.6">ATMOSPHERE</text>

            {/* ── Satellite ── */}
            {/* Body */}
            <rect x="1232" y="56" width="36" height="22"
                  fill="none" stroke="#334155" strokeWidth="1.4" rx="2" />
            {/* Inner detail */}
            <rect x="1237" y="61" width="26" height="12"
                  fill="none" stroke="#1e3a5f" strokeWidth="0.8" rx="1" />
            {/* Left panel bar */}
            <line x1="1180" y1="67" x2="1232" y2="67" stroke="#1e3a5f" strokeWidth="0.9" />
            {/* Left solar panel */}
            <rect x="1138" y="58" width="42" height="18"
                  fill="none" stroke="#1d4ed8" strokeWidth="1.0" rx="1" opacity="0.75" />
            {/* Left panel cells */}
            {[0,1,2].map(n => (
                <line key={n} x1={1138 + n*14} y1="58" x2={1138 + n*14} y2="76"
                      stroke="#1d4ed8" strokeWidth="0.5" opacity="0.5" />
            ))}
            {/* Right panel bar */}
            <line x1="1268" y1="67" x2="1316" y2="67" stroke="#1e3a5f" strokeWidth="0.9" />
            {/* Right solar panel */}
            <rect x="1316" y="58" width="42" height="18"
                  fill="none" stroke="#1d4ed8" strokeWidth="1.0" rx="1" opacity="0.75" />
            {[0,1,2].map(n => (
                <line key={n} x1={1316 + n*14} y1="58" x2={1316 + n*14} y2="76"
                      stroke="#1d4ed8" strokeWidth="0.5" opacity="0.5" />
            ))}
            {/* Antenna dish (below body) */}
            <line x1="1250" y1="78" x2="1250" y2="94" stroke="#334155" strokeWidth="0.9" />
            <path d="M 1240,94 Q 1250,100 1260,94" fill="none" stroke="#334155" strokeWidth="1.0" />
            {/* Dish signal ping */}
            <circle cx="1250" cy="88" r="6"
                    fill="none" stroke="#3b82f6" strokeWidth="0.8"
                    className="sat-ping"
                    style={{ transformOrigin: '1250px 88px' }} />
            <circle cx="1250" cy="88" r="6"
                    fill="none" stroke="#3b82f6" strokeWidth="0.6"
                    className="sat-ping"
                    style={{ animationDelay: '1.5s', transformOrigin: '1250px 88px' }} />
            {/* Satellite label */}
            <text x="1250" y="115" textAnchor="middle" fill="#1e3a5f"
                  fontSize="8" fontFamily="monospace" letterSpacing="1" opacity="0.7">
                GALILEO SAT
            </text>

            {/* ── Rolling Hills ── */}
            {/* Background hill — darkest */}
            <path d="M -10,510 C 80,494 170,482 285,490 C 400,498 510,472 650,464
                     C 790,456 900,462 1040,456 C 1150,451 1280,464 1410,470"
                  fill="none" stroke="#0e2035" strokeWidth="1.2" opacity="0.9" />
            {/* Fill below for layering */}
            <path d="M -10,510 C 80,494 170,482 285,490 C 400,498 510,472 650,464
                     C 790,456 900,462 1040,456 C 1150,451 1280,464 1410,470
                     L 1410,900 L -10,900 Z"
                  fill="#060e1a" opacity="0.9" />

            {/* Mid hill */}
            <path d="M -10,555 C 120,538 260,526 420,538 C 580,550 740,530 900,522
                     C 1050,515 1200,528 1410,540"
                  fill="none" stroke="#0b1c2e" strokeWidth="1.2" opacity="0.9" />
            <path d="M -10,555 C 120,538 260,526 420,538 C 580,550 740,530 900,522
                     C 1050,515 1200,528 1410,540
                     L 1410,900 L -10,900 Z"
                  fill="#060c18" opacity="0.9" />

            {/* Foreground hill */}
            <path d="M -10,618 C 180,600 380,610 590,618 C 800,626 1010,608 1200,600
                     C 1310,596 1380,602 1410,604"
                  fill="none" stroke="#0d1e30" strokeWidth="1.2" opacity="0.9" />
            <path d="M -10,618 C 180,600 380,610 590,618 C 800,626 1010,608 1200,600
                     C 1310,596 1380,602 1410,604
                     L 1410,900 L -10,900 Z"
                  fill="#050a14" opacity="0.95" />

            {/* ── Cell Towers ── */}
            {towers.map((t, i) => drawTower(t, i))}

            {/* ── Backhaul lines (tower to tower) ── */}
            <path d="M 285,302 C 450,310 580,330 720,312"
                  fill="none" stroke="#0d2540" strokeWidth="0.8"
                  className="backhaul-line" opacity="0.6" />
            <path d="M 720,312 C 880,300 1000,308 1105,290"
                  fill="none" stroke="#0d2540" strokeWidth="0.8"
                  className="backhaul-line" opacity="0.6" style={{ animationDelay: '3s' }} />

            {/* ── Road ── */}
            <rect x="0" y="742" width="1400" height="26"
                  fill="#06101c" stroke="none" />
            {/* Road edges */}
            <line x1="0" y1="742" x2="1400" y2="742"
                  stroke="#122035" strokeWidth="1.0" />
            <line x1="0" y1="768" x2="1400" y2="768"
                  stroke="#122035" strokeWidth="1.0" />
            {/* Centre dashes */}
            <line x1="0" y1="755" x2="1400" y2="755"
                  stroke="#0d2030" strokeWidth="0.7" strokeDasharray="35 22" />
            {/* Shoulder lines */}
            <line x1="0" y1="745" x2="1400" y2="745"
                  stroke="#0a1a2c" strokeWidth="0.5" />
            <line x1="0" y1="765" x2="1400" y2="765"
                  stroke="#0a1a2c" strokeWidth="0.5" />

            {/* ── Truck (COE, facing right) ── */}
            {/* Cab */}
            <rect x="520" y="712" width="48" height="30"
                  fill="none" stroke="#1e3a5f" strokeWidth="1.2" rx="2" />
            {/* Windshield (front left face) */}
            <line x1="520" y1="712" x2="520" y2="742" stroke="#1e3a5f" strokeWidth="0.8" />
            <polygon points="520,712 520,726 532,726 528,712"
                     fill="none" stroke="#1a3050" strokeWidth="0.7" opacity="0.7" />
            {/* Side window */}
            <rect x="534" y="716" width="26" height="14"
                  fill="none" stroke="#1a3050" strokeWidth="0.7" opacity="0.6" />
            {/* Exhaust stack */}
            <rect x="563" y="695" width="6" height="18"
                  fill="none" stroke="#162840" strokeWidth="0.8" rx="1" />
            {/* Chassis */}
            <rect x="568" y="724" width="130" height="18"
                  fill="none" stroke="#162840" strokeWidth="1.0" rx="1" />
            {/* Fuel tank */}
            <rect x="620" y="726" width="30" height="14"
                  fill="none" stroke="#0d2540" strokeWidth="0.8" rx="1" />
            {/* Wheels */}
            {[537, 590, 640, 672].map((wx, i) => (
                <g key={i}>
                    <circle cx={wx} cy={746} r={10}
                            fill="none" stroke="#1a3050" strokeWidth="1.1" />
                    <circle cx={wx} cy={746} r={4}
                            fill="none" stroke="#0d2030" strokeWidth="0.7" />
                </g>
            ))}
            {/* Galileo unit (on chassis, glowing) */}
            <rect x="576" y="720" width="18" height="10"
                  fill="none" stroke="#3b82f6" strokeWidth="1.0" rx="1"
                  className="galileo-ping" />
            {/* Galileo cross detail */}
            <line x1="576" y1="725" x2="594" y2="725" stroke="#1d4ed8" strokeWidth="0.5" opacity="0.7" />
            <line x1="585" y1="720" x2="585" y2="730" stroke="#1d4ed8" strokeWidth="0.5" opacity="0.7" />
            {/* Label */}
            <text x="585" y="738" textAnchor="middle" fill="#1e3a5f"
                  fontSize="6.5" fontFamily="monospace" opacity="0.7">GALILEO</text>

            {/* ── Signal Connection: Galileo → Tower 2 ── */}
            <path d="M 585,720 C 570,640 620,510 720,340"
                  fill="none" stroke="#3b82f6" strokeWidth="1.2"
                  opacity="0.55" className="signal-line-1" />
            {/* Ghost / shadow of the path for visual depth */}
            <path d="M 585,720 C 570,640 620,510 720,340"
                  fill="none" stroke="#1d4ed8" strokeWidth="2.5"
                  opacity="0.12" />

            {/* ── Signal Connection: Tower 2 → Satellite ── */}
            <path d="M 720,312 C 800,240 1020,150 1250,88"
                  fill="none" stroke="#3b82f6" strokeWidth="1.0"
                  opacity="0.45" className="signal-line-2" />
            <path d="M 720,312 C 800,240 1020,150 1250,88"
                  fill="none" stroke="#1d4ed8" strokeWidth="2.5"
                  opacity="0.10" />

            {/* ── Ground fill (below road) ── */}
            <rect x="0" y="768" width="1400" height="132"
                  fill="#040b14" />

            {/* ── Subtle grid / ground texture ── */}
            {[800,840,880].map(y => (
                <line key={y} x1="0" y1={y} x2="1400" y2={y}
                      stroke="#080f1c" strokeWidth="0.4" />
            ))}

            {/* ── "POWERSTAR TELEMATICS" faint watermark ── */}
            <text x="700" y="860" textAnchor="middle"
                  fill="#0d1e30" fontSize="26" fontFamily="monospace"
                  fontWeight="bold" letterSpacing="8" opacity="0.5">
                POWERSTAR TELEMATICS
            </text>
        </svg>
    );
};

// --- Stock Split Card ---
const SimStockCard: React.FC<{
    provider: SimProvider;
    data: SimStock;
}> = ({ provider, data }) => {
    const isVodacom = provider === 'vodacom';
    const deployedPct = Math.round((data.deployed / data.total) * 100);
    const inStockPct = Math.round((data.inStock / data.total) * 100);

    return (
        <div className={cn(
            "bg-white border rounded-xl p-5 shadow-sm space-y-4",
            "border-border"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", isVodacom ? "bg-red-50" : "bg-blue-50")}>
                        {isVodacom
                            ? <Smartphone className="h-5 w-5 text-red-500" />
                            : <Globe className="h-5 w-5 text-blue-500" />
                        }
                    </div>
                    <div>
                        <p className="text-[14px] font-black text-slate-800">
                            {isVodacom ? 'Vodacom M2M' : 'BICS International'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                            {isVodacom ? 'South Africa · IoT Data SIMs' : 'Global · Cross-Border Roaming SIMs'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-slate-800">{data.total.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase">Total SIMs</p>
                </div>
            </div>

            {/* Two main split boxes */}
            <div className="grid grid-cols-2 gap-3">
                {/* In Stock (Khulu) */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Building2 className="h-3.5 w-3.5 text-accent" />
                        <p className="text-[9px] font-black text-accent uppercase tracking-wider">In Stock — Khulu</p>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{data.inStock.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">unallocated · ready to deploy</p>
                </div>

                {/* Deployed in trucks */}
                <div className={cn("border rounded-xl p-4", isVodacom ? "bg-red-50/40 border-red-100" : "bg-blue-50/40 border-blue-100")}>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Truck className={cn("h-3.5 w-3.5", isVodacom ? "text-red-500" : "text-blue-500")} />
                        <p className={cn("text-[9px] font-black uppercase tracking-wider", isVodacom ? "text-red-500" : "text-blue-500")}>
                            Deployed — Fleet
                        </p>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{data.deployed.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">active in trucks</p>
                </div>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg text-[11px]">
                    <span className="text-slate-400">Dormant</span>
                    <span className="font-black text-slate-600">{data.dormant}</span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg text-[11px]">
                    <span className="text-slate-400">Suspended</span>
                    <span className={cn("font-black", data.suspended > 0 ? "text-amber-600" : "text-slate-600")}>{data.suspended}</span>
                </div>
            </div>

            {/* Split bar */}
            <div>
                <div className="flex justify-between text-[9px] text-slate-400 mb-1.5">
                    <span>Stock vs Deployed breakdown</span>
                    <span>{deployedPct}% in field</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                        className="h-full bg-accent transition-all rounded-l-full"
                        style={{ width: `${inStockPct}%` }}
                    />
                    <div
                        className={cn("h-full transition-all", isVodacom ? "bg-red-400" : "bg-blue-400")}
                        style={{ width: `${deployedPct}%` }}
                    />
                    <div className="h-full bg-slate-200 flex-1" />
                </div>
                <div className="flex gap-4 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                        <div className="h-1.5 w-2.5 rounded bg-accent" />
                        In Stock ({inStockPct}%)
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                        <div className={cn("h-1.5 w-2.5 rounded", isVodacom ? "bg-red-400" : "bg-blue-400")} />
                        Deployed ({deployedPct}%)
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                        <div className="h-1.5 w-2.5 rounded bg-slate-200" />
                        Other
                    </div>
                </div>
            </div>

            {/* Provider detail */}
            <div className="pt-3 border-t border-border text-[10px] text-slate-400 space-y-0.5">
                {isVodacom ? (
                    <>
                        <p><span className="font-black text-slate-600">Portal:</span> SIM Control (SIMControl.co.za)</p>
                        <p><span className="font-black text-slate-600">Plan:</span> M2M IoT Shared Data Pool</p>
                        <p><span className="font-black text-slate-600">Coverage:</span> South Africa</p>
                    </>
                ) : (
                    <>
                        <p><span className="font-black text-slate-600">Provider:</span> BICS — Global Carrier</p>
                        <p><span className="font-black text-slate-600">Coverage:</span> Zimbabwe, Zambia, Mozambique, Botswana +</p>
                        <p><span className="font-black text-slate-600">Use Case:</span> Automatic failover when truck crosses SA border</p>
                    </>
                )}
            </div>
        </div>
    );
};

// --- Main Component ---
const SIMManagement: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [providerFilter, setProviderFilter] = useState<SimProvider | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<SimStatus | 'all'>('all');
    const [activeSection, setActiveSection] = useState<'overview' | 'inventory' | 'orders'>('overview');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const filteredSims = simCards.filter(sim => {
        const matchProvider = providerFilter === 'all' || sim.provider === providerFilter;
        const matchStatus = statusFilter === 'all' || sim.status === statusFilter;
        const matchSearch = !searchQuery
            || sim.iccid.includes(searchQuery)
            || sim.assignedTruck?.includes(searchQuery)
            || sim.client?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchProvider && matchStatus && matchSearch;
    });

    const filteredOrders = simOrders.filter(o => providerFilter === 'all' || o.provider === providerFilter);

    return (
        <div className="relative min-h-screen" style={{ background: '#010b18' }}>

            {/* Illustrated background scene */}
            <NetworkSceneBackground />

            <div className="relative z-10 p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

                {/* Page header — dark themed to blend with scene */}


            {/* Header — dark themed to read over the scene background */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase drop-shadow-sm">SIM Management</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Vodacom M2M and BICS SIM stock, fleet deployment, and ordering via SIM Control.</p>
                </div>
                <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded text-xs font-black uppercase tracking-widest shadow-sm transition-all">
                    <Plus className="h-3.5 w-3.5" />
                    Order SIMs
                </button>
            </div>

            {/* High usage alert */}
            {simCards.some(s => s.status === 'high_usage') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <TrendingUp className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-800">
                        <span className="font-black">High Usage Alert: </span>
                        {simCards.filter(s => s.status === 'high_usage').map(s => `${s.assignedTruck} (${s.usage30d})`).join(', ')} — review data plan.
                    </p>
                </div>
            )}

            {/* Section Toggle */}
            <div className="flex gap-1 bg-slate-900/70 backdrop-blur-sm border border-slate-700 p-1 rounded-xl w-fit">
                {([
                    ['overview', '📊 Stock Overview'],
                    ['inventory', '📱 SIM Inventory'],
                    ['orders', '📦 Orders'],
                ] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveSection(key)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                            activeSection === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW: Two Stock Split Cards side by side */}
            {activeSection === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SimStockCard provider="vodacom" data={vodacomStock} />
                    <SimStockCard provider="bics" data={bicsStock} />
                </div>
            )}

            {/* INVENTORY: Full SIM table */}
            {activeSection === 'inventory' && (
                <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-slate-50/50 flex flex-wrap items-center gap-3">
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search ICCID, truck, or client..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-border rounded py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent/50"
                            />
                        </div>
                        <div className="flex gap-1">
                            {(['all', 'vodacom', 'bics'] as const).map(p => (
                                <button key={p} onClick={() => setProviderFilter(p)}
                                    className={cn("px-3 py-1 rounded text-[10px] font-black uppercase", providerFilter === p ? "bg-slate-900 text-white" : "bg-white border border-border text-slate-500")}>
                                    {p === 'all' ? 'All' : p === 'vodacom' ? 'Vodacom' : 'BICS'}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {(['all', 'active', 'high_usage', 'dormant', 'unallocated'] as const).map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={cn("px-3 py-1 rounded text-[10px] font-black uppercase", statusFilter === s ? "bg-slate-900 text-white" : "bg-white border border-border text-slate-500")}>
                                    {s === 'all' ? 'All Status' : s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead className="bg-slate-50 border-b border-border">
                                <tr>
                                    {['ICCID', 'Provider', 'MSISDN', 'Assigned Truck', 'Client', 'Roaming', 'Status', 'Usage (30d)', 'Last Active'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left font-black text-[10px] text-slate-500 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredSims.map(sim => {
                                    const cfg = simStatusConfig[sim.status];
                                    return (
                                        <tr key={sim.iccid} className={cn("hover:bg-slate-50/50 transition-colors", sim.status === 'high_usage' && "bg-amber-50/20")}>
                                            <td className="px-4 py-3 font-mono font-black text-slate-800 text-[11px]">{sim.iccid}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", sim.provider === 'vodacom' ? 'bg-red-400' : 'bg-blue-400')} />
                                                    <span className="font-bold text-slate-700">{sim.provider === 'vodacom' ? 'Vodacom' : 'BICS'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{sim.msisdn}</td>
                                            <td className="px-4 py-3">
                                                {sim.assignedTruck
                                                    ? <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{sim.assignedTruck}</span>
                                                    : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{sim.client || <span className="text-slate-300">—</span>}</td>
                                            <td className="px-4 py-3">
                                                {sim.crossBorder
                                                    ? <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit"><Globe className="h-3 w-3" />Active</span>
                                                    : <span className="text-slate-300 text-[10px]">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn("flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg text-[10px] font-black uppercase", cfg.color)}>
                                                    <div className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className={cn("px-4 py-3 font-black text-[12px]", sim.status === 'high_usage' ? "text-amber-600" : "text-slate-700")}>{sim.usage30d}</td>
                                            <td className="px-4 py-3 text-slate-400 text-[11px]">{sim.lastActive}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ORDERS */}
            {activeSection === 'orders' && (
                <div className="space-y-4">
                    <div className="flex gap-1">
                        {(['all', 'vodacom', 'bics'] as const).map(p => (
                            <button key={p} onClick={() => setProviderFilter(p)}
                                className={cn("px-4 py-1.5 rounded text-[10px] font-black uppercase", providerFilter === p ? "bg-slate-900 text-white" : "bg-white border border-border text-slate-500")}>
                                {p === 'all' ? 'All Orders' : p === 'vodacom' ? 'Vodacom' : 'BICS'}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border">
                            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">SIM Orders — via SIM Control</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {filteredOrders.map(order => {
                                const isExp = expandedOrderId === order.id;
                                const cfg = orderStatusConfig[order.status];
                                const isVodacom = order.provider === 'vodacom';
                                return (
                                    <div key={order.id}>
                                        <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/50" onClick={() => setExpandedOrderId(isExp ? null : order.id)}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-black text-[13px] text-slate-800">{order.ref}</span>
                                                    <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded", isVodacom ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600')}>
                                                        {isVodacom ? 'Vodacom' : 'BICS'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400">{order.simType} · {order.qty} SIMs</p>
                                            </div>
                                            <div className="hidden md:block text-right">
                                                <p className="font-black text-slate-800 text-[13px]">R {(order.qty * order.unitCost).toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400">{order.orderDate} → {order.expectedArrival}</p>
                                            </div>
                                            <span className={cn("text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0", cfg.color)}>{cfg.label}</span>
                                            {isExp ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                                        </div>
                                        {isExp && (
                                            <div className="px-5 pb-5 pt-3 bg-slate-50/50 border-t border-border text-[12px] grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'SIM Type', val: order.simType },
                                                        { label: 'Provider', val: isVodacom ? 'Vodacom M2M via SIM Control' : 'BICS International' },
                                                        { label: 'Quantity', val: `${order.qty} SIMs` },
                                                        { label: 'Unit Price', val: `R ${order.unitCost}` },
                                                        { label: 'Total', val: `R ${(order.qty * order.unitCost).toLocaleString()}` },
                                                        { label: 'Order Date', val: order.orderDate },
                                                        { label: 'Expected', val: order.expectedArrival },
                                                    ].map(row => (
                                                        <div key={row.label} className="flex justify-between">
                                                            <span className="text-slate-400">{row.label}</span>
                                                            <span className="font-bold text-slate-700">{row.val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex flex-col justify-end gap-2">
                                                    <button className="w-full bg-accent hover:bg-accent-hover text-white text-[10px] font-black uppercase py-2 rounded-lg flex items-center justify-center gap-1">
                                                        Update Status <ArrowRight className="h-3 w-3" />
                                                    </button>
                                                    <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase py-2 rounded-lg">
                                                        Mark as Received
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            </div>{/* end z-10 content */}
        </div>
    );
};

export default SIMManagement;
