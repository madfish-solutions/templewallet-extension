// import retry from 'async-retry';
// import { NetworkSelectSelectors } from 'src/app/layouts/PageLayout/Header/NetworkSelect/selectors';
//
// import { Page } from '/src/classes/page.class';
// import { createPageElement, findElement } from 'src/utils/search.utils';
//
// export class NetworksDropDown extends Page {
//   networkItemButton = createPageElement(NetworkSelectSelectors.networkItemButton);
//
//   async isVisible(timeout?: number) {
//     await this.networkItemButton.waitForDisplayed(timeout);
//   }
//
//   // async isClosed() {
//   //   await retry(
//   //     () =>
//   //       this.isVisible(ONE_SECOND).then(
//   //         () => {
//   //           throw new Error(`Networks dropdown is still opened`);
//   //         },
//   //         () => undefined
//   //       ),
//   //     RETRY_OPTIONS
//   //   );
//   // }
//
//   // async selectNetwork(name: string) {
//   //   const networkItemElem = await findElement(NetworkSelectSelectors.networkItemButton, { name });
//   //
//   //   await networkItemElem.click();
//   // }
// }
