import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Layouts
const DashboardShell = lazy(() => import('./components/layout/DashboardShell'));

// Pages
const Login = lazy(() => import('./pages/Login'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const HardwareStock = lazy(() => import('./pages/admin/HardwareStock'));
const SIMManagement = lazy(() => import('./pages/admin/SIMManagement'));
const SalesLeaderboard = lazy(() => import('./pages/admin/SalesLeaderboard'));
const OEMHome = lazy(() => import('./pages/oem/OEMHome'));
const OEMInstallations = lazy(() => import('./pages/oem/OEMInstallations'));
const OEMFuelCoolant = lazy(() => import('./pages/oem/OEMFuelCoolant'));
const OEMDealerships = lazy(() => import('./pages/oem/OEMDealerships'));
const OEMParts = lazy(() => import('./pages/oem/OEMParts'));
const OEMService = lazy(() => import('./pages/oem/OEMService'));
const OEMBuildQuality = lazy(() => import('./pages/oem/OEMBuildQuality'));
const OEMWarrantyClaims = lazy(() => import('./pages/oem/OEMWarrantyClaims'));
const OEMRegionalManagers = lazy(() => import('./pages/oem/OEMRegionalManagers'));
const DealerHome = lazy(() => import('./pages/dealer/DealerHome'));
const FleetHome = lazy(() => import('./pages/fleet/FleetHome'));
const ClientSignupForm = lazy(() => import('./components/forms/ClientSignupForm'));
const ClientOnboarding = lazy(() => import('./pages/admin/ClientOnboarding'));
const TruckModels = lazy(() => import('./pages/admin/TruckModels'));
const GeoZones = lazy(() => import('./pages/admin/GeoZones'));
const FuelTheft = lazy(() => import('./pages/admin/FuelTheft'));
const DemoApp = lazy(() => import('./demo/DemoApp'));

const Loading = () => (
    <div className="flex items-center justify-center p-8 min-h-screen bg-background text-white">
        <div className="animate-pulse text-accent font-bold text-xl tracking-tighter overflow-hidden">
            POWER<span className="text-white">STAR</span> TELEMATICS...
        </div>
    </div>
);

// Basic Auth Guard for Demo
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = localStorage.getItem('powerstar_mock_auth') === 'true';
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const App: React.FC = () => {
    return (
        <Router>
            <Suspense fallback={<Loading />}>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Client-facing interactive demo — no auth required */}
                    <Route path="/demo/*" element={<DemoApp />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <DashboardShell />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/admin" replace />} />

                        {/* Admin Tier */}
                        <Route path="admin" element={<AdminHome />} />
                        <Route path="admin/hardware" element={<HardwareStock />} />
                        <Route path="admin/sims" element={<SIMManagement />} />
                        <Route path="admin/leaderboard" element={<SalesLeaderboard />} />
                        <Route path="admin/onboarding" element={<ClientOnboarding />} />
                        <Route path="admin/truck-models" element={<TruckModels />} />

                        <Route path="admin/geo-zones" element={<GeoZones />} />
                        <Route path="admin/fuel-theft" element={<FuelTheft />} />

                        {/* OEM Tier */}
                        <Route path="oem" element={<OEMHome />} />
                        <Route path="oem/installations" element={<OEMInstallations />} />
                        <Route path="oem/fuel-coolant" element={<OEMFuelCoolant />} />
                        <Route path="oem/dealerships" element={<OEMDealerships />} />
                        <Route path="oem/parts" element={<OEMParts />} />
                        <Route path="oem/service" element={<OEMService />} />
                        <Route path="oem/build-quality" element={<OEMBuildQuality />} />
                        <Route path="oem/warranty" element={<OEMWarrantyClaims />} />
                        <Route path="oem/regional-managers" element={<OEMRegionalManagers />} />

                        {/* Dealer Tier */}
                        <Route path="dealer/:dealershipId" element={<DealerHome />} />

                        {/* Fleet Tier */}
                        <Route path="fleet/:clientId" element={<FleetHome />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </Router>
    );
};

export default App;
