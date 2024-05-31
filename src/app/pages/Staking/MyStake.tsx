import React, { FC, memo, useState, useCallback } from 'react';

import clsx from 'clsx';
import memoizee from 'memoizee';

import { FormSubmitButton } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import { useRetryableSWR } from 'lib/swr';
import { useAccount, useDelegate, useNetwork, useTezos } from 'lib/temple/front';
import { loadFastRpcClient } from 'lib/temple/helpers';
import { confirmOperation } from 'lib/temple/operation';
import { TempleAccountType } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';

import { FinalizableRequestItem, UnfinalizableRequestItem } from './RequestItem';
import { RequestUnstakeModal } from './RequestUnstakeModal';
import { StakingCyclesInfo } from './types';

export const MyStakeTab = memo(() => {
  const acc = useAccount();
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;

  const tezos = useTezos();
  const { rpcBaseURL } = useNetwork();

  const [requestingUnstake, setRequestingUnstake] = useState(false);
  const toggleUnstakeModal = useCallback(() => setRequestingUnstake(val => !val), []);

  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash, true, false);

  const { data: cyclesInfo } = useRetryableSWR(
    ['delegate-stake', 'get-cycles-info', rpcBaseURL],
    () => getCyclesInfo(rpcBaseURL),
    {
      revalidateOnFocus: false
    }
  );

  const { data: level_info } = useRetryableSWR(
    ['delegate-stake', 'get-level-info', rpcBaseURL],
    () =>
      loadFastRpcClient(rpcBaseURL)
        .getBlockMetadata()
        .then(m => m.level_info),
    {
      revalidateOnFocus: false
    }
  );

  const requestsSwr = useRetryableSWR(
    ['delegate-stake', 'get-unstake-requests', tezos.checksum],
    () => tezos.rpc.getUnstakeRequests(acc.publicKeyHash),
    { suspense: true, revalidateOnFocus: false }
  );
  const { data: data2 } = useRetryableSWR(['delegate-stake', 'get-unstaked-frozen-balance', tezos.checksum], () =>
    tezos.rpc.getUnstakedFrozenBalance(acc.publicKeyHash)
  );
  const { data: data3 } = useRetryableSWR(['delegate-stake', 'get-unstaked-finalizable-balance', tezos.checksum], () =>
    tezos.rpc.getUnstakedFinalizableBalance(acc.publicKeyHash)
  );

  console.log('DATA:', requestsSwr.data, '|', data2?.toString(), '|', data3?.toString());

  const bakerPkh =
    requestsSwr?.data?.unfinalizable.delegate || requestsSwr?.data?.finalizable[0]?.delegate || myBakerPkh;

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

  const readyRequests = requestsSwr.data?.finalizable;
  const requests = requestsSwr.data?.unfinalizable?.requests;

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
                      level_info={level_info}
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
                          console.log('Op:', oper);
                          confirmOperation(tezos, oper.opHash).then(() => void requestsSwr.mutate());
                        },
                        err => {
                          console.error(err);
                        }
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

const getCyclesInfo = memoizee(
  async (rpcBaseURL: string): Promise<StakingCyclesInfo | null> => {
    const rpc = loadFastRpcClient(rpcBaseURL);

    const { blocks_per_cycle, consensus_rights_delay, max_slashing_period, minimal_block_delay } =
      await rpc.getConstants();

    if (consensus_rights_delay == null && max_slashing_period == null) return null;

    const cooldownCyclesLeft =
      (consensus_rights_delay ?? 0) + (max_slashing_period ?? 0) - /* Accounting for current cycle*/ 1;

    return { blocks_per_cycle, minimal_block_delay, cooldownCyclesLeft };
  },
  { promise: true, max: 10 }
);
