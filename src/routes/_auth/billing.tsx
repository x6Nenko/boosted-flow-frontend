import { Link, createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Check, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { BillingStatus } from '@/features/billing/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { billingApi } from '@/features/billing/api';
import { billingStatusQueryKey, useBillingStatus, useCreateCheckout } from '@/features/billing/hooks';
import { openPaddleCheckout } from '@/features/billing/paddle';

export const Route = createFileRoute('/_auth/billing')({
  component: BillingPage,
});

const CHECKOUT_POLL_ATTEMPTS = 8;
const CHECKOUT_POLL_DELAY_MS = 1500;

const INCLUDES = [
  'Activities & Sessions',
  'Stopwatch & Pomodoro timers',
  'Intention & Reflection notes',
  'Distraction tracking',
  'Heatmap, streaks & analytics',
  'All new upcoming features',
];

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled';
  return format(new Date(value), 'MMM d, yyyy');
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return (error.data as { message?: string } | null)?.message ?? 'Request failed';
  }

  return error instanceof Error ? error.message : 'Request failed';
}

async function waitForBillingAccess(queryClient: QueryClient) {
  for (let attempt = 0; attempt < CHECKOUT_POLL_ATTEMPTS; attempt += 1) {
    const status = await queryClient.fetchQuery({
      queryKey: billingStatusQueryKey,
      queryFn: billingApi.getStatus,
      staleTime: 0,
    });

    if (status.hasActiveAccess) {
      return true;
    }

    await new Promise((resolve) => window.setTimeout(resolve, CHECKOUT_POLL_DELAY_MS));
  }

  return false;
}

export function BillingPage() {
  const queryClient = useQueryClient();
  const { data: billingStatus, isLoading } = useBillingStatus();
  const createCheckout = useCreateCheckout();
  const cleanupCheckoutEventsRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const checkoutAttemptRef = useRef(0);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isWaitingForAccess, setIsWaitingForAccess] = useState(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupCheckoutEventsRef.current?.();
    };
  }, []);

  const refreshBillingStatus = () => {
    void queryClient.invalidateQueries({ queryKey: billingStatusQueryKey });
  };

  const handleSubscribe = async () => {
    cleanupCheckoutEventsRef.current?.();
    const checkoutAttempt = checkoutAttemptRef.current + 1;
    checkoutAttemptRef.current = checkoutAttempt;
    setCheckoutError(null);
    setCheckoutMessage(null);

    try {
      const { transactionId } = await createCheckout.mutateAsync();
      const cleanup = await openPaddleCheckout(transactionId, (event) => {
        if (event.name === 'checkout.completed') {
          setIsWaitingForAccess(true);
          setCheckoutMessage('Confirming your subscription...');

          void waitForBillingAccess(queryClient)
            .then((hasAccess) => {
              if (!isMountedRef.current || checkoutAttemptRef.current !== checkoutAttempt) {
                return;
              }

              if (!hasAccess) {
                setCheckoutMessage('Payment received. Access will update as soon as Paddle confirms it.');
              }
            })
            .catch((error) => {
              if (!isMountedRef.current || checkoutAttemptRef.current !== checkoutAttempt) {
                return;
              }

              setCheckoutError(getApiErrorMessage(error));
            })
            .finally(() => {
              if (isMountedRef.current && checkoutAttemptRef.current === checkoutAttempt) {
                setIsWaitingForAccess(false);
              }
            });
        }

        if (event.name === 'checkout.closed') {
          refreshBillingStatus();
          cleanupCheckoutEventsRef.current?.();
          cleanupCheckoutEventsRef.current = null;
        }
      });

      cleanupCheckoutEventsRef.current = cleanup;
    } catch (error) {
      setCheckoutError(getApiErrorMessage(error));
      setIsWaitingForAccess(false);
    }
  };

  if (isLoading || !billingStatus) {
    return <BillingSkeleton />;
  }

  if (billingStatus.hasActiveSubscription && billingStatus.subscription) {
    return <SubscriptionView billingStatus={billingStatus} />;
  }

  if (billingStatus.hasActiveTrial) {
    return <TrialView billingStatus={billingStatus} />;
  }

  return (
    <PaywallView
      isPending={createCheckout.isPending || isWaitingForAccess}
      checkoutMessage={checkoutMessage}
      checkoutError={checkoutError}
      onSubscribe={handleSubscribe}
    />
  );
}

function BillingSkeleton() {
  return (
    <div className="py-8">
      <Skeleton className="mb-6 h-8 w-32" />
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="mb-8 h-4 w-72 max-w-full" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}

function TrialView({ billingStatus }: { billingStatus: BillingStatus }) {
  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Billing</h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-clean/80">
          Trial active
        </p>
        <h2 className="mb-3 text-base font-semibold text-foreground">Your app trial is running</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          You have full access until {formatDate(billingStatus.trial.endsAt)}.
        </p>
        <Button asChild variant="action">
          <Link to="/dashboard">Continue to app</Link>
        </Button>
      </div>
    </div>
  );
}

function SubscriptionView({ billingStatus }: { billingStatus: BillingStatus }) {
  const subscription = billingStatus.subscription;

  if (!subscription) return null;

  return (
    <div className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Billing</h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-cream/15 bg-cream/10 text-cream">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Subscription active</h2>
            <p className="text-sm capitalize text-muted-foreground">{subscription.status}</p>
          </div>
        </div>

        <dl className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatusMetric label="Next billing date" value={formatDate(subscription.nextBilledAt)} />
          <StatusMetric
            label="Cancellation"
            value={subscription.canceledAt ? formatDate(subscription.canceledAt) : 'Not canceled'}
          />
          <StatusMetric label="Plan" value="Yearly plan" />
        </dl>

        <Button disabled variant="secondary" className="gap-2">
          Manage subscription
          <ExternalLink size={14} />
        </Button>
      </div>
    </div>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function PaywallView({
  isPending,
  checkoutMessage,
  checkoutError,
  onSubscribe,
}: {
  isPending: boolean;
  checkoutMessage: string | null;
  checkoutError: string | null;
  onSubscribe: () => void;
}) {
  return (
    <div className="py-8">
      <div className="mx-auto max-w-sm">
        <p className="mb-12 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground/80">Billing</p>
        <h1 className="mb-8 text-center text-2xl font-bold text-foreground md:text-3xl">
          Keep your flow intact.
          <br />
          <span className="text-muted-foreground">One price.</span>
        </h1>

        <div className="relative rounded-xl border border-cream/15 bg-card p-6 sm:p-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
            <p className="text-base font-semibold text-foreground">Yearly plan</p>
            <span className="rounded-full border border-cream/20 bg-cream/10 px-2.5 py-1 text-xs font-medium text-cream">
              50% off - Launch sale
            </span>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-6xl font-bold text-foreground">$12</span>
              <span className="text-sm text-muted-foreground">/year</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground/80">
              <span className="line-through">$24</span>
              <span className="mx-1.5 text-border">·</span>
              $1/mo during launch
            </p>
          </div>

          <ul className="mb-8 space-y-2.5">
            {INCLUDES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Check size={14} className="shrink-0 text-cream/60" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onSubscribe}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Working...' : 'Subscribe'}
          </Button>

          <p
            className={cn(
              'mt-3 text-center text-xs text-muted-foreground/60',
              checkoutError && 'text-destructive',
            )}
          >
            {checkoutError ?? checkoutMessage ?? 'Secure checkout powered by Paddle'}
          </p>
        </div>
      </div>
    </div>
  );
}
