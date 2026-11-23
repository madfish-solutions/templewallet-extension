import { RefObject, useEffect, useRef, useState } from 'react';

import { isAddress } from 'viem';

import { useGetEvmGasOrTokenMetadata } from 'lib/metadata';
import { useAllEvmChains } from 'temple/front';

import { UserAction } from '../../evm/user-actions';
import { runWithLimit } from '../run-with-limit';
import { PreparedEvmAction, PreparedEvmStepAction } from '../types';

import { matchesUserAction, prepareEvmStepAction } from './prepare-evm-action';

interface NextStepPreparationParams {
  accountPkh: string;
  userAction: UserAction;
  preparedAction?: PreparedEvmAction;
  nextUserAction?: UserAction;
  onStepCompleted: EmptyFn;
  cancelledRef?: RefObject<boolean | null>;
}

export const useNextStepPreparation = ({
  accountPkh,
  userAction,
  preparedAction,
  nextUserAction,
  onStepCompleted,
  cancelledRef
}: NextStepPreparationParams) => {
  const allEvmChains = useAllEvmChains();
  const getEvmMetadata = useGetEvmGasOrTokenMetadata();
  const [nextPrepared, setNextPrepared] = useState<PreparedEvmStepAction>();
  const prepared = [preparedAction, nextPrepared].find(
    candidate => candidate !== undefined && matchesUserAction(candidate, userAction)
  );

  // Closing the modal unmounts the owner; useEvmUserActions resets cancelledRef in the same commit
  const lifetimeRef = useRef<AbortController>(null);
  useEffect(() => {
    const lifetime = new AbortController();
    lifetimeRef.current = lifetime;

    return () => lifetime.abort();
  }, []);

  const prepareNextStep = async () => {
    const lifetime = lifetimeRef.current?.signal;
    if (!nextUserAction || !lifetime || !isAddress(accountPkh, { strict: false })) return;

    const next = await runWithLimit(
      signal =>
        prepareEvmStepAction(nextUserAction, { accountPkh, chains: allEvmChains, getMetadata: getEvmMetadata }, signal),
      undefined,
      lifetime
    );
    if (next && !lifetime.aborted) setNextPrepared(next);
  };

  const completeStep = () => {
    if (lifetimeRef.current?.signal.aborted === false && !cancelledRef?.current) onStepCompleted();
  };

  return { prepared, prepareNextStep, completeStep };
};
