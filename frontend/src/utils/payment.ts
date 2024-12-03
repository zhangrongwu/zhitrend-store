import { paymentConfig } from '../config/payment';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

interface PaymentConfig {
  stripe: {
    publishableKey: string;
  };
  paypal: {
    clientId: string;
  };
  supportedMethods: PaymentMethod[];
}

// 类型断言确保 paymentConfig 符合 PaymentConfig 接口
const typedPaymentConfig = paymentConfig as PaymentConfig;

export function getEnabledPaymentMethods(): PaymentMethod[] {
  return typedPaymentConfig.supportedMethods.filter(method => method.enabled);
}

export function isPaymentMethodSupported(methodId: string): boolean {
  const method = typedPaymentConfig.supportedMethods.find(m => m.id === methodId);
  return !!method?.enabled;
} 