import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import { SyncSpinner } from 'app/atoms';
import SegmentedControl from 'app/atoms/SegmentedControl';
import { StyledButton } from 'app/atoms/StyledButton';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import PageLayout from 'app/layouts/PageLayout';
import { buildSendPagePath } from 'app/pages/Send/build-url';
import { dispatch } from 'app/store';
import { loadCollectiblesDetailsActions } from 'app/store/tezos/collectibles/actions';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/tezos/collectibles/selectors';
import { useCollectibleMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { setTestID } from 'lib/analytics';
import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';
import { t, T } from 'lib/i18n';
import { buildTokenImagesStack } from 'lib/images-uri';
import { getTokenName } from 'lib/metadata';
import { useInterval } from 'lib/ui/hooks';
import { navigate } from 'lib/woozie';
import { useTezosChainByChainId, useAccountForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { CollectiblesSelectors } from '../selectors';

import { TezosAttributes } from './Attributes';
import { TezosCollectiblePageImage } from './CollectiblePageImage';
import { CollectionDetails } from './CollectionDetails';
import { Description } from './Description';
import { TezosDetails } from './Details';
import { QuickActionsPopper } from './QuickActionsPopper';

const TEZOS_DETAILS_SYNC_INTERVAL = 4 * TEZOS_BLOCK_DURATION;

interface Props {
  tezosChainId: string;
  assetSlug: string;
}

export const TezosContent = memo<Props>(({ tezosChainId, assetSlug }) => {
  const network = useTezosChainByChainId(tezosChainId);
  const account = useAccountForTezos();
  const metadata = useCollectibleMetadataSelector(assetSlug); // Loaded only, if shown in grid for now

  if (!metadata || !network || !account) throw new DeadEndBoundaryError();

  const [tab, setTab] = useState<'details' | 'attributes'>('details');

  const details = useCollectibleDetailsSelector(assetSlug);
  const areAnyCollectiblesDetailsLoading = useAllCollectiblesDetailsLoadingSelector();

  const publicKeyHash = account.address;

  const areDetailsLoading = areAnyCollectiblesDetailsLoading && details === undefined;

  const collectibleName = getTokenName(metadata);

  const collection = useMemo(
    () =>
      details && {
        title: details.galleries[0]?.title ?? details.fa.name,
        logo: buildTokenImagesStack(details.fa.logo)
      },
    [details]
  );

  const onSendButtonClick = useCallback(
    () => navigate(buildSendPagePath(TempleChainKind.Tezos, tezosChainId, assetSlug)),
    [tezosChainId, assetSlug]
  );

  useInterval(
    () => void dispatch(loadCollectiblesDetailsActions.submit([assetSlug])),
    [assetSlug],
    TEZOS_DETAILS_SYNC_INTERVAL
  );

  const detailsTabRef = useRef<HTMLDivElement>(null);
  const attributesTabRef = useRef<HTMLDivElement>(null);

  return (
    <PageLayout headerRightElem={<QuickActionsPopper assetSlug={assetSlug} network={network} />}>
      <div
        className="relative flex items-center justify-center rounded-8 mb-4 overflow-hidden bg-grey-4"
        style={{ aspectRatio: '1/1' }}
      >
        <TezosCollectiblePageImage
          metadata={metadata}
          areDetailsLoading={areDetailsLoading}
          objktArtifactUri={details?.objktArtifactUri}
          isAdultContent={details?.isAdultContent}
          mime={details?.mime}
        />
      </div>

      <div
        className="max-w-88 max-h-12 mb-2 text-font-regular-bold leading-6 truncate"
        {...setTestID(CollectiblesSelectors.collectibleTitle)}
      >
        {collectibleName}
      </div>

      {areDetailsLoading ? (
        <SyncSpinner className="mt-6" />
      ) : (
        <>
          <CollectionDetails {...collection} />

          <StyledButton
            size="L"
            color="primary"
            onClick={onSendButtonClick}
            testID={CollectiblesSelectors.sendButton}
            className="my-6"
          >
            <T id="send" />
          </StyledButton>

          <Description text={details?.description} className="mb-6" />

          {details?.attributes && details.attributes.length > 0 && (
            <SegmentedControl
              name="collectible-details-attributes"
              activeSegment={tab}
              setActiveSegment={setTab}
              className="mb-4"
              segments={[
                {
                  label: t('details'),
                  value: 'details',
                  ref: detailsTabRef
                },
                {
                  label: t('attributes'),
                  value: 'attributes',
                  ref: attributesTabRef
                }
              ]}
            />
          )}

          <div className="w-full">
            {tab === 'attributes' ? (
              <TezosAttributes details={details} />
            ) : (
              <TezosDetails network={network} assetSlug={assetSlug} accountPkh={publicKeyHash} details={details} />
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
});
