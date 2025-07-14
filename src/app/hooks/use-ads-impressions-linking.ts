import { dispatch } from 'app/store';
import { setAdsImpressionsLinkedAction } from 'app/store/settings/actions';
import { useIsAdsImpressionsLinkedSelector } from 'app/store/settings/selectors';
import { performLinkingOfAdsImpressions } from 'lib/ads/link-ads-impressions';
import { useDidMount } from 'lib/ui/hooks';

import { useAdsViewerPkh } from './use-ads-viewer-addresses';

export const useAdsImpressionsLinking = () => {
  const linked = useIsAdsImpressionsLinkedSelector();
  const { tezosAddress: accountPkh } = useAdsViewerPkh();

  useDidMount(() => {
    if (linked) return;

    performLinkingOfAdsImpressions(accountPkh).then(() => void dispatch(setAdsImpressionsLinkedAction()));
  });
};
