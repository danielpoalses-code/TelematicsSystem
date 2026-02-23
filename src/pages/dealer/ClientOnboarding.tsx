import React from 'react';
import { UserPlus, ClipboardList, Send, Briefcase, Mail, Phone, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const ClientOnboarding: React.FC = () => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-23xl font-bold text-white tracking-tight flex items-center gap-3">
                        <UserPlus className="h-6 w-6 text-accent" />
                        Client Onboarding Form
                    </h2>
                    <p className="text-slate-500 mt-1">Collect client data to activate their Telematics Profile and White-Label portal.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 text-slate-400 border border-white/10 rounded-xl text-xs font-bold hover:text-white transition-all">
                        Save Draft
                    </button>
                    <button className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold shadow-lg shadow-accent/20 flex items-center gap-2 hover:bg-accent-hover transition-all">
                        <Send className="h-4 w-4" />
                        Activate Portal
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-2xl space-y-6">
                    <h3 className="font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                        <Briefcase className="h-5 w-5 text-status-blue" />
                        Company Details
                    </h3>

                    <div className="space-y-4">
                        <InputGroup label="Trading Name" placeholder="e.g. Teichman Logistics" />
                        <InputGroup label="Industry Vertical" placeholder="e.g. Mining / Civil Engineering" />

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Registration Number" placeholder="202X/XXXXXX/XX" />
                            <InputGroup label="VAT Number" placeholder="XXXXXXXXXX" />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Expected Initial Fleet Size</label>
                            <select className="w-full bg-card border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none transition-all">
                                <option>1 - 5 Trucks</option>
                                <option>6 - 20 Trucks</option>
                                <option>21 - 50 Trucks</option>
                                <option>50+ Strategic Fleet</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-2xl space-y-6">
                    <h3 className="font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                        <Users className="h-5 w-5 text-status-amber" />
                        Primary Contact Person
                    </h3>

                    <div className="space-y-4">
                        <InputGroup label="Full Name" placeholder="John Doe" />
                        <div className="relative">
                            <InputGroup label="Enail Address" placeholder="john@example.com" />
                            <Mail className="absolute right-4 top-9 h-4 w-4 text-slate-600" />
                        </div>
                        <div className="relative">
                            <InputGroup label="Mobile Number" placeholder="+27 XX XXX XXXX" />
                            <Phone className="absolute right-4 top-9 h-4 w-4 text-slate-600" />
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/5">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="w-5 h-5 bg-card border border-white/10 rounded-md checked:bg-accent transition-all" />
                            <span className="text-xs text-slate-400 group-hover:text-white transition-colors">Client requires White-Label 'Powerstar' Mobile App access</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl">
                <h3 className="font-bold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                    <ClipboardList className="h-5 w-5 text-status-green" />
                    Special Technical Requirements
                </h3>
                <textarea
                    className="w-full bg-card border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all min-h-[120px]"
                    placeholder="e.g. Custom service intervals for severe mud operation, specific fuel theft alert thresholds for remote sites..."
                />
            </div>
        </div>
    );
};

const InputGroup = ({ label, placeholder }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
        <input
            className="w-full bg-card border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all border-glow"
            placeholder={placeholder}
        />
    </div>
);

export default ClientOnboarding;
