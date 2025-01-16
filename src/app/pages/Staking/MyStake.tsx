import React, { FC, memo, useState, useMemo, useCallback } from 'react';

import { ChainIds } from '@taquito/taquito';
import clsx from 'clsx';

import { Divider, FormSubmitButton } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useBlockLevelInfo, useStakingCyclesInfo, useUnstakeRequests } from 'app/hooks/use-baking-hooks';
import { ReactComponent as AlertCircleIcon } from 'app/icons/alert-circle.svg';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import { useDelegate } from 'lib/temple/front';
import useTippy from 'lib/ui/useTippy';
import { getTezosToolkitWithSigner } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { confirmTezosOperation, getReadOnlyTezos } from 'temple/tezos';

import { AMOUNT_COLUMN_STYLE, RequestItem, UnstakeRequest } from './RequestItem';
import { RequestUnstakeModal } from './RequestUnstakeModal';

interface Props {
  accountPkh: string;
  network: TezosNetworkEssentials;
  cannotDelegate: boolean;
}

export const MyStakeTab = memo<Props>(({ accountPkh, network, cannotDelegate }) => {
  const { rpcBaseURL, chainId } = network;

  const [requestingUnstake, setRequestingUnstake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toggleUnstakeModal = useCallback(() => setRequestingUnstake(val => !val), []);

  const { data: myBakerPkh } = useDelegate(accountPkh, network, true, false);

  const { data: cyclesInfo } = useStakingCyclesInfo(rpcBaseURL);

  const blockLevelInfo = useBlockLevelInfo(rpcBaseURL);

  const {
    data: requests,
    mutate: updateRequests,
    isLoading: requestsAreLoading
  } = useUnstakeRequests(rpcBaseURL, accountPkh, true);

  const pendingRequests = requests?.unfinalizable.requests;
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

      if (opHash) {
        const tezos = getReadOnlyTezos(rpcBaseURL);
        confirmTezosOperation(tezos, opHash).then(() => void updateRequests());
      }
    },
    [toggleUnstakeModal, updateRequests, rpcBaseURL]
  );

  const finalizeUnstake = useCallback(() => {
    setSubmitting(true);

    const tezos = getTezosToolkitWithSigner(rpcBaseURL, accountPkh);

    tezos.wallet
      .finalizeUnstake({ amount: 0 })
      .send()
      .then(
        oper => {
          confirmTezosOperation(tezos, oper.opHash).then(() => void updateRequests());
        },
        err => console.error(err)
      )
      .finally(() => setSubmitting(false));
  }, [updateRequests, rpcBaseURL, accountPkh]);

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
      {requestingUnstake && (
        <RequestUnstakeModal accountPkh={accountPkh} network={network} onDone={onRequestUnstakeDone} />
      )}

      <div className="flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-4">
          <span className="text-base font-medium text-blue-750">Current Staking</span>

          {bakerPkh && (
            <BakerBanner
              network={network}
              accountPkh={accountPkh}
              bakerPkh={bakerPkh}
              allowDisplayZeroStake
              ActionButton={RequestUnstakeButtonLocal}
            />
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
                  loading={submitting}
                  small
                  unsetHeight
                  className="h-10"
                  onClick={finalizeUnstake}
                >
                  Finalize
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
  [ChainIds.PARISCNET]: 'https://parisnet.tzkt.io/cycles'
};
