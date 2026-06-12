import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DemoProvider } from './context/DemoContext';
import { DemoShell } from './components/DemoShell';

const Landing = lazy(() => import('./pages/Landing'));
const LiveMap = lazy(() => import('./pages/LiveMap'));
const History = lazy(() => import('./pages/History'));
const Reports = lazy(() => import('./pages/Reports'));
const Events = lazy(() => import('./pages/Events'));
const Geofences = lazy(() => import('./pages/Geofences'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Integrations = lazy(() => import('./pages/Integrations'));
const FleetManager = lazy(() => import('./pages/FleetManager'));

const Loading = () => (
    <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-accent font-black tracking-tight">
            Power<span className="text-slate-800">Tech</span> Demo…
        </div>
    </div>
);

const DemoApp: React.FC = () => (
    <DemoProvider>
        <Routes>
            <Route element={<DemoShell />}>
                <Route index element={<Suspense fallback={<Loading />}><Landing /></Suspense>} />
                <Route path="map" element={<Suspense fallback={<Loading />}><LiveMap /></Suspense>} />
                <Route path="history" element={<Suspense fallback={<Loading />}><History /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<Loading />}><Reports /></Suspense>} />
                <Route path="events" element={<Suspense fallback={<Loading />}><Events /></Suspense>} />
                <Route path="geofences" element={<Suspense fallback={<Loading />}><Geofences /></Suspense>} />
                <Route path="notifications" element={<Suspense fallback={<Loading />}><Notifications /></Suspense>} />
                <Route path="integrations" element={<Suspense fallback={<Loading />}><Integrations /></Suspense>} />
                <Route path="fleet" element={<Suspense fallback={<Loading />}><FleetManager /></Suspense>} />
                <Route path="*" element={<Navigate to="/demo" replace />} />
            </Route>
        </Routes>
    </DemoProvider>
);

export default DemoApp;
