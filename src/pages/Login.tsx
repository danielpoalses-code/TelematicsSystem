import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/layout/Logo';
import { cn } from '@/lib/utils';

// Mock User Database for Demo
const MOCK_USERS = [
    { email: 'admin@khulu.co.za', role: 'khulu_admin', name: 'System Admin' },
    { email: 'oem@powerstar.co.za', role: 'oem_manager', name: 'OEM Executive' },
    { email: 'dealer@powerstar.co.za', role: 'dealer_manager', name: 'Centurion Dealer' },
    { email: 'client@powerstar.co.za', role: 'fleet_client', name: 'Teichman Fleet' },
];

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate backend lookup delay
        setTimeout(() => {
            const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (user) {
                localStorage.setItem('powerstar_mock_auth', 'true');
                localStorage.setItem('powerstar_user_role', user.role);
                localStorage.setItem('powerstar_user_name', user.name);

                // Redirect based on role
                if (user.role === 'khulu_admin') navigate('/admin');
                else if (user.role === 'dealer_manager') navigate('/dealer/dealer_centurion');
                else if (user.role === 'oem_manager') navigate('/oem');
                else navigate('/fleet/client_teichman');
            } else {
                setError('Invalid credentials. Hint: use any mock email.');
            }
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white border border-border p-10 rounded-2xl space-y-8 animate-in fade-in zoom-in duration-500 shadow-xl">
                <div className="flex flex-col items-center justify-center text-center">
                    <Logo className="scale-125 mb-6" size="lg" />
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Telematics Management</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Please sign in to your corporate account</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Corporate Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium placeholder:text-slate-400"
                                placeholder="name@powerstar.co.za"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium placeholder:text-slate-400"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-xs text-accent font-bold text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "w-full flex justify-center py-4 px-4 rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-white transition-all duration-200",
                            isLoading ? "bg-slate-400 cursor-not-allowed" : "bg-accent hover:bg-accent-hover shadow-accent/20"
                        )}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Verifying...
                            </div>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="pt-4 flex flex-col items-center gap-4">
                    <div className="h-px w-full bg-border" />
                    <button
                        type="button"
                        onClick={() => navigate('/demo')}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-accent/40 text-accent text-sm font-black uppercase tracking-widest hover:bg-accent/5 hover:border-accent transition-all"
                    >
                        Try the interactive demo →
                    </button>
                    <div className="text-center text-[10px] text-slate-400 uppercase tracking-[0.25em] font-black">
                        Secure Access Portal • KhuluDigital Intelligence
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
