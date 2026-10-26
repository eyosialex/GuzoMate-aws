import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, CheckCheck, AlertTriangle, ShieldCheck, CloudSun, Clock, Trash2 } from 'lucide-react';
import { springGentle } from '../lib/motion';

interface NotificationItem {
  id: string;
  type: 'ALERT' | 'GUILD' | 'WEATHER';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export const NotificationsPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'ALERT',
      title: 'Highland Roadblock: Termaber Escarpment km 98.4',
      message: 'Active rockfall reported on hairpin #4. 14 scout confirmations. Descending lane blocked with mud slurry.',
      time: '15 mins ago',
      isRead: false,
    },
    {
      id: 'notif-2',
      type: 'WEATHER',
      title: 'Dense Mountain Mist Alert (Entoto Ridge)',
      message: 'Visibility dropped below 30m on Entoto Pass. Gabi or warm apparel strictly advised for evening commuters.',
      time: '1 hour ago',
      isRead: false,
    },
    {
      id: 'notif-3',
      type: 'GUILD',
      title: 'Selam Intercity Guild Broadcast',
      message: 'Your report on Churchill Avenue resurfacing reached 28 scout endorsements and was forwarded to Traffic Police.',
      time: '3 hours ago',
      isRead: true,
    },
    {
      id: 'notif-4',
      type: 'ALERT',
      title: 'Heavy Peak Slowdown near Gotera Interchange',
      message: 'Average vehicle speed reduced to 8 km/h. Recommend taking Debre Zeit road bypass.',
      time: '5 hours ago',
      isRead: true,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#f8faf8] text-[#141d18] font-sans py-8 px-4 sm:px-6">
      <div className="max-w-[1000px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8e3] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-[#f0f7f3] text-[#183a2b] flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#183a2b]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
                Notifications & Safety Broadcasts
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Real-time corridor alerts, weather advisories, and guild scout broadcasts.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-[#183a2b]" />
              <span>Mark all as read ({unreadCount})</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto space-y-2">
            <Bell className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No notifications</h3>
            <p className="text-xs text-gray-500">
              You are all caught up! When safety broadcasts or scout alerts are issued, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <motion.div
                key={item.id}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={springGentle}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  item.isRead
                    ? 'bg-white border-gray-200 text-gray-700'
                    : 'bg-[#f0f7f3]/60 border-[#d1e2d8] text-gray-950 shadow-xs'
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'ALERT'
                    ? 'bg-red-50 text-red-600'
                    : item.type === 'WEATHER'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-[#183a2b] text-white'
                }`}>
                  {item.type === 'ALERT' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : item.type === 'WEATHER' ? (
                    <CloudSun className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-xs sm:text-sm font-bold ${item.isRead ? 'text-gray-800' : 'text-gray-950'}`}>
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => deleteNotification(item.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
