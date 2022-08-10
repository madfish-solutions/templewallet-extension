const MEDIA_HOST = 'https://static.tcinfra.net';
const MEDIA_SIZE = 'small';

export const formatAssetUri = (url = '') => {
  if (url.startsWith('ipfs://')) {
    return `${MEDIA_HOST}/media/${MEDIA_SIZE}/ipfs/${url.substring(7)}`;
  }

  if (url.startsWith('http')) {
    return `${MEDIA_HOST}/media/${MEDIA_SIZE}/web/${url.replace(/^https?:\/\//, '')}`;
  }

  if (url.startsWith('chrome-extension')) {
    return url;
  }

  if (url.startsWith('moz-extension')) {
    return url;
  }

  return '';
};

export const formatObjktSmallAssetUri = (assetSlug: string) => {
  const [address, id] = assetSlug.split('_');

  return `https://assets.objkt.media/file/assets-003/${address}/${id}/thumb288`;
};
