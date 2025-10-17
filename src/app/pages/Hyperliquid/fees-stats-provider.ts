import { useCallback } from 'react';

import constate from 'constate';

import { useTypedSWR } from 'lib/swr';
import { useAccountForEvm } from 'temple/front';

import { useClients } from './clients';
import { BUILDER_ADDRESS, BUILDER_FEE_UNITS } from './utils';

export const [FeesStatsProvider, useFeesStats] = constate(() => {
  const evmAccount = useAccountForEvm();
  const {
    clients: { info }
  } = useClients();

  const getFees = useCallback(async () => {
    const user = evmAccount!.address as HexString;
    const [{ userCrossRate, userSpotCrossRate, userAddRate, userSpotAddRate }, builderFees] = await Promise.all([
      info.userFees({ user }),
      info.maxBuilderFee({ user, builder: BUILDER_ADDRESS })
    ]);

    return {
      userCrossRate,
      userSpotCrossRate,
      userAddRate,
      userSpotAddRate,
      builderFees
    };
  }, [evmAccount, info]);
  const { data: fees, mutate } = useTypedSWR(evmAccount ? ['hyperliquid-fees', evmAccount.address] : null, getFees, {
    refreshInterval: 60 * 60 * 1000,
    suspense: true
  });
  const updateFees = useCallback(() => mutate(), [mutate]);

  return { fees, approvalIsSufficient: fees ? fees.builderFees >= BUILDER_FEE_UNITS : undefined, updateFees };
});
