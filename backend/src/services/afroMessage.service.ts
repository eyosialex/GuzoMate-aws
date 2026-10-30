import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ProviderError } from '../shared/errors/app-error.js';

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  providerResponse?: any;
}

export interface AfroMessageSendOptions {
  to: string;
  message: string;
}

/**
 * Service adapter for AfroMessage SMS API (https://afromessage.com).
 * Wraps SMS dispatch operations behind an swappable interface.
 */
export class AfroMessageService {
  private static readonly BASE_URL = env.AFROMESSAGE_BASE_URL || 'https://api.afromessage.com/api';

  /**
   * Dispatches an SMS message via the AfroMessage API.
   *
   * Assumptions & API Details:
   * - Endpoint: POST ${BASE_URL}/send or GET ${BASE_URL}/send
   * - Auth Header: Bearer <AFROMESSAGE_API_TOKEN>
   * - Parameters: to, message, sender (optional), from (optional identifier ID)
   *
   * In test environment or when AFROMESSAGE_API_TOKEN is not configured,
   * SMS dispatching is mocked safely without throwing provider errors.
   */
  static async sendSms(options: AfroMessageSendOptions): Promise<SendSmsResult> {
    const { to, message } = options;
    const token = env.AFROMESSAGE_API_TOKEN?.trim();

    // In test environment or when credentials are not configured, use mock provider
    if (env.NODE_ENV === 'test' || !token || token === 'your_afromessage_api_bearer_token') {
      logger.info(`[AfroMessage Mock] SMS dispatched to ${to}`);
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    try {
      const url = new URL(`${this.BASE_URL}/send`);
      const payload: Record<string, any> = {
        to,
        message,
      };

      if (env.AFROMESSAGE_SENDER_ID) {
        payload.sender = env.AFROMESSAGE_SENDER_ID;
      }
      if (env.AFROMESSAGE_IDENTIFIER_ID) {
        payload.from = env.AFROMESSAGE_IDENTIFIER_ID;
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = (await response.json().catch(() => null)) as any;

      if (!response.ok || (responseData && responseData.acknowledge === 'error')) {
        logger.error('[AfroMessage API Error]', {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
          to,
        });

        // Safe error mapping without exposing internal provider details
        if (response.status === 401 || response.status === 403) {
          throw new ProviderError('SMS provider authorization failed. Please contact support.');
        } else if (response.status === 402 || (responseData?.response?.toLowerCase().includes('balance'))) {
          throw new ProviderError('SMS provider insufficient credit. Please try again later.');
        } else {
          throw new ProviderError('Unable to send verification SMS. Please try again later.');
        }
      }

      logger.info(`[AfroMessage] SMS sent successfully to ${to}`);
      return {
        success: true,
        messageId: responseData?.response?.message_id || responseData?.message_id,
        providerResponse: responseData,
      };
    } catch (error: any) {
      if (error instanceof ProviderError) {
        throw error;
      }

      logger.error('[AfroMessage Network/Unexpected Error]', {
        message: error.message,
        to,
      });

      throw new ProviderError('SMS delivery service is temporarily unreachable. Please try again later.');
    }
  }

  /**
   * Helper to format and send OTP SMS message.
   */
  static async sendOtp(phoneNumber: string, otp: string): Promise<SendSmsResult> {
    const message = `Your GuzoMate verification code is: ${otp}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes. Never share this code with anyone.`;
    return this.sendSms({
      to: phoneNumber,
      message,
    });
  }
}
