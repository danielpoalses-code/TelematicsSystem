import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BaseLayerId = 'streets' | 'satellite' | 'dark';

const LAYERS: Record<BaseLayerId, { label: string; url: string; attribution: string; labelsOverlay?: string }> = {
    streets: {
        label: 'Streets',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
    },
    satellite: {
        label: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri',
        labelsOverlay: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
    },
    dark: {
        label: 'Dark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
};

export const MapBase: React.FC<{
    center?: [number, number];
    zoom?: number;
    children?: React.ReactNode;
    className?: string;
}> = ({ center = [-29.65, 30.45], zoom = 11, children, className }) => {
    const [layer, setLayer] = useState<BaseLayerId>('streets');
    const [pickerOpen, setPickerOpen] = useState(false);
    const l = LAYERS[layer];

    return (
        <div className={cn('relative h-full w-full', className)}>
            <MapContainer center={center} zoom={zoom} className="h-full w-full" zoomControl preferCanvas>
                <TileLayer key={layer} url={l.url} attribution={l.attribution} maxZoom={19} />
                {l.labelsOverlay && <TileLayer url={l.labelsOverlay} maxZoom={19} />}
                {children}
            </MapContainer>

            {/* layer switcher */}
            <div className="absolute top-3 right-3 z-[1000]">
                <div className="flex items-center gap-1 bg-white/95 backdrop-blur rounded-lg shadow-md border border-slate-200 p-1">
                    <button
                        onClick={() => setPickerOpen(o => !o)}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                        title="Map layers"
                    >
                        <Layers size={16} />
                    </button>
                    {pickerOpen && (Object.keys(LAYERS) as BaseLayerId[]).map(id => (
                        <button
                            key={id}
                            onClick={() => { setLayer(id); setPickerOpen(false); }}
                            className={cn(
                                'px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors',
                                layer === id ? 'bg-accent text-white' : 'text-slate-600 hover:bg-slate-100',
                            )}
                        >
                            {LAYERS[id].label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
