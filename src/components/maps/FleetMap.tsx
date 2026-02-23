import React from 'react';

// Note: In a real implementation, we would use react-leaflet
// This is a mockup of the Fleet Map component

const FleetMap: React.FC = () => {
    return (
        <div className="w-full h-full min-h-[400px] rounded-2xl bg-slate-900 border border-white/10 relative overflow-hidden group">
            {/* Mock Map Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700" />

            {/* Map Overlay Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />

            {/* Mock Markers */}
            <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-status-green rounded-full border-2 border-white shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-bounce" />
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-status-blue rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
            <div className="absolute top-2/3 left-1/4 w-4 h-4 bg-status-red rounded-full border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
            <div className="absolute top-1/3 left-2/3 w-4 h-4 bg-status-amber rounded-full border-2 border-white shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse" />

            {/* Map Controls Mockup */}
            <div className="absolute bottom-6 left-6 space-y-2">
                <div className="glass-panel p-2 rounded-lg flex flex-col gap-2 shadow-2xl">
                    <button className="p-2 bg-card hover:bg-white/5 rounded text-white font-bold">+</button>
                    <button className="p-2 bg-card hover:bg-white/5 rounded text-white font-bold">-</button>
                </div>
            </div>

            <div className="absolute top-6 right-6">
                <div className="glass-panel px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-green" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Live Fleet</span>
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <span className="text-xs font-bold text-white">1,172 Objects</span>
                </div>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-6 right-6 glass-panel p-4 rounded-xl border border-white/10 shadow-2xl">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Status Legend</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-green" />
                        <span className="text-[10px] text-slate-300">Moving</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-blue" />
                        <span className="text-[10px] text-slate-300">Stationary</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-amber" />
                        <span className="text-[10px] text-slate-300">Alert</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-status-red" />
                        <span className="text-[10px] text-slate-300">Offline</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetMap;
