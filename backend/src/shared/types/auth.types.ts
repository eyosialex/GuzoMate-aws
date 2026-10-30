import { UserRole, UserStatus, Language } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string | null;
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  role: UserRole;
  status: UserStatus;
  preferredLanguage?: Language;
}

export interface JwtPayload {
  userId: string;
  email: string | null;
  phoneNumber?: string | null;
  role: UserRole;
}
