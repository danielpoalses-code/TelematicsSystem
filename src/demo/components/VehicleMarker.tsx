import React, { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { DemoVehicle } from '../data/fleets';
import { STATUS_COLOR } from './ui';

const TYPE_GLYPH: Record<string, string> = {
    truck: '🚛',
    van: '🚐',
    car: '🛻',
    tanker: '🛢️',
};

function iconHtml(v: DemoVehicle, selected: boolean): string {
    const color = STATUS_COLOR[v.status];
    const pulse = v.status === 'moving'
        ? `<span class="demo-pulse" style="background:${color}"></span>`
        : '';
    return `
    <div class="demo-veh ${selected ? 'demo-veh-selected' : ''}">
        ${pulse}
        <div class="demo-veh-dot" style="background:${color}">
            <span class="demo-veh-glyph">${TYPE_GLYPH[v.type] ?? '🚛'}</span>
            ${v.status === 'moving' ? `<span class="demo-veh-arrow" style="transform: rotate(${Math.round(v.heading)}deg)">▲</span>` : ''}
        </div>
        <div class="demo-veh-label">${v.name}</div>
    </div>`;
}

export const VehicleMarker: React.FC<{
    vehicle: DemoVehicle;
    selected: boolean;
    onClick: () => void;
}> = ({ vehicle, selected, onClick }) => {
    const icon = useMemo(
        () => L.divIcon({
            className: 'demo-veh-wrap',
            html: iconHtml(vehicle, selected),
            iconSize: [36, 36],
            iconAnchor: [18, 18],
        }),
        // re-render icon when visual state changes
        [vehicle.status, Math.round(vehicle.heading / 15), selected, vehicle.name, vehicle.type],
    );

    return (
        <Marker
            position={vehicle.pos}
            icon={icon}
            eventHandlers={{ click: onClick }}
            zIndexOffset={selected ? 1000 : 0}
        />
    );
};
