import React, { FC, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useStakedAmount } from 'app/hooks/use-baking-hooks';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { useDelegate } from 'lib/temple/front';
import { mutezToTz } from 'lib/temple/helpers';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForTezos, useTezosMainnetChain } from 'temple/front';
import { useTezosTestnetChain } from 'temple/front/chains';

import { getTezSavingOffer } from '../config';
import { ActiveDeposit } from '../types';

import { EarnItem } from './EarnItem';

export const TezSavingItem: FC = () => {
  const accountPkh = useAccountAddressForTezos();

  if (accountPkh) {
    return <DepositContent accountPkh={accountPkh} />;
  }

  return null;
};

interface DepositContentProps {
  accountPkh: string;
}

const DepositContent: FC<DepositContentProps> = ({ accountPkh }) => {
  const isTestnetMode = useTestnetModeEnabledSelector();
  const tezMainnet = useTezosMainnetChain();
  const tezTestnet = useTezosTestnetChain();

  const network = isTestnetMode ? tezTestnet : tezMainnet;

  const { value: tezBalance } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);
  const { data: myBakerPkh, isLoading: isBakerAddressLoading } = useDelegate(accountPkh, network, false, true);
  const { data: stakedAtomic, isLoading: isStakedAmountLoading } = useStakedAmount(network, accountPkh, false);

  const deposit = useMemo<ActiveDeposit | undefined>(() => {
    if (isBakerAddressLoading || isStakedAmountLoading || !isDefined(tezBalance)) return { isLoading: true };

    const hasDelegation = isDefined(myBakerPkh) && tezBalance.gt(0);
    const hasStaked = isDefined(stakedAtomic) && !stakedAtomic.isNaN() && stakedAtomic.gt(0);

    let amount = ZERO;

    if (hasDelegation) amount = tezBalance;
    else return;

    if (hasStaked) amount = tezBalance.plus(mutezToTz(stakedAtomic));

    return { amount, isLoading: false };
  }, [isBakerAddressLoading, isStakedAmountLoading, tezBalance, myBakerPkh, stakedAtomic]);

  return <EarnItem offer={getTezSavingOffer(isTestnetMode)} deposit={deposit} />;
};
