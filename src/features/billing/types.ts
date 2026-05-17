export type BillingTrial = {
  status: 'active' | 'expired';
  startedAt: string;
  endsAt: string;
};

export type BillingSubscription = {
  status: string;
  priceId: string;
  nextBilledAt: string | null;
  canceledAt: string | null;
};

export type BillingStatus = {
  hasActiveSubscription: boolean;
  hasActiveTrial: boolean;
  hasActiveAccess: boolean;
  trial: BillingTrial;
  subscription: BillingSubscription | null;
};

export type CheckoutResponse = {
  transactionId: string;
};
