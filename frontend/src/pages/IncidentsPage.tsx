import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  Filter, 
  Search,
  ThumbsUp,
  ThumbsDown,
  Radio,
  Share2
} from 'lucide-react';
import { useAuth } from '../features/AuthContext';
import { Incident } from '../types';
import { incidentsService } from '../services/incidentsService';
import { springTactile, springGentle } from '../lib/motion';

export const IncidentsPage: React.FC = () => {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    let active = true;
    incidentsService.getNearby({ lat: 9.0108, lon: 38.7618 }).then((res) => {
      if (active) setIncidents(res.items);
    });
    return () => {
      active = false;
    };
  }, []);

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [userVotes, setUserVotes] = useState<Record<string, 'CONFIRM' | 'DISPUTE'>>({});

  const handleVote = (incidentId: string, action: 'CONFIRM' | 'DISPUTE') => {
    const currentVote = userVotes[incidentId];
    if (currentVote === action) return; // Already voted

    setUserVotes((prev) => ({ ...prev, [incidentId]: action }));

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const currentCount = inc.confirmationsCount || 0;
          const newCount = action === 'CONFIRM' ? currentCount + 1 : Math.max(0, currentCount - 1);
          // If confirmations reach 3 or more, auto-promote from PENDING to ACTIVE
          const newStatus = inc.status === 'PENDING' && newCount >= 3 ? 'ACTIVE' : inc.status;
          return {
            ...inc,
            confirmationsCount: newCount,
            status: newStatus,
          };
        }
        return inc;
      })
    );
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesStatus = filterStatus === 'ALL' || inc.status === filterStatus;
    const matchesQuery = !searchQuery.trim() ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#f8faf8] text-[#141d18] font-sans py-8 px-4 sm:px-6">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8e3] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
                Road Incidents & Hazard Radar
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Live highway telemetry and community verified roadblocks. Submissions automatically activate upon 3 scout endorsements.
            </p>
          </div>

          <Link
            to="/incidents/report"
            className="self-start sm:self-auto py-2.5 px-4 bg-[#0f2b1d] hover:bg-[#07170f] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Report Road Hazard</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'ACTIVE', 'PENDING', 'RESOLVED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-[#183a2b] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'All Incidents' : status}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports or corridors..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b]"
            />
          </div>
        </div>

        {/* Incidents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((incident) => {
            const userVote = userVotes[incident.id];
            const isConfirmed = incident.status === 'ACTIVE' || (incident.confirmationsCount || 0) >= 3;

            return (
              <motion.div
                key={incident.id}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={springGentle}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:border-[#183a2b]/40 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      incident.status === 'ACTIVE'
                        ? 'bg-red-100 text-red-800'
                        : incident.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {incident.type.replace('_', ' ')} • {incident.status}
                    </span>

                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                    {incident.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {incident.distanceMeters 
                        ? `${(incident.distanceMeters / 1000).toFixed(1)} km away from current GPS` 
                        : 'Highland Escarpment'}
                    </span>
                  </div>
                </div>

                {/* Community Verification Voting Bar */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{incident.confirmationsCount || 0} Confirmations</span>
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {isConfirmed ? 'Verified by Guild' : 'Needs 3 to activate'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleVote(incident.id, 'CONFIRM')}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        userVote === 'CONFIRM'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-gray-50 hover:bg-emerald-50 text-emerald-800 border border-gray-200'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Confirm (አረጋግጥ)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVote(incident.id, 'DISPUTE')}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        userVote === 'DISPUTE'
                          ? 'bg-red-700 text-white shadow-xs'
                          : 'bg-gray-50 hover:bg-red-50 text-red-800 border border-gray-200'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Dispute (አልተስማማሁም)</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default IncidentsPage;
