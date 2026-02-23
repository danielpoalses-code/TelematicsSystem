import React, { useState } from 'react';
import Logo from './Logo';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Truck,
    Factory,
    ClipboardList,
    Settings,
    ShieldCheck,
    Mail,
    BarChart3,
    Box,
    UserCircle, Map, Calendar, AlertTriangle, FileText,
    Wrench, Activity, PhoneCall, History, PenTool, Battery, Package,
    Building2, PackageSearch,
    Smartphone,
    ChevronLeft,
    ChevronRight,
    Droplets,
    ClipboardCheck,
    Signal,
    MapPin,
    ShieldAlert,
    Users,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    roles: string[];
}

interface NavSection {
    label: string;
    roles: string[];
    items: NavItem[];
}

const navSections: NavSection[] = [

    // ── KHULU ADMIN ONLY ──────────────────────────────────────────
    {
        label: 'Admin',
        roles: ['khulu_admin'],
        items: [
            { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['khulu_admin'] },
            { title: 'Client Onboarding', href: '/admin/onboarding', icon: Mail, roles: ['khulu_admin'] },
            { title: 'Hardware Orders', href: '/admin/hardware', icon: Box, roles: ['khulu_admin'] },
            { title: 'SIM Management', href: '/admin/sims', icon: Smartphone, roles: ['khulu_admin'] },
            { title: 'Truck Models', href: '/admin/truck-models', icon: Truck, roles: ['khulu_admin'] },
            { title: 'System Settings', href: '/admin/settings', icon: Settings, roles: ['khulu_admin'] },
        ]
    },

    // ── FACTORY: visible to both khulu_admin and oem_manager ──────
    {
        label: 'Factory',
        roles: ['khulu_admin', 'oem_manager'],
        items: [
            { title: 'Factory Overview', href: '/oem', icon: Factory, roles: ['khulu_admin', 'oem_manager'] },
            { title: 'Build Quality', href: '/oem/build-quality', icon: ClipboardCheck, roles: ['khulu_admin', 'oem_manager'] },
            { title: 'Fuel & Coolant', href: '/oem/fuel-coolant', icon: Droplets, roles: ['khulu_admin', 'oem_manager'] },
            { title: 'Service & Tracking', href: '/oem/service', icon: Wrench, roles: ['khulu_admin', 'oem_manager'] },
            { title: 'Dealerships', href: '/oem/dealerships', icon: Building2, roles: ['khulu_admin', 'oem_manager'] },
            { title: 'Parts Logistics', href: '/oem/parts', icon: PackageSearch, roles: ['khulu_admin', 'oem_manager'] },
            { title: 'Warranty Claims', href: '/oem/warranty', icon: ShieldAlert, roles: ['khulu_admin', 'oem_manager'] },
            { title: 'Regional Managers', href: '/oem/regional-managers', icon: Users, roles: ['khulu_admin', 'oem_manager'] },
            { title: 'Geo Zones', href: '/admin/geo-zones', icon: Globe, roles: ['khulu_admin', 'oem_manager'] },
            { title: 'Fuel Theft', href: '/admin/fuel-theft', icon: Droplets, roles: ['khulu_admin', 'oem_manager'] },
        ]
    },

];

const Sidebar: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const userRole = localStorage.getItem('powerstar_user_role') || 'khulu_admin';
    const userName = localStorage.getItem('powerstar_user_name') || 'System Admin';

    return (
        <aside
            className={cn(
                "flex flex-col border-r border-border bg-white transition-all duration-300 ease-in-out relative z-20",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex h-28 items-center px-4 border-b border-border shrink-0">
                <Logo collapsed={collapsed} />
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5 custom-scrollbar">
                {navSections.map(section => {
                    if (!section.roles.includes(userRole)) return null;

                    const visibleItems = section.items.filter(item => item.roles.includes(userRole));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={section.label}>
                            {!collapsed && (
                                <p className="px-3 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                                    {section.label}
                                </p>
                            )}
                            {collapsed && <div className="mx-auto w-5 h-px bg-slate-100 my-1" />}

                            <div className="space-y-0.5">
                                {visibleItems.map(item => {
                                    const isActive =
                                        item.href === '/admin'
                                            ? location.pathname === '/admin'
                                            : item.href === '/oem'
                                                ? location.pathname === '/oem'
                                                : location.pathname.startsWith(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-bold uppercase tracking-tight transition-all duration-150 group relative",
                                                isActive
                                                    ? "bg-accent/5 text-accent ring-1 ring-accent/15"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                                                collapsed && "mx-auto",
                                                isActive && "text-accent"
                                            )} />
                                            {!collapsed && <span className="truncate">{item.title}</span>}

                                            {collapsed && (
                                                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white rounded-lg shadow-xl text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                                    {item.title}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User Profile */}
            {!collapsed && (
                <div className="px-3 pb-3 shrink-0">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="h-7 w-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                            <Signal className="h-3.5 w-3.5 text-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{userName}</p>
                            <p className="text-[9px] text-slate-400 truncate font-mono uppercase">{userRole.replace('_', ' ')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="h-10 border-t border-border flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors bg-white hover:bg-slate-50 shrink-0"
            >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
        </aside>
    );
};

export default Sidebar;
