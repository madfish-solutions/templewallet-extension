import {
  collectibleImagePreviewUrl,
  collectibleMediaKindFromMime,
  collectiblePageMediaKind,
  firstCollectibleArtifactUrl,
  previewUrlIsOpenseaHosted
} from './collectible-media';

const VIDEO =
  'https://raw2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/aef5861c2ff9855c0dd6292e30039b/dcaef5861c2ff9855c0dd6292e30039b.mp4';
const FRAME = `${VIDEO.replace('https://raw2.seadn.io', 'https://i2.seadn.io')}?frame-time=1&w=500`;
const COVER = 'https://i2c.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/cover.png';
const AUDIO = 'https://i2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/track.mp3';
const MODEL = 'https://i2.seadn.io/matic/0x2953399124f0cbb46d2cbacd8a89cf0599974963/model.glb';
const HTML = 'https://i2.seadn.io/ethereum/0x50a76d644ccd4b3e2ca0169fe52f0ed0292cee58/token.html';

describe('collectible media urls', () => {
  it('turns an OpenSea video into a still frame and keeps the file as the artifact', () => {
    expect(collectibleImagePreviewUrl(VIDEO)).toBe(FRAME);
    expect(firstCollectibleArtifactUrl(VIDEO)).toBe(VIDEO);
    expect(collectibleImagePreviewUrl(FRAME)).toBe(FRAME);
    expect(firstCollectibleArtifactUrl(FRAME)).toBe(VIDEO);
  });

  it('keeps a separate image for audio, a 3D model, and HTML', () => {
    expect(collectibleImagePreviewUrl(AUDIO)).toBeUndefined();
    expect(collectibleImagePreviewUrl(MODEL)).toBeUndefined();
    expect(collectibleImagePreviewUrl(HTML)).toBeUndefined();
    expect(collectibleImagePreviewUrl(COVER)).toBe(COVER);
    expect(firstCollectibleArtifactUrl(AUDIO, COVER)).toBe(AUDIO);
    expect(firstCollectibleArtifactUrl(MODEL)).toBe(MODEL);
    expect(firstCollectibleArtifactUrl(HTML)).toBe(HTML);
  });

  it('maps a mime type to the detail-page player and skips USDZ', () => {
    expect(collectibleMediaKindFromMime('video/mp4')).toBe('video');
    expect(collectibleMediaKindFromMime('audio/mpeg')).toBe('audio');
    expect(collectibleMediaKindFromMime('model/gltf-binary')).toBe('model');
    expect(collectibleMediaKindFromMime('text/html')).toBe('html');
    expect(collectibleMediaKindFromMime('image/png')).toBeUndefined();
    expect(collectiblePageMediaKind(MODEL)).toBe('model');
    expect(collectiblePageMediaKind(HTML)).toBe('html');
    expect(collectiblePageMediaKind(VIDEO)).toBe('video');
    expect(collectiblePageMediaKind('https://i2.seadn.io/ethereum/0xabc/model.usdz')).toBeUndefined();
  });

  it('treats OpenSea CDN hosts as already loaded from OpenSea', () => {
    expect(previewUrlIsOpenseaHosted(COVER)).toBe(true);
    expect(previewUrlIsOpenseaHosted(VIDEO)).toBe(true);
    expect(previewUrlIsOpenseaHosted('https://example.com/missing.png')).toBe(false);
    expect(previewUrlIsOpenseaHosted('https://lh3.googleusercontent.com/abc=s256')).toBe(false);
    expect(previewUrlIsOpenseaHosted('https://i.seadn.io/gae/abc')).toBe(false);
  });
});
