import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Bell, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Sliders, 
  Check, 
  AlertTriangle, 
  Bookmark, 
  ThumbsUp, 
  Loader2, 
  Save, 
  Search,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAppStore } from '../../features/useAppStore';
import { useAuth } from '../../features/AuthContext';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { ModerationQueueTab } from '../moderation/ModerationQueueTab';
import { 
  UserProfile, 
  NotificationPreferences, 
  IncidentCategory, 
  formatRadius 
} from '../../types/users';
import { modalScaleFade, backdropFade } from '../../lib/motion';

const ALL_INCIDENT_CATEGORIES: { id: IncidentCategory; label: string }[] = [
  { id: 'ACCIDENT', label: 'Traffic Accident' },
  { id: 'ROAD_BLOCK', label: 'Roadblock / Escarpment Hazard' },
  { id: 'ROAD_CLOSURE', label: 'Complete Road Closure' },
  { id: 'FLOODING', label: 'Flooding / Flash Torrent' },
  { id: 'LANDSLIDE', label: 'Mountain Landslide / Rockfall' },
  { id: 'ROAD_DAMAGE', label: 'Pothole / Road Damage' },
  { id: 'CONSTRUCTION', label: 'Road Construction & Lane Closure' },
  { id: 'HEAVY_TRAFFIC', label: 'Heavy Traffic Bottleneck' },
  { id: 'HAZARD', label: 'General Road Hazard' },
  { id: 'OTHER', label: 'Other Road Disturbance' },
];

