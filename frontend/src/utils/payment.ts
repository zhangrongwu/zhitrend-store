import { PAYMENT_CONFIG } from '../config/payment';

export function formatCurrency(amount: number, currency: string = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  
  const rate = PAYMENT_CONFIG.exchangeRate[`${from}_${to}` as keyof typeof PAYMENT_CONFIG.exchangeRate];
  if (!rate) throw new Error(`Exchange rate not found for ${from} to ${to}`);
  
  return amount * rate;
}

export function getAvailablePaymentMethods(userRegion: string = 'global'): typeof PAYMENT_CONFIG.supportedMethods {
  return PAYMENT_CONFIG.supportedMethods.filter(method => 
    method.regions.includes('global') || method.regions.includes(userRegion)
  );
}

export function validatePaymentAmount(amount: number): boolean {
  return amount > 0 && amount <= 99999999;
}

export function getPaymentMethodIcon(methodId: string): string {
  const method = PAYMENT_CONFIG.supportedMethods.find(m => m.id === methodId);
  return method?.icon || '/images/payment/default.svg';
} 