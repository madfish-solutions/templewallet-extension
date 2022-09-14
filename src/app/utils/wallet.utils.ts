import { Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';

import { WalletRootState } from '../store/wallet/wallet-state';

export const withSelectedCounter =
  <T>(state$: Observable<WalletRootState>) =>
  (observable$: Observable<T>) =>
    observable$.pipe(withLatestFrom(state$, (value, { wallet }): [T, number] => [value, wallet.counter]));