export const UserProfileModal: React.FC = () => {
  const { 
    isProfileModalOpen, 
    closeProfileModal, 
    language, 
    setLanguage, 
    setCurrentUser, 
    currentUser,
    openAuthModal 
  } = useAppStore();
  const { user: authUser, logout, updateUserPreferences } = useAuth();

  // Helper to resolve initial profile immediately from active memory or stored session
  const resolveCurrentProfile = (): UserProfile | null => {
    const base = currentUser || authUser || authService.getStoredSession()?.user;
    if (!base) return null;
    return {
      id: base.id,
      email: base.email,
      name: base.name || (base as any).fullName || null,
      role: (base as any).role || 'USER',
      status: (base as any).status || 'ACTIVE',
      preferredLanguage: ((base as any).preferredLanguage as 'en' | 'am' | 'om') || 'en',
      createdAt: (base as any).createdAt || new Date().toISOString(),
      updatedAt: (base as any).updatedAt || new Date().toISOString(),
      stats: (base as any).stats || {
        reportedIncidentsCount: 0,
        confirmationsCount: 0,
        savedPlacesCount: 0,
      },
    };
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'moderation' | 'admin'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(resolveCurrentProfile);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Profile Form state
  const [displayName, setDisplayName] = useState(
    () => currentUser?.name || authUser?.name || (authUser as any)?.fullName || ''
  );
  const [selectedLang, setSelectedLang] = useState<'en' | 'am' | 'om'>(
    () => ((currentUser?.preferredLanguage || authUser?.preferredLanguage || language) as 'en' | 'am' | 'om') || 'en'
  );

  // Notification Preferences Form state
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<IncidentCategory[]>([]);

  // Admin Tab State
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Fetch profile and notification preferences when modal opens
  useEffect(() => {
    if (!isProfileModalOpen) return;

    // Immediately sync local state with current active session
    const initial = resolveCurrentProfile();
    if (initial) {
      setProfile((prev: UserProfile | null) => prev || initial);
      setDisplayName((prev: string) => prev || initial.name || '');
      setSelectedLang((prev: 'en' | 'am' | 'om') => (initial.preferredLanguage as any) || prev);
    }

    const token = authService.getStoredToken();
    if (!token) {
      // User is not signed in
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setStatusMessage(null);

    // Safety timeout ensures loading never gets permanently stuck
    const safetyTimeout = setTimeout(() => {
      if (active) setLoading(false);
    }, 6000);

    Promise.allSettled([
      userService.getProfile(),
      userService.getNotificationPreferences(),
    ]).then(([profileRes, prefsRes]) => {
      if (!active) return;
      clearTimeout(safetyTimeout);

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value;
        setProfile(p);
        setDisplayName(p.name || '');
        setSelectedLang((p.preferredLanguage as any) || 'en');
        // Synchronize store and auth context immediately
        setCurrentUser(p as any);
        updateUserPreferences({
          name: p.name,
          fullName: p.name || undefined,
          preferredLanguage: p.preferredLanguage as any,
        });
      } else {
        console.warn('Profile sync fallback to local cache:', profileRes.reason);
      }

      if (prefsRes.status === 'fulfilled') {
        const pr = prefsRes.value;
        setPrefs(pr);
        setNotifEnabled(pr.enabled);
        setRadiusMeters(pr.radiusMeters);
        setSelectedIncidentTypes(pr.incidentTypes || []);
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
    };
  }, [isProfileModalOpen]);

  // Load admin users list if on admin tab
  useEffect(() => {
    if (activeTab === 'admin' && profile?.role === 'ADMIN') {
      let active = true;
      setAdminLoading(true);
      userService.listUsers({ search: adminSearch || undefined })
        .then((res) => {
          if (active) setAdminUsers(res.items || []);
        })
        .catch((err) => console.warn('Admin list users error', err))
        .finally(() => {
          if (active) setAdminLoading(false);
        });

      return () => {
        active = false;
      };
    }
  }, [activeTab, adminSearch, profile?.role]);

  if (!isProfileModalOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const updated = await userService.updateProfile({
        name: displayName.trim(),
        preferredLanguage: selectedLang,
      });
      setProfile(updated);
      setLanguage(selectedLang);

      // Instantly update global store & auth context so homepage and navbar reflect immediately
      setCurrentUser(updated);
      updateUserPreferences({
        name: updated.name,
        fullName: updated.name || undefined,
        preferredLanguage: selectedLang,
      });

      setStatusMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch {
      setStatusMessage({ text: 'Failed to update profile. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const updated = await userService.updateNotificationPreferences({
        enabled: notifEnabled,
        radiusMeters,
        incidentTypes: selectedIncidentTypes,
      });
      setPrefs(updated);
      setStatusMessage({ text: 'Notification preferences saved!', type: 'success' });
    } catch {
      setStatusMessage({ text: 'Failed to save alert preferences.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleIncidentType = (id: IncidentCategory) => {
    setSelectedIncidentTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleToggleUserStatus = async (targetUser: UserProfile) => {
    const nextStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await userService.updateUserStatus(targetUser.id, {
        status: nextStatus,
        reason: `Admin toggle status to ${nextStatus}`,
      });
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      console.warn('Status change failed', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          variants={backdropFade}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={closeProfileModal}
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          variants={modalScaleFade}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-outline-variant/40 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-low">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-bold shadow-sm">
                <User className="w-5 h-5 text-secondary-light" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-primary font-display">
                    Traveler Profile &amp; Settings
                  </h2>
                  {loading && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Syncing
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant font-medium">
                  {profile?.email || authUser?.email || currentUser?.email || 'Traveler Account'}
                </p>
              </div>
            </div>

            <button
              onClick={closeProfileModal}
              className="p-2 rounded-xl text-ash hover:text-on-surface hover:bg-surface-high transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-outline-variant/20 bg-white text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('profile'); setStatusMessage(null); }}
              className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ash hover:text-on-surface'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile &amp; Stats</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('notifications'); setStatusMessage(null); }}
              className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'notifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-ash hover:text-on-surface'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Push Preferences</span>
            </button>

            {(profile?.role === 'MODERATOR' || profile?.role === 'ADMIN') && (
              <button
                type="button"
                onClick={() => { setActiveTab('moderation'); setStatusMessage(null); }}
                className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'moderation'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ash hover:text-on-surface'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Hazard Review</span>
              </button>
            )}

            {profile?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => { setActiveTab('admin'); setStatusMessage(null); }}
                className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ash hover:text-on-surface'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>User Moderation</span>
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Status Feedback Toast */}
            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <span>{statusMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="text-ash hover:text-on-surface cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {loading && !profile ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-primary">
                <Loader2 className="w-7 h-7 animate-spin" />
                <span className="text-xs font-semibold">Loading traveler data...</span>
              </div>
            ) : !profile ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center px-4">
                <User className="w-10 h-10 text-ash" />
                <h3 className="text-sm font-bold text-primary">No Active Traveler Session</h3>
                <p className="text-xs text-ash max-w-xs">
                  Please log in to manage your traveler profile, notification preferences, and contribution stats.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeProfileModal();
                    openAuthModal('login');
                  }}
                  className="mt-2 px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-colors cursor-pointer"
                >
                  Sign In / Register
                </button>
              </div>
            ) : (
              <>
                {/* TAB 1: PROFILE & STATS */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    {/* Role & Status Pill */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-ash">Account Role:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {profile?.role || 'USER'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {profile?.status || 'ACTIVE'}
                      </span>
                    </div>

                    {/* Community Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-surface-low border border-outline-variant/30 text-center">
                        <AlertTriangle className="w-4 h-4 text-secondary mx-auto mb-1" />
                        <span className="text-lg font-bold text-primary block">
                          {profile?.stats?.reportedIncidentsCount ?? 0}
                        </span>
                        <span className="text-[10px] text-ash font-medium">Hazards Reported</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-surface-low border border-outline-variant/30 text-center">
                        <ThumbsUp className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                        <span className="text-lg font-bold text-primary block">
                          {profile?.stats?.confirmationsCount ?? 0}
                        </span>
                        <span className="text-[10px] text-ash font-medium">Confirmations</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-surface-low border border-outline-variant/30 text-center">
                        <Bookmark className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                        <span className="text-lg font-bold text-primary block">
                          {profile?.stats?.savedPlacesCount ?? 0}
                        </span>
                        <span className="text-[10px] text-ash font-medium">Saved Places</span>
                      </div>
                    </div>

                    {/* Display Name Input */}
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your full name or callsign"
                        className="w-full px-3.5 py-2.5 bg-surface-low border border-outline-variant/40 rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Preferred Language Select */}
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1.5">
                        App &amp; Audio Language
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { code: 'en' as const, label: 'English', desc: 'EN' },
                          { code: 'am' as const, label: 'አማርኛ', desc: 'Amharic' },
                          { code: 'om' as const, label: 'Afaan Oromo', desc: 'Oromoo' },
                        ].map((l) => (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => setSelectedLang(l.code)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              selectedLang === l.code
                                ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                                : 'bg-surface-low border-outline-variant/30 text-ash hover:text-on-surface'
                            }`}
                          >
                            <span className="block text-xs font-bold">{l.label}</span>
                            <span className="text-[10px] opacity-75">{l.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          closeProfileModal();
                        }}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Sign Out
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-xs hover:bg-primary-dark transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save Profile</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: NOTIFICATION PREFERENCES */}
                {activeTab === 'notifications' && (
                  <form onSubmit={handleSavePreferences} className="space-y-5">
                    {/* Master Notification Toggle */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-low border border-outline-variant/30">
                      <div>
                        <h4 className="text-xs font-bold text-primary">Highland Road Alerts</h4>
                        <p className="text-[11px] text-ash">Receive push alerts for real-time corridor hazards</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifEnabled}
                          onChange={(e) => setNotifEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>

                    {/* Geofence Alert Radius Slider */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-surface-low border border-outline-variant/30">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-on-surface">Geofence Alert Radius</span>
                        <span className="font-mono font-bold text-primary bg-white px-2.5 py-0.5 rounded-md border border-outline-variant/30">
                          {formatRadius(radiusMeters)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="50000"
                        step="500"
                        value={radiusMeters}
                        onChange={(e) => setRadiusMeters(Number(e.target.value))}
                        disabled={!notifEnabled}
                        className="w-full accent-primary cursor-pointer disabled:opacity-40"
                      />
                      <div className="flex items-center justify-between text-[10px] text-ash">
                        <span>500 m (Local)</span>
                        <span>10 km (Intercity)</span>
                        <span>50 km (Regional Pass)</span>
                      </div>
                    </div>

                    {/* Incident Type Subscriptions */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-on-surface">
                          Incident Categories of Interest
                        </label>
                        <span className="text-[10px] text-ash">
                          {selectedIncidentTypes.length === 0 ? 'Subscribed to All' : `${selectedIncidentTypes.length} selected`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALL_INCIDENT_CATEGORIES.map((cat) => {
                          const isChecked = selectedIncidentTypes.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => toggleIncidentType(cat.id)}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                                isChecked
                                  ? 'bg-primary/5 border-primary text-primary font-semibold'
                                  : 'bg-surface-low border-outline-variant/20 text-on-surface hover:bg-surface-high'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                isChecked ? 'bg-primary border-primary text-white' : 'border-outline-variant/50'
                              }`}>
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                              <span className="truncate">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-outline-variant/20">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-xs hover:bg-primary-dark transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save Preferences</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 3: HAZARD MODERATION QUEUE */}
                {activeTab === 'moderation' && (profile?.role === 'MODERATOR' || profile?.role === 'ADMIN') && (
                  <ModerationQueueTab />
                )}

                {/* TAB 4: ADMIN USER MODERATION */}
                {activeTab === 'admin' && profile?.role === 'ADMIN' && (
                  <div className="space-y-4">
                    {/* Search box */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-ash absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Search travelers by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-low border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    {/* Users list */}
                    {adminLoading ? (
                      <div className="py-8 flex justify-center text-primary">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {adminUsers.map((u) => (
                          <div
                            key={u.id}
                            className="p-3 rounded-2xl bg-surface-low border border-outline-variant/30 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">{u.name || 'Unnamed Scout'}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-primary/10 text-primary font-bold rounded">
                                  {u.role}
                                </span>
                              </div>
                              <span className="text-[11px] text-ash">{u.email}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={u.id === profile.id}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                u.status === 'ACTIVE'
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Suspend</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
