export interface PushMessagePayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  invalidToken?: boolean;
}

export interface INotificationProvider {
  name: string;
  sendToDevice(token: string, payload: PushMessagePayload): Promise<PushSendResult>;
  sendToDevices(tokens: string[], payload: PushMessagePayload): Promise<PushSendResult[]>;
}
