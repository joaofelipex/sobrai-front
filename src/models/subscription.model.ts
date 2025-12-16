export interface SubscriptionPlan {
  id: 'starter' | 'growth' | 'pro';
  name: string;
  price: number;
  features: string[];
}
