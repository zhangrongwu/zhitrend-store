interface RiskRule {
  id: string;
  name: string;
  type: 'amount' | 'frequency' | 'location' | 'device' | 'pattern';
  condition: string;
  action: 'block' | 'flag' | 'review';
  score: number;
  enabled: boolean;
}

interface RiskAssessment {
  score: number;
  rules: string[];
  action: 'allow' | 'block' | 'review';
  reasons: string[];
}

export class PaymentRiskMonitorService {
  private static RISK_THRESHOLD = 75;
  private static HIGH_RISK_THRESHOLD = 90;

  static async assessRisk(c: any, payment: any): Promise<RiskAssessment> {
    const { DB } = c.env;
    let totalScore = 0;
    const triggeredRules: string[] = [];
    const reasons: string[] = [];

    try {
      // 获取启用的风险规则
      const rules = await DB.prepare(`
        SELECT * FROM risk_rules WHERE enabled = true
      `).all();

      // 评估每个规则
      for (const rule of rules.results) {
        const isTriggered = await this.evaluateRule(c, rule, payment);
        if (isTriggered) {
          totalScore += rule.score;
          triggeredRules.push(rule.id);
          reasons.push(rule.name);
        }
      }

      // 记录风险评估结果
      await DB.prepare(`
        INSERT INTO risk_assessments (
          payment_id,
          user_id,
          score,
          triggered_rules,
          action,
          created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        payment.id,
        payment.user_id,
        totalScore,
        JSON.stringify(triggeredRules),
        this.determineAction(totalScore)
      ).run();

      return {
        score: totalScore,
        rules: triggeredRules,
        action: this.determineAction(totalScore),
        reasons,
      };
    } catch (error) {
      console.error('Risk assessment failed:', error);
      throw error;
    }
  }

  private static async evaluateRule(c: any, rule: RiskRule, payment: any): Promise<boolean> {
    const { DB } = c.env;

    try {
      switch (rule.type) {
        case 'amount':
          return this.evaluateAmountRule(rule, payment);
        case 'frequency':
          return await this.evaluateFrequencyRule(c, rule, payment);
        case 'location':
          return this.evaluateLocationRule(rule, payment);
        case 'device':
          return this.evaluateDeviceRule(rule, payment);
        case 'pattern':
          return await this.evaluatePatternRule(c, rule, payment);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Rule evaluation failed for ${rule.id}:`, error);
      return false;
    }
  }

  private static determineAction(score: number): 'allow' | 'block' | 'review' {
    if (score >= this.HIGH_RISK_THRESHOLD) return 'block';
    if (score >= this.RISK_THRESHOLD) return 'review';
    return 'allow';
  }

  private static evaluateAmountRule(rule: RiskRule, payment: any): boolean {
    const condition = JSON.parse(rule.condition);
    return payment.amount > condition.threshold;
  }

  private static async evaluateFrequencyRule(c: any, rule: RiskRule, payment: any): Promise<boolean> {
    const { DB } = c.env;
    const condition = JSON.parse(rule.condition);
    
    const count = await DB.prepare(`
      SELECT COUNT(*) as count
      FROM payments
      WHERE user_id = ?
      AND created_at >= datetime('now', ?)
    `).bind(
      payment.user_id,
      `-${condition.timeWindow} minutes`
    ).first();

    return count.count >= condition.maxCount;
  }

  private static evaluateLocationRule(rule: RiskRule, payment: any): boolean {
    const condition = JSON.parse(rule.condition);
    return condition.blacklist.includes(payment.location);
  }

  private static evaluateDeviceRule(rule: RiskRule, payment: any): boolean {
    const condition = JSON.parse(rule.condition);
    return condition.suspicious.some((pattern: string) => 
      payment.deviceFingerprint.includes(pattern)
    );
  }

  private static async evaluatePatternRule(c: any, rule: RiskRule, payment: any): Promise<boolean> {
    const { DB } = c.env;
    const condition = JSON.parse(rule.condition);
    
    // 获取用户历史交易模式
    const history = await DB.prepare(`
      SELECT amount, created_at
      FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(payment.user_id, condition.historySize).all();

    // 分析模式
    return this.detectAnomalousPattern(history.results, payment, condition);
  }

  private static detectAnomalousPattern(history: any[], payment: any, condition: any): boolean {
    // 实现模式检测逻辑
    return false;
  }

  static async getMonitoringStats(c: any): Promise<any> {
    const { DB } = c.env;
    
    try {
      const stats = await DB.prepare(`
        SELECT 
          COUNT(*) as total_assessments,
          AVG(score) as average_score,
          COUNT(CASE WHEN action = 'block' THEN 1 END) as blocked_count,
          COUNT(CASE WHEN action = 'review' THEN 1 END) as review_count
        FROM risk_assessments
        WHERE created_at >= datetime('now', '-24 hours')
      `).first();

      const topRules = await DB.prepare(`
        SELECT 
          rule_id,
          COUNT(*) as trigger_count
        FROM (
          SELECT json_each.value as rule_id
          FROM risk_assessments, json_each(triggered_rules)
          WHERE created_at >= datetime('now', '-24 hours')
        )
        GROUP BY rule_id
        ORDER BY trigger_count DESC
        LIMIT 5
      `).all();

      return {
        ...stats,
        topTriggeredRules: topRules.results,
      };
    } catch (error) {
      console.error('Failed to get monitoring stats:', error);
      throw error;
    }
  }
} 