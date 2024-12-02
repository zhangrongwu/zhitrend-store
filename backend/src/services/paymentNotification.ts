import { PAYMENT_CONFIG } from '../config/payment';

interface NotificationData {
  type: 'payment' | 'refund' | 'timeout' | 'error';
  orderId: number;
  userId: number;
  amount?: number;
  message: string;
  metadata?: Record<string, any>;
}

export class PaymentNotificationService {
  static async notify(c: any, data: NotificationData): Promise<void> {
    const { DB } = c.env;
    
    try {
      // 记录通知
      await DB.prepare(`
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          metadata,
          created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        data.userId,
        data.type,
        this.getNotificationTitle(data.type),
        data.message,
        JSON.stringify(data.metadata || {})
      ).run();

      // 获取用户通知设置
      const userSettings = await DB.prepare(`
        SELECT notification_settings
        FROM users
        WHERE id = ?
      `).bind(data.userId).first();

      const settings = JSON.parse(userSettings?.notification_settings || '{}');

      // 根据用户设置发送不同类型的通知
      if (settings.email) {
        await this.sendEmail(data);
      }

      if (settings.sms) {
        await this.sendSMS(data);
      }

      if (settings.wechat) {
        await this.sendWechatNotification(data);
      }

      // 记录通知发送日志
      await DB.prepare(`
        INSERT INTO notification_logs (
          user_id,
          type,
          channels,
          status,
          error,
          created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        data.userId,
        data.type,
        JSON.stringify(Object.keys(settings).filter(k => settings[k])),
        'success',
        null
      ).run();

    } catch (error) {
      console.error('Notification error:', error);
      
      // 记录失败日志
      await DB.prepare(`
        INSERT INTO notification_logs (
          user_id,
          type,
          channels,
          status,
          error,
          created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        data.userId,
        data.type,
        '[]',
        'failed',
        error.message
      ).run();

      throw error;
    }
  }

  private static getNotificationTitle(type: string): string {
    const titles = {
      payment: '支付通知',
      refund: '退款通知',
      timeout: '支付超时提醒',
      error: '支付异常提醒',
    };
    return titles[type as keyof typeof titles] || '系统通知';
  }

  private static async sendEmail(data: NotificationData): Promise<void> {
    // 实现邮件发送逻辑
    const emailService = new EmailService(PAYMENT_CONFIG.email);
    await emailService.send({
      to: data.metadata?.email,
      subject: this.getNotificationTitle(data.type),
      content: data.message,
    });
  }

  private static async sendSMS(data: NotificationData): Promise<void> {
    // 实现短信发送逻辑
    const smsService = new SMSService(PAYMENT_CONFIG.sms);
    await smsService.send({
      phone: data.metadata?.phone,
      content: data.message,
    });
  }

  private static async sendWechatNotification(data: NotificationData): Promise<void> {
    // 实现微信通知逻辑
    const wechatService = new WechatService(PAYMENT_CONFIG.wechat);
    await wechatService.sendTemplateMessage({
      openid: data.metadata?.openid,
      templateId: 'payment_notification',
      data: {
        type: data.type,
        message: data.message,
        amount: data.amount,
        time: new Date().toLocaleString(),
      },
    });
  }
}

// 这些类需要根据实际使用的服务来实现
class EmailService {
  constructor(config: any) {}
  async send(data: any) {}
}

class SMSService {
  constructor(config: any) {}
  async send(data: any) {}
}

class WechatService {
  constructor(config: any) {}
  async sendTemplateMessage(data: any) {}
} 