import type { AdsRules } from 'lib/ads/get-rules-content-script';
import { TEMPLE_WALLET_AD_ATTRIBUTE_NAME } from 'lib/constants';

import { applyQuerySelector, getFinalSize, getParentOfDepth, pickAdResolution } from './helpers';
import {
  AdAction,
  AdActionType,
  HideElementAction,
  InsertAdAction,
  RemoveElementAction,
  ReplaceAllChildrenWithAdAction,
  ReplaceElementWithAdAction,
  SimpleInsertAdAction
} from './types';

const ourAdQuerySelector = `iframe[${TEMPLE_WALLET_AD_ATTRIBUTE_NAME}], div[${TEMPLE_WALLET_AD_ATTRIBUTE_NAME}], \
ins[${TEMPLE_WALLET_AD_ATTRIBUTE_NAME}]`;

const elementIsOurAd = (element: HTMLElement) => {
  const tagName = element.tagName.toLowerCase();

  return (
    (tagName === 'iframe' || tagName === 'div' || tagName === 'ins') &&
    element.hasAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME)
  );
};

const forEachWithTimeoutInterruptions = <A>(array: A[], fn: (value: A) => void | Promise<void>) =>
  Promise.all(
    array.map(async value => {
      await new Promise(resolve => setTimeout(resolve, 0));

      await fn(value);
    })
  );

