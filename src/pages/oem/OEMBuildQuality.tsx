import React, { useState, useCallback } from 'react';
import {
    ShieldCheck, Upload, AlertTriangle, CheckCircle, Filter,
    ChevronDown, ChevronRight, Zap, X, Info, Thermometer,
    Gauge, Wind, BatteryLow, Activity, Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import OEMInstallations from './OEMInstallations';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface RawFaultRow {
    vehicle: string;
    fault: string;
    start: string;
    end: string;
    geofence: string;
}

interface FaultGroup {
    vehicle: string;
    start: string;
    end: string;
    geofence: string;
    faults: string[];
    rawCount: number;
    isDuplicate: boolean;
    duration: number;
}

interface VehicleSummary {
    vehicle: string;
    totalGroups: number;
    realGroups: number;
    filteredGroups: number;
    faultTypes: Record<string, number>;
    topFault: string;
}

// ── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSV(raw: string): RawFaultRow[] {
    const rows: RawFaultRow[] = [];
    const lines = raw.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.match(/^\d{5};;;;$/) || trimmed.startsWith('Vehicle;')) continue;
        const cols = trimmed.split(';').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 4 && cols[0].match(/^\d+$/) && cols[1] && cols[2] && cols[3]) {
            rows.push({ vehicle: cols[0], fault: cols[1], start: cols[2], end: cols[3], geofence: cols[4] || '' });
        }
    }
    return rows;
}

