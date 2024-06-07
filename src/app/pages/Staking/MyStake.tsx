import React, { FC, memo, useState, useMemo, useCallback } from 'react';

import { ChainIds } from '@taquito/taquito';
import clsx from 'clsx';

import { Divider, FormSubmitButton } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useBlockLevelInfo, useStakingCyclesInfo, useUnstakeRequests } from 'app/hooks/use-baking-hooks';
import { ReactComponent as AlertCircleIcon } from 'app/icons/alert-circle.svg';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import { useAccount, useChainId, useDelegate, useNetwork, useTezos } from 'lib/temple/front';
import { confirmOperation } from 'lib/temple/operation';
import { TempleAccountType } from 'lib/temple/types';
import useTippy from 'lib/ui/useTippy';
import { ZERO } from 'lib/utils/numbers';

import { AMOUNT_COLUMN_STYLE, RequestItem, UnstakeRequest } from './RequestItem';
import { RequestUnstakeModal } from './RequestUnstakeModal';

export const MyStakeTab = memo(() => {
  const acc = useAccount();
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;

  const tezos = useTezos();
  const { rpcBaseURL } = useNetwork();
  const chainId = useChainId(false);

  const [requestingUnstake, setRequestingUnstake] = useState(false);
  const toggleUnstakeModal = useCallback(() => setRequestingUnstake(val => !val), []);

  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash, true, false);

  const { data: cyclesInfo } = useStakingCyclesInfo(rpcBaseURL);

  const blockLevelInfo = useBlockLevelInfo(rpcBaseURL);

  const {
    data: requests,
    mutate: updateRequests,
    isLoading: requestsAreLoading
  } = useUnstakeRequests(rpcBaseURL, acc.publicKeyHash, true);

  const pendingRequests = requests?.unfinalizable?.requests;
  const readyRequests = requests?.finalizable;

  /** Priority is to show baker with user's stake in this page's banner */
  const bakerPkh = readyRequests?.[0]?.delegate || requests?.unfinalizable.delegate || myBakerPkh;

  const cooldownCyclesNumber = cyclesInfo?.cooldownCyclesNumber ?? 0;

  const cooldownTippyRef = useTippy<SVGSVGElement>(
    useMemo(
      () => ({
        trigger: 'mouseenter',
        hideOnClick: false,
        content: `Unstake requests will be processed after ${
          cooldownCyclesNumber ? cooldownCyclesNumber + ' ' : ''
        }validation cycles end. You should claim your unstaked TEZ here after the cooldown period ends.`,
        animation: 'shift-away-subtle'
      }),
      [cooldownCyclesNumber]
    )
  );

  const RequestUnstakeButtonLocal = useCallback<FC<{ staked: number }>>(
    ({ staked }) => (
      <FormSubmitButton
        disabled={!staked || cannotDelegate}
        small
        unsetHeight
        className="h-10"
        onClick={toggleUnstakeModal}
      >
        Request Unstake
      </FormSubmitButton>
    ),
    [cannotDelegate, toggleUnstakeModal]
  );

  const onRequestUnstakeDone = useCallback(
    (opHash?: string) => {
      toggleUnstakeModal();

      if (opHash) confirmOperation(tezos, opHash).then(() => void updateRequests());
    },
    [toggleUnstakeModal, updateRequests, tezos]
  );

  const finalizeUnstake = useCallback(() => {
    if (!readyRequests) return;

    const amount = readyRequests.reduce((acc, curr) => acc.plus(curr.amount), ZERO).toNumber();

    tezos.wallet
      .finalizeUnstake({ amount, mutez: true })
      .send()
      .then(
        oper => {
          confirmOperation(tezos, oper.opHash).then(() => void updateRequests());
        },
        err => void console.error(err)
      );
  }, [readyRequests, tezos, updateRequests]);

  const cyclesLookupUrl = chainId ? CYCLES_LOOKUP_URLS[chainId] : undefined;

  const allRequests = useMemo<UnstakeRequest[]>(
    () =>
      (pendingRequests ?? []).concat(
        (readyRequests ?? []).map<UnstakeRequest>(request => ({ ...request, ready: true }))
      ),
    [pendingRequests, readyRequests]
  );

  return (
    <>
      {requestingUnstake && <RequestUnstakeModal onDone={onRequestUnstakeDone} />}

      <div className="mx-auto max-w-sm flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-4">
          <span className="text-base font-medium text-blue-750">Current Staking</span>

          {bakerPkh && (
            <BakerBanner bakerPkh={bakerPkh} allowDisplayZeroStake ActionButton={RequestUnstakeButtonLocal} />
          )}
        </div>

        <div className="flex flex-col gap-y-4">
          <span className="text-base font-medium text-blue-750">Unstake requests</span>

          <div className={clsx(BAKER_BANNER_CLASSNAME, 'flex flex-col gap-y-4 text-xs leading-5 text-gray-500')}>
            <div className="flex items-center pb-1 border-b">
              <div style={AMOUNT_COLUMN_STYLE}>Amount</div>

              <div className="flex-1 flex items-center">
                <span>Cooldown</span>
                <AlertCircleIcon ref={cooldownTippyRef} className="ml-1 w-3 h-3 stroke-current" />
              </div>

              <div className="flex-1 text-right">Unstake cycle</div>
            </div>

            {allRequests.length ? (
              <>
                <div className="flex flex-col gap-y-4">
                  {allRequests.map((request, i) => (
                    <React.Fragment key={i}>
                      {i !== 0 && <Divider />}

                      <RequestItem
                        {...request}
                        cyclesInfo={cyclesInfo}
                        blockLevelInfo={blockLevelInfo}
                        cyclesUrl={cyclesLookupUrl}
                      />
                    </React.Fragment>
                  ))}
                </div>

                <FormSubmitButton
                  disabled={!readyRequests?.length || cannotDelegate}
                  small
                  unsetHeight
                  className="h-10"
                  onClick={finalizeUnstake}
                >
                  Unstake
                </FormSubmitButton>
              </>
            ) : requestsAreLoading ? (
              <Spinner className="w-10 self-center" />
            ) : (
              <div className="text-center">Your unstake requests will be shown here</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

const CYCLES_LOOKUP_URLS: StringRecord = {
  [ChainIds.MAINNET]: 'https://tzkt.io/cycles',
  [ChainIds.ITHACANET2]: 'https://ghostnet.tzkt.io/cycles',
  [ChainIds.PARISNET]: 'https://parisnet.tzkt.io/cycles'
};
