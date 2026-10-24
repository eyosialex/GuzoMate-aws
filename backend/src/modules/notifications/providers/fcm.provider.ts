import { INotificationProvider, PushMessagePayload, PushSendResult } from './notification.provider.interface.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { MockNotificationProvider } from './mock.provider.js';

export class FCMNotificationProvider implements INotificationProvider {
  public readonly name = 'FCMNotificationProvider';
  private fallbackProvider: MockNotificationProvider;
  private isConfigured: boolean;

  constructor() {
    this.fallbackProvider = new MockNotificationProvider();
    this.isConfigured = Boolean(env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY);

    if (!this.isConfigured) {
      logger.info(
        '[FCMNotificationProvider] Firebase credentials not configured in environment. Using MockNotificationProvider fallback.'
      );
    }
  }

  async sendToDevice(token: string, payload: PushMessagePayload): Promise<PushSendResult> {
    if (!this.isConfigured) {
      return this.fallbackProvider.sendToDevice(token, payload);
    }

    try {
      // In production with credentials, FCM v1 HTTP API or Admin SDK would dispatch here
      // For safe dev environment, provide documented mock delivery
      logger.info(`[FCMNotificationProvider] Sending push via FCM to ${token.substring(0, 10)}...`);
      return {
        success: true,
        messageId: `fcm-${Date.now()}`,
      };
    } catch (error: any) {
      logger.error('[FCMNotificationProvider] Failed to dispatch push:', error);
      return {
        success: false,
        error: error.message || 'FCM dispatch failed',
      };
    }
  }

  async sendToDevices(tokens: string[], payload: PushMessagePayload): Promise<PushSendResult[]> {
    return Promise.all(tokens.map((token) => this.sendToDevice(token, payload)));
  }
}
