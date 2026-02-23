import React, { useState, useEffect } from 'react';
import {
    Building2,
    MapPin,
    Truck,
    CreditCard,
    Lightbulb,
    CheckCircle2,
    Save,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
    { id: 'dealer', title: 'Dealership & Sales', icon: Building2 },
    { id: 'client', title: 'Client Details', icon: MapPin },
    { id: 'fleet', title: 'Fleet & Truck Details', icon: Truck },
    { id: 'package', title: 'Package & Billing', icon: CreditCard },
    { id: 'intelligence', title: 'Sales Intelligence', icon: Lightbulb },
];

const ClientSignupForm: React.FC = () => {
    const [activeSection, setActiveSection] = useState(0);
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    // Auto-save simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('Auto-saving form data to Firestore...', formData);
        }, 2000);
        return () => clearTimeout(timer);
    }, [formData]);

    const handleNext = () => setActiveSection(prev => Math.min(prev + 1, SECTIONS.length - 1));
    const handleBack = () => setActiveSection(prev => Math.max(prev - 1, 0));

    const updateField = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 mt-8">
            {/* Stepper Header */}
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between overflow-x-auto no-scrollbar">
                {SECTIONS.map((section, idx) => (
                    <div key={section.id} className="flex items-center">
                        <button
                            onClick={() => setActiveSection(idx)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                                activeSection === idx
                                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                                    : idx < activeSection
                                        ? "text-status-green hover:bg-white/5"
                                        : "text-slate-500 hover:bg-white/5"
                            )}
                        >
                            <section.icon className="h-4 w-4" />
                            <span className="text-xs font-bold whitespace-nowrap hidden sm:block">{section.title}</span>
                            {idx < activeSection && <CheckCircle2 className="h-3 w-3" />}
                        </button>
                        {idx < SECTIONS.length - 1 && (
                            <div className="w-4 h-px bg-white/5 mx-2" />
                        )}
                    </div>
                ))}
            </div>

            {/* Form Content */}
            <div className="glass-panel p-8 rounded-3xl min-h-[500px] animate-in fade-in slide-in-from-right-4 duration-500 bg-panel/40">
                <div className="mb-10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        {(() => {
                            const Icon = SECTIONS[activeSection].icon;
                            return <Icon className="h-6 w-6 text-accent" />;
                        })()}
                        {SECTIONS[activeSection].title}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 italic">Section {activeSection + 1} of 5</p>
                </div>

                {activeSection === 0 && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        <InputField label="Dealership Name" placeholder="Powerstar Centurion" disabled value="Powerstar Centurion" />
                        <InputField label="Salesperson Name" placeholder="Your Name" disabled value="Daniel Poalses" />
                        <InputField label="Dealership Province" placeholder="Gauteng" disabled value="Gauteng" />
                    </section>
                )}

                {activeSection === 1 && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        <InputField label="Company Registered Name" placeholder="e.g. PowerTech (Pty) Ltd" />
                        <InputField label="VAT Number" placeholder="4XXXXXXXXX" />
                        <InputField label="Contact Person" placeholder="Full Name" />
                        <InputField label="Contact Phone" placeholder="+27 XX XXX XXXX" />
                        <div className="md:col-span-2">
                            <InputField label="Physical Address" placeholder="123 Fleet Street, Pietermaritzburg" />
                        </div>
                    </section>
                )}

                {activeSection === 2 && (
                    <section className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Truck Model(s)" placeholder="e.g. Powerstar VX-3335" />
                            <InputField label="Total Truck Count" type="number" placeholder="5" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Truck Stock Numbers (separated by commas)</label>
                            <textarea
                                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all min-h-[100px]"
                                placeholder="PS-10042, PS-10043, PS-10044..."
                            />
                        </div>
                    </section>
                )}

                {activeSection === 3 && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        <SelectField
                            label="Selected Package"
                            options={[
                                { label: 'Base GPS Tracking', value: 'base' },
                                { label: 'Engine Protection Plus', value: 'engine_protect' },
                                { label: 'Full Management Suite', value: 'full' }
                            ]}
                        />
                        <SelectField
                            label="Billing Cycle"
                            options={[
                                { label: 'Monthly (Debit Order)', value: 'monthly' },
                                { label: 'Quarterly', value: 'quarterly' },
                                { label: 'Annual', value: 'annual' }
                            ]}
                        />
                    </section>
                )}

                {activeSection === 4 && (
                    <section className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-400">What was the primary objection raised?</label>
                            <textarea
                                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                                placeholder="e.g. Price of hardware, competitors..."
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-400">Client Enthusiasm (1-5)</label>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <button
                                        key={i}
                                        className={cn(
                                            "w-10 h-10 rounded-full border border-white/10 font-bold transition-all",
                                            formData.enthusiasm === i ? "bg-accent text-white scale-110" : "bg-card text-slate-400 hover:text-white"
                                        )}
                                        onClick={() => updateField('enthusiasm', i)}
                                    >
                                        {i}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 md:relative bg-panel md:bg-transparent border-t border-white/5 md:border-0 p-4 md:p-0 flex items-center justify-between">
                <button
                    onClick={handleBack}
                    disabled={activeSection === 0}
                    className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>

                <div className="flex items-center gap-2">
                    <span className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mr-4">
                        <Save className="h-3 w-3" />
                        Auto-saving...
                    </span>

                    {activeSection < SECTIONS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-accent/20"
                        >
                            Continue
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            className="bg-status-green hover:bg-status-green/80 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-status-green/20"
                        >
                            Submit Application
                            <CheckCircle2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// UI Atoms
const InputField = ({ label, placeholder, type = "text", disabled = false, value }: any) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-400">{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            defaultValue={value}
            className={cn(
                "w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all",
                disabled && "opacity-50 cursor-not-allowed bg-white/5"
            )}
        />
    </div>
);

const SelectField = ({ label, options }: any) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-400">{label}</label>
        <select className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none">
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export default ClientSignupForm;
