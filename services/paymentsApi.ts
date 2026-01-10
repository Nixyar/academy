import { apiFetch } from './apiClient';

export async function initTbankCoursePurchase(courseId: string): Promise<{ paymentUrl: string; orderId: string }> {
  return apiFetch('/api/payments/tbank/init', {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  });
}

export async function syncTbankCoursePurchase(orderId: string): Promise<{ status: string; courseId: string; paidAt?: string | null }> {
  return apiFetch('/api/payments/tbank/sync', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}
