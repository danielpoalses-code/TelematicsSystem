import React from 'react';
import { Lightbulb, Target, TrendingUp, ShieldCheck, DollarSign, Clock, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

const SalesEnablement: React.FC = () => {
    const tips = [
        {
            title: "Total Cost of Ownership (TCO)",
            tip: "Demonstrate how the Speed Limiter + Pedal Interface reduces wear on brakes and tires by 15% annually.",
            icon: DollarSign,
            color: "text-status-green"
        },
        {
            title: "Engine Protection Selling Point",
            tip: "Mention that the Limp Mode trigger saves 'engine-off' catastrophic failures from coolant overtemp.",
            icon: ShieldCheck,
            color: "text-accent"
        },
        {
            title: "Service Scheduling Efficiency",
            tip: "Explain that they'll never miss a service because the truck itself triggers the booking request.",
            icon: Clock,
            color: "text-status-blue"
        },
    ];

    const talkingPoints = [
        "White-label branding shows 'Powerstar' - it's not a 3rd party tool, it's part of the truck.",
        "Live sensor monitoring (Battery, Coolant, Oil) reduces breakdowns by 60%.",
        "Driver behavior reports help fleet owners reward good drivers and lower insurance premiums."
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tips.map((t, i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
                        <div className={cn("h-10 w-10 rounded-xl bg-card border border-white/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-110", t.color)}>
                            <t.icon className="h-5 w-5" />
                        </div>
                        <h4 className="font-bold text-white mb-2">{t.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{t.tip}</p>
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                            <t.icon className="h-16 w-16" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Target className="h-5 w-5 text-accent" />
                            Key Selling Propositons
                        </h3>
                        <div className="space-y-4">
                            {talkingPoints.map((point, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-black text-accent">{i + 1}</span>
                                    </div>
                                    <p className="text-sm text-slate-300">{point}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 p-8 opacity-5">
                        <TrendingUp className="h-40 w-40 text-accent" />
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-2xl bg-white/[0.02]">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-status-amber" />
                        Objection Handling
                    </h3>
                    <div className="space-y-6">
                        <div className="group">
                            <p className="text-xs font-bold text-status-amber uppercase tracking-widest mb-2">Q: "Is it a tracker?"</p>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                A: "It's far more. It's an <strong>Operational Intelligence Hub</strong>. Trackers only show where; we show <em>how</em> the engine is breathing, <em>how</em> the fuel is stored, and <em>how</em> the driver is treating the asset."
                            </p>
                        </div>
                        <div className="group">
                            <p className="text-xs font-bold text-status-amber uppercase tracking-widest mb-2">Q: "Does it drain the battery?"</p>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                A: "No. The system has <strong>Smart Sleep Modes</strong>. Plus, the system actually <em>warns</em> you if the battery voltage drops, helping you avoid jump-start costs."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesEnablement;
