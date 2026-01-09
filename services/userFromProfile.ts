import type { User } from '../types';
import type { BackendProfile } from './authApi';

export function userFromProfile(profile: BackendProfile): User {
  const displayName =
    profile.name ||
    (profile.email ? profile.email.split('@')[0] : null) ||
    'Vibe Coder';

  const isSubscribed = profile.plan !== 'free';

  return {
    id: profile.id,
    name: displayName,
    email: profile.email ?? '',
    avatarUrl: profile.avatar_url,
    isSubscribed,
    plan: profile.plan,
    dailyLimit: profile.daily_limit,
    dailyUsed: profile.daily_used,
    termsAccepted: Boolean(profile.terms_accepted),
    privacyAccepted: Boolean(profile.privacy_accepted),
    progress: {},
    completedCourses: [],
  };
}
