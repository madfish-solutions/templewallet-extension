import React, { FC, memo, ReactNode, useCallback, useMemo, useState } from 'react';

import browser from 'webextension-polyfill';

import { FormSubmitButton } from 'app/atoms';
import { AppUpdateDetails, useStoredAppUpdateDetails } from 'app/storage/app-update/use-value.hook';
import { useAcceptedTermsVersionSelector } from 'app/store/settings/selectors';
import { RECENT_TERMS_VERSION } from 'lib/constants';
import { T } from 'lib/i18n';
import { EmojiInlineIcon } from 'lib/icons/emoji';
import { useDidMount } from 'lib/ui/hooks';
import { useIntersectionObserver } from 'lib/ui/use-intersection-observer';

import { TermsOfUseUpdateOverlay } from './TermsOfUseUpdateOverlay';

interface Props {
  stickyBarRef: React.RefObject<HTMLDivElement>;
}

export const Banner = memo<Props>(({ stickyBarRef }) => {
  const acceptedTermsVersion = useAcceptedTermsVersionSelector();

  if (acceptedTermsVersion === RECENT_TERMS_VERSION) return <UpdateAppBanner stickyBarRef={stickyBarRef} />;

  return <TermsOfUseUpdateBanner stickyBarRef={stickyBarRef} />;
});

const UpdateAppBanner: FC<Props> = ({ stickyBarRef }) => {
  const [storedUpdateDetails, setStoredUpdateDetails] = useStoredAppUpdateDetails();

  const [checkedUpdateDetails, setCheckedUpdateDetails] = useState<AppUpdateDetails>();

  useDidMount(() => {
    // Only available in Chrome
    void browser.runtime.requestUpdateCheck?.().then(([status, details]) => {
      if (status === 'update_available') setCheckedUpdateDetails(details);
    });
  });

  const updateDetails = storedUpdateDetails || checkedUpdateDetails;

  const onUpdateButtonPress = useMemo(() => {
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

  if (!onUpdateButtonPress) return null;

  return (
    <BannerBase
      title="Update your Temple Wallet extension!"
      description={
        <>
          <EmojiInlineIcon key="emoji" name="party-popper-1f389" className="align-sub" />
          {
            ' Great news! The newest version of Temple Wallet is available in the store. Please, update your extension to unlock all the latest improvements.'
          }
        </>
      }
      actionName="Update now"
      stickyBarRef={stickyBarRef}
      onActionClick={onUpdateButtonPress}
    />
  );
};

const TermsOfUseUpdateBanner: FC<Props> = ({ stickyBarRef }) => {
  const [shouldShowTermsOfUseUpdateOverlay, setShouldShowTermsOfUseUpdateOverlay] = useState(false);
  const showTermsOfUseUpdateOverlay = useCallback(() => void setShouldShowTermsOfUseUpdateOverlay(true), []);
  const hideTermsOfUseUpdateOverlay = useCallback(() => void setShouldShowTermsOfUseUpdateOverlay(false), []);

  return (
    <>
      {shouldShowTermsOfUseUpdateOverlay && <TermsOfUseUpdateOverlay onClose={hideTermsOfUseUpdateOverlay} />}

      <BannerBase
        title={<T id="templeWalletUpdate" />}
        description={<T id="templeWalletUpdateDescription" />}
        actionName={<T id="reviewUpdate" />}
        stickyBarRef={stickyBarRef}
        onActionClick={showTermsOfUseUpdateOverlay}
      />
    </>
  );
};

interface BannerBaseProps {
  title: ReactNode;
  description: ReactChildren;
  actionName: ReactNode;
  stickyBarRef: React.RefObject<HTMLDivElement>;
  onActionClick?: EmptyFn;
}

const BannerBase = memo<BannerBaseProps>(({ title, description, actionName, stickyBarRef, onActionClick }) => {
  const [stickyBarHeight, setStickyBarHeight] = useState(0);

  useIntersectionObserver(stickyBarRef, entry => void setStickyBarHeight(entry.boundingClientRect.height), {});

  const style = useMemo(
    () => ({
      top: stickyBarHeight + 12
    }),
    [stickyBarHeight]
  );

  return (
    <div className="sticky z-25 flex flex-col p-3 mb-3 bg-white rounded-md shadow-lg" style={style}>
      <h5 className="text-sm font-inter font-medium leading-4 text-gray-910">{title}</h5>

      <p className="mt-1 text-xs font-inter leading-5 text-gray-700">{description}</p>

      <FormSubmitButton slim className="mt-3" onClick={onActionClick}>
        {actionName}
      </FormSubmitButton>
    </div>
  );
});
