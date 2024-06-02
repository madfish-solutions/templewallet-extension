import React, { FC, memo, useState, useCallback } from 'react';

import clsx from 'clsx';

import { FormSubmitButton } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useBlockLevelInfo, useStakingCyclesInfo, useUnstakeRequests } from 'app/hooks/use-baking-hooks';
import { ReactComponent as AlertCircleIcon } from 'app/icons/alert-circle.svg';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import { useRetryableSWR } from 'lib/swr';
import { useAccount, useDelegate, useNetwork, useTezos } from 'lib/temple/front';
import { confirmOperation } from 'lib/temple/operation';
import { TempleAccountType } from 'lib/temple/types';
import useTippy from 'lib/ui/useTippy';
import { ZERO } from 'lib/utils/numbers';

import { FinalizableRequestItem, UnfinalizableRequestItem } from './RequestItem';
import { RequestUnstakeModal } from './RequestUnstakeModal';

export const MyStakeTab = memo(() => {
  const acc = useAccount();
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;

  const tezos = useTezos();
  const { rpcBaseURL } = useNetwork();

  const [requestingUnstake, setRequestingUnstake] = useState(false);
  const toggleUnstakeModal = useCallback(() => setRequestingUnstake(val => !val), []);

  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash, true, false);

  const { data: cyclesInfo } = useStakingCyclesInfo(rpcBaseURL);

  const blockLevelInfo = useBlockLevelInfo(rpcBaseURL);

  const requestsSwr = useUnstakeRequests(rpcBaseURL, acc.publicKeyHash, true);

  const requests = requestsSwr.data?.unfinalizable?.requests;
  const readyRequests = requestsSwr.data?.finalizable;

  const { data: data2 } = useRetryableSWR(['delegate-stake', 'get-unstaked-frozen-balance', tezos.checksum], () =>
    tezos.rpc.getUnstakedFrozenBalance(acc.publicKeyHash)
  );
  const { data: data3 } = useRetryableSWR(['delegate-stake', 'get-unstaked-finalizable-balance', tezos.checksum], () =>
    tezos.rpc.getUnstakedFinalizableBalance(acc.publicKeyHash)
  );

  console.log('DATA:', requestsSwr, '|', data2?.toString(), '|', data3?.toString());

  /** Priority is to show baker with user's stake in this page's banner */
  const bakerPkh = readyRequests?.[0]?.delegate || requestsSwr?.data?.unfinalizable.delegate || myBakerPkh;

  const cooldownTippyRef = useTippy<SVGSVGElement>(COOLDOWN_TIPPY_PROPS);

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

  return (
    <>
      {requestingUnstake && <RequestUnstakeModal close={toggleUnstakeModal} />}

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
              <span>Amount</span>
              <div className="flex-1" />
              <span>Cooldown period</span>
              <AlertCircleIcon ref={cooldownTippyRef} className="ml-1 w-3 h-3 stroke-current" />
            </div>

            {requests?.length || readyRequests?.length ? (
              <>
                <div className="flex flex-col gap-y-3">
                  {requests?.map((request, i) => (
                    <UnfinalizableRequestItem
                      key={i}
                      amount={request.amount}
                      cycle={request.cycle}
                      cyclesInfo={cyclesInfo}
                      blockLevelInfo={blockLevelInfo}
                    />
                  ))}

                  {readyRequests?.map((request, i) => (
                    <FinalizableRequestItem key={i} amount={request.amount} />
                  ))}
                </div>

                <FormSubmitButton
                  disabled={!readyRequests?.length || cannotDelegate}
                  small
                  unsetHeight
                  className="h-10"
                  onClick={() => {
                    if (!readyRequests) return;

                    const amount = readyRequests.reduce((acc, curr) => acc.plus(curr.amount), ZERO).toNumber();

                    tezos.wallet
                      .finalizeUnstake({ amount, mutez: true })
                      .send()
                      .then(
                        oper => {
                          console.log('Operation:', oper);
                          confirmOperation(tezos, oper.opHash).then(() => void requestsSwr.mutate());
                        },
                        err => void console.error(err)
                      );
                  }}
                >
                  Unstake
                </FormSubmitButton>
              </>
            ) : requestsSwr.isLoading ? (
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

const COOLDOWN_TIPPY_PROPS = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content:
    'Unstake requests will be processed after 4 validation cycles end. You should claim your unstaked TEZ here after the cooldown preiod ends.',
  animation: 'shift-away-subtle'
};
