import { apiFetch } from './apiClient';
import type { Subscription } from '../types';

// =============================================
// Subscription API — T-bank recurring payments
// =============================================

/**
 * Initialize a new subscription (redirects to T-bank payment page)
 */
export async function initSubscription(): Promise<{ paymentUrl: string; orderId: string }> {
  return apiFetch<{ paymentUrl: string; orderId: string }>('/api/subscriptions/init', {
    method: 'POST',
  });
}

/**
 * Sync subscription status after payment callback
 */
export async function syncSubscription(orderId: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/api/subscriptions/sync', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

/**
 * Get current active subscription for the user
 */
export async function getCurrentSubscription(): Promise<Subscription | null> {
  try {
    return await apiFetch<Subscription | null>('/api/subscriptions/current', {
      method: 'GET',
    });
  } catch {
    return null;
  }
}

/**
 * Cancel subscription (will remain active until period end)
 */
export async function cancelSubscription(): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/subscriptions/cancel', {
    method: 'POST',
  });
}
