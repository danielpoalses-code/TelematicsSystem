import React, { useState, useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polygon, Tooltip, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
    MapPin, Globe, Building2, Factory, Truck,
    Radio, Shield, AlertTriangle, CheckCircle2,
    Map, Package, Layers, RefreshCw, WifiOff,
    BatteryLow, Signal, ToggleLeft, Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix Leaflet default marker icons in Vite/webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Types ──────────────────────────────────────────────────────────────────────

type ZoneTier = 'provincial' | 'dealerships' | 'suppliers' | 'factory' | 'crossborder' | 'offline';

/** A parsed feature from a KML file */
interface KMLFeature {
    id: string;
    name: string;
    coords: [number, number][];   // [lat, lng][]
    type: 'polygon' | 'point';
    kmlColor?: string;            // raw KML AABBGGRR color
}

// ── KML Parser ─────────────────────────────────────────────────────────────────

function kmlColorToHex(aabbggrr: string): string {
    // KML color format: AABBGGRR → CSS rgba
    if (!aabbggrr || aabbggrr.length !== 8) return '#ffffff';
    const r = parseInt(aabbggrr.slice(6, 8), 16);
    const g = parseInt(aabbggrr.slice(4, 6), 16);
    const b = parseInt(aabbggrr.slice(2, 4), 16);
    return `rgb(${r},${g},${b})`;
}

function parseKML(rawXml: string): KMLFeature[] {
    // Sanitise common KML issues: HTML span tags from Google Earth, & in names
    const clean = rawXml
        .replace(/<\/?span[^>]*>/g, '')
        .replace(/&(?![a-zA-Z#][a-zA-Z0-9#]*;)/g, '&amp;');

    const doc = new DOMParser().parseFromString(clean, 'application/xml');
    const placemarks = Array.from(doc.querySelectorAll('Placemark'));

    return placemarks
        .map((pm, idx): KMLFeature | null => {
            const name = pm.querySelector('name')?.textContent?.trim() ?? '';
            const rawCoords = pm.querySelector('coordinates')?.textContent?.trim();
            const colorEl = pm.querySelector('PolyStyle > color') ?? pm.querySelector('LineStyle > color');
            const kmlColor = colorEl?.textContent?.trim();
            const isPoint = pm.querySelector('Point') !== null;

            if (!rawCoords) return null;

            const coords = rawCoords
                .split(/\s+/)
                .filter(Boolean)
                .map(token => {
                    const parts = token.split(',');
                    const lng = parseFloat(parts[0]);
                    const lat = parseFloat(parts[1]);
                    return isNaN(lat) || isNaN(lng) ? null : [lat, lng] as [number, number];
                })
                .filter((c): c is [number, number] => c !== null);

            if (coords.length === 0) return null;

            return {
                id: `${name.replace(/\s+/g, '_')}_${idx}`,
                name,
                coords,
                type: isPoint ? 'point' : (coords.length === 1 ? 'point' : 'polygon'),
                kmlColor,
            };
        })
        .filter((f): f is KMLFeature => f !== null);
}

// ── Province classification ────────────────────────────────────────────────────
// Names that appear as province-level boundaries in factory-suppliers.kml

const PROVINCE_KEYS = new Set([
    'gauteng', 'natal', 'kwazulu-natal', 'limpopo', 'northern cape',
    'northen cape', 'western cape', 'eastern cape', 'free state', 'mpumalanga',
    'north west', 'northwest',
]);

const isProvince = (name: string) => PROVINCE_KEYS.has(name.toLowerCase().trim());

// Map KML name → display name
const PROVINCE_DISPLAY: Record<string, string> = {
    'natal':         'KwaZulu-Natal',
    'northen cape':  'Northern Cape',
    'gauteng':       'Gauteng',
    'limpopo':       'Limpopo',
    'western cape':  'Western Cape',
    'eastern cape':  'Eastern Cape',
    'free state':    'Free State',
    'mpumalanga':    'Mpumalanga',
    'north west':    'North West',
};

function displayName(raw: string): string {
    return PROVINCE_DISPLAY[raw.toLowerCase().trim()] ?? raw;
}

// ── User-defined province list ─────────────────────────────────────────────────
// The 7 provinces the user operates in (from the brief)
const USER_PROVINCES = [
    'KwaZulu-Natal', 'Western Cape', 'Free State', 'Gauteng',
    'Mpumalanga', 'Limpopo', 'Eastern Cape', 'North West',
];

// ── Map colour scheme ──────────────────────────────────────────────────────────

const TIER_COLORS: Record<ZoneTier, string> = {
    provincial:  '#6366f1',
    dealerships: '#10b981',
    suppliers:   '#f59e0b',
    factory:     '#f97316',
    crossborder: '#3b82f6',
};

// ── Offline truck mock data ────────────────────────────────────────────────────

type OfflineReason = 'battery' | 'signal' | 'iso_switch' | 'no_airtime';

interface OfflineTruck {
    id: string; stock: string; model: string;
    lat: number; lng: number;
    hoursOffline: number;
    reason: OfflineReason;
    dealer: string;
}

export const REASON_LABEL: Record<OfflineReason, string> = {
    battery:    'Battery Dead',
    signal:     'Signal Loss',
    iso_switch: 'ISO Switch',
    no_airtime: 'No Airtime',
};

export const REASON_COLOR: Record<OfflineReason, string> = {
    battery:    '#f59e0b',
    signal:     '#64748b',
    iso_switch: '#f97316',
    no_airtime: '#ef4444',
};

export const REASON_ICON: Record<OfflineReason, React.ElementType> = {
    battery:    BatteryLow,
    signal:     Signal,
    iso_switch: ToggleLeft,
    no_airtime: Smartphone,
};

function fmtOffline(h: number): string {
    if (h < 1) return '< 1h ago';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ${h % 24}h ago`;
}

// Last-known-location offline fleet — sourced from vehicle health report
const OFFLINE_TRUCKS: OfflineTruck[] = [
    // ── Gauteng — Centurion hub ──
    { id:'of-001', stock:'ST-085', model:'VX 2642',   lat:-25.864, lng:28.165, hoursOffline:14,  reason:'battery',    dealer:'Centurion' },
    { id:'of-002', stock:'ST-112', model:'VX 2635A',  lat:-25.871, lng:28.172, hoursOffline:6,   reason:'signal',     dealer:'Centurion' },
    { id:'of-003', stock:'ST-203', model:'VX 1627',   lat:-25.858, lng:28.159, hoursOffline:31,  reason:'iso_switch', dealer:'Centurion' },
    { id:'of-004', stock:'ST-217', model:'VX 2628',   lat:-25.876, lng:28.181, hoursOffline:2,   reason:'battery',    dealer:'Centurion' },
    { id:'of-005', stock:'ST-298', model:'VX 4042K',  lat:-25.860, lng:28.168, hoursOffline:72,  reason:'no_airtime', dealer:'Centurion' },
    { id:'of-006', stock:'ST-301', model:'VX 2635A',  lat:-25.868, lng:28.162, hoursOffline:8,   reason:'signal',     dealer:'Centurion' },
    { id:'of-007', stock:'ST-189', model:'VX 2642',   lat:-25.873, lng:28.176, hoursOffline:19,  reason:'battery',    dealer:'Centurion' },
    // ── Gauteng — Brakpan / East Rand ──
    { id:'of-008', stock:'ST-066', model:'VX 4035B',  lat:-26.235, lng:28.371, hoursOffline:11,  reason:'battery',    dealer:'Brakpan' },
    { id:'of-009', stock:'ST-177', model:'VX 2642',   lat:-26.242, lng:28.378, hoursOffline:3,   reason:'signal',     dealer:'Brakpan' },
    { id:'of-010', stock:'ST-388', model:'VX 2628',   lat:-26.228, lng:28.365, hoursOffline:48,  reason:'no_airtime', dealer:'Brakpan' },
    // ── Gauteng — Wonderboom / North ──
    { id:'of-011', stock:'ST-421', model:'VX 2635A',  lat:-25.684, lng:28.190, hoursOffline:7,   reason:'battery',    dealer:'Wonderboom' },
    { id:'of-012', stock:'ST-498', model:'VX 3335',   lat:-25.690, lng:28.195, hoursOffline:22,  reason:'iso_switch', dealer:'Wonderboom' },
    // ── Gauteng — Randburg ──
    { id:'of-013', stock:'ST-519', model:'VX 2628',   lat:-25.960, lng:27.850, hoursOffline:2,   reason:'battery',    dealer:'Randburg' },
    { id:'of-014', stock:'ST-531', model:'VX 2635A',  lat:-26.095, lng:27.994, hoursOffline:16,  reason:'iso_switch', dealer:'Randburg' },
    // ── KwaZulu-Natal — PMB ──
    { id:'of-015', stock:'ST-033', model:'VX 2642',   lat:-29.616, lng:30.392, hoursOffline:5,   reason:'signal',     dealer:'PMB' },
    { id:'of-016', stock:'ST-072', model:'VX 4035B',  lat:-29.623, lng:30.399, hoursOffline:18,  reason:'battery',    dealer:'PMB' },
    { id:'of-017', stock:'ST-151', model:'VX 2635A',  lat:-29.609, lng:30.385, hoursOffline:36,  reason:'no_airtime', dealer:'PMB' },
    { id:'of-018', stock:'ST-274', model:'VX 1627',   lat:-29.619, lng:30.395, hoursOffline:9,   reason:'battery',    dealer:'PMB' },
    // ── KZN — trucks on N3 corridor ──
    { id:'of-019', stock:'ST-445', model:'VX 2642',   lat:-29.750, lng:30.650, hoursOffline:3,   reason:'battery',    dealer:'PMB' },
    { id:'of-020', stock:'ST-506', model:'VX 4042K',  lat:-29.680, lng:30.530, hoursOffline:11,  reason:'signal',     dealer:'PMB' },
    // ── KZN — Empangeni ──
    { id:'of-021', stock:'ST-041', model:'VX 2642',   lat:-28.753, lng:31.893, hoursOffline:13,  reason:'signal',     dealer:'Empangeni' },
    { id:'of-022', stock:'ST-168', model:'VX 2628',   lat:-28.759, lng:31.899, hoursOffline:26,  reason:'iso_switch', dealer:'Empangeni' },
    { id:'of-023', stock:'ST-335', model:'VX 4042K',  lat:-28.748, lng:31.888, hoursOffline:4,   reason:'battery',    dealer:'Empangeni' },
    // ── KZN — Pinetown ──
    { id:'of-024', stock:'ST-055', model:'VX 2635A',  lat:-29.814, lng:30.865, hoursOffline:7,   reason:'battery',    dealer:'Pinetown' },
    { id:'of-025', stock:'ST-249', model:'VX 2642',   lat:-29.820, lng:30.871, hoursOffline:15,  reason:'signal',     dealer:'Pinetown' },
    // ── Mpumalanga — Ermelo ──
    { id:'of-026', stock:'ST-047', model:'VX 2628',   lat:-26.533, lng:29.983, hoursOffline:10,  reason:'battery',    dealer:'Ermelo' },
    { id:'of-027', stock:'ST-139', model:'VX 4035B',  lat:-26.540, lng:29.990, hoursOffline:28,  reason:'no_airtime', dealer:'Ermelo' },
    { id:'of-028', stock:'ST-262', model:'VX 2642',   lat:-26.527, lng:29.977, hoursOffline:3,   reason:'iso_switch', dealer:'Ermelo' },
    { id:'of-029', stock:'ST-378', model:'VX 2635A',  lat:-26.536, lng:29.986, hoursOffline:44,  reason:'signal',     dealer:'Ermelo' },
    // ── Mpumalanga — Middelburg ──
    { id:'of-030', stock:'ST-093', model:'VX 2628',   lat:-25.766, lng:29.458, hoursOffline:6,   reason:'battery',    dealer:'Middelburg' },
    { id:'of-031', stock:'ST-215', model:'VX 2642',   lat:-25.772, lng:29.464, hoursOffline:20,  reason:'signal',     dealer:'Middelburg' },
    { id:'of-032', stock:'ST-347', model:'VX 1729',   lat:-25.760, lng:29.452, hoursOffline:8,   reason:'iso_switch', dealer:'Middelburg' },
    // ── Mpumalanga — Nelspruit / N4 ──
    { id:'of-033', stock:'ST-412', model:'VX 2635A',  lat:-25.475, lng:30.985, hoursOffline:33,  reason:'no_airtime', dealer:'Nelspruit' },
    { id:'of-034', stock:'ST-547', model:'VX 2642',   lat:-25.810, lng:29.750, hoursOffline:7,   reason:'signal',     dealer:'Middelburg' },
    { id:'of-035', stock:'ST-563', model:'VX 2628',   lat:-25.680, lng:30.200, hoursOffline:29,  reason:'no_airtime', dealer:'Nelspruit' },
    // ── Limpopo — Polokwane ──
    { id:'of-036', stock:'ST-019', model:'VX 2642',   lat:-23.904, lng:29.468, hoursOffline:11,  reason:'battery',    dealer:'Polokwane' },
    { id:'of-037', stock:'ST-131', model:'VX 4042K',  lat:-23.910, lng:29.474, hoursOffline:5,   reason:'signal',     dealer:'Polokwane' },
    { id:'of-038', stock:'ST-256', model:'VX 2628',   lat:-23.898, lng:29.462, hoursOffline:17,  reason:'iso_switch', dealer:'Polokwane' },
    { id:'of-039', stock:'ST-371', model:'VX 2635A',  lat:-23.907, lng:29.471, hoursOffline:39,  reason:'no_airtime', dealer:'Polokwane' },
    // ── Limpopo — N1 corridor ──
    { id:'of-040', stock:'ST-578', model:'VX 4035B',  lat:-23.500, lng:29.350, hoursOffline:8,   reason:'battery',    dealer:'Polokwane' },
    // ── Western Cape — Brackenfell ──
    { id:'of-041', stock:'ST-028', model:'VX 2642',   lat:-33.882, lng:18.694, hoursOffline:8,   reason:'battery',    dealer:'Brackenfell' },
    { id:'of-042', stock:'ST-144', model:'VX 1627',   lat:-33.888, lng:18.700, hoursOffline:24,  reason:'signal',     dealer:'Brackenfell' },
    { id:'of-043', stock:'ST-267', model:'VX 2635A',  lat:-33.876, lng:18.688, hoursOffline:4,   reason:'iso_switch', dealer:'Brackenfell' },
    { id:'of-044', stock:'ST-392', model:'VX 2628',   lat:-33.885, lng:18.697, hoursOffline:56,  reason:'no_airtime', dealer:'Brackenfell' },
    // ── Western Cape — George ──
    { id:'of-045', stock:'ST-463', model:'VX 2642',   lat:-33.963, lng:22.459, hoursOffline:12,  reason:'battery',    dealer:'George' },
    // ── Free State — Bloemfontein ──
    { id:'of-046', stock:'ST-060', model:'VX 2628',   lat:-29.114, lng:26.227, hoursOffline:9,   reason:'signal',     dealer:'Bloemfontein' },
    { id:'of-047', stock:'ST-182', model:'VX 4035B',  lat:-29.120, lng:26.233, hoursOffline:31,  reason:'battery',    dealer:'Bloemfontein' },
    { id:'of-048', stock:'ST-309', model:'VX 2635A',  lat:-29.108, lng:26.221, hoursOffline:5,   reason:'iso_switch', dealer:'Bloemfontein' },
    // ── Eastern Cape — Port Elizabeth ──
    { id:'of-049', stock:'ST-077', model:'VX 2642',   lat:-33.960, lng:25.602, hoursOffline:16,  reason:'battery',    dealer:'Port Elizabeth' },
    { id:'of-050', stock:'ST-198', model:'VX 2628',   lat:-33.966, lng:25.608, hoursOffline:7,   reason:'signal',     dealer:'Port Elizabeth' },
    { id:'of-051', stock:'ST-324', model:'VX 1729',   lat:-33.954, lng:25.596, hoursOffline:42,  reason:'no_airtime', dealer:'Port Elizabeth' },
    // ── North West — Klerksdorp / Schweizer ──
    { id:'of-052', stock:'ST-089', model:'VX 2635A',  lat:-27.183, lng:25.327, hoursOffline:21,  reason:'battery',    dealer:'Schweizer-Reneke' },
    { id:'of-053', stock:'ST-211', model:'VX 2642',   lat:-27.189, lng:25.333, hoursOffline:6,   reason:'signal',     dealer:'Schweizer-Reneke' },
    { id:'of-054', stock:'ST-341', model:'VX 2628',   lat:-26.852, lng:26.666, hoursOffline:13,  reason:'iso_switch', dealer:'Klerksdorp' },
    // ── Northern Cape — Upington / Kimberley ──
    { id:'of-055', stock:'ST-116', model:'VX 4035B',  lat:-28.447, lng:21.255, hoursOffline:25,  reason:'no_airtime', dealer:'Upington' },
    { id:'of-056', stock:'ST-238', model:'VX 2642',   lat:-28.453, lng:21.261, hoursOffline:9,   reason:'battery',    dealer:'Upington' },
    { id:'of-057', stock:'ST-365', model:'VX 2635A',  lat:-28.728, lng:24.765, hoursOffline:18,  reason:'signal',     dealer:'Kimberley' },
    // ── PMB Factory (inside assembly plant) ──
    { id:'of-058', stock:'ST-601', model:'VX 2642',   lat:-29.6450, lng:30.4140, hoursOffline:2,   reason:'battery',    dealer:'PMB Factory' },
    { id:'of-059', stock:'ST-602', model:'VX 4035B',  lat:-29.6462, lng:30.4128, hoursOffline:18,  reason:'signal',     dealer:'PMB Factory' },
    { id:'of-060', stock:'ST-603', model:'VX 2628',   lat:-29.6448, lng:30.4122, hoursOffline:5,   reason:'iso_switch', dealer:'PMB Factory' },
    { id:'of-061', stock:'ST-604', model:'VX 2635A',  lat:-29.6458, lng:30.4148, hoursOffline:31,  reason:'no_airtime', dealer:'PMB Factory' },
    // ── Supplier sites ──
    { id:'of-062', stock:'ST-611', model:'VX 2642',   lat:-29.618,  lng:30.402,  hoursOffline:7,   reason:'battery',    dealer:'Roadhogs' },
    { id:'of-063', stock:'ST-612', model:'VX 2628',   lat:-29.615,  lng:30.395,  hoursOffline:14,  reason:'signal',     dealer:'Knight Bodies' },
    { id:'of-064', stock:'ST-613', model:'VX 2635A',  lat:-25.940,  lng:28.150,  hoursOffline:3,   reason:'battery',    dealer:'Transpec' },
    { id:'of-065', stock:'ST-614', model:'VX 4042K',  lat:-25.965,  lng:28.212,  hoursOffline:22,  reason:'iso_switch', dealer:'Hennox' },
    { id:'of-066', stock:'ST-615', model:'VX 1729',   lat:-26.986,  lng:30.803,  hoursOffline:11,  reason:'no_airtime', dealer:'Anco Manufacturing' },
    // ── En Route — no fixed zone (province-only) ──
    { id:'of-067', stock:'ST-621', model:'VX 2642',   lat:-26.200,  lng:28.000,  hoursOffline:4,   reason:'signal',     dealer:'En Route' },
    { id:'of-068', stock:'ST-622', model:'VX 4035B',  lat:-28.250,  lng:29.100,  hoursOffline:8,   reason:'battery',    dealer:'En Route' },
    { id:'of-069', stock:'ST-623', model:'VX 2628',   lat:-34.020,  lng:22.510,  hoursOffline:15,  reason:'no_airtime', dealer:'En Route' },
    { id:'of-070', stock:'ST-624', model:'VX 2635A',  lat:-25.850,  lng:29.600,  hoursOffline:2,   reason:'iso_switch', dealer:'En Route' },
    { id:'of-071', stock:'ST-625', model:'VX 2642',   lat:-29.300,  lng:27.500,  hoursOffline:9,   reason:'battery',    dealer:'En Route' },
];

// ── Point-in-polygon (ray casting) ────────────────────────────────────────────

function pointInPolygon(lat: number, lng: number, poly: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [alat, alng] = poly[i];
        const [blat, blng] = poly[j];
        if (((alng > lng) !== (blng > lng)) &&
            (lat < (blat - alat) * (lng - alng) / (blng - alng) + alat))
            inside = !inside;
    }
    return inside;
}

function assignProvince(lat: number, lng: number, provinces: KMLFeature[]): string {
    for (const p of provinces) {
        if (pointInPolygon(lat, lng, p.coords)) return displayName(p.name);
    }
    return 'Other';
}

type ZoneType = 'factory' | 'dealership' | 'supplier' | 'province';

const ZONE_COLOR: Record<ZoneType, string> = {
    factory:    '#f97316',
    dealership: '#10b981',
    supplier:   '#f59e0b',
    province:   '#94a3b8',
};

const ZONE_LABEL: Record<ZoneType, string> = {
    factory:    'Factory',
    dealership: 'Dealership',
    supplier:   'Supplier',
    province:   'In Province',
};

// Zone classifiers — names that identify each category in mock fleet data
const FACTORY_DEALERS  = new Set(['PMB Factory', 'Powerstar Factory', 'Factory']);
const SUPPLIER_DEALERS = new Set(['Roadhogs', 'Knight Bodies', 'Transpec', 'Nsimbi', 'Anco Manufacturing', 'Hennox', 'Thor Drilling', 'QTC Civils', 'Onelogix Umlaas']);
const ENROUTE_DEALERS  = new Set(['En Route']);

function assignFullZone(
    truck: OfflineTruck,
    provinces: KMLFeature[]
): { province: string; zone: ZoneType; zoneName: string } {
    const province = assignProvince(truck.lat, truck.lng, provinces);
    if (FACTORY_DEALERS.has(truck.dealer))  return { province, zone: 'factory',    zoneName: truck.dealer };
    if (SUPPLIER_DEALERS.has(truck.dealer)) return { province, zone: 'supplier',   zoneName: truck.dealer };
    if (ENROUTE_DEALERS.has(truck.dealer))  return { province, zone: 'province',   zoneName: province };
    return { province, zone: 'dealership', zoneName: truck.dealer };
}

// ── SA bounding boxes ──────────────────────────────────────────────────────────

const SA_BOUNDS: L.LatLngBoundsLiteral = [[-35, 16.3], [-22, 33]];
const SA_CENTER: [number, number] = [-28.8, 24.8];

// ── Dark tile layer ────────────────────────────────────────────────────────────

const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTR = '&copy; <a href="https://carto.com">CARTO</a>';

// ── Map components ─────────────────────────────────────────────────────────────

/** Province outlines map */
const ProvinceMap: React.FC<{ features: KMLFeature[] }> = ({ features }) => {
    const provinces = features.filter(f => isProvince(f.name) && f.type === 'polygon');
    const color = TIER_COLORS.provincial;

    return (
        <MapContainer
            bounds={SA_BOUNDS}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            scrollWheelZoom={false}
            zoomControl={true}
        >
            <TileLayer url={DARK_TILE} attribution={DARK_TILE_ATTR} />
            {provinces.map(prov => (
                <Polygon
                    key={prov.id}
                    positions={prov.coords}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.18, weight: 1.8, opacity: 0.85 }}
                >
                    <Tooltip sticky>{displayName(prov.name)}</Tooltip>
                </Polygon>
            ))}
        </MapContainer>
    );
};

/** Dealership polygons map */
const DealershipsMap: React.FC<{ features: KMLFeature[] }> = ({ features }) => {
    const color = TIER_COLORS.dealerships;
    return (
        <MapContainer
            bounds={SA_BOUNDS}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            scrollWheelZoom={false}
        >
            <TileLayer url={DARK_TILE} attribution={DARK_TILE_ATTR} />
            {features.map(f => {
                // Compute centroid for small polygons → show as circle marker at the right zoom
                const centroid = f.coords.reduce(
                    (acc, [lat, lng]) => [acc[0] + lat / f.coords.length, acc[1] + lng / f.coords.length],
                    [0, 0]
                ) as [number, number];

                return f.type === 'polygon' && f.coords.length > 3 ? (
                    <React.Fragment key={f.id}>
                        <Polygon
                            positions={f.coords}
                            pathOptions={{ color, fillColor: color, fillOpacity: 0.3, weight: 1.5, opacity: 0.9 }}
                        >
                            <Tooltip sticky>{f.name.replace(/^powerstar\s+/i, '')}</Tooltip>
                        </Polygon>
                        {/* Visible marker dot for overview zoom */}
                        <CircleMarker
                            center={centroid}
                            radius={5}
                            pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1 }}
                        >
                            <Popup>
                                <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                    <strong>{f.name.replace(/^powerstar\s+/i, '')}</strong><br />
                                    {centroid[0].toFixed(4)}° S, {centroid[1].toFixed(4)}° E
                                </div>
                            </Popup>
                        </CircleMarker>
                    </React.Fragment>
                ) : (
                    <CircleMarker
                        key={f.id}
                        center={f.coords[0]}
                        radius={5}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1 }}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                <strong>{f.name.replace(/^powerstar\s+/i, '')}</strong><br />
                                {f.coords[0][0].toFixed(4)}° S, {f.coords[0][1].toFixed(4)}° E
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
};

/** Supplier locations map — zooms into the supplier hotspot area */
const SuppliersMap: React.FC<{ features: KMLFeature[] }> = ({ features }) => {
    const color = TIER_COLORS.suppliers;
    return (
        <MapContainer
            bounds={SA_BOUNDS}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            scrollWheelZoom={false}
        >
            <TileLayer url={DARK_TILE} attribution={DARK_TILE_ATTR} />
            {features.map(f => {
                const center = f.coords[0];
                return (
                    <React.Fragment key={f.id}>
                        {f.coords.length > 3 && (
                            <Polygon
                                positions={f.coords}
                                pathOptions={{ color, fillColor: color, fillOpacity: 0.28, weight: 1.5 }}
                            />
                        )}
                        <CircleMarker
                            center={center}
                            radius={6}
                            pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1 }}
                        >
                            <Popup>
                                <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                    <strong>{f.name}</strong>
                                </div>
                            </Popup>
                        </CircleMarker>
                    </React.Fragment>
                );
            })}
        </MapContainer>
    );
};

/** Factory close-up map — PMB factory zone */
const FactoryMap: React.FC<{ features: KMLFeature[] }> = ({ features }) => {
    const color = TIER_COLORS.factory;
    // PMB factory approx
    const center: [number, number] = [-29.6456, 30.4135];
    return (
        <MapContainer
            center={center}
            zoom={16}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            scrollWheelZoom={false}
        >
            <TileLayer url={DARK_TILE} attribution={DARK_TILE_ATTR} />
            {features.map(f => (
                <React.Fragment key={f.id}>
                    <Polygon
                        positions={f.coords}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 2, opacity: 0.95 }}
                    >
                        <Tooltip sticky>{f.name}</Tooltip>
                    </Polygon>
                </React.Fragment>
            ))}
            {/* Centre marker for factory */}
            <CircleMarker
                center={center}
                radius={8}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
            >
                <Popup>
                    <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                        <strong>Powerstar Assembly Plant</strong><br />
                        Pietermaritzburg, KZN
                    </div>
                </Popup>
            </CircleMarker>
        </MapContainer>
    );
};

/** Cross-border map — wide view with border crossing markers */
const CrossBorderMap: React.FC<{ dealerships: KMLFeature[] }> = ({ dealerships }) => {
    const color = TIER_COLORS.crossborder;

    // Key border crossings / country dealers
    const crossBorderPoints: { name: string; pos: [number, number]; country: string }[] = [
        { name: 'Beit Bridge — Zimbabwe',     pos: [-22.2035, 29.9975], country: 'ZW' },
        { name: 'Ramatlabama — Botswana',     pos: [-25.8745, 25.6345], country: 'BW' },
        { name: 'Maseru Bridge — Lesotho',    pos: [-29.3226, 27.4727], country: 'LS' },
        { name: 'Oshoek — Eswatini',          pos: [-25.9785, 31.2140], country: 'SZ' },
        { name: 'Lebombo — Mozambique',       pos: [-25.1025, 32.0605], country: 'MZ' },
        { name: 'Vioolsdrift — Namibia',      pos: [-28.7667, 17.7167], country: 'NA' },
    ];

    // Cross-border dealer polygons (Zimbabwe, Swaziland, Botswana, Namibia)
    const crossBorderDealers = dealerships.filter(d =>
        /botswana|zimbabwe|zim|swaziland|namibia/i.test(d.name)
    );

    // Bounds encompassing SA + all neighbors
    const widenedBounds: L.LatLngBoundsLiteral = [[-36, 11], [-15, 36]];

    return (
        <MapContainer
            bounds={widenedBounds}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            scrollWheelZoom={false}
        >
            <TileLayer url={DARK_TILE} attribution={DARK_TILE_ATTR} />
            {/* Border crossings */}
            {crossBorderPoints.map(p => (
                <CircleMarker
                    key={p.name}
                    center={p.pos}
                    radius={7}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1.5 }}
                >
                    <Popup>
                        <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                            <strong>{p.name}</strong><br />
                            Country code: {p.country}
                        </div>
                    </Popup>
                    <Tooltip permanent direction="top" offset={[0, -8]}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace' }}>{p.name.split('—')[1]?.trim()}</span>
                    </Tooltip>
                </CircleMarker>
            ))}
            {/* Cross-border dealership polygons */}
            {crossBorderDealers.map(f => {
                const centroid = f.coords.reduce(
                    (acc, [lat, lng]) => [acc[0] + lat / f.coords.length, acc[1] + lng / f.coords.length],
                    [0, 0]
                ) as [number, number];
                return (
                    <React.Fragment key={f.id}>
                        <Polygon
                            positions={f.coords}
                            pathOptions={{ color: '#a78bfa', fillColor: '#a78bfa', fillOpacity: 0.3, weight: 1.5 }}
                        >
                            <Tooltip sticky>{f.name.replace(/^powerstar\s+/i, '')}</Tooltip>
                        </Polygon>
                        <CircleMarker
                            center={centroid}
                            radius={5}
                            pathOptions={{ color: '#a78bfa', fillColor: '#a78bfa', fillOpacity: 0.9, weight: 1 }}
                        />
                    </React.Fragment>
                );
            })}
        </MapContainer>
    );
};

// ── Overview Map — all tiers layered ──────────────────────────────────────────

const OverviewMap: React.FC<{ data: KMLData }> = ({ data }) => {
    // Wide enough to show SA + cross-border neighbours
    const bounds: L.LatLngBoundsLiteral = [[-36, 11], [-16, 36]];

    const centroid = (coords: [number, number][]): [number, number] =>
        coords.reduce(
            (acc, [lat, lng]) => [acc[0] + lat / coords.length, acc[1] + lng / coords.length],
            [0, 0] as [number, number]
        );

    const LEGEND = [
        { color: '#6366f1', label: 'Provinces'    },
        { color: '#10b981', label: 'Dealerships'  },
        { color: '#f59e0b', label: 'Suppliers'    },
        { color: '#f97316', label: 'Factory'      },
        { color: '#3b82f6', label: 'Cross-Border' },
        { color: '#ef4444', label: `${OFFLINE_TRUCKS.length} Offline` },
    ];

    return (
        <div className="rounded-2xl overflow-hidden border border-slate-700/70 shadow-2xl" style={{ background: '#0f172a' }}>
            {/* Header bar */}
            <div className="px-5 py-3 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">
                        All Zones — Live Overview
                    </p>
                    <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">
                        {data.provinces.length} prov · {data.dealerships.length + data.crossBorderDealers.length} dealers · {data.suppliers.length} suppliers
                    </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    {LEGEND.map(item => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full ring-1 ring-white/10"
                                 style={{ background: item.color }} />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map */}
            <div className="h-[600px]">
                <MapContainer
                    bounds={bounds}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                    zoomControl
                >
                    <TileLayer url={DARK_TILE} attribution={DARK_TILE_ATTR} />

                    {/* ── Province outlines ── */}
                    {data.provinces.map(prov => (
                        <Polygon
                            key={prov.id}
                            positions={prov.coords}
                            pathOptions={{
                                color: '#6366f1', fillColor: '#6366f1',
                                fillOpacity: 0.1, weight: 1.6, opacity: 0.75,
                            }}
                        >
                            <Tooltip sticky>{displayName(prov.name)}</Tooltip>
                        </Polygon>
                    ))}

                    {/* ── Supplier sites ── */}
                    {data.suppliers.map(f => (
                        <CircleMarker
                            key={f.id}
                            center={f.coords[0]}
                            radius={4}
                            pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9, weight: 1 }}
                        >
                            <Tooltip sticky>
                                <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{f.name}</span>
                            </Tooltip>
                        </CircleMarker>
                    ))}

                    {/* ── SA dealerships ── */}
                    {data.dealerships.map(f => (
                        <CircleMarker
                            key={f.id}
                            center={centroid(f.coords)}
                            radius={5}
                            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.85, weight: 1 }}
                        >
                            <Tooltip sticky>
                                <span style={{ fontFamily: 'monospace', fontSize: 10 }}>
                                    {f.name.replace(/^powerstar\s+/i, '')}
                                </span>
                            </Tooltip>
                        </CircleMarker>
                    ))}

                    {/* ── Cross-border dealerships ── */}
                    {data.crossBorderDealers.map(f => (
                        <CircleMarker
                            key={f.id}
                            center={centroid(f.coords)}
                            radius={5}
                            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.85, weight: 1 }}
                        >
                            <Tooltip sticky>
                                <span style={{ fontFamily: 'monospace', fontSize: 10 }}>
                                    {f.name.replace(/^powerstar\s+/i, '')}
                                </span>
                            </Tooltip>
                        </CircleMarker>
                    ))}

                    {/* ── Offline trucks — last known position ── */}
                    {OFFLINE_TRUCKS.map(t => (
                        <CircleMarker
                            key={t.id}
                            center={[t.lat, t.lng]}
                            radius={4}
                            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.85, weight: 1 }}
                        >
                            <Tooltip sticky>
                                <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: '1.5' }}>
                                    <strong>{t.stock}</strong> — {t.model}<br />
                                    {REASON_LABEL[t.reason]} · {fmtOffline(t.hoursOffline)}<br />
                                    {t.dealer}
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    ))}

                    {/* ── Factory ── */}
                    {(data.factory.length > 0 ? data.factory : [null]).map((f, i) => {
                        const pos: [number, number] = f
                            ? centroid(f.coords)
                            : [-29.6456, 30.4135]; // PMB fallback
                        return (
                            <React.Fragment key={f?.id ?? 'factory-fallback'}>
                                {/* Pulse ring */}
                                <CircleMarker
                                    center={pos}
                                    radius={18}
                                    pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.08, weight: 1, opacity: 0.4 }}
                                />
                                {/* Core dot */}
                                <CircleMarker
                                    center={pos}
                                    radius={7}
                                    pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.95, weight: 2 }}
                                >
                                    <Tooltip permanent direction="top" offset={[0, -12]}>
                                        <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' }}>
                                            PMB Factory
                                        </span>
                                    </Tooltip>
                                </CircleMarker>
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
};

// ── Offline trucks map ─────────────────────────────────────────────────────────

interface OfflineTruckPlaced extends OfflineTruck {
    province: string;
    zone: ZoneType;
    zoneName: string;
}

const ZONE_TYPES: ZoneType[] = ['factory', 'dealership', 'supplier', 'province'];

const OfflineTrucksMap: React.FC<{ trucks: OfflineTruckPlaced[]; provinces: KMLFeature[] }> = ({ trucks, provinces }) => (
    <MapContainer
        bounds={SA_BOUNDS}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        scrollWheelZoom={false}
        zoomControl
    >
        <TileLayer url={DARK_TILE} attribution={DARK_TILE_ATTR} />
        {provinces.map(p => (
            <Polygon key={p.id} positions={p.coords}
                pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.07, weight: 1.2, opacity: 0.45 }} />
        ))}
        {trucks.map(t => (
            <CircleMarker key={t.id} center={[t.lat, t.lng]} radius={6}
                pathOptions={{ color: ZONE_COLOR[t.zone], fillColor: ZONE_COLOR[t.zone], fillOpacity: 0.9, weight: 1.5 }}
            >
                <Tooltip sticky>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: '1.6' }}>
                        <strong>{t.stock}</strong> — {t.model}<br />
                        Zone: <strong>{ZONE_LABEL[t.zone]}</strong>
                        {t.zone !== 'province' && <> ({t.zoneName})</>}<br />
                        Province: {t.province}<br />
                        {REASON_LABEL[t.reason]} · Offline {fmtOffline(t.hoursOffline)}
                    </div>
                </Tooltip>
            </CircleMarker>
        ))}
    </MapContainer>
);

// ── Offline by province panel ──────────────────────────────────────────────────

const OfflineByProvincePanel: React.FC<{ trucks: OfflineTruckPlaced[] }> = ({ trucks }) => {
    const groups = useMemo(() => {
        const map = new Map<string, OfflineTruckPlaced[]>();
        trucks.forEach(t => {
            const arr = map.get(t.province) ?? [];
            arr.push(t);
            map.set(t.province, arr);
        });
        return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
    }, [trucks]);

    const totalByZone = useMemo(() => {
        const counts: Record<ZoneType, number> = { factory: 0, dealership: 0, supplier: 0, province: 0 };
        trucks.forEach(t => counts[t.zone]++);
        return counts;
    }, [trucks]);

    return (
        <div className="space-y-4">
            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ZONE_TYPES.map(z => (
                    <div key={z} className="bg-white border border-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                             style={{ background: ZONE_COLOR[z] + '18', border: `1px solid ${ZONE_COLOR[z]}30` }}>
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: ZONE_COLOR[z] }} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-800">{totalByZone[z]}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                                {ZONE_LABEL[z]}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-red-500" />
                <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                    {trucks.length} Offline — By Province & Zone
                </p>
                <div className="flex-1" />
                {ZONE_TYPES.map(z => (
                    <div key={z} className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full" style={{ background: ZONE_COLOR[z] }} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider hidden md:block">
                            {ZONE_LABEL[z]}
                        </span>
                    </div>
                ))}
            </div>

            {/* Province cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groups.map(([province, list]) => {
                    const byZone = Object.fromEntries(
                        ZONE_TYPES.map(z => [z, list.filter(t => t.zone === z)])
                    ) as Record<ZoneType, OfflineTruckPlaced[]>;

                    const provinceOnlyCount = byZone.province.length;
                    const dealershipCount   = byZone.dealership.length;
                    const total             = list.length;
                    const nonDealerTotal    = total - dealershipCount;
                    const worstHours        = Math.max(...list.map(t => t.hoursOffline));
                    const severityColor     = total >= 10 ? '#ef4444' : total >= 5 ? '#f97316' : '#f59e0b';

                    return (
                        <div key={province}
                             className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                            {/* Province header */}
                            <div className="px-4 py-3 border-b border-border flex items-start justify-between"
                                 style={{ borderLeftWidth: 3, borderLeftColor: severityColor }}>
                                <div>
                                    <p className="text-[13px] font-black text-slate-800 uppercase tracking-tight">
                                        {province}
                                    </p>
                                    <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                                        worst: {fmtOffline(worstHours)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black leading-none" style={{ color: severityColor }}>
                                        {total}
                                    </p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">total</p>
                                </div>
                            </div>

                            {/* Zone breakdown bar */}
                            <div className="flex h-1.5">
                                {ZONE_TYPES.filter(z => byZone[z].length > 0).map(z => (
                                    <div key={z} style={{ flex: byZone[z].length, background: ZONE_COLOR[z], opacity: 0.8 }} />
                                ))}
                            </div>

                            {/* Zone counts */}
                            <div className="px-4 pt-2.5 pb-1 grid grid-cols-2 gap-x-3 gap-y-1">
                                {ZONE_TYPES.filter(z => byZone[z].length > 0).map(z => (
                                    <div key={z} className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full" style={{ background: ZONE_COLOR[z] }} />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">
                                                {ZONE_LABEL[z]}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-black" style={{ color: ZONE_COLOR[z] }}>
                                            {byZone[z].length}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Province totals */}
                            <div className="mx-4 mt-2 mb-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">In Province Only</p>
                                    <p className="text-[15px] font-black text-slate-700">{provinceOnlyCount}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ex-Dealership</p>
                                    <p className="text-[15px] font-black text-slate-700">{nonDealerTotal}</p>
                                    <p className="text-[8px] text-slate-400">({total} − {dealershipCount} dealers)</p>
                                </div>
                            </div>

                            {/* Stock tags coloured by zone */}
                            <div className="px-4 pb-3 flex flex-wrap gap-1">
                                {list.slice(0, 6).map(t => (
                                    <span key={t.id}
                                          className="px-1.5 py-0.5 rounded text-[8px] font-black font-mono border"
                                          style={{
                                              background: ZONE_COLOR[t.zone] + '12',
                                              borderColor: ZONE_COLOR[t.zone] + '35',
                                              color: ZONE_COLOR[t.zone],
                                          }}>
                                        {t.stock}
                                    </span>
                                ))}
                                {list.length > 6 && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black text-slate-400 bg-slate-50 border border-slate-200">
                                        +{list.length - 6}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── KPI Bar ────────────────────────────────────────────────────────────────────

const KpiBar: React.FC<{
    provinceCount: number;
    dealerCount: number;
    supplierCount: number;
    factoryCount: number;
    crossBorderDealers: number;
}> = ({ provinceCount, dealerCount, supplierCount, factoryCount, crossBorderDealers }) => {
    const items = [
        { label: 'Province Zones',        value: provinceCount,      icon: Map,        color: '#6366f1' },
        { label: 'Dealership Zones',      value: dealerCount,        icon: Building2,  color: '#10b981' },
        { label: 'Supplier Zones',        value: supplierCount,      icon: Package,    color: '#f59e0b' },
        { label: 'Factory Zones',         value: factoryCount,       icon: Factory,    color: '#f97316' },
        { label: 'Cross-Border Dealers',  value: crossBorderDealers, icon: Globe,      color: '#3b82f6' },
    ];
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {items.map(k => (
                <div key={k.label} className="bg-white border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                         style={{ background: k.color + '18', border: `1px solid ${k.color}30` }}>
                        <k.icon style={{ color: k.color, height: 16, width: 16 }} />
                    </div>
                    <div>
                        <p className="text-xl font-black text-slate-800">{k.value}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight mt-0.5">{k.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ── Province coverage list ─────────────────────────────────────────────────────

const ProvinceList: React.FC<{ loadedProvinces: string[] }> = ({ loadedProvinces }) => {
    const loaded = new Set(loadedProvinces.map(n => displayName(n)));
    return (
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Layers style={{ height: 14, width: 14 }} className="text-accent" />
                Province KML Coverage — {USER_PROVINCES.length} Defined
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                {USER_PROVINCES.map(prov => {
                    const hasKml = loaded.has(prov);
                    return (
                        <div key={prov} className={cn(
                            'flex flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 border text-center',
                            hasKml
                                ? 'bg-indigo-50 border-indigo-200'
                                : 'bg-slate-50 border-slate-200 opacity-60'
                        )}>
                            <div className={cn('h-2 w-2 rounded-full', hasKml ? 'bg-indigo-500' : 'bg-slate-300')} />
                            <p className={cn('text-[10px] font-black leading-tight', hasKml ? 'text-indigo-700' : 'text-slate-500')}>
                                {prov}
                            </p>
                            <p className={cn('text-[8px] font-black uppercase', hasKml ? 'text-indigo-500' : 'text-slate-400')}>
                                {hasKml ? 'KML loaded' : 'Pending'}
                            </p>
                        </div>
                    );
                })}
            </div>
            {loadedProvinces.length < USER_PROVINCES.length && (
                <p className="text-[10px] text-slate-400 mt-3">
                    {USER_PROVINCES.length - loadedProvinces.length} province{USER_PROVINCES.length - loadedProvinces.length > 1 ? 's' : ''} pending KML — add to <code className="bg-slate-100 px-1 rounded text-[9px]">public/kml/factory-suppliers.kml</code>
                </p>
            )}
        </div>
    );
};

// ── Dealership list ────────────────────────────────────────────────────────────

const DealershipList: React.FC<{ features: KMLFeature[] }> = ({ features }) => (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-border bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {features.length} Dealership Zones — from KML
            </p>
        </div>
        <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {features.map(f => {
                const centroid = f.coords.reduce(
                    (acc, [lat, lng]) => [acc[0] + lat / f.coords.length, acc[1] + lng / f.coords.length],
                    [0, 0]
                ) as [number, number];
                const isCross = /botswana|zimbabwe|zim|swaziland|namibia/i.test(f.name);
                return (
                    <div key={f.id} className="flex items-center gap-3 px-5 py-2.5">
                        <div className={cn(
                            'h-2 w-2 rounded-full shrink-0',
                            isCross ? 'bg-blue-400' : 'bg-emerald-400'
                        )} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-slate-700 truncate">
                                {f.name.replace(/^powerstar\s+/i, '')}
                            </p>
                        </div>
                        <p className="text-[9px] font-mono text-slate-400 shrink-0">
                            {centroid[0].toFixed(3)}°, {centroid[1].toFixed(3)}°
                        </p>
                    </div>
                );
            })}
        </div>
    </div>
);

// ── Supplier list ──────────────────────────────────────────────────────────────

const SupplierList: React.FC<{ features: KMLFeature[] }> = ({ features }) => (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-border bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {features.length} Supplier Zones — from KML
            </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-50">
            {features.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                        <Package style={{ height: 12, width: 12 }} className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-700 truncate">{f.name}</p>
                        <p className="text-[9px] font-mono text-slate-400">
                            {f.coords[0][0].toFixed(3)}°, {f.coords[0][1].toFixed(3)}°
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

type LoadState = 'loading' | 'loaded' | 'error';

interface KMLData {
    provinces: KMLFeature[];
    suppliers: KMLFeature[];
    dealerships: KMLFeature[];
    factory: KMLFeature[];
    crossBorderDealers: KMLFeature[];
}

const TIERS: { key: ZoneTier; label: string; icon: React.ElementType }[] = [
    { key: 'provincial',  label: 'Provincial',   icon: Map       },
    { key: 'dealerships', label: 'Dealerships',  icon: Building2 },
    { key: 'suppliers',   label: 'Suppliers',    icon: Package   },
    { key: 'factory',     label: 'Factory',       icon: Factory   },
    { key: 'crossborder', label: 'Cross-Border', icon: Globe     },
    { key: 'offline',     label: `Offline (${OFFLINE_TRUCKS.length})`, icon: WifiOff },
];

const GeoZones: React.FC = () => {
    const [activeTier, setActiveTier] = useState<ZoneTier>('provincial');
    const [loadState, setLoadState] = useState<LoadState>('loading');
    const [kml, setKml] = useState<KMLData>({
        provinces: [], suppliers: [], dealerships: [],
        factory: [], crossBorderDealers: [],
    });

    useEffect(() => {
        async function load() {
            try {
                const [fsRes, dlRes] = await Promise.all([
                    fetch('/kml/factory-suppliers.kml'),
                    fetch('/kml/dealerships.kml'),
                ]);
                const [fsText, dlText] = await Promise.all([fsRes.text(), dlRes.text()]);
                const fsFeatures = parseKML(fsText);
                const dlFeatures = parseKML(dlText);

                const provinces  = fsFeatures.filter(f => isProvince(f.name) && f.coords.length > 20);
                const suppliers  = fsFeatures.filter(f => !isProvince(f.name) && f.coords.length < 50);
                const factory    = dlFeatures.filter(f => /factory|pietermaritzburg|pmb/i.test(f.name));
                const crossBorderDealers = dlFeatures.filter(f =>
                    /botswana|zimbabwe|zim|swaziland|namibia/i.test(f.name)
                );
                const dealerships = dlFeatures.filter(f =>
                    !factory.includes(f) && !crossBorderDealers.includes(f)
                );

                setKml({ provinces, suppliers, dealerships, factory, crossBorderDealers });
                setLoadState('loaded');
            } catch {
                setLoadState('error');
            }
        }
        load();
    }, []);

    const provinceNames = useMemo(
        () => kml.provinces.map(p => p.name),
        [kml.provinces]
    );

    const allDealers = useMemo(
        () => [...kml.dealerships, ...kml.crossBorderDealers],
        [kml.dealerships, kml.crossBorderDealers]
    );

    // Assign each offline truck to province + zone using point-in-polygon + name lookup
    const offlinePlaced = useMemo<OfflineTruckPlaced[]>(() => {
        if (kml.provinces.length === 0) return [];
        return OFFLINE_TRUCKS.map(t => ({
            ...t,
            ...assignFullZone(t, kml.provinces),
        }));
    }, [kml.provinces]);

    const color = TIER_COLORS[activeTier] ?? '#ef4444';

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-accent/10 border border-accent/20 rounded-xl">
                            <MapPin className="h-5 w-5 text-accent" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Geo Zones</h1>
                    </div>
                    <p className="text-[12px] text-slate-500 ml-[52px]">
                        Live geographic boundaries — provincial, dealership, supplier, factory and cross-border tiers.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {loadState === 'loading' && (
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                            <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                            <span className="text-[11px] font-black text-blue-700 uppercase tracking-widest">Loading KML…</span>
                        </div>
                    )}
                    {loadState === 'loaded' && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">KML Loaded</span>
                        </div>
                    )}
                    {loadState === 'error' && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                            <span className="text-[11px] font-black text-red-700 uppercase tracking-widest">KML Error</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        <Radio className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-[11px] font-black text-red-700 uppercase tracking-widest">
                            Armed Zones Active
                        </span>
                    </div>
                </div>
            </div>

            {/* ── KPI Bar ── */}
            {loadState === 'loaded' && (
                <KpiBar
                    provinceCount={kml.provinces.length}
                    dealerCount={kml.dealerships.length}
                    supplierCount={kml.suppliers.length}
                    factoryCount={kml.factory.length}
                    crossBorderDealers={kml.crossBorderDealers.length}
                />
            )}

            {/* ── Overview Map ── */}
            {loadState === 'loading' && (
                <div className="h-[600px] rounded-2xl border border-slate-700 bg-slate-900 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <RefreshCw className="h-8 w-8 text-slate-500 animate-spin mx-auto" />
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Loading geo zones…</p>
                    </div>
                </div>
            )}
            {loadState === 'loaded' && <OverviewMap data={kml} />}

            {/* ── Tier Tabs ── */}
            <div className="overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
                <div className="flex gap-2 min-w-max">
                    {TIERS.map(t => {
                        const tc = TIER_COLORS[t.key];
                        const active = activeTier === t.key;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setActiveTier(t.key)}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-3 rounded-xl border transition-all duration-150 text-left',
                                    active
                                        ? 'bg-white border-slate-200 shadow-sm'
                                        : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                                )}
                            >
                                <t.icon
                                    className="h-4 w-4 shrink-0"
                                    style={{ color: active ? tc : '#94a3b8' }}
                                />
                                <span
                                    className="text-[12px] font-black tracking-tight"
                                    style={{ color: active ? tc : '#64748b' }}
                                >
                                    {t.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Map Area ── */}
            {loadState === 'loading' && (
                <div className="h-[480px] bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center">
                    <div className="text-center space-y-2">
                        <RefreshCw className="h-8 w-8 text-slate-500 animate-spin mx-auto" />
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Parsing KML zones…</p>
                    </div>
                </div>
            )}
            {loadState === 'error' && (
                <div className="h-[480px] bg-slate-900 rounded-2xl border border-red-900/40 flex items-center justify-center">
                    <div className="text-center space-y-2">
                        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
                        <p className="text-[11px] font-black text-red-400 uppercase tracking-widest">Failed to load KML files</p>
                        <p className="text-[10px] text-slate-500">Check <code className="bg-slate-800 px-1 rounded">public/kml/</code></p>
                    </div>
                </div>
            )}
            {loadState === 'loaded' && (
                <div
                    className="rounded-2xl border overflow-hidden shadow-sm"
                    style={{ borderColor: color + '40', background: '#0f172a' }}
                >
                    {/* Map header */}
                    <div className="px-5 py-3 border-b flex items-center justify-between"
                         style={{ borderColor: color + '30' }}>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: color }} />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                {TIERS.find(t => t.key === activeTier)?.label}
                                {activeTier === 'provincial'  && ` — ${kml.provinces.length} provinces loaded`}
                                {activeTier === 'dealerships' && ` — ${kml.dealerships.length} SA dealerships`}
                                {activeTier === 'suppliers'   && ` — ${kml.suppliers.length} supplier sites`}
                                {activeTier === 'factory'     && ` — Pietermaritzburg`}
                                {activeTier === 'crossborder' && ` — ${kml.crossBorderDealers.length} border dealers`}
                                {activeTier === 'offline'     && ` — ${OFFLINE_TRUCKS.length} vehicles · last known position`}
                            </p>
                        </div>
                        <p className="text-[9px] text-slate-600 font-mono">KML SOURCE</p>
                    </div>

                    {/* Map container */}
                    <div className="h-[500px]">
                        {activeTier === 'provincial'  && <ProvinceMap features={kml.provinces} />}
                        {activeTier === 'dealerships' && <DealershipsMap features={kml.dealerships} />}
                        {activeTier === 'suppliers'   && <SuppliersMap features={kml.suppliers} />}
                        {activeTier === 'factory'     && <FactoryMap features={kml.factory} />}
                        {activeTier === 'crossborder' && <CrossBorderMap dealerships={allDealers} />}
                        {activeTier === 'offline'     && <OfflineTrucksMap trucks={offlinePlaced} provinces={kml.provinces} />}
                    </div>
                </div>
            )}

            {/* ── Data panels below the map ── */}
            {loadState === 'loaded' && (
                <div className="space-y-4">
                    {activeTier === 'provincial' && (
                        <>
                            <ProvinceList loadedProvinces={provinceNames} />
                            {kml.provinces.length < USER_PROVINCES.length && (
                                <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl p-4">
                                    <AlertTriangle className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-black text-violet-800 uppercase tracking-widest">
                                            Remaining provinces pending KML
                                        </p>
                                        <p className="text-[11px] text-violet-700 mt-0.5 leading-relaxed">
                                            Add province boundary polygons for{' '}
                                            {USER_PROVINCES
                                                .filter(p => !kml.provinces.map(pp => displayName(pp.name)).includes(p))
                                                .join(', ')}{' '}
                                            to <code className="bg-violet-100 px-1 rounded text-[10px]">public/kml/factory-suppliers.kml</code> as named Placemarks.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTier === 'dealerships' && (
                        <DealershipList features={allDealers} />
                    )}

                    {activeTier === 'suppliers' && (
                        <SupplierList features={kml.suppliers} />
                    )}

                    {activeTier === 'factory' && (
                        <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <Shield className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[11px] font-black text-orange-800 uppercase tracking-widest">Armed Zone — Entry/Exit Logging</p>
                                <p className="text-[11px] text-orange-700 mt-0.5 leading-relaxed">
                                    All factory zones are armed. Every vehicle entry and exit is timestamped — used for dispatch
                                    fluid theft detection, dwell time monitoring, and pre-delivery sign-off confirmation.
                                    {kml.factory.length > 0 && ` ${kml.factory.length} factory zone polygon${kml.factory.length > 1 ? 's' : ''} loaded from KML.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTier === 'crossborder' && (
                        <>
                            <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl p-4">
                                <AlertTriangle className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-black text-violet-800 uppercase tracking-widest">Planned Expansion</p>
                                    <p className="text-[11px] text-violet-700 mt-0.5 leading-relaxed">
                                        Active border zones shown above cover current cross-border routes.
                                        Planned expansion to Zambia, Malawi, Tanzania pending BICS SIM coverage confirmation.
                                    </p>
                                </div>
                            </div>
                            {kml.crossBorderDealers.length > 0 && (
                                <DealershipList features={kml.crossBorderDealers} />
                            )}
                        </>
                    )}

                    {activeTier === 'offline' && offlinePlaced.length > 0 && (
                        <OfflineByProvincePanel trucks={offlinePlaced} />
                    )}
                    {activeTier === 'offline' && offlinePlaced.length === 0 && (
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                            <p className="text-[11px] text-slate-500">Assigning provinces via point-in-polygon…</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GeoZones;
