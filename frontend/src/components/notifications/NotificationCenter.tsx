import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  ShieldAlert,
  Loader2,
  ExternalLink,
  LogIn,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAppStore } from '../../features/useAppStore';
import { InAppNotification } from '../../types/notifications';
import { springTactile, tactilePress } from '../../lib/motion';

export interface NotificationCenterProps {
  onClose?: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const shouldReduceMotion = useReducedMotion();
  const currentUser = useAppStore((state) => state.currentUser);
  const openAuthModal = useAppStore((state) => state.openAuthModal);
  const setPageView = useAppStore((state) => state.setPageView);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ limit: 20 });

  const handleNotificationClick = async (item: InAppNotification) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }

    if (item.incidentId) {
      // Navigate to incidents feed/map to view the alert
      setPageView('incidents');
      if (onClose) onClose();
    }
  };

  return (
    <div className="w-80 md:w-96 rounded-2xl bg-white border border-outline-variant/40 shadow-xl overflow-hidden z-50 animate-in fade-in-50 text-xs flex flex-col max-h-[480px]">
      {/* Header */}
      <div className="p-3.5 border-b border-outline-variant/20 bg-surface-low/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-sm leading-none">Travel Alerts</h3>
            <span className="text-[10px] text-on-surface-variant font-medium">
              Real-time corridor advisories
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {unreadCount} new
            </span>
          )}

          {currentUser && unreadCount > 0 && (
            <motion.button
              type="button"
              whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
              transition={springTactile}
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-variant px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1.5 divide-y divide-outline-variant/10">
        {!currentUser ? (
          <div className="p-6 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
              <LogIn className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-on-surface text-xs">Sign in for Corridor Alerts</p>
              <p className="text-[11px] text-on-surface-variant/80 mt-1 max-w-[220px]">
                Get instant notifications on road hazards, blockages, and severe weather in Addis Ababa.
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
              transition={springTactile}
              onClick={() => {
                if (onClose) onClose();
                openAuthModal('login');
              }}
              className="mt-1 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-variant transition-colors cursor-pointer"
            >
              Sign In to GuzoMate
            </motion.button>
          </div>
        ) : isLoading && notifications.length === 0 ? (
          <div className="p-6 flex flex-col items-center justify-center text-on-surface-variant/60 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs font-medium">Checking travel advisories...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-on-surface-variant/70">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <p className="font-bold text-on-surface text-xs">Corridors Clear</p>
            <p className="text-[11px] text-on-surface-variant max-w-[220px]">
              No active road hazards or safety advisories along your subscribed routes.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-2.5 rounded-xl transition-all cursor-pointer select-none flex items-start gap-2.5 ${
                item.isRead
                  ? 'bg-transparent hover:bg-surface-low opacity-80'
                  : 'bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100/60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  item.type === 'INCIDENT_ALERT'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                {item.type === 'INCIDENT_ALERT' ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <Info className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={`text-xs truncate ${
                      item.isRead ? 'font-semibold text-on-surface' : 'font-bold text-on-surface'
                    }`}
                  >
                    {item.title}
                  </p>
                  <span className="text-[10px] text-on-surface-variant/60 shrink-0 font-medium">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">
                  {item.message}
                </p>

                {item.incidentId && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-primary">
                    <span>View on hazard map</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>

              {!item.isRead && (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0"
                  title="Unread notification"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
