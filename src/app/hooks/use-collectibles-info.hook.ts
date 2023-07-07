import { useEffect, useState } from 'react';

import { EMPTY } from 'rxjs';
import { map, tap, finalize, catchError } from 'rxjs/operators';

import { fetchCollectibleInfo$ } from 'lib/apis/objkt';
import { CollectibleInfo } from 'lib/apis/objkt/intefaces';

export const useCollectibleInfo = (address: string, id: string) => {
  const [collectibleInfo, setCollectibleInfo] = useState<CollectibleInfo>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const subscription = fetchCollectibleInfo$(address, id)
      .pipe(
        tap(() => setIsLoading(true)),
        map(collectibleInfo => collectibleInfo),
        catchError(() => EMPTY),
        finalize(() => setIsLoading(false))
      )
      .subscribe(result => {
        setCollectibleInfo(result);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [address, id]);

  return { collectibleInfo, isLoading };
};
