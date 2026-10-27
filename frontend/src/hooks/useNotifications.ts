import { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services/notificationsService';
import { InAppNotification, ListNotificationsQuery } from '../types/notifications';
import { useAppStore } from '../features/useAppStore';

export function useNotifications(query?: ListNotificationsQuery) {
  const currentUser = useAppStore((state) => state.currentUser);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const page = query?.page;
  const limit = query?.limit;
  const unreadOnly = query?.unreadOnly;

  const fetchNotifications = useCallback(async () => {
    // Only fetch if authenticated
    const token = localStorage.getItem('guzomate_token') || localStorage.getItem('guzo_access_token');
    if (!token && !currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await notificationsService.getNotifications({ page, limit, unreadOnly });
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch (err: unknown) {
      console.warn('Failed to fetch notifications', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, page, limit, unreadOnly]);

  useEffect(() => {
    fetchNotifications();

    // Auto-poll notifications every 30 seconds if authenticated
    const token = localStorage.getItem('guzomate_token') || localStorage.getItem('guzo_access_token');
    if (!token && !currentUser) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, currentUser]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationsService.markAsRead(id);
      return true;
    } catch (err) {
      console.warn('Failed to mark notification as read on server', err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationsService.markAllAsRead();
      return true;
    } catch (err) {
      console.warn('Failed to mark all notifications as read on server', err);
      return false;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
