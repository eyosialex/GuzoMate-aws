import { INotificationProvider, PushMessagePayload, PushSendResult } from './notification.provider.interface.js';
import { logger } from '../../../config/logger.js';

export class MockNotificationProvider implements INotificationProvider {
  public readonly name = 'MockNotificationProvider';
  public sentMessages: Array<{ token: string; payload: PushMessagePayload; timestamp: Date }> = [];

  async sendToDevice(token: string, payload: PushMessagePayload): Promise<PushSendResult> {
    logger.info(`[MockNotificationProvider] Dispatching mock push to token: ${token.substring(0, 10)}...`, {
      title: payload.title,
      body: payload.body,
    });

    this.sentMessages.push({
      token,
      payload,
      timestamp: new Date(),
    });

    return {
      success: true,
      messageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  async sendToDevices(tokens: string[], payload: PushMessagePayload): Promise<PushSendResult[]> {
    return Promise.all(tokens.map((token) => this.sendToDevice(token, payload)));
  }

  clearHistory(): void {
    this.sentMessages = [];
  }
}
