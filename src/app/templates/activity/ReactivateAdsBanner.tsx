import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import { buildFormSubmitButtonCommonClassName } from 'app/atoms/FormSubmitButton';
import { ReactivateAdsOverlay } from 'app/layouts/PageLayout/ReactivateAdsOverlay';
import { useSafeState } from 'lib/ui/hooks';

import bgImageSrc from './reactivate-ads-banner-bg.png';
import { ActivitySelectors } from './selectors';

// ts-prune-ignore-next
export const ReactivateAdsBanner = memo(() => {
  const [modalOpened, setModalOpened] = useSafeState(false);

  const style = useMemo(
    () => ({
      background: [
        'linear-gradient(90deg, #D3E8FB 0%, #FFF2E6 41.63%, rgba(255, 255, 255, 0) 66.84%)',
        `url("${bgImageSrc}") no-repeat right / cover`
      ].join(', ')
    }),
    []
  );

  const onModalClose = useCallback(() => void setModalOpened(false), [setModalOpened]);

  return (
    <>
      {modalOpened && <ReactivateAdsOverlay onClose={onModalClose} />}

      <div className="w-full flex items-center px-6 py-3 rounded-lg" style={style}>
        <div className="flex-grow text-left text-sm font-semibold text-gray-910" style={{ lineHeight: 1.2 }}>
          Familiar Experience, With
          <br />
          Growth Of TKEY Balance!
        </div>

        <Button
          type="button"
          onClick={() => setModalOpened(true)}
          className={clsx(
            'min-w-20 rounded-lg text-xs leading-none px-4 py-2 text-white',
            buildFormSubmitButtonCommonClassName()
          )}
          testID={ActivitySelectors.reactivateAdsBannerViewBtn}
        >
          View
        </Button>
      </div>
    </>
  );
});
