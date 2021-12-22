import React, { Suspense, useMemo } from 'react';

import classNames from 'clsx';

import { ReactComponent as InfoIcon } from 'app/icons/info.svg';
import { ReactComponent as SwapIcon } from 'app/icons/swap.svg';
import PageLayout from 'app/layouts/PageLayout';
import { SwapForm } from 'app/templates/SwapForm/SwapForm';
import { t, T } from 'lib/i18n/react';
import useTippy from 'lib/ui/useTippy';

interface SwapProps {
  assetSlug?: string;
}

const Swap: React.FC<SwapProps> = ({ assetSlug }) => (
  <PageLayout
    pageTitle={
      <>
        <SwapIcon className="w-auto h-4 mr-1 stroke-current" /> {t('swap')}
      </>
    }
  >
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <SwapDisclaimer />

        <Suspense fallback={null}>
          <SwapForm assetSlug={assetSlug} />
        </Suspense>
      </div>
    </div>
  </PageLayout>
);

export default Swap;

const SwapDisclaimer: React.FC = () => {
  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: t('swapDisclaimerContent'),
      animation: 'shift-away-subtle'
    }),
    []
  );
  const tippyRef = useTippy<HTMLSpanElement>(tippyProps);

  return (
    <div className="mb-4 flex items-center">
      <span
        ref={tippyRef}
        className={classNames(
          'inline-flex items-center',
          '-ml-1 p-1',
          'cursor-default',
          'text-xs',
          'rounded-sm',
          'text-gray-600 hover:bg-gray-100'
        )}
      >
        <T id="swapDisclaimerTitle" />
        <InfoIcon
          style={{
            width: '0.625rem',
            height: 'auto',
            marginLeft: '0.125rem'
          }}
          className="stroke-current"
        />
      </span>
    </div>
  );
};
