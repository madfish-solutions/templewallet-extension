import { SLISE_PUBLISHER_ID } from 'lib/constants';
import type { SliseAdsRules } from 'lib/slise/get-rules-content-script';

import { applyQuerySelector, getFinalSize, getParentOfDepth, pickAdRect } from './helpers';
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

const sliseAdQuerySelector = `ins.adsbyslise[data-ad-pub="${SLISE_PUBLISHER_ID}"]`;

const elementIsOurSliseAd = (element: HTMLElement) =>
  (element.className.includes('adsbyslise') && element.getAttribute('data-ad-pub') === SLISE_PUBLISHER_ID) ||
  element.getAttribute('slise-ad-container');

export const getAdsActions = async ({ providersSelector, adPlacesRules, permanentAdPlacesRules }: SliseAdsRules) => {
  const result: AdAction[] = [];
  const addActionsIfAdRectAvailable = (
    elementToMeasure: Element,
    shouldUseStrictContainerLimits: boolean,
    minContainerWidthIsBannerWidth: boolean,
    ...actionsBases: Array<Omit<InsertAdAction, 'adRect'> | HideElementAction | RemoveElementAction>
  ) => {
    const { width, height } = getFinalSize(elementToMeasure);
    const adRect = pickAdRect(width, height, shouldUseStrictContainerLimits, minContainerWidthIsBannerWidth);

    if (adRect) {
      result.push(
        ...actionsBases.map(actionBase =>
          actionBase.type === AdActionType.HideElement || actionBase.type === AdActionType.RemoveElement
            ? actionBase
            : ({ ...actionBase, adRect } as InsertAdAction)
        )
      );

      return true;
    }

    return false;
  };

  let permanentAdsParents: HTMLElement[] = [];
  await Promise.all(
    permanentAdPlacesRules.map(
      async ({
        shouldUseDivWrapper,
        divWrapperStyle,
        adSelector,
        parentSelector,
        insertionIndex,
        insertBeforeSelector,
        insertAfterSelector,
        insertionsCount = 1,
        elementToMeasureSelector,
        stylesOverrides,
        shouldHideOriginal = false
      }) => {
        await new Promise(resolve => setTimeout(resolve, 0));
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
        await Promise.all(
          parents.map(async parent => {
            await new Promise(resolve => setTimeout(resolve, 0));
            const sliseAdsCount = applyQuerySelector(`ins.adsbyslise`, true, parent).length;
            let insertionsLeft = insertionsCount - sliseAdsCount;

            const banners = applyQuerySelector<HTMLElement>(bannerCssString, shouldSearchForManyBannersInParent, parent)
              .map(element => getParentOfDepth(element, bannerParentDepth))
              .filter((value): value is HTMLElement => Boolean(value));
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
                const replaceActionBase: Omit<ReplaceElementWithAdAction, 'adRect'> = {
                  type: AdActionType.ReplaceElement,
                  element: banner,
                  shouldUseDivWrapper,
                  divWrapperStyle,
                  stylesOverrides
                };
                const hideActionBase: HideElementAction = {
                  type: AdActionType.HideElement,
                  element: banner
                };
                const insertActionBase: Omit<SimpleInsertAdAction, 'adRect'> = {
                  type: AdActionType.SimpleInsertAd,
                  shouldUseDivWrapper,
                  divWrapperStyle,
                  parent: banner.parentElement!,
                  insertionIndex: Array.from(banner.parentElement!.children).indexOf(banner),
                  stylesOverrides
                };
                const nextBannerSibling = banner.nextElementSibling;
                const nextBannerSiblingIsSliseAd =
                  nextBannerSibling?.tagName.toLowerCase() === 'ins' &&
                  nextBannerSibling.getAttribute('data-ad-pub') === SLISE_PUBLISHER_ID;
                const actionsToInsert = shouldHideOriginal
                  ? nextBannerSiblingIsSliseAd
                    ? []
                    : [hideActionBase, insertActionBase]
                  : [replaceActionBase];
                if (
                  actionsToInsert.length > 0 &&
                  addActionsIfAdRectAvailable(elementToMeasure, false, true, ...actionsToInsert)
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
              const actionBase: Omit<SimpleInsertAdAction, 'adRect'> = {
                type: AdActionType.SimpleInsertAd,
                shouldUseDivWrapper,
                divWrapperStyle,
                parent: insertionParentElement,
                insertionIndex: normalizedInsertionIndex,
                stylesOverrides
              };

              addActionsIfAdRectAvailable(
                elementToMeasure,
                false,
                true,
                ...Array<typeof actionBase>(insertionsLeft).fill(actionBase)
              );
            }
          })
        );
      }
    )
  );

  adPlacesRules.forEach(({ selector, stylesOverrides }) => {
    const { cssString, shouldUseDivWrapper, isMultiple, parentDepth, divWrapperStyle } = selector;
    const selectedElements = applyQuerySelector<HTMLElement>(cssString, isMultiple);

    selectedElements.forEach(selectedElement => {
      const banner = getParentOfDepth(selectedElement, parentDepth);

      if (
        !banner ||
        permanentAdsParents.some(parent => parent.contains(banner)) ||
        elementIsOurSliseAd(banner) ||
        banner.querySelector(sliseAdQuerySelector)
      ) {
        return;
      }

      const actionBaseCommonProps = {
        shouldUseDivWrapper,
        divWrapperStyle
      };
      const replaceElementActionBase: Omit<ReplaceElementWithAdAction, 'adRect'> = {
        type: AdActionType.ReplaceElement,
        element: banner,
        stylesOverrides: stylesOverrides?.map(({ parentDepth, ...restProps }) => ({
          ...restProps,
          parentDepth: parentDepth - 1
        })),
        ...actionBaseCommonProps
      };
      const replaceAllChildrenActionBase: Omit<ReplaceAllChildrenWithAdAction, 'adRect'> = {
        type: AdActionType.ReplaceAllChildren,
        parent: banner,
        stylesOverrides,
        ...actionBaseCommonProps
      };
      const actionBase: Omit<InsertAdAction, 'adRect'> = shouldUseDivWrapper
        ? replaceElementActionBase
        : replaceAllChildrenActionBase;
      addActionsIfAdRectAvailable(banner, false, false, actionBase);
    });
  });

  const bannersFromProviders = applyQuerySelector(providersSelector, true);
  bannersFromProviders.forEach(banner => {
    const elementToMeasure =
      banner.parentElement?.closest<HTMLElement>('div, article, aside, footer, header') ??
      banner.parentElement ??
      banner;

    if (!permanentAdsParents.some(parent => parent.contains(banner))) {
      const actionBase: Omit<ReplaceElementWithAdAction, 'adRect'> = {
        type: AdActionType.ReplaceElement,
        element: banner as HTMLElement,
        shouldUseDivWrapper: false
      };
      addActionsIfAdRectAvailable(elementToMeasure, true, false, actionBase);
    }
  });

  return result;
};