export const getAdsActions = async ({ providersSelector, adPlacesRules, permanentAdPlacesRules }: AdsRules) => {
  const result: AdAction[] = [];
  const addActionsIfAdResolutionAvailable = (
    elementToMeasure: Element,
    shouldUseStrictContainerLimits: boolean,
    minContainerWidthIsBannerWidth: boolean,
    adIsNative: boolean,
    ...actionsBases: Array<Omit<InsertAdAction, 'adResolution'> | HideElementAction | RemoveElementAction>
  ) => {
    const { width, height } = getFinalSize(elementToMeasure);
    const adResolution = pickAdResolution(
      width,
      height,
      shouldUseStrictContainerLimits,
      minContainerWidthIsBannerWidth,
      adIsNative
    );

    if (adResolution) {
      result.push(
        ...actionsBases.map(actionBase =>
          actionBase.type === AdActionType.HideElement || actionBase.type === AdActionType.RemoveElement
            ? actionBase
            : ({ ...actionBase, adResolution } as InsertAdAction)
        )
      );

      return true;
    }

    return false;
  };

  let permanentAdsParents: HTMLElement[] = [];
  await forEachWithTimeoutInterruptions(
    permanentAdPlacesRules,
    async ({
      shouldUseDivWrapper,
      divWrapperStyle,
      elementStyle,
      adSelector,
      parentSelector,
      insertionIndex,
      insertBeforeSelector,
      insertAfterSelector,
      insertionsCount = 1,
      elementToMeasureSelector,
      stylesOverrides,
      shouldHideOriginal = false,
      isNative
    }) => {
      const {
        isMultiple: shouldSearchForManyBannersInParent,
        cssString: bannerCssString,
        parentDepth: bannerParentDepth
      } = adSelector;
      const {
        isMultiple: shouldSearchForManyParents,
        cssString: parentCssString,
        parentDepth: parentParentDepth
      } = parentSelector;
      const parents = applyQuerySelector<HTMLElement>(parentCssString, shouldSearchForManyParents)
        .map(element => getParentOfDepth(element, parentParentDepth))
        .filter((value): value is HTMLElement => Boolean(value));
      permanentAdsParents = permanentAdsParents.concat(parents);
      await forEachWithTimeoutInterruptions(parents, parent => {
        const ourAds = applyQuerySelector(ourAdQuerySelector, true, parent).reduce<Element[]>((acc, element) => {
          if (acc.some(prevElement => prevElement.contains(element) || element.contains(prevElement))) {
            return acc;
          }

          return [...acc, element];
        }, []);
        const ourAdsCount = ourAds.length;
        let insertionsLeft = insertionsCount - ourAdsCount;

        const banners = applyQuerySelector<HTMLElement>(bannerCssString, shouldSearchForManyBannersInParent, parent)
          .map(element => getParentOfDepth(element, bannerParentDepth))
          .filter((value): value is HTMLElement => Boolean(value))
          .filter(element => !elementIsOurAd(element));
        banners.forEach(banner => {
          if (insertionsLeft <= 0) {
            const { display: bannerDisplay } = window.getComputedStyle(banner);
            if (!shouldHideOriginal || bannerDisplay !== 'none') {
              result.push({
                type: shouldHideOriginal ? AdActionType.HideElement : AdActionType.RemoveElement,
                element: banner
              });
            }
          } else {
            let elementToMeasure = banner.parentElement?.children.length === 1 ? banner.parentElement : banner;
            if (elementToMeasureSelector) {
              elementToMeasure = document.querySelector(elementToMeasureSelector) ?? elementToMeasure;
            }
            const replaceActionBase: Omit<ReplaceElementWithAdAction, 'adResolution'> = {
              type: AdActionType.ReplaceElement,
              element: banner,
              shouldUseDivWrapper,
              divWrapperStyle,
              elementStyle,
              stylesOverrides
            };
            const hideActionBase: HideElementAction = {
              type: AdActionType.HideElement,
              element: banner
            };
            const insertActionBase: Omit<SimpleInsertAdAction, 'adResolution'> = {
              type: AdActionType.SimpleInsertAd,
              shouldUseDivWrapper,
              divWrapperStyle,
              elementStyle,
              parent: banner.parentElement!,
              insertionIndex: Array.from(banner.parentElement!.children).indexOf(banner),
              stylesOverrides
            };
            const nextBannerSibling = banner.nextElementSibling;
            const nextBannerSiblingIsOurAd = nextBannerSibling && elementIsOurAd(nextBannerSibling as HTMLElement);
            const actionsToInsert = shouldHideOriginal
              ? nextBannerSiblingIsOurAd
                ? []
                : [hideActionBase, insertActionBase]
              : [replaceActionBase];
            if (
              actionsToInsert.length > 0 &&
              addActionsIfAdResolutionAvailable(elementToMeasure, false, true, isNative, ...actionsToInsert)
            ) {
              insertionsLeft--;
            }
          }
        });

        if (insertionsLeft <= 0) {
          return;
        }

        let normalizedInsertionIndex = -1;
        let insertionParentElement = parent;
        let elementToMeasure = parent;
        const insertAnchorSelector = insertBeforeSelector || insertAfterSelector;
        if (insertAnchorSelector) {
          const insertAnchorElement = parent.querySelector(insertAnchorSelector);
          const newInsertionParentElement = insertAnchorElement?.parentElement;

          if (insertAnchorElement && newInsertionParentElement) {
            insertionParentElement = newInsertionParentElement;
            normalizedInsertionIndex =
              Array.from(parent.children).indexOf(insertAnchorElement) + (insertBeforeSelector ? 0 : 1);
            elementToMeasure =
              (elementToMeasureSelector && document.querySelector(elementToMeasureSelector)) ||
              (insertAnchorElement as HTMLElement);
          }
        } else {
          const insertionIndexWithDefault = insertionIndex ?? 0;
          normalizedInsertionIndex =
            insertionIndexWithDefault < 0
              ? Math.max(parent.children.length + insertionIndexWithDefault, 0)
              : Math.min(insertionIndexWithDefault, parent.children.length);
          elementToMeasure =
            (elementToMeasureSelector && document.querySelector(elementToMeasureSelector)) ||
            ((parent.children[normalizedInsertionIndex] as HTMLElement | undefined) ?? parent);
        }

        if (normalizedInsertionIndex !== -1) {
          const actionBase: Omit<SimpleInsertAdAction, 'adResolution'> = {
            type: AdActionType.SimpleInsertAd,
            shouldUseDivWrapper,
            divWrapperStyle,
            elementStyle,
            parent: insertionParentElement,
            insertionIndex: normalizedInsertionIndex,
            stylesOverrides
          };

          addActionsIfAdResolutionAvailable(
            elementToMeasure,
            false,
            true,
            isNative,
            ...Array<typeof actionBase>(insertionsLeft).fill(actionBase)
          );
        }
      });
    }
  );

  await forEachWithTimeoutInterruptions(adPlacesRules, async ({ selector, stylesOverrides, shouldHideOriginal }) => {
    const { cssString, shouldUseDivWrapper, isMultiple, parentDepth, divWrapperStyle } = selector;
    const selectedElements = applyQuerySelector<HTMLElement>(cssString, isMultiple);

    await forEachWithTimeoutInterruptions(selectedElements, selectedElement => {
      const banner = getParentOfDepth(selectedElement, parentDepth);

      if (
        !banner ||
        permanentAdsParents.some(parent => parent.contains(banner)) ||
        elementIsOurAd(banner) ||
        banner.querySelector(ourAdQuerySelector)
      ) {
        return;
      }

      const actionBaseCommonProps = {
        shouldUseDivWrapper,
        divWrapperStyle
      };

      let actionsBases: Array<Omit<InsertAdAction, 'adResolution'> | HideElementAction | RemoveElementAction>;
      if (shouldUseDivWrapper && shouldHideOriginal) {
        const parent = banner.parentElement!;
        const insertAdAction: Omit<SimpleInsertAdAction, 'adResolution'> = {
          type: AdActionType.SimpleInsertAd,
          parent,
          insertionIndex: Array.from(parent.children).indexOf(banner),
          stylesOverrides: stylesOverrides?.map(({ parentDepth, ...restProps }) => ({
            ...restProps,
            parentDepth: parentDepth - 1
          })),
          ...actionBaseCommonProps
        };

        actionsBases = [];
        if (window.getComputedStyle(banner).display !== 'none') {
          actionsBases.push({ type: AdActionType.HideElement, element: banner });
        }
        if (!parent.querySelector(ourAdQuerySelector)) {
          actionsBases.push(insertAdAction);
        }
      } else if (shouldUseDivWrapper) {
        const replaceElementActionBase: Omit<ReplaceElementWithAdAction, 'adResolution'> = {
          type: AdActionType.ReplaceElement,
          element: banner,
          stylesOverrides: stylesOverrides?.map(({ parentDepth, ...restProps }) => ({
            ...restProps,
            parentDepth: parentDepth - 1
          })),
          ...actionBaseCommonProps
        };
        actionsBases = [replaceElementActionBase];
      } else if (shouldHideOriginal) {
        const insertAdAction: Omit<SimpleInsertAdAction, 'adResolution'> = {
          type: AdActionType.SimpleInsertAd,
          parent: banner,
          insertionIndex: 0,
          stylesOverrides,
          ...actionBaseCommonProps
        };

        actionsBases = Array.from(banner.children)
          .filter(child => window.getComputedStyle(child).display !== 'none')
          .map((child): HideElementAction => ({ type: AdActionType.HideElement, element: child as HTMLElement }));
        if (!banner.querySelector(ourAdQuerySelector)) {
          actionsBases.push(insertAdAction);
        }
      } else {
        const replaceAllChildrenActionBase: Omit<ReplaceAllChildrenWithAdAction, 'adResolution'> = {
          type: AdActionType.ReplaceAllChildren,
          parent: banner,
          stylesOverrides,
          ...actionBaseCommonProps
        };
        actionsBases = [replaceAllChildrenActionBase];
      }

      if (actionsBases.length > 0) {
        addActionsIfAdResolutionAvailable(banner, false, false, false, ...actionsBases);
      }
    });
  });

  const bannersFromProviders = applyQuerySelector(providersSelector, true);
  bannersFromProviders.forEach(banner => {
    const elementToMeasure =
      banner.parentElement?.closest<HTMLElement>('div, article, aside, footer, header') ??
      banner.parentElement ??
      banner;

    if (!permanentAdsParents.some(parent => parent.contains(banner))) {
      const actionBase: Omit<ReplaceElementWithAdAction, 'adResolution'> = {
        type: AdActionType.ReplaceElement,
        element: banner as HTMLElement,
        shouldUseDivWrapper: false
      };
      addActionsIfAdResolutionAvailable(elementToMeasure, true, false, false, actionBase);
    }
  });

  return result;
};
