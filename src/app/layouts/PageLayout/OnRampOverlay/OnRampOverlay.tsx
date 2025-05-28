import React, { memo, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';
import browser from 'webextension-polyfill';

import { Anchor, IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { CloseButton } from 'app/atoms/PageModal';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as ApplePayIcon } from 'app/icons/payment-options/apple-pay.svg';
import { ReactComponent as MastercardIcon } from 'app/icons/payment-options/mastercard.svg';
import { ReactComponent as VisaIcon } from 'app/icons/payment-options/visa.svg';
import { ReactComponent as SmileWithDollarIcon } from 'app/icons/smile-with-dollar.svg';
import { ReactComponent as SmileWithGlassesIcon } from 'app/icons/smile-with-glasses.svg';
import { ReactComponent as SmileIcon } from 'app/icons/smile.svg';
import { dispatch } from 'app/store';
import { setOnRampPossibilityAction } from 'app/store/settings/actions';
import { useOnRampPossibilitySelector } from 'app/store/settings/selectors';
import { getWertLink, wertCommodityEvmChainIdMap } from 'lib/apis/wert';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n/react';
import { getAccountAddressForChain } from 'temple/accounts';
import { useAccount } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { OnRampOverlaySelectors } from './OnRampOverlay.selectors';
import { OnRampSmileButton } from './OnRampSmileButton/OnRampSmileButton';

export const OnRampOverlay = memo(() => {
  const account = useAccount();
  const onRampPossibility = useOnRampPossibilitySelector();
  const isOnRampPossibility = Boolean(onRampPossibility);

  const [isLinkLoading, setIsLinkLoading] = useState(false);

  const tokenSymbol = useMemo(() => {
    if (!onRampPossibility) return;

    const [chainKind, chainId] = parseChainAssetSlug(onRampPossibility);

    if (chainKind === TempleChainKind.Tezos) return 'TEZ';
    return wertCommodityEvmChainIdMap[chainId]?.commodity;
  }, [onRampPossibility]);

  const close = useCallback(() => {
    setIsLinkLoading(false);
    dispatch(setOnRampPossibilityAction(false));
  }, []);

  const handleRedirect = useCallback(
    async (amount?: number) => {
      if (!onRampPossibility) return;

      try {
        setIsLinkLoading(true);

        const [chainKind] = parseChainAssetSlug(onRampPossibility);

        const accountAddress = getAccountAddressForChain(account, chainKind);

        if (!accountAddress) throw new Error();
        const url = await getWertLink(accountAddress, onRampPossibility, amount);

        close();

        await browser.tabs.create({ url });
      } catch {
        close();
      }
    },
    [account, close, onRampPossibility]
  );

  if (!isOnRampPossibility) return null;

  return (
    <div className="fixed inset-0 z-overlay-promo flex flex-col items-center justify-center bg-black bg-opacity-10 backdrop-blur-xs">
      <div className="w-88 h-88 mx-auto relative flex flex-col text-center bg-white shadow-lg bg-no-repeat rounded-md p-4">
        <div className="ml-auto">
          <CloseButton onClick={close} />
        </div>

        {isLinkLoading ? (
          <PageLoader stretch />
        ) : (
          <>
            <h1 className="text-base font-semibold text-text my-1">
              <T id="insufficientTokenBalance" substitutions={[tokenSymbol]} />
            </h1>

            <p className="text-sm text-grey-1 mb-1">
              <T id="topupBalanceDescription" />
            </p>

            <div className="flex flex-row items-center my-4 gap-x-2">
              <OnRampSmileButton
                SmileIcon={SmileIcon}
                amount={50}
                onClick={() => handleRedirect(50)}
                testID={OnRampOverlaySelectors.fiftyDollarButton}
              />
              <OnRampSmileButton
                SmileIcon={SmileWithGlassesIcon}
                amount={100}
                accentColors
                onClick={() => handleRedirect(100)}
                testID={OnRampOverlaySelectors.oneHundredDollarButton}
              />
              <OnRampSmileButton
                SmileIcon={SmileWithDollarIcon}
                amount={200}
                onClick={() => handleRedirect(200)}
                testID={OnRampOverlaySelectors.twoHundredDollarButton}
              />
            </div>

            <Anchor
              className={classNames(
                'my-0.5 font-inter text-secondary',
                'text-xs font-semibold',
                'flex items-center',
                'hover:secondary-hover cursor-pointer self-center'
              )}
              onClick={() => handleRedirect()}
              testID={OnRampOverlaySelectors.customAmountButton}
            >
              <T id="customAmount" />
              <IconBase Icon={OutLinkIcon} size={16} className="text-secondary" />
            </Anchor>

            <p className="text-xxxs mt-3 mb-2 text-grey-1">
              <T id="thirdParty" />
            </p>

            <div className="mb-1 gap-x-2 flex items-center self-center">
              <VisaIcon />
              <MastercardIcon />
              <ApplePayIcon />
            </div>
          </>
        )}
      </div>
    </div>
  );
});
