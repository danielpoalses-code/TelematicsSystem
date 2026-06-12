export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertMetric =
    | 'speed'
    | 'coolantC'
    | 'fuelPct'
    | 'batteryV'
    | 'cargoTempC'
    | 'idleMin';

export type RuleOperator = 'gt' | 'lt';

export interface NotificationRule {
    id: string;
    name: string;
    metric: AlertMetric;
    operator: RuleOperator;
    threshold: number;
    severity: AlertSeverity;
    enabled: boolean;
    channels: { popup: boolean; email: boolean; sms: boolean };
    builtIn?: boolean;
}

export interface DemoAlert {
    id: string;
    time: number;
    vehicleId: string;
    vehicleName: string;
    severity: AlertSeverity;
    kind: 'sensor' | 'geofence' | 'system';
    title: string;
    detail: string;
    pos?: [number, number];
    acknowledged: boolean;
}

export const METRIC_META: Record<AlertMetric, { label: string; unit: string }> = {
    speed: { label: 'Speed', unit: 'km/h' },
    coolantC: { label: 'Coolant temperature', unit: '°C' },
    fuelPct: { label: 'Fuel level', unit: '%' },
    batteryV: { label: 'Battery voltage', unit: 'V' },
    cargoTempC: { label: 'Cargo temperature', unit: '°C' },
    idleMin: { label: 'Idle time', unit: 'min' },
};

export const DEFAULT_RULES: NotificationRule[] = [
    {
        id: 'rule_speed', name: 'Speeding over 100 km/h', metric: 'speed', operator: 'gt',
        threshold: 100, severity: 'warning', enabled: true,
        channels: { popup: true, email: true, sms: false }, builtIn: true,
    },
    {
        id: 'rule_coolant', name: 'Engine overheating', metric: 'coolantC', operator: 'gt',
        threshold: 102, severity: 'critical', enabled: true,
        channels: { popup: true, email: true, sms: true }, builtIn: true,
    },
    {
        id: 'rule_fuel', name: 'Low fuel', metric: 'fuelPct', operator: 'lt',
        threshold: 15, severity: 'warning', enabled: true,
        channels: { popup: true, email: false, sms: false }, builtIn: true,
    },
    {
        id: 'rule_battery', name: 'Battery voltage low', metric: 'batteryV', operator: 'lt',
        threshold: 23.5, severity: 'warning', enabled: true,
        channels: { popup: true, email: true, sms: false }, builtIn: true,
    },
    {
        id: 'rule_cargo', name: 'Cold-chain breach (cargo > 8°C)', metric: 'cargoTempC', operator: 'gt',
        threshold: 8, severity: 'critical', enabled: true,
        channels: { popup: true, email: true, sms: true }, builtIn: true,
    },
    {
        id: 'rule_idle', name: 'Excessive idling (> 20 min)', metric: 'idleMin', operator: 'gt',
        threshold: 20, severity: 'info', enabled: true,
        channels: { popup: true, email: false, sms: false }, builtIn: true,
    },
];
