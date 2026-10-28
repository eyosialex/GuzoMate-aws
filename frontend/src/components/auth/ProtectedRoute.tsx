import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/AuthContext';
import { Compass } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8faf8] text-[#141d18]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#183a2b] text-white flex items-center justify-center shadow-lg shadow-[#183a2b]/20">
            <Compass className="w-8 h-8 animate-[spin_10s_linear_infinite]" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-gray-900 tracking-tight">GuzoMate Ethiopia</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Verifying scout credentials & highway telemetry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to /login with state preservation
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
