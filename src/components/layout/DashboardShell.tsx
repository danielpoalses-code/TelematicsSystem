import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardShell: React.FC = () => {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    if (isLoginPage) return <Outlet />;

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 overflow-auto bg-white border-l border-border">
                    <Outlet />
                </main>

                {/* Optional Status Bar at bottom as seen in some professional tools */}
                <div className="h-8 bg-white border-t border-border flex items-center px-4 justify-between text-[11px] font-medium text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-status-green" />
                            System Live
                        </span>
                        <div className="h-3 w-px bg-border" />
                        <span className="text-slate-400">v2.4.0-stable</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardShell;
