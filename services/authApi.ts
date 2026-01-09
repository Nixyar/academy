import { apiFetch } from './apiClient';

export interface BackendProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  plan: string;
  daily_limit: number;
  daily_used: number;
  daily_reset_at: string;
  created_at: string;
  updated_at: string;
  terms_accepted?: boolean | null;
  privacy_accepted?: boolean | null;
  terms_version?: string | null;
  privacy_version?: string | null;
  terms_accepted_at?: string | null;
  privacy_accepted_at?: string | null;
  consent_ip?: string | null;
  consent_user_agent?: string | null;
}

export async function setSession(accessToken: string, refreshToken: string): Promise<void> {
  await apiFetch('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' }, { retryOn401: false });
}

export async function refreshSession(): Promise<void> {
  await apiFetch('/api/auth/refresh', { method: 'POST' }, { retryOn401: false });
}

export async function me(): Promise<BackendProfile> {
  return apiFetch<BackendProfile>('/api/me', { method: 'GET' });
}

export async function acceptDocuments(input: {
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
}): Promise<BackendProfile> {
  return apiFetch<BackendProfile>('/api/me/consent', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<void> {
  await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}
