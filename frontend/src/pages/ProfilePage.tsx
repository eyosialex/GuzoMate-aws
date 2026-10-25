import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Globe, 
  Bell, 
  CheckCircle2, 
  LogOut, 
  Save 
} from 'lucide-react';
import { useAuth } from '../features/AuthContext';
import { useAppStore } from '../features/useAppStore';
import { Language } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, logout, updateUserPreferences } = useAuth();
  const navigate = useNavigate();

  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const [fullName, setFullName] = useState(user?.fullName || 'Dawit A.');
  const [prefLang, setPrefLang] = useState<Language>(language);
  const [alertRadiusKm, setAlertRadiusKm] = useState<number>(15);
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [incidentAlerts, setIncidentAlerts] = useState<boolean>(true);
  const [phone, setPhone] = useState(user?.phone || '+251 91 123 4567');
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserPreferences({
      fullName,
      preferredLanguage: prefLang,
      phone,
    });
    setLanguage(prefLang);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#f8faf8] text-[#141d18] font-sans py-8 px-4 sm:px-6">
      <div className="max-w-[800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                alt={user?.fullName || "User"}
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-[#183a2b]/20 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-gray-950">{user?.fullName || 'Scout'}</h1>
                <span className="text-[10px] font-bold bg-[#f0f7f3] text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded">
                  {user?.scoutGuildBadge || 'Selam Guild #418'}
                </span>
              </div>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-[10px] text-gray-400 uppercase font-semibold">Trust Rating</span>
            <span className="text-base font-black text-emerald-700">{user?.trustRating || 98.4}%</span>
          </div>
        </div>

        {isSavedNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Preferences saved successfully to local session!</span>
          </motion.div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Section 1: Scout Identity */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-950 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#183a2b]" />
              <span>Scout Identity & Contact</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Emergency Mobile Dial
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#183a2b]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Localization */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-950 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#183a2b]" />
              <span>Language & Script</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Preferred Display Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'en' as const, label: 'English (US)' },
                  { code: 'am' as const, label: 'አማርኛ (Amharic)' },
                  { code: 'om' as const, label: 'Afaan Oromoo' },
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setPrefLang(l.code)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      prefLang === l.code
                        ? 'bg-[#183a2b] text-white border-[#183a2b]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Safety & Notification Radius */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-950 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#183a2b]" />
              <span>Corridor Safety Alerts & Radius</span>
            </h3>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
                <span>Alert Broadcast Radius:</span>
                <span className="font-mono font-bold text-[#183a2b]">{alertRadiusKm} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={alertRadiusKm}
                onChange={(e) => setAlertRadiusKm(Number(e.target.value))}
                className="w-full accent-[#183a2b] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>5 km (Local)</span>
                <span>25 km (Corridor)</span>
                <span>50 km (Regional)</span>
              </div>
            </div>

            <div className="pt-2 space-y-2 border-t border-gray-100">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs font-semibold text-gray-800">Push Notifications for Severe Hazards</span>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="rounded text-[#183a2b] focus:ring-[#183a2b] h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs font-semibold text-gray-800">Scout Community Verification Requests</span>
                <input
                  type="checkbox"
                  checked={incidentAlerts}
                  onChange={(e) => setIncidentAlerts(e.target.checked)}
                  className="rounded text-[#183a2b] focus:ring-[#183a2b] h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="py-2.5 px-5 bg-[#183a2b] hover:bg-[#122e22] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
