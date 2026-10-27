export type DevicePlatform = 'ios' | 'android' | 'web';

export interface RegisterDevicePayload {
  token: string;
  platform?: DevicePlatform;
}

export interface RegisteredDevice {
  id: string;
  token: string;
  platform: DevicePlatform;
  isActive: boolean;
}

export interface InAppNotification {
  id: string;
  userId: string;
  incidentId: string | null;
  type: string; // e.g. 'INCIDENT_ALERT'
  title: string;
  message: string;
  isRead: boolean;
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED';
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface NotificationsListResponse {
  items: InAppNotification[];
  unreadCount: number;
}
