import {
  bindAccountNotificationImage,
  OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL,
  subscribeAccountNotificationImageSrc
} from './objkt-image';

interface ImageStub {
  onload: EmptyFn | null;
  src: string;
}

describe('account notification image fallback', () => {
  const OriginalImage = global.Image;

  afterEach(() => {
    global.Image = OriginalImage;
  });

  const installImageStub = (Stub: new () => ImageStub) => {
    Object.assign(global, { Image: Stub });
  };

  it('shows the fallback immediately for a remote url', () => {
    installImageStub(
      class {
        onload: EmptyFn | null = null;
        src = '';
      }
    );

    const onSrc = jest.fn();
    subscribeAccountNotificationImageSrc('https://objkt.com/token.png', onSrc);

    expect(onSrc).toHaveBeenCalledTimes(1);
    expect(onSrc).toHaveBeenCalledWith(OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL);
  });

  it('keeps the fallback when the backend image is missing or unsafe', () => {
    const onSrc = jest.fn();
    subscribeAccountNotificationImageSrc('', onSrc);
    subscribeAccountNotificationImageSrc('javascript:alert(1)', onSrc);
    subscribeAccountNotificationImageSrc('ipfs://bafy', onSrc);

    expect(onSrc.mock.calls).toEqual([
      [OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL],
      [OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL],
      [OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL]
    ]);
  });

  it('swaps to the remote image after it loads', () => {
    installImageStub(
      class {
        onload: EmptyFn | null = null;
        set src(_url: string) {
          this.onload?.();
        }
      }
    );

    const onSrc = jest.fn();
    subscribeAccountNotificationImageSrc('https://objkt.com/token.png', onSrc);

    expect(onSrc).toHaveBeenLastCalledWith('https://objkt.com/token.png');
  });

  it('does not swap after unsubscribe', () => {
    let triggerLoad: EmptyFn | undefined;
    installImageStub(
      class {
        onload: EmptyFn | null = null;
        set src(_url: string) {
          triggerLoad = () => this.onload?.();
        }
      }
    );

    const onSrc = jest.fn();
    const unsubscribe = subscribeAccountNotificationImageSrc('https://objkt.com/token.png', onSrc);
    unsubscribe();
    triggerLoad?.();

    expect(onSrc).toHaveBeenCalledTimes(1);
    expect(onSrc).toHaveBeenCalledWith(OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL);
  });

  it('binds the fallback to an image element while the remote url loads', () => {
    installImageStub(
      class {
        onload: EmptyFn | null = null;
        src = '';
      }
    );

    const image = document.createElement('img');
    bindAccountNotificationImage(image, 'https://objkt.com/token.png');

    expect(image.src).toContain('objkt-notification-fallback.svg');
  });
});
