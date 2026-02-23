import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Bell, Settings, HelpCircle, User, Home, History, FileText, Users, Activity, Wrench, Cpu } from 'lucide-react';
import Logo from './Logo';

const TopNav: React.FC = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('powerstar_user_name') || 'daniel(master)';

    const navItems = [
        { label: 'Main', icon: Home, href: '/admin' },
        { label: 'History', icon: History, href: '/admin/history' },
        { label: 'Reports', icon: FileText, href: '/admin/reports' },
        { label: 'Account', icon: Users, href: '/admin/account' },
        { label: 'Events', icon: Bell, href: '/admin/events' },
        { label: 'Service', icon: Wrench, href: '/admin/service' },
        { label: 'Algorithms', icon: Cpu, href: '/admin/algorithms' },
    ];

    const statusBadges = [
        { count: 1172, color: 'bg-[#7D7D8E]' },
        { count: 20, color: 'bg-[#28A745]' },
        { count: 670, color: 'bg-[#007BFF]' },
        { count: 13, color: 'bg-[#FFC107]', textColor: 'text-black' },
        { count: 513, color: 'bg-[#DC3545]' },
    ];

    return (
        <header className="h-14 bg-white border-b border-border px-4 flex items-center justify-between sticky top-0 z-50">
            {/* Left: Logo & Nav */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 mr-2">
                    <Logo size="sm" />
                </div>

                <nav className="flex items-center">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.href}
                            className={({ isActive }) => `
                                flex items-center gap-1.5 px-3 py-4 text-[13px] font-medium transition-colors border-b-2
                                ${isActive
                                    ? 'text-accent border-accent bg-surface/50'
                                    : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-surface/30'}
                            `}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Right: Badges & Profile */}
            <div className="flex items-center gap-4">
                {/* Status Badges */}
                <div className="flex gap-1">
                    {statusBadges.map((badge, i) => (
                        <div
                            key={i}
                            className={`${badge.color} ${badge.textColor || 'text-white'} px-2 py-0.5 rounded text-[11px] font-bold min-w-[32px] text-center shadow-sm`}
                        >
                            {badge.count}
                        </div>
                    ))}
                </div>

                <div className="h-8 w-px bg-border mx-1" />

                {/* User Info */}
                <div className="flex items-center gap-2 pr-2">
                    <div className="h-8 w-8 bg-slate-100 border border-border rounded flex items-center justify-center text-slate-500">
                        <User className="h-5 w-5" />
                    </div>
                    <div className="text-left leading-tight">
                        <p className="text-[12px] font-bold text-slate-700">{userName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">$ 97583.33</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-1.5 text-accent hover:bg-surface rounded transition-colors group relative">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full border border-white" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-surface rounded transition-colors">
                        <Settings className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-surface rounded transition-colors">
                        <HelpCircle className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopNav;
