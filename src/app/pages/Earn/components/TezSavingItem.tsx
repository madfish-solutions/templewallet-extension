import React, { FC, useMemo } from 'react';

import { useStakedAmount } from 'app/hooks/use-baking-hooks';
import { mutezToTz } from 'lib/temple/helpers';
import { useAccountAddressForTezos, useTezosMainnetChain } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

import { TEZ_SAVING_OFFER } from '../config';
import { ActiveDeposit } from '../types';

import { EarnItem } from './EarnItem';

export const TezSavingItem: FC = () => {
  const accountPkh = useAccountAddressForTezos();
  const network = useTezosMainnetChain();

  if (accountPkh && network) {
    return <DepositContent accountPkh={accountPkh} network={network} />;
  }

  return null;
};

interface DepositContentProps {
  accountPkh: string;
  network: TezosNetworkEssentials;
}

const DepositContent: FC<DepositContentProps> = ({ accountPkh, network }) => {
  const { data: stakedAtomic, isLoading } = useStakedAmount(network, accountPkh, false);

  const deposit = useMemo<ActiveDeposit | undefined>(() => {
    if (isLoading) return { isLoading: true };

    if (!stakedAtomic || stakedAtomic.isNaN() || stakedAtomic.lte(0)) {
      return;
    }

    const amount = mutezToTz(stakedAtomic);

    return { amount, isLoading: false };
  }, [stakedAtomic, isLoading]);

  return <EarnItem offer={TEZ_SAVING_OFFER} deposit={deposit} />;
};
