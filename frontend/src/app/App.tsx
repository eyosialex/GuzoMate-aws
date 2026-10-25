import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from '../features/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '../components/auth/PublicOnlyRoute';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Compass } from 'lucide-react';

// Code-split pages for high performance and fast initial load
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const ExplorePage = lazy(() => import('../pages/ExplorePage'));
const RoutesPage = lazy(() => import('../pages/RoutesPage'));
const IncidentsPage = lazy(() => import('../pages/IncidentsPage'));
const ReportHazardPage = lazy(() => import('../pages/ReportHazardPage'));
const EmergencyPage = lazy(() => import('../pages/EmergencyPage'));
const AssistantPage = lazy(() => import('../pages/AssistantPage'));
const SavedPlacesPage = lazy(() => import('../pages/SavedPlacesPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Page loading fallback
const PageLoader: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8">
    <div className="h-10 w-10 rounded-xl bg-[#183a2b] text-white flex items-center justify-center animate-pulse shadow-sm">
      <Compass className="w-6 h-6 animate-spin" />
    </div>
    <span className="text-xs font-semibold text-gray-500 mt-2">Loading Highland Telemetry...</span>
  </div>
);

// Main Application Layout Shell
const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] font-sans antialiased text-gray-900">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Animated Landing & System Description Page (First Load) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<LandingPage />} />

            {/* Public-Only Auth Routes */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Main Application Shell */}
            <Route element={<AppLayout />}>
              {/* Publicly Accessible Exploration Views */}
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/emergency" element={<EmergencyPage />} />

              {/* Protected Routes (Scout Authentication Required) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/incidents/report" element={<ReportHazardPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/saved" element={<SavedPlacesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
