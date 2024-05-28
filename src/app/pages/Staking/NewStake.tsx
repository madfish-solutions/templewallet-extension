import React, { memo, useCallback, useState } from 'react';

import AssetField from 'app/atoms/AssetField';
import { StakeButton } from 'app/atoms/BakingButtons';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import { t } from 'lib/i18n';
import { TEZOS_METADATA } from 'lib/metadata';
import { useAccount, useDelegate, useTezos } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';

export const NewStakeTab = memo(() => {
  const acc = useAccount();
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;

  const tezos = useTezos();

  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash, true, false);

  const [value, setValue] = useState<number>();

  const handleStake = useCallback(() => {
    if (!value) return;

    tezos.wallet
      .stake({
        amount: value,
        mutez: true
      })
      .send()
      .then(
        operation => {
          console.log('Operation:', operation);
        },
        error => {
          console.error(error);
        }
      );
  }, [tezos, value]);

  return (
    <div className="mx-auto max-w-sm flex flex-col gap-y-8 pb-4">
      <div className="flex flex-col gap-y-4">
        <span className="text-base font-medium text-blue-750">Current Baker</span>

        {myBakerPkh ? <BakerBanner bakerPkh={myBakerPkh} /> : <div className={BAKER_BANNER_CLASSNAME}>---</div>}
      </div>

      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-1">
          <span className="text-base font-medium text-blue-750">Stake {TEZOS_METADATA.symbol}</span>

          <span className="text-xs leading-5 text-gray-600">
            Avalable (max) : {100.04} {TEZOS_METADATA.symbol}
          </span>
        </div>

        <AssetField
          name="amount"
          placeholder={t('amountPlaceholder')}
          value={value}
          onChange={val => {
            setValue(Number(val) || 0);
          }}
        />

        <StakeButton disabled={!value} onClick={handleStake} />
      </div>
    </div>
  );
});
