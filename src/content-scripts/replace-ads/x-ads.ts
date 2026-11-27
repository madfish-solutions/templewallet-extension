import { buildNativeAdsMeta } from 'lib/ads/configure-ads';
import { importExtensionAdsModule } from 'lib/ads/import-extension-ads-module';

type AdsModule = Awaited<ReturnType<typeof importExtensionAdsModule>>;

export const X_ADS_DOMAINS = ['x.com', 'twitter.com'];

const PROMOTED_TWEET_SELECTOR =
  '[data-testid="cellInnerDiv"] [data-testid$="impression-pixel"] + article[data-testid="tweet"]';
const FONT_SAMPLE_SELECTOR = 'nav[role="navigation"] [role="tablist"] span, nav[role="navigation"] [role="tablist"] p';

interface XAdPlacement {
  original: HTMLElement;
  mount: HTMLElement;
  dispose: () => void;
}

const placements = new Map<HTMLElement, XAdPlacement>();
let attempted = new WeakSet<HTMLElement>();

const isPlacementCurrent = (tweet: HTMLElement, mount: HTMLElement, original: HTMLElement): boolean =>
  tweet.isConnected &&
  tweet.matches(PROMOTED_TWEET_SELECTOR) &&
  tweet.firstElementChild === mount &&
  mount.nextElementSibling === original;

export const isXAdsHost = (hostname: string): boolean => X_ADS_DOMAINS.includes(hostname.replace(/^www\./, ''));

export const restoreXAds = (): void => {
  for (const placement of placements.values()) placement.dispose();
  attempted = new WeakSet();
};

export const replaceXAds = async (
  { AdActionType, executeAdsActions }: AdsModule,
  href: string
): Promise<PromiseSettledResult<void>[]> => {
  for (const [tweet, placement] of placements) {
    if (!isPlacementCurrent(tweet, placement.mount, placement.original)) placement.dispose();
  }

  const results = await Promise.all(
    Array.from(document.querySelectorAll<HTMLElement>(PROMOTED_TWEET_SELECTOR), async tweet => {
      const original = tweet.firstElementChild;
      if (placements.has(tweet) || !(original instanceof HTMLElement) || original.hasAttribute('twa')) return [];
      if (attempted.has(original)) return [];

      const { width, height } = (tweet.children.length === 1 ? tweet : original).getBoundingClientRect();
      if (width < 2 || height < 2) return [];
      const adsMetadata = buildNativeAdsMeta(width, height, href).filter(
        ({ source }) => source.providerName === 'HypeLab' && source.native && source.slug
      );
      if (!adsMetadata.length) return [];

      const mount = document.createElement('div');
      mount.setAttribute('twa', 'true');
      mount.style.display = 'contents';
      let restoreOriginal: (() => void) | undefined;
      const observer = new MutationObserver(() => {
        if (!isPlacementCurrent(tweet, mount, original)) dispose();
      });
      const dispose = () => {
        if (placements.get(tweet)?.mount !== mount) return;
        observer.disconnect();
        placements.delete(tweet);
        mount.remove();
        restoreOriginal?.();
      };
      const stop = () => {
        if (placements.get(tweet)?.mount !== mount) return;
        attempted.add(original);
        dispose();
      };

      placements.set(tweet, { original, mount, dispose });
      observer.observe(tweet, { childList: true });
      tweet.insertBefore(mount, original);
      const results = await executeAdsActions(
        [
          {
            type: AdActionType.SimpleInsertAd,
            parent: mount,
            insertionIndex: 0,
            isSiblingReplacement: false,
            wrapperStyle: { display: 'contents' },
            supportsTheming: true,
            fontSampleSelector: FONT_SAMPLE_SELECTOR,
            adsMetadata,
            adCategories: ['crypto'],
            originalWidth: width,
            originalHeight: height
          }
        ],
        {
          onAdLoad: () => {
            if (placements.get(tweet)?.mount !== mount || restoreOriginal) return;
            if (window.location.href !== href || !isPlacementCurrent(tweet, mount, original)) {
              dispose();
              return;
            }
            const display = original.style.getPropertyValue('display');
            const priority = original.style.getPropertyPriority('display');
            original.style.setProperty('display', 'none', 'important');
            restoreOriginal = () => {
              if (
                original.style.getPropertyValue('display') === 'none' &&
                original.style.getPropertyPriority('display') === 'important'
              ) {
                if (display) original.style.setProperty('display', display, priority);
                else original.style.removeProperty('display');
              }
            };
          },
          onAdError: stop,
          onClose: stop
        }
      ).catch((reason: unknown): PromiseSettledResult<void>[] => [{ status: 'rejected', reason }]);
      if (results.some(result => result.status === 'rejected')) stop();
      return results;
    })
  );
  return results.flat();
};
