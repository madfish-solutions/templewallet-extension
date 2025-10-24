import { useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { postReactivationCheck } from 'lib/apis/ads-api';
import { REACTIVATION_APPLIED_AT_KEY } from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';
import { getAccountAddressForTezos } from 'temple/accounts';
import { useAllAccounts } from 'temple/front';

export function useReactivateAdsOnce() {
  const isEnabled = useShouldShowPartnersPromoSelector();
  const allAccounts = useAllAccounts();
  const [appliedAt, setAppliedAt] = usePassiveStorage<number>(REACTIVATION_APPLIED_AT_KEY);
  const runningRef = useRef(false);

  useEffect(() => {
    if (isEnabled || appliedAt || runningRef.current) return;
    if (!allAccounts || allAccounts.length === 0) return;
    runningRef.current = true;

    const tezos: string[] = [];

    for (const acc of allAccounts) {
      const tezAddr = getAccountAddressForTezos(acc);
      if (tezAddr) tezos.push(tezAddr);
    }

    postReactivationCheck(tezos)
      .then(({ eligible }) => {
        if (eligible) {
          dispatch(togglePartnersPromotionAction(true));
          setAppliedAt(Date.now());
        }
      })
      .finally(() => {
        runningRef.current = false;
      });
  }, [isEnabled, appliedAt, allAccounts, setAppliedAt]);
}
