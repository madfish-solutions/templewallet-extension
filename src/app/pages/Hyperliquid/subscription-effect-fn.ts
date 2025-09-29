import { Subscription } from '@nktkas/hyperliquid';
import retry from 'async-retry';

export const subscriptionEffectFn = (
  createSubscription: () => Promise<Subscription>,
  onSubscription?: EmptyFn,
  onUnsubscribe?: EmptyFn
) => {
  let bail: SyncFn<Error> | undefined;
  let sub: Subscription | undefined;
  retry(
    async newBail => {
      bail = newBail;

      return await createSubscription().then(newSub => void (sub = newSub));
    },
    { forever: true, minTimeout: 1000, maxTimeout: 10000 }
  )
    .then(onSubscription)
    .catch(console.error);

  return () => {
    if (sub) {
      sub.unsubscribe();
      onUnsubscribe?.();
    } else {
      bail?.(new Error('Subscription cancelled'));
    }
  };
};
