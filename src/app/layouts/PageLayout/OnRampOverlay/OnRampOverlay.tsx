import React, { memo, useCallback, useMemo } from 'react';

import browser from 'webextension-polyfill';

import { Anchor, IconBase } from 'app/atoms';
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
import { getWertCommodity, getWertOnRampUrl, wertCommodityEvmChainIdMap } from 'lib/apis/wert';
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

  const tokenSymbol = useMemo(() => {
    if (!onRampAsset) return undefined;

    const [chainKind, chainId] = parseChainAssetSlug(onRampAsset);

    if (chainKind === TempleChainKind.Tezos) return 'TEZ';
    return wertCommodityEvmChainIdMap[chainId]?.commodity;
  }, [onRampAsset]);

  const close = useCallback(() => void dispatch(setOnRampAssetAction({ chainAssetSlug: null })), []);

  const handleBuy = useCallback(
    (amount?: number) => {
      if (!onRampAsset) return;

      const commodity = getWertCommodity(onRampAsset);
      const [chainKind] = parseChainAssetSlug(onRampAsset);
      const walletAddress = getAccountAddressForChain(account, chainKind);

      close();

      if (!commodity || !walletAddress) return;

      browser.tabs.create({ url: getWertOnRampUrl(walletAddress, commodity, amount) });
    },
    [account, onRampAsset, close]
  );

  if (!isOnRampPossibility) return null;

  return (
    <div className="fixed inset-0 z-overlay-promo flex flex-col items-center justify-center bg-black/15 backdrop-blur-xs">
      <div className="w-88 h-[19.375rem] relative flex flex-col text-center bg-white shadow-bottom rounded-8 px-3 py-4">
        <div className="absolute top-3 right-3">
          <CloseButton onClick={close} />
        </div>

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
            onClick={() => handleBuy(50)}
            testID={OnRampOverlaySelectors.fiftyDollarButton}
          />
          <OnRampSmileButton
            SmileIcon={SmileWithGlassesIcon}
            amount={100}
            accentColors
            onClick={() => handleBuy(100)}
            testID={OnRampOverlaySelectors.oneHundredDollarButton}
          />
          <OnRampSmileButton
            SmileIcon={SmileWithDollarIcon}
            amount={200}
            onClick={() => handleBuy(200)}
            testID={OnRampOverlaySelectors.twoHundredDollarButton}
          />
        </div>

        <Anchor
          className="flex items-center self-center text-secondary text-font-description-bold cursor-pointer"
          onClick={() => handleBuy()}
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
      </div>
    </div>
  );
});
