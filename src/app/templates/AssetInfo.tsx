import React, { ComponentProps, FC, memo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { FormField } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { isFA2Token, isTezAsset } from 'lib/assets';
import { fromAssetSlugWithStandardDetect } from 'lib/assets/contract.utils';
import { T } from 'lib/i18n';
import { getAssetSymbol, useAssetMetadata } from 'lib/metadata';
import { useRetryableSWR } from 'lib/swr';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { useTezosChainByChainId } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';

interface Props {
  tezosChainId: string;
  assetSlug: string;
}

const AssetInfo = memo<Props>(({ tezosChainId, assetSlug }) => {
  const network = useTezosChainByChainId(tezosChainId);
  if (!network) throw new DeadEndBoundaryError();

  return <AssetInfoContent network={network} assetSlug={assetSlug} />;
});

export default AssetInfo;

interface AssetInfoContentProps {
  network: TezosNetworkEssentials;
  assetSlug: string;
}

const AssetInfoContent: FC<AssetInfoContentProps> = ({ network, assetSlug }) => {
  const { popup } = useAppEnv();

  const rpcUrl = network.rpcBaseURL;

  const { data } = useRetryableSWR(
    ['asset', assetSlug, rpcUrl],
    () => fromAssetSlugWithStandardDetect(getReadOnlyTezos(rpcUrl), assetSlug),
    { suspense: true }
  );
  const asset = data!;

  const metadata = useAssetMetadata(assetSlug, network.chainId);

  return (
    <div className={classNames(popup && 'mx-4')}>
      <div className="w-full max-w-sm mx-auto">
        <InfoField
          textarea
          rows={2}
          id="contract-address"
          label={<T id="contract" />}
          labelDescription={<T id="addressOfTokenContract" substitutions={[getAssetSymbol(metadata)]} />}
          value={isTezAsset(asset) ? 'TEZ' : asset.contract}
          size={36}
          style={{
            resize: 'none'
          }}
        />

        {isFA2Token(asset) && (
          <InfoField id="token-id" label={<T id="tokenId" />} value={new BigNumber(asset.id).toFixed()} />
        )}

        {metadata && metadata.decimals > 0 && (
          <InfoField id="token-decimals" label={<T id="decimals" />} value={metadata.decimals} />
        )}
      </div>
    </div>
  );
};

type InfoFieldProps = ComponentProps<typeof FormField>;

const InfoField: FC<InfoFieldProps> = props => {
  const { fieldRef, copy, copied } = useCopyToClipboard();

  return (
    <>
      <FormField ref={fieldRef} spellCheck={false} readOnly {...props} />

      <button
        type="button"
        className={classNames(
          'mx-auto mb-6',
          'py-1 px-2 w-40',
          'bg-primary-orange rounded',
          'border border-primary-orange',
          'flex items-center justify-center',
          'text-primary-orange-lighter text-shadow-black-orange',
          'text-sm font-semibold',
          'transition duration-300 ease-in-out',
          'opacity-90 hover:opacity-100 focus:opacity-100',
          'shadow-sm',
          'hover:shadow focus:shadow'
        )}
        onClick={copy}
      >
        {copied ? (
          <T id="copiedAddress" />
        ) : (
          <>
            <CopyIcon className="mr-1 h-4 w-auto stroke-current stroke-2" />
            <T id="copyAddressToClipboard" />
          </>
        )}
      </button>
    </>
  );
};
