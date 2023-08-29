const ETHER_SCAN = 'https://etherscan.io';
const BSC_SCAN = 'https://bscscan.com';
const POLYGON_SCAN = 'https://polygonscan.com';
const TZKT = 'https://tzkt.io';
const TRON_SCAN = 'https://tronscan.org';

const transformTzktUrl = (url: string) => {
  const splittedUrl = url.split('/');
  const indexOfItemToChange = 3;
  const changedItem = splittedUrl[indexOfItemToChange];

  if (changedItem.startsWith('tz')) {
    return `${TZKT}/address/`;
  } else if (changedItem.startsWith('KT')) {
    return `${TZKT}/token/`;
  } else if (changedItem.startsWith('o')) {
    return `${TZKT}/transaction/`;
  }

  return TZKT;
};

const transformBlockExplorerUrl = (url: string) => {
  const splittedUrl = url.split('/');

  if (url.includes(TZKT)) {
    return transformTzktUrl(url);
  }

  splittedUrl.pop();

  return splittedUrl.join('/') + '/';
};

const isBlockExplorerUrl = (url: string) => {
  const blockExplorers = [ETHER_SCAN, BSC_SCAN, POLYGON_SCAN, TZKT, TRON_SCAN];

  return blockExplorers.some(blockExplorer => url.includes(blockExplorer));
};

export const modifyTrackedUrl = (url: string) => {
  if (isBlockExplorerUrl(url)) {
    return transformBlockExplorerUrl(url);
  }

  return url;
};
