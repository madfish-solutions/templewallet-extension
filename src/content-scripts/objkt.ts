import retry from 'async-retry';
import browser from 'webextension-polyfill';

import { getObjktNftContractAddress } from 'lib/apis/objkt';
import { isTruthy } from 'lib/utils';

const extensionId = browser.runtime.id;

console.log('Hello OBJKT from TW! Hello!');

let currentHref = document.location.href;

const observer = new MutationObserver(() => {
  if (currentHref === document.location.href) return;
  currentHref = document.location.href;

  onUrlChange();
});

// const bodyElem = document.querySelector('body');
console.log('Doc elem present:', !!document);
observer.observe(document, { childList: true, subtree: true });

const onUrlChange = async () => {
  const [, pageName, collectionShortname, tokenIdStr] = document.location.pathname.split('/');

  const tokenId = Number(tokenIdStr);

  if (!(pageName === 'asset' && isTruthy(collectionShortname) && Number.isFinite(tokenId))) return;

  const address = await getObjktNftContractAddress(collectionShortname, tokenId);

  console.log('TW: NFT address = ', address);

  if (address) onLandedAtAssetPage(address, tokenId);
};

onUrlChange();

const onLandedAtAssetPage = (address: string, id: number) => {
  const twBuyButton = new TempleWalletBuyButton();

  twBuyButton.mount();
};

class TempleWalletBuyButton {
  elem: HTMLElement;
  mounted: boolean | 'trying' = false;
  constructor() {
    const elem = document.createElement('app-info-popover');
    // @ts-ignore
    elem.style = 'display: flex; align-items: center; background-color: orange;';
    const linkElem = document.createElement('a');
    linkElem.href = `chrome-extension://${extensionId}/fullpage.html#/nft-purchase`;
    linkElem.className = 'external-payment-button square';
    linkElem.textContent = 'TW';
    // @ts-ignore
    linkElem.style = 'padding: 0 0.5em;';
    elem.appendChild(linkElem);

    this.elem = elem;
  }
  mount() {
    console.log('a');
    const mainBuyBtnElem = this.mainObjktBuyBtnElem;

    if (mainBuyBtnElem) {
      this.mounted = true;
      mainBuyBtnElem.after(this.elem);
      return;
    }

    this.mounted = 'trying';
    const observer = new MutationObserver(() => {
      console.log(1);
      if (!this.mounted) {
        observer.disconnect();
        return;
      }
      console.log(2);

      const mainBuyBtnElem = this.mainObjktBuyBtnElem;

      if (!mainBuyBtnElem) {
        console.log('fuck');
        return;
      }
      console.log(3);

      mainBuyBtnElem.after(this.elem);
      observer.disconnect();
      this.mounted = true;
    });

    observer.observe(document, { childList: true, subtree: true });
  }
  private get mainObjktBuyBtnElem() {
    const appBuyElem = document.querySelector('app-buy');
    const mainBuyBtnElem = appBuyElem?.querySelector('button.buy-button');

    return mainBuyBtnElem;
  }
}
