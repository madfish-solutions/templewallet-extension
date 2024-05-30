import React, { FC, memo, useState, useCallback } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { Money } from 'app/atoms';
import { UnstakeButton } from 'app/atoms/BakingButtons';
import Spinner from 'app/atoms/Spinner/Spinner';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import { TEZOS_METADATA } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import { useAccount, useDelegate, useTezos } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';

import { RequestUnstakeModal } from './RequestUnstakeModal';

export const MyStakeTab = memo(() => {
  const acc = useAccount();
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;

  const tezos = useTezos();

  const [requestingUnstake, setRequestingUnstake] = useState(false);
  const toggleUnstakeModal = useCallback(() => setRequestingUnstake(val => !val), []);

  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash, true, false);

  const requestsSwr = useRetryableSWR(['delegate-stake', 'get-unstake-requests', tezos.checksum], () =>
    tezos.rpc.getUnstakeRequests(acc.publicKeyHash)
  );
  const { data: data2 } = useRetryableSWR(['delegate-stake', 'get-unstaked-frozen-balance', tezos.checksum], () =>
    tezos.rpc.getUnstakedFrozenBalance(acc.publicKeyHash)
  );
  const { data: data3 } = useRetryableSWR(['delegate-stake', 'get-unstaked-finalizable-balance', tezos.checksum], () =>
    tezos.rpc.getUnstakedFinalizableBalance(acc.publicKeyHash)
  );

  console.log('DATA:', requestsSwr.data, '|', data2?.toString(), '|', data3?.toString());

  const RequestUnstakeButtonLocal = useCallback<FC<{ staked: number }>>(
    ({ staked }) => (
      <UnstakeButton disabled={!staked || cannotDelegate} onClick={toggleUnstakeModal}>
        Request Unstake
      </UnstakeButton>
    ),
    [cannotDelegate, toggleUnstakeModal]
  );

  const readyRequests = requestsSwr.data?.finalizable;
  const requests = requestsSwr.data?.unfinalizable?.requests;

  return (
    <>
      {requestingUnstake && <RequestUnstakeModal close={toggleUnstakeModal} />}

      <div className="mx-auto max-w-sm flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-4">
          <span className="text-base font-medium text-blue-750">Current Staking</span>

          {myBakerPkh && (
            <BakerBanner bakerPkh={myBakerPkh} allowDisplayZeroStake ActionButton={RequestUnstakeButtonLocal} />
          )}
        </div>

        <div className="flex flex-col gap-y-4">
          <span className="text-base font-medium text-blue-750">Unstake requests</span>

          <div className={clsx(BAKER_BANNER_CLASSNAME, 'flex flex-col gap-y-4 text-xs leading-5 text-gray-500')}>
            <div className="flex items-center pb-1 border-b">
              <span>Amount</span>
              <div className="flex-1" />
              <span>Cooldown period</span>
            </div>

            {requests?.length || readyRequests?.length ? (
              <>
                <div className="flex flex-col gap-y-3">
                  {requests?.map((request, i) => (
                    <RequestItem key={i} amount={request.amount} />
                  ))}

                  {readyRequests?.map((request, i) => (
                    <RequestItem key={i} amount={request.amount} ready />
                  ))}
                </div>

                <UnstakeButton
                  disabled={!readyRequests?.length || cannotDelegate}
                  onClick={() => {
                    if (!readyRequests) return;

                    const amount = readyRequests.reduce((acc, curr) => acc.plus(curr.amount), ZERO).toNumber();

                    tezos.wallet
                      .finalizeUnstake({ amount, mutez: true })
                      .send()
                      .then(
                        oper => {
                          console.log('Op:', oper);
                        },
                        err => {
                          console.error(err);
                        }
                      );
                  }}
                >
                  Unstake
                </UnstakeButton>
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

interface RequestItemProps {
  amount: BigNumber;
  ready?: boolean;
}

const RequestItem = memo<RequestItemProps>(({ amount, ready }) => {
  //
  return (
    <div className="flex text-sm font-medium text-blue-750">
      <span>
        <Money smallFractionFont={false} cryptoDecimals={TEZOS_METADATA.decimals}>
          {atomsToTokens(amount, TEZOS_METADATA.decimals)}
        </Money>{' '}
        {TEZOS_METADATA.symbol}
      </span>

      <div className="flex-1" />

      {ready ? <span className="text-green-500">Ready</span> : <span>???h</span>}
    </div>
  );
});