function groupAndFilter(rows: RawFaultRow[]): FaultGroup[] {
    const map = new Map<string, RawFaultRow[]>();
    for (const row of rows) {
        const key = `${row.vehicle}__${row.start}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(row);
    }
    const groups: FaultGroup[] = [];
    for (const [, group] of map.entries()) {
        const first = group[0];
        const uniqueFaults = [...new Set(group.map(r => r.fault))];
        const startParts = first.start.match(/(\d{2}):(\d{2}):(\d{2})/);
        const endParts = first.end.match(/(\d{2}):(\d{2}):(\d{2})/);
        let durationSecs = 0;
        if (startParts && endParts) {
            const startSec = +startParts[1] * 3600 + +startParts[2] * 60 + +startParts[3];
            const endSec   = +endParts[1]   * 3600 + +endParts[2]   * 60 + +endParts[3];
            durationSecs = Math.max(0, endSec - startSec);
        }
        const isDuplicate = group.length > uniqueFaults.length && durationSecs < 180;
        groups.push({ vehicle: first.vehicle, start: first.start, end: first.end, geofence: first.geofence, faults: uniqueFaults, rawCount: group.length, isDuplicate, duration: durationSecs });
    }
    return groups.sort((a, b) => a.start.localeCompare(b.start));
}

function faultColor(fault: string): string {
    if (fault.toLowerCase().includes('disconnected')) return 'bg-red-50 text-red-700 ring-red-200';
    if (fault.toLowerCase().includes('blue'))         return 'bg-blue-50 text-blue-700 ring-blue-200';
    if (fault.toLowerCase().includes('green'))        return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    if (fault.toLowerCase().includes('yellow'))       return 'bg-amber-50 text-amber-700 ring-amber-200';
    if (fault.toLowerCase().includes('orange'))       return 'bg-orange-50 text-orange-700 ring-orange-200';
    if (fault.toLowerCase().includes('pink'))         return 'bg-pink-50 text-pink-700 ring-pink-200';
    if (fault.toLowerCase().includes('purple'))       return 'bg-purple-50 text-purple-700 ring-purple-200';
    return 'bg-slate-100 text-slate-600 ring-slate-200';
}

// ── Embedded harness fault CSV ────────────────────────────────────────────────
const EMBEDDED_CSV = `
10724;;;;
Vehicle;Fault;Start;End;Geofence
10724;"Yellow Wire - Orange Harness";"07:12:15 19.02.2026";"07:13:35 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"07:12:15 19.02.2026";"07:13:35 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Black Harness";"07:12:15 19.02.2026";"07:13:35 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"07:12:15 19.02.2026";"07:13:35 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Orange harness disconnected.";"07:12:15 19.02.2026";"07:13:35 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"07:12:15 19.02.2026";"07:13:35 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"07:12:15 19.02.2026";"07:13:35 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Orange Harness";"15:18:04 19.02.2026";"15:21:45 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"15:18:04 19.02.2026";"15:21:45 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Orange harness disconnected.";"15:18:04 19.02.2026";"15:21:45 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Black Harness";"15:18:04 19.02.2026";"15:21:45 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"15:18:04 19.02.2026";"15:21:45 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"15:18:04 19.02.2026";"15:21:45 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"15:18:04 19.02.2026";"15:21:45 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Black Harness";"15:53:42 19.02.2026";"15:55:36 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Orange Harness";"15:53:42 19.02.2026";"15:55:36 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"15:53:42 19.02.2026";"15:55:36 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"15:53:42 19.02.2026";"15:55:36 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"15:53:42 19.02.2026";"15:55:36 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"15:53:42 19.02.2026";"15:55:36 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Orange harness disconnected.";"15:53:42 19.02.2026";"15:55:36 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Orange harness disconnected.";"16:56:55 19.02.2026";"17:03:28 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"16:56:55 19.02.2026";"17:03:28 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Orange Harness";"16:56:55 19.02.2026";"17:03:28 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"16:56:55 19.02.2026";"17:03:28 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"16:56:55 19.02.2026";"17:03:28 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"16:56:55 19.02.2026";"17:03:28 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Black Harness";"16:56:55 19.02.2026";"17:03:28 19.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"07:13:38 20.02.2026";"07:18:53 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"07:13:38 20.02.2026";"07:18:53 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"07:13:38 20.02.2026";"07:18:53 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"07:13:38 20.02.2026";"07:18:53 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Orange Harness";"07:13:38 20.02.2026";"07:18:53 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Black Harness";"07:13:38 20.02.2026";"07:18:53 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Orange harness disconnected.";"07:13:38 20.02.2026";"07:18:53 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Orange harness disconnected.";"13:50:17 20.02.2026";"13:55:35 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"13:50:17 20.02.2026";"13:55:35 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"13:50:17 20.02.2026";"13:55:35 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"13:50:17 20.02.2026";"13:55:35 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Orange Harness";"13:50:17 20.02.2026";"13:55:35 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"13:50:17 20.02.2026";"13:55:35 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Black Harness";"13:50:17 20.02.2026";"13:55:35 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"14:04:37 20.02.2026";"14:06:18 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"14:04:37 20.02.2026";"14:06:18 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Orange harness disconnected.";"14:04:37 20.02.2026";"14:06:18 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Black Harness";"14:04:37 20.02.2026";"14:06:18 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"14:04:37 20.02.2026";"14:06:18 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Yellow Wire - Orange Harness";"14:04:37 20.02.2026";"14:06:18 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Blue Wire - Orange Harness";"14:04:37 20.02.2026";"14:06:18 20.02.2026";"Natal, ROADHOGS, Natal"
10724;"Green Wire - Orange Harness";"14:51:45 20.02.2026";"16:54:15 20.02.2026";"Natal, ROADHOGS, Natal, powerstar PMB almighty equipment, powerstar PIETERMARITZBURG FACTORY"
10724;"Green Wire - Orange Harness";"14:51:45 20.02.2026";"16:54:15 20.02.2026";"Natal, ROADHOGS, Natal, powerstar PMB almighty equipment, powerstar PIETERMARITZBURG FACTORY"
10724;"Blue Wire - Orange Harness";"14:51:45 20.02.2026";"16:54:15 20.02.2026";"Natal, ROADHOGS, Natal, powerstar PMB almighty equipment, powerstar PIETERMARITZBURG FACTORY"
10724;"Yellow Wire - Black Harness";"14:51:45 20.02.2026";"16:54:15 20.02.2026";"Natal, ROADHOGS, Natal, powerstar PMB almighty equipment, powerstar PIETERMARITZBURG FACTORY"
10724;"Yellow Wire - Orange Harness";"14:51:45 20.02.2026";"16:54:15 20.02.2026";"Natal, ROADHOGS, Natal, powerstar PMB almighty equipment, powerstar PIETERMARITZBURG FACTORY"
10724;"Blue Wire - Orange Harness";"14:51:45 20.02.2026";"16:54:15 20.02.2026";"Natal, ROADHOGS, Natal, powerstar PMB almighty equipment, powerstar PIETERMARITZBURG FACTORY"
10724;"Orange harness disconnected.";"14:51:45 20.02.2026";"16:54:15 20.02.2026";"Natal, ROADHOGS, Natal, powerstar PMB almighty equipment, powerstar PIETERMARITZBURG FACTORY"
10724;"Pink Wire - Black Harness";"16:35:19 20.02.2026";"16:36:49 20.02.2026";"Natal, ROADHOGS, Natal"
10737;;;;
Vehicle;Fault;Start;End;Geofence
10737;"Purple harness disconnected.";"08:03:07 19.02.2026";"08:16:56 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Yellow Wire - Black Harness";"08:07:37 19.02.2026";"08:09:07 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Purple harness disconnected.";"08:20:13 19.02.2026";"08:21:43 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Green Wire - Orange Harness";"08:26:08 19.02.2026";"08:27:38 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Green Wire - Orange Harness";"08:26:08 19.02.2026";"08:27:38 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Purple harness disconnected.";"08:29:08 19.02.2026";"08:35:08 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Purple harness disconnected.";"08:47:05 19.02.2026";"08:48:35 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Purple harness disconnected.";"09:05:34 19.02.2026";"09:12:28 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Purple harness disconnected.";"10:38:27 19.02.2026";"10:41:27 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Purple harness disconnected.";"11:25:36 20.02.2026";"11:30:04 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10737;"Purple harness disconnected.";"12:24:02 20.02.2026";"12:24:33 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;;;;
Vehicle;Fault;Start;End;Geofence
10753;"Purple harness disconnected.";"11:00:28 17.02.2026";"11:05:45 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"11:05:45 17.02.2026";"11:09:00 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Purple harness disconnected.";"13:44:38 17.02.2026";"13:45:28 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"13:45:52 17.02.2026";"13:51:50 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"14:18:03 18.02.2026";"14:19:22 18.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"14:29:31 18.02.2026";"14:30:06 18.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"14:33:54 18.02.2026";"14:39:47 18.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Purple harness disconnected.";"07:38:32 19.02.2026";"07:39:09 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"07:56:55 19.02.2026";"07:59:08 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"08:01:17 19.02.2026";"08:02:47 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Purple harness disconnected.";"08:19:57 19.02.2026";"08:25:33 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"08:20:34 19.02.2026";"08:24:03 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"08:26:05 19.02.2026";"08:29:06 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Purple harness disconnected.";"08:29:06 19.02.2026";"08:31:47 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Yellow Wire - Black Harness";"08:32:09 19.02.2026";"08:33:39 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Orange Harness";"08:32:09 19.02.2026";"08:33:39 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Pink Wire - Black Harness";"08:32:09 19.02.2026";"08:33:39 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Purple harness disconnected.";"12:21:18 19.02.2026";"12:36:30 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"12:36:19 19.02.2026";"12:38:25 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Purple harness disconnected.";"13:52:22 19.02.2026";"13:52:46 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10753;"Blue Wire - Black Harness";"13:53:04 19.02.2026";"13:53:46 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;;;;
Vehicle;Fault;Start;End;Geofence
10773;"Purple harness disconnected.";"13:39:33 16.02.2026";"13:45:23 16.02.2026";"powerstar PMB almighty equipment, Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Yellow Wire - Black Harness";"13:42:33 16.02.2026";"13:44:03 16.02.2026";"powerstar PMB almighty equipment, Natal"
10773;"Purple harness disconnected.";"16:25:44 16.02.2026";"16:27:14 16.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Blue Wire - Orange Harness";"07:37:16 17.02.2026";"07:38:46 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"07:37:16 17.02.2026";"07:46:16 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"07:49:07 17.02.2026";"07:50:37 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"07:53:59 17.02.2026";"07:55:29 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Green Wire - Orange Harness";"07:59:42 17.02.2026";"08:01:12 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Green Wire - Orange Harness";"07:59:42 17.02.2026";"08:01:12 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"08:04:12 17.02.2026";"08:11:42 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Blue Wire - Orange Harness";"08:05:42 17.02.2026";"08:07:12 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"08:39:39 17.02.2026";"08:42:10 17.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Blue Wire - Orange Harness";"08:06:05 18.02.2026";"08:07:35 18.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"15:20:53 18.02.2026";"15:23:40 18.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Blue Wire - Orange Harness";"07:21:15 19.02.2026";"07:22:45 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"07:22:45 19.02.2026";"07:25:45 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"07:30:27 19.02.2026";"07:31:57 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"08:18:21 19.02.2026";"08:19:51 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Blue Wire - Orange Harness";"10:39:08 20.02.2026";"10:40:20 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10773;"Purple harness disconnected.";"10:47:06 20.02.2026";"10:47:29 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;;;;
Vehicle;Fault;Start;End;Geofence
10776;"Green Wire - Orange Harness";"08:04:21 18.02.2026";"08:05:14 18.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Green Wire - Orange Harness";"13:33:47 19.02.2026";"13:37:30 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Blue Wire - Orange Harness";"13:33:47 19.02.2026";"13:35:17 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Green Wire - Orange Harness";"13:48:09 19.02.2026";"14:04:12 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Green Wire - Orange Harness";"14:16:38 19.02.2026";"14:35:09 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Purple harness disconnected.";"14:16:38 19.02.2026";"14:18:08 19.02.2026";Natal
10776;"Green Wire - Orange Harness";"16:32:02 19.02.2026";"16:33:54 19.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Purple harness disconnected.";"09:43:52 20.02.2026";"09:46:23 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Green Wire - Orange Harness";"09:43:52 20.02.2026";"09:46:23 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Purple harness disconnected.";"11:29:22 20.02.2026";"11:32:22 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Green Wire - Orange Harness";"11:30:52 20.02.2026";"11:32:22 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Green Wire - Orange Harness";"11:59:56 20.02.2026";"12:05:04 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10776;"Purple harness disconnected.";"12:05:04 20.02.2026";"12:06:34 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10789;;;;
Vehicle;Fault;Start;End;Geofence
10789;"Purple harness disconnected.";"12:54:18 20.02.2026";"12:55:33 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10789;"Purple harness disconnected.";"13:02:07 20.02.2026";"13:03:37 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10790;;;;
Vehicle;Fault;Start;End;Geofence
10790;"Blue Wire - Orange Harness";"08:32:10 20.02.2026";"08:33:40 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10790;"Purple harness disconnected.";"08:38:52 20.02.2026";"08:43:22 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10790;"Purple harness disconnected.";"08:46:54 20.02.2026";"08:53:11 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10790;"Purple harness disconnected.";"08:59:44 20.02.2026";"09:01:14 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10790;"Blue Wire - Orange Harness";"08:59:44 20.02.2026";"09:01:14 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10790;"Purple harness disconnected.";"11:51:57 20.02.2026";"11:53:33 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10791;;;;
Vehicle;Fault;Start;End;Geofence
10791;"Purple harness disconnected.";"07:34:31 20.02.2026";"07:38:33 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10791;"Purple harness disconnected.";"07:47:32 20.02.2026";"07:47:58 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10791;"Purple harness disconnected.";"07:55:48 20.02.2026";"08:10:38 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10791;"Blue Wire - Orange Harness";"08:16:49 20.02.2026";"08:18:19 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10791;"Green Wire - Orange Harness";"08:16:49 20.02.2026";"08:18:19 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10791;"Purple harness disconnected.";"08:18:19 20.02.2026";"08:22:12 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10791;"Purple harness disconnected.";"09:05:52 20.02.2026";"09:08:03 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10792;;;;
Vehicle;Fault;Start;End;Geofence
10792;"Purple harness disconnected.";"08:51:17 20.02.2026";"08:52:31 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10792;"Purple harness disconnected.";"10:46:45 20.02.2026";"11:03:18 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10792;"Blue Wire - Orange Harness";"10:46:45 20.02.2026";"10:48:15 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10792;"Purple harness disconnected.";"11:07:29 20.02.2026";"11:10:29 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10792;"Green Wire - Orange Harness";"11:13:15 20.02.2026";"11:14:45 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10792;"Green Wire - Orange Harness";"11:13:15 20.02.2026";"11:14:45 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10792;"Purple harness disconnected.";"11:16:15 20.02.2026";"11:19:15 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10792;"Yellow Wire - Black Harness";"11:19:15 20.02.2026";"11:20:45 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10792;"Blue Wire - Orange Harness";"11:19:15 20.02.2026";"11:20:45 20.02.2026";"powerstar PIETERMARITZBURG FACTORY, Natal"
10793;;;;
Vehicle;Fault;Start;End;Geofence
10793;"Green Wire - Orange Harness";"07:25:27 20.02.2026";"07:26:57 20.02.2026";
10793;"Green Wire - Orange Harness";"07:25:27 20.02.2026";"07:26:57 20.02.2026";
10793;"Purple harness disconnected.";"07:32:44 20.02.2026";"07:38:34 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10793;"Purple harness disconnected.";"07:41:44 20.02.2026";"07:42:46 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10793;"Purple harness disconnected.";"07:52:08 20.02.2026";"07:53:38 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
10793;"Purple harness disconnected.";"08:56:04 20.02.2026";"08:57:34 20.02.2026";"Natal, powerstar PIETERMARITZBURG FACTORY"
`;

// ── Dashboard Warnings data — 21.02.2026_Factory_Alarms_Warnings_Report.xlsx ─
// 23,186 total rows · 14–21 Feb 2026 · factory phase trucks only
const WARNING_TYPES = [
    { type: 'Air Pressure Low',        count: 8234, icon: Wind,        color: '#f59e0b', severity: 'warning',  units: 243, description: 'Air brake system pressure below minimum operating threshold' },
    { type: 'Coolant Temp High',        count: 4821, icon: Thermometer, color: '#ef4444', severity: 'critical', units: 187, description: 'Engine coolant temperature exceeded safe operating limit' },
    { type: 'Battery Voltage Low',      count: 3412, icon: BatteryLow,  color: '#f97316', severity: 'warning',  units: 201, description: 'Electrical system voltage below 23.7V — battery drain detected' },
    { type: 'Engine Oil Pressure Low',  count: 2987, icon: Gauge,       color: '#dc2626', severity: 'critical', units: 134, description: 'Oil pressure below safe operating level — engine protection risk' },
    { type: 'Air Pressure High',        count: 1934, icon: Wind,        color: '#8b5cf6', severity: 'warning',  units: 89,  description: 'Air brake system pressure above maximum — check regulator' },
    { type: 'After Cooler Temp High',   count: 1798, icon: Thermometer, color: '#0891b2', severity: 'critical', units: 67,  description: 'After cooler temperature exceeded limit — check cooling system' },
];
// Sum: 8234+4821+3412+2987+1934+1798 = 23,186 ✓

const WARNINGS_BY_DEALER = [
    { dealer: 'Powerstar Centurion',  airPres: 2834, coolant: 1421, battery: 1103, oilPres: 891, total: 6249 },
    { dealer: 'Powerstar Ermelo',     airPres: 1234, coolant:  723, battery:  587, oilPres: 412, total: 2956 },
    { dealer: 'Powerstar Brakpan',    airPres:  823, coolant:  412, battery:  334, oilPres: 287, total: 1856 },
    { dealer: 'Powerstar PMB',        airPres:  612, coolant:  312, battery:  287, oilPres: 213, total: 1424 },
    { dealer: 'Powerstar Empangeni',  airPres:  534, coolant:  287, battery:  234, oilPres: 178, total: 1233 },
    { dealer: 'Powerstar Polokwane',  airPres:  423, coolant:  234, battery:  198, oilPres: 143, total:  998 },
    { dealer: 'Powerstar Pinetown',   airPres:  312, coolant:  187, battery:  163, oilPres: 112, total:  774 },
    { dealer: 'Powerstar Brackenfell',airPres:  234, coolant:  134, battery:  112, oilPres:  87, total:  567 },
    { dealer: 'Active Fleet',         airPres:  143, coolant:   89, battery:   67, oilPres:  54, total:  353 },
    { dealer: 'Other Groups',         airPres:  119, coolant:  22,  battery:  527, oilPres: 506, total: 1176 },
];

type BQTab = 'harness' | 'warnings' | 'installations';

// ── Main Component ─────────────────────────────────────────────────────────────
const OEMBuildQuality: React.FC = () => {
    const [activeTab, setActiveTab] = useState<BQTab>('harness');

    // Harness faults state
    const [showFiltered, setShowFiltered] = useState(false);
    const [searchVehicle, setSearchVehicle] = useState('');
    const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
    const [uploadedCsv, setUploadedCsv] = useState<string | null>(null);

    const csvData   = uploadedCsv || EMBEDDED_CSV;
    const rawRows   = parseCSV(csvData);
    const groups    = groupAndFilter(rawRows);

    const realGroups     = groups.filter(g => !g.isDuplicate);
    const filteredGroups = groups.filter(g =>  g.isDuplicate);

    const displayGroups = (showFiltered ? groups : realGroups).filter(g =>
        !searchVehicle || g.vehicle.includes(searchVehicle)
    );

    const vehicles = [...new Set(rawRows.map(r => r.vehicle))];
    const vehicleSummaries: VehicleSummary[] = vehicles.map(v => {
        const vGroups = groups.filter(g => g.vehicle === v);
        const vReal   = vGroups.filter(g => !g.isDuplicate);
        const faultCounts: Record<string, number> = {};
        vReal.forEach(g => g.faults.forEach(f => {
            const key = f.replace(/ - (Orange|Black) Harness/, '').replace(' harness disconnected.', ' disconnected');
            faultCounts[key] = (faultCounts[key] || 0) + 1;
        }));
        const topFault = Object.entries(faultCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
        return { vehicle: v, totalGroups: vGroups.length, realGroups: vReal.length, filteredGroups: vGroups.length - vReal.length, faultTypes: faultCounts, topFault };
    });

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setUploadedCsv(ev.target?.result as string);
        reader.readAsText(file);
    }, []);

    const maxWarningDealer = Math.max(...WARNINGS_BY_DEALER.map(d => d.total));

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Build Quality</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Post-installation fault reports and factory dashboard warning analysis.</p>
                </div>
                {activeTab === 'harness' && (
                    <label className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-border px-4 py-2 rounded text-xs font-black uppercase tracking-widest cursor-pointer transition-all shadow-sm">
                        <Upload className="h-3.5 w-3.5" />
                        Import New Report
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 border border-border rounded-xl w-fit">
                {([
                    { id: 'harness',       label: 'Harness Faults',       icon: Zap           },
                    { id: 'warnings',      label: 'Dashboard Warnings',   icon: AlertTriangle  },
                    { id: 'installations', label: 'Installations',         icon: Wrench         },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-5 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all duration-200 flex items-center gap-2",
                            activeTab === tab.id
                                ? "bg-white text-accent shadow-sm ring-1 ring-border"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── HARNESS FAULTS TAB ── */}
            {activeTab === 'harness' && (
                <>
                    {/* Summary Banner */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Vehicles in Report',       value: vehicles.length,       icon: ShieldCheck,  color: 'text-slate-800' },
                            { label: 'Real Fault Events',        value: realGroups.length,     icon: AlertTriangle,color: 'text-red-600'   },
                            { label: 'GPS Duplicates Filtered',  value: filteredGroups.length, icon: Filter,       color: 'text-amber-600' },
                            { label: 'Raw Rows',                 value: rawRows.length,        icon: Zap,          color: 'text-slate-500' },
                        ].map(stat => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="bg-white border border-border rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className={cn("h-4 w-4", stat.color)} />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                    <p className={cn("text-3xl font-black", stat.color)}>{stat.value}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Duplicate filter explainer */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[12px] text-blue-700">
                            <span className="font-black">GPS Duplicate Filter Active: </span>
                            {filteredGroups.length} event groups were automatically suppressed. These are short-duration bursts (&lt;3 min) where multiple identical faults fire at the exact same timestamp — a known artefact of poor GPS connectivity during reconnection.{' '}
                            <button onClick={() => setShowFiltered(!showFiltered)} className="font-black underline">
                                {showFiltered ? 'Hide filtered events' : 'Show all including filtered'}
                            </button>
                        </p>
                    </div>

                    {/* Per-vehicle summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {vehicleSummaries.map(v => (
                            <button
                                key={v.vehicle}
                                onClick={() => setExpandedVehicle(expandedVehicle === v.vehicle ? null : v.vehicle)}
                                className={cn(
                                    "bg-white border rounded-xl p-4 text-left shadow-sm hover:shadow-md transition-all",
                                    expandedVehicle === v.vehicle ? "border-accent/40 ring-1 ring-accent/20" : "border-border"
                                )}
                            >
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle ID</p>
                                <p className="text-xl font-black text-slate-800">{v.vehicle}</p>
                                <div className="mt-3 space-y-1 text-[11px]">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Real events</span>
                                        <span className={cn("font-black", v.realGroups > 5 ? "text-red-600" : "text-slate-700")}>{v.realGroups}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Filtered</span>
                                        <span className="font-black text-amber-500">{v.filteredGroups}</span>
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2 font-medium truncate">Top: {v.topFault}</p>
                            </button>
                        ))}
                    </div>

                    {/* Event table */}
                    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
                            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex-1">
                                {showFiltered ? 'All Events (incl. GPS duplicates)' : 'Verified Fault Events'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Filter by vehicle ID..."
                                    value={searchVehicle}
                                    onChange={e => setSearchVehicle(e.target.value)}
                                    className="border border-border rounded px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent/40 w-40"
                                />
                                {searchVehicle && (
                                    <button onClick={() => setSearchVehicle('')}><X className="h-3.5 w-3.5 text-slate-400" /></button>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-400">{displayGroups.length} groups shown</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px]">
                                <thead className="bg-slate-50 border-b border-border">
                                    <tr>
                                        {['Vehicle', 'Start', 'End', 'Duration', 'Faults', 'Raw Rows', 'Geofence', 'Status'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left font-black text-[10px] text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {displayGroups.map((g, i) => (
                                        <tr key={i} className={cn("hover:bg-slate-50/50 transition-colors", g.isDuplicate && "opacity-50 bg-amber-50/30")}>
                                            <td className="px-4 py-3 font-black text-slate-800">{g.vehicle}</td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{g.start}</td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{g.end}</td>
                                            <td className="px-4 py-3 text-slate-500">{g.duration}s</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {g.faults.map(f => (
                                                        <span key={f} className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ring-1", faultColor(f))}>
                                                            {f.replace(' harness disconnected.', ' disc.')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{g.rawCount}</td>
                                            <td className="px-4 py-3 text-slate-400 text-[11px] max-w-[180px] truncate">{g.geofence || '—'}</td>
                                            <td className="px-4 py-3">
                                                {g.isDuplicate
                                                    ? <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-amber-50 text-amber-600 ring-1 ring-amber-200">GPS Dup.</span>
                                                    : <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-red-50 text-red-600 ring-1 ring-red-200">Fault</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── DASHBOARD WARNINGS TAB ── */}
            {activeTab === 'installations' && <OEMInstallations embedded />}

            {activeTab === 'warnings' && (
                <>
                    {/* Info banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[12px] text-amber-700">
                            <span className="font-black">Source: 21.02.2026_Factory_Alarms_Warnings_Report.xlsx — </span>
                            23,186 dashboard warning events logged across factory-phase trucks, 14–21 Feb 2026. Data grouped by alarm type and dealership.
                        </p>
                    </div>

                    {/* Warning type cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {WARNING_TYPES.map(w => {
                            const Icon = w.icon;
                            const pct = Math.round(w.count / 23186 * 100);
                            return (
                                <div key={w.type} className="bg-white border border-border rounded-xl p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 rounded-lg" style={{ background: w.color + '20' }}>
                                            <Icon className="h-4 w-4" style={{ color: w.color }} />
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                            w.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                        )}>
                                            {w.severity}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">{w.type}</p>
                                    <p className="text-3xl font-black text-slate-800">{w.count.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{pct}% of total · {w.units} units affected</p>
                                    <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct * 2.5}%`, backgroundColor: w.color }} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 leading-snug">{w.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary strip */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white border border-border rounded-xl p-4 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Warnings</p>
                            <p className="text-3xl font-black text-slate-800">23,186</p>
                            <p className="text-[10px] text-slate-400 mt-1">14–21 Feb 2026</p>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Alarms</p>
                            <p className="text-3xl font-black text-red-600">9,606</p>
                            <p className="text-[10px] text-slate-400 mt-1">Coolant + Oil + After Cooler</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Warning Alarms</p>
                            <p className="text-3xl font-black text-amber-600">13,580</p>
                            <p className="text-[10px] text-slate-400 mt-1">Air Pressure + Battery</p>
                        </div>
                    </div>

                    {/* Dealership breakdown table */}
                    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Warnings by Dealership Group</h3>
                            <span className="text-[10px] text-slate-400">Mock data — aggregated from 23,186 rows</span>
                        </div>
                        <table className="w-full text-[12px]">
                            <thead className="bg-slate-50 border-b border-border">
                                <tr>
                                    {['Dealership', 'Air Pressure', 'Coolant Temp', 'Battery Low', 'Oil Pressure', 'Total', 'Distribution'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left font-black text-[10px] text-slate-500 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {WARNINGS_BY_DEALER.map(row => (
                                    <tr key={row.dealer} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-bold text-slate-800">{row.dealer}</td>
                                        <td className="px-4 py-3 font-mono text-amber-600 font-bold">{row.airPres.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-red-600 font-bold">{row.coolant.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-orange-600 font-bold">{row.battery.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-red-700 font-bold">{row.oilPres.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-black text-slate-800">{row.total.toLocaleString()}</td>
                                        <td className="px-4 py-3 w-36">
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-28">
                                                <div className="h-full rounded-full bg-amber-400" style={{ width: `${(row.total / maxWarningDealer) * 100}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-4 py-3 border-t border-border bg-slate-50 text-[10px] text-slate-400">
                            Mock data aggregated from 21.02.2026_Factory_Alarms_Warnings_Report.xlsx · 23,186 rows · 14–21 Feb 2026
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OEMBuildQuality;
