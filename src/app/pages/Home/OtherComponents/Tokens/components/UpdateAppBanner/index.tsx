import React, { FC, memo, useMemo, useState } from 'react';

import browser from 'webextension-polyfill';

import { AppUpdateDetails, useStoredAppUpdateDetails } from 'app/storage/app-update/use-value.hook';
import { T } from 'lib/i18n';
import { useDidMount } from 'lib/ui/hooks';
import { Lottie } from 'lib/ui/react-lottie';

import rocketAnimation from './rocket-animation.json';

export const UpdateAppBanner: FC = () => {
  const [storedUpdateDetails, setStoredUpdateDetails] = useStoredAppUpdateDetails();

  const [checkedUpdateDetails, setCheckedUpdateDetails] = useState<AppUpdateDetails>();

  useDidMount(() => {
    // Only available in Chrome
    void browser.runtime.requestUpdateCheck?.().then(([status, details]) => {
      if (status === 'update_available') setCheckedUpdateDetails(details);
    });
  });

  const updateDetails = storedUpdateDetails || checkedUpdateDetails;

  const handleUpdate = useMemo(() => {
    if (!updateDetails) return undefined;

    return async () => {
      await setStoredUpdateDetails({
        ...updateDetails,
        triggeredManually: true
      });

      // Applies updates if available. See:
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/reload
      browser.runtime.reload();
    };
  }, [updateDetails, setStoredUpdateDetails]);

  if (!handleUpdate) return null;

  return <BannerBase onClick={handleUpdate} />;
};

const ROCKET_ANIMATION_OPTIONS = {
  loop: true,
  autoplay: true,
  animationData: rocketAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
} as const;

interface BannerBaseProps {
  onClick?: EmptyFn;
}

const BannerBase = memo<BannerBaseProps>(({ onClick }) => (
  <div
    className="flex gap-x-2 p-4 mb-2 rounded-8 border-0.5 border-lines cursor-pointer bg-white hover:bg-grey-4"
    onClick={onClick}
  >
    <div className="flex shrink-0 justify-center items-center w-10 h-10">
      <Lottie isClickToPauseDisabled options={ROCKET_ANIMATION_OPTIONS} height={47} width={47} />
    </div>

    <div className="flex flex-col gap-y-1">
      <p className="text-font-medium-bold">
        <T id="newVersion" />
      </p>
      <p className="text-font-description text-grey-1">
        <T id="clickToUpdateWallet" />
      </p>
    </div>
  </div>
));
