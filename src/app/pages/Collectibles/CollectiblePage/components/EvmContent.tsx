import React, { memo, useCallback, useMemo } from 'react';

import { FormSubmitButton } from 'app/atoms';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import PageLayout from 'app/layouts/PageLayout';
import { buildSendPagePath } from 'app/pages/Send/build-url';
import { useEvmCollectibleMetadataSelector } from 'app/store/evm/collectibles-metadata/selectors';
import AddressChip from 'app/templates/AddressChip';
import { TabsBar } from 'app/templates/TabBar';
import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';
import { navigate } from 'lib/woozie';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { ATTRIBUTES_TAB, PROPERTIES_TAB } from '../constants';
import { CollectiblesSelectors } from '../selectors';

import { EvmAttributesItems } from './Attributes';
import { EvmCollectiblePageImage } from './CollectiblePageImage';
import { EvmPropertiesItems } from './Details';

interface Props {
  evmChainId: number;
  assetSlug: string;
}

export const EvmContent = memo<Props>(({ evmChainId, assetSlug }) => {
  const network = useEvmChainByChainId(evmChainId);
  const publicKeyHash = useAccountAddressForEvm();
  const metadata = useEvmCollectibleMetadataSelector(evmChainId, assetSlug);

  if (!publicKeyHash || !network || !metadata) throw new DeadEndBoundaryError();

  const tabNameInUrl = useLocationSearchParamValue('tab');

  const tabs = useMemo(() => {
    if (!metadata.attributes || metadata.attributes.length === 0) return [PROPERTIES_TAB];

    return [ATTRIBUTES_TAB, PROPERTIES_TAB];
  }, [metadata]);

  const { name: activeTabName } = useMemo(() => {
    const tab = tabNameInUrl ? tabs.find(({ name }) => name === tabNameInUrl) : null;

    return tab ?? tabs[0]!;
  }, [tabs, tabNameInUrl]);

  const onSendButtonClick = useCallback(
    () => navigate(buildSendPagePath(TempleChainKind.EVM, String(evmChainId), assetSlug)),
    [evmChainId, assetSlug]
  );

  return (
    <PageLayout
      pageTitle={
        <span className="truncate" {...setTestID(CollectiblesSelectors.collectibleTitle)}>
          {metadata.name}
        </span>
      }
    >
      <div className="flex flex-col gap-y-3 max-w-sm w-full mx-auto pt-2 pb-4">
        <div
          className="rounded-lg mb-2 border border-gray-300 bg-blue-50 overflow-hidden"
          style={{ aspectRatio: '1/1' }}
        >
          <EvmCollectiblePageImage metadata={metadata} className="h-full w-full" />
        </div>

        <>
          {metadata.name && (
            <div className="flex justify-between items-center">
              <div className="flex items-center justify-center rounded">
                <div className="content-center ml-2 text-gray-910 text-sm">{metadata.name}</div>
              </div>
            </div>
          )}

          <div className="text-gray-910 text-2xl truncate">{metadata.name}</div>

          <div className="text-xs text-gray-910 break-words">{metadata.description ?? ''}</div>

          {metadata.originalOwner && (
            <div className="flex items-center">
              <div className="self-start leading-6 text-gray-600 text-xs mr-1">
                <T id="creator" />
              </div>

              <div className="flex flex-wrap gap-1">
                <AddressChip address={metadata.originalOwner} />
              </div>
            </div>
          )}

          <FormSubmitButton onClick={onSendButtonClick} testID={CollectiblesSelectors.sendButton}>
            <T id="send" />
          </FormSubmitButton>

          <TabsBar tabs={tabs} activeTabName={activeTabName} withOutline />

          <div className="grid grid-cols-2 gap-2 text-gray-910">
            {activeTabName === 'attributes' ? (
              <EvmAttributesItems attributes={metadata.attributes ?? []} />
            ) : (
              <EvmPropertiesItems
                accountPkh={publicKeyHash}
                assetSlug={assetSlug}
                evmChainId={evmChainId}
                metadata={metadata}
              />
            )}
          </div>
        </>
      </div>
    </PageLayout>
  );
});
