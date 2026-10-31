export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type SupportedLanguage = 'en' | 'am' | 'om';
export type AuthProviderType = 'local' | 'google';

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  name: string | null;
  fullName?: string;
  role: UserRole;
  status: UserStatus;
  preferredLanguage: SupportedLanguage;
  avatarUrl?: string;
  isPhoneVerified?: boolean;
  googleId?: string | null;
  authProvider?: AuthProviderType | string;
  authProviders?: string[];
  scoutGuildBadge?: string;
  trustRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterPayload {
  fullName?: string;
  phoneNumber?: string;
  password: string;
  confirmPassword?: string;
  preferredLanguage?: SupportedLanguage;
  // Backwards compatibility fields
  name?: string;
  email?: string;
}

export interface LoginPayload {
  phoneNumber?: string;
  password: string;
  email?: string;
}

export interface LoginCredentials extends LoginPayload {
  rememberMe?: boolean;
}

export interface VerifyOtpPayload {
  phoneNumber: string;
  otp: string;
}

export interface ResendOtpPayload {
  phoneNumber: string;
}

export interface GoogleAuthPayload {
  idToken?: string;
  code?: string;
  accessToken?: string;
  redirectUri?: string;
}

export interface AuthSuccessData {
  user: User;
  accessToken: string;
  isNewUser?: boolean;
}

export type AuthSession = AuthSuccessData;

export interface RegisterResponseData {
  message: string;
  user: User;
  accessToken?: string;
}

export interface VerifyOtpResponseData {
  message: string;
  user: User;
  accessToken: string;
}

export interface ResendOtpResponseData {
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      path: (string | number)[];
      message: string;
    }>;
  };
}
