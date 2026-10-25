import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-[#f8faf8] text-center font-sans">
      <div className="h-16 w-16 rounded-2xl bg-[#183a2b] text-white flex items-center justify-center mb-4 shadow-md">
        <Compass className="w-9 h-9 text-emerald-400" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-950">404 — Route Not Found</h1>
      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mt-2">
        The highland waypoint or page you requested does not exist on our corridor radar.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#183a2b] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#122e22] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home Corridor</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
