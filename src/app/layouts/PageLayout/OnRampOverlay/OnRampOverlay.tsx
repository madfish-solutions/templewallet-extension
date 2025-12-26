import React, { memo, useCallback, useMemo, useState } from 'react';

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
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { useOnRampAssetSelector, useOnRampTitleSelector } from 'app/store/settings/selectors';
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
  const onRampAsset = useOnRampAssetSelector();
  const onRampTitle = useOnRampTitleSelector();
  const isOnRampPossibility = Boolean(onRampAsset);

  const [isLinkLoading, setIsLinkLoading] = useState(false);

  const tokenSymbol = useMemo(() => {
    if (!onRampAsset) return;

    const [chainKind, chainId] = parseChainAssetSlug(onRampAsset);

    if (chainKind === TempleChainKind.Tezos) return 'TEZ';
    return wertCommodityEvmChainIdMap[chainId]?.commodity;
  }, [onRampAsset]);

  const close = useCallback(() => {
    setIsLinkLoading(false);
    dispatch(setOnRampAssetAction({ chainAssetSlug: null }));
  }, []);

  const handleRedirect = useCallback(
    async (amount?: number) => {
      if (!onRampAsset) return;

      try {
        setIsLinkLoading(true);

        const [chainKind] = parseChainAssetSlug(onRampAsset);

        const accountAddress = getAccountAddressForChain(account, chainKind);

        if (!accountAddress) throw new Error();
        const url = await getWertLink(accountAddress, onRampAsset, amount);

        close();

        await browser.tabs.create({ url });
      } catch {
        close();
      }
    },
    [account, close, onRampAsset]
  );

  if (!isOnRampPossibility) return null;

  return (
    <div className="fixed inset-0 z-overlay-promo flex flex-col items-center justify-center bg-black bg-opacity-15 backdrop-blur-xs">
      <div className="w-88 h-[19.375rem] relative flex flex-col text-center bg-white shadow-bottom rounded-8 px-3 py-4">
        <div className="absolute top-3 right-3">
          <CloseButton onClick={close} />
        </div>

        {isLinkLoading ? (
          <PageLoader stretch />
        ) : (
          <>
            <h1 className="text-font-regular-bold my-1">
              {onRampTitle ?? <T id="insufficientBalanceForGas" substitutions={[tokenSymbol]} />}
            </h1>

            <p className="text-font-medium text-grey-1 mb-1">
              <T id="topupBalanceDescription" />
            </p>

            <div className="flex flex-row justify-center items-center py-4 gap-x-2">
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
              className="flex items-center self-center text-secondary text-font-description-bold cursor-pointer"
              onClick={() => handleRedirect()}
              testID={OnRampOverlaySelectors.customAmountButton}
            >
              <T id="customAmount" />
              <IconBase Icon={OutLinkIcon} className="text-secondary" />
            </Anchor>

            <p className="text-font-small mt-3 mb-2 text-grey-1">
              <T id="thirdParty" />
            </p>

            <div className="flex items-center self-center mb-1 gap-x-2">
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
