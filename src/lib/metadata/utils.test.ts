import { buildEvmCollectiblePreviewSources } from 'lib/images-uri';

import { patchRetiredSeadnImageUrl } from './utils';

const GAE_ID = '3IgHDPOCHPERMvRmO2t-8cKDBI4q0zkeXxjxfVRzM-_2Lcc8hQXdd8CBING_zxRY4I';

describe('patchRetiredSeadnImageUrl', () => {
  it('rewrites a Goldrush OpenSea /gae/ URL to the Google host that still serves it', () => {
    expect(patchRetiredSeadnImageUrl(`https://i.seadn.io/gae/${GAE_ID}?w=500&auto=format`)).toBe(
      `https://lh3.googleusercontent.com/${GAE_ID}=s500`
    );
  });

  it('keeps the Covalent proxy width when that proxy wraps a retired /gae/ URL', () => {
    const proxied = `https://image-proxy.svc.prod.covalenthq.com/cdn-cgi/image/width=256,fit/https://i.seadn.io/gae/${GAE_ID}?w=500&auto=format`;

    expect(patchRetiredSeadnImageUrl(proxied)).toBe(`https://lh3.googleusercontent.com/${GAE_ID}=s256`);
  });

  it('leaves a current OpenSea CDN URL unchanged', () => {
    const url =
      'https://i2c.seadn.io/polygon/0x2953399124f0cbb46d2cbacd8a89cf0599974963/315bd353805c2527ff48e7457553bd/7f315bd353805c2527ff48e7457553bd.png';

    expect(patchRetiredSeadnImageUrl(url)).toBe(url);
  });

  it('drops a retired /gcs/ URL that cannot be rewritten', () => {
    expect(
      patchRetiredSeadnImageUrl('https://i.seadn.io/gcs/files/f9f6b97b526be158b0597eb7154bbccb.gif?w=500&auto=format')
    ).toBeUndefined();
  });
});

describe('buildEvmCollectiblePreviewSources', () => {
  it('previews a stored Goldrush /gae/ URL from Google', () => {
    const sources = buildEvmCollectiblePreviewSources({
      address: '0x2953399124F0cBB46d2CbACD8A89cF0599974963',
      tokenId: '1',
      image: `https://i.seadn.io/gae/${GAE_ID}?w=500&auto=format`
    });

    expect(sources.flatMap(stage => stage.urls)).toEqual([`https://lh3.googleusercontent.com/${GAE_ID}=s500`]);
  });

  it('previews a stored OpenSea video from a still frame', () => {
    const video =
      'https://raw2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/aef5861c2ff9855c0dd6292e30039b/dcaef5861c2ff9855c0dd6292e30039b.mp4';

    const sources = buildEvmCollectiblePreviewSources({
      address: '0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58',
      tokenId: '438',
      image: video
    });

    expect(sources.flatMap(stage => stage.urls)).toEqual([
      'https://i2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/aef5861c2ff9855c0dd6292e30039b/dcaef5861c2ff9855c0dd6292e30039b.mp4?frame-time=1&w=500'
    ]);
  });

  it('previews a video frame before an animated cover', () => {
    const cover =
      'https://i2c.seadn.io/ethereum/0x8754f54074400ce745a7ceddc928fb1b7e985ed6/f8d296e4ebab1d0e580288ddd61d700c.gif';
    const video =
      'https://raw2.seadn.io/ethereum/0x8754f54074400ce745a7ceddc928fb1b7e985ed6/c7f93c7187abae1a73ba15b2a203cb4f.mp4';

    const sources = buildEvmCollectiblePreviewSources({
      address: '0x8754F54074400CE745a7CEddC928FB1b7E985eD6',
      tokenId: '550226233603',
      image: cover,
      images: [cover],
      artifactUrl: video
    });

    expect(sources.flatMap(stage => stage.urls)).toEqual([
      'https://i2.seadn.io/ethereum/0x8754f54074400ce745a7ceddc928fb1b7e985ed6/c7f93c7187abae1a73ba15b2a203cb4f.mp4?frame-time=1&w=500',
      cover
    ]);
  });
});
