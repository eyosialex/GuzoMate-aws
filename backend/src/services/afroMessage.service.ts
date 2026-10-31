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
  private static lastSentOtps = new Map<string, string>();

  /**
   * Helper for automated test suites to verify OTPs without sending real SMS.
   */
  static getLastSentOtp(phoneNumber?: string): string | undefined {
    if (!phoneNumber) {
      return Array.from(this.lastSentOtps.values()).pop();
    }
    return this.lastSentOtps.get(phoneNumber);
  }

  /**
   * Dispatches an SMS message via the AfroMessage API.
   * Authentication uses only AFROMESSAGE_API_KEY via Bearer header.
   */
  static async sendSms(options: AfroMessageSendOptions): Promise<SendSmsResult> {
    const { to, message } = options;
    const apiKey = (env.AFROMESSAGE_API_KEY || env.AFROMESSAGE_API_TOKEN)?.trim();

    // In test environment or when credentials are not configured, use mock provider
    if (env.NODE_ENV === 'test' || !apiKey || apiKey === 'your_afromessage_api_key' || apiKey === 'your_afromessage_api_bearer_token') {
      logger.info(`[AfroMessage Mock] SMS dispatched to ${to}`);
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
    }

    try {
      const url = new URL(`${this.BASE_URL}/send`);
      // Only AFROMESSAGE_API_KEY is needed — no sender or identifier ID required
      const payload: Record<string, any> = {
        to,
        message,
      };

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = (await response.json().catch(() => null)) as any;

      if (!response.ok || (responseData && responseData.acknowledge === 'error')) {
        let errorMsg = '';
        if (typeof responseData?.response === 'string') {
          errorMsg = responseData.response;
        } else if (Array.isArray(responseData?.response?.errors)) {
          errorMsg = responseData.response.errors.join('; ');
        } else if (responseData?.error) {
          errorMsg = typeof responseData.error === 'string' ? responseData.error : JSON.stringify(responseData.error);
        } else if (responseData?.message) {
          errorMsg = String(responseData.message);
        }

        const lowerMsg = errorMsg.toLowerCase();

        logger.error('[AfroMessage API Error]', {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
          errorMessage: errorMsg,
          to,
        });

        // Safe error mapping with clear context
        if (response.status === 401 || response.status === 403 || lowerMsg.includes('auth') || lowerMsg.includes('unauthorized') || lowerMsg.includes('token') || lowerMsg.includes('key')) {
          throw new ProviderError('SMS provider authorization failed. Please check your AFROMESSAGE_API_KEY.');
        } else if (response.status === 402 || lowerMsg.includes('balance') || lowerMsg.includes('credit')) {
          throw new ProviderError('SMS provider insufficient credit. Please recharge your AfroMessage account balance.');
        } else if (lowerMsg.includes('unverified contact') || lowerMsg.includes('beta testing')) {
          throw new ProviderError(`AfroMessage error: ${to} is an unverified contact number. While AfroMessage is in beta/trial mode, you must verify this recipient in your AfroMessage portal (https://app.afromessage.com).`);
        } else if (errorMsg) {
          throw new ProviderError(`AfroMessage error: ${errorMsg}`);
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
    this.lastSentOtps.set(phoneNumber, otp);
    const message = `Your GuzoMate verification code is: ${otp}. Valid for ${env.OTP_EXPIRY_MINUTES} minutes. Never share this code with anyone.`;
    return this.sendSms({
      to: phoneNumber,
      message,
    });
  }
}
