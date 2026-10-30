import { UserRole, UserStatus, Language } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string | null;
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  name?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  googleId?: string | null;
  authProvider?: string;
  authProviders?: string[];
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
