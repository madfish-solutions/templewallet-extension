import { Observable } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';

import { NewsNotificationInterface } from 'app/store/news/news-interfaces';
import { NewsRootState } from 'app/store/news/news-state';

export const withLoadedNews =
  <T>(state$: Observable<NewsRootState>) =>
  (observable$: Observable<T>) =>
    observable$.pipe(
      withLatestFrom(state$, (value, { newsState }): [T, Array<NewsNotificationInterface>] => [value, newsState.news])
    );
