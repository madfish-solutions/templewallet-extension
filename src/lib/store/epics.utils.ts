import { Observable, withLatestFrom } from 'rxjs';

export const toLatestValue =
  <T1, T2>(state$: Observable<T2>) =>
  (observable$: Observable<T1>) =>
    observable$.pipe(withLatestFrom(state$, (value, state): [T1, T2] => [value, state]));
