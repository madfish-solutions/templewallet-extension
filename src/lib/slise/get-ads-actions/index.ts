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

export const getAdsActions = ({ providersSelector, adPlacesRules, permanentAdPlacesRules }: SliseAdsRules) => {
  const result: AdAction[] = [];
  const addActionsIfAdRectAvailable = (
    elementToMeasure: Element,
    shouldUseStrictContainerLimits: boolean,
    minContainerWidthIsBannerWidth: boolean,
    ...actionsBases: Array<Omit<InsertAdAction, 'adRect'> | HideElementAction | RemoveElementAction>
  ) => {
    const { width, height } = getFinalSize(elementToMeasure);
    const adRect = pickAdRect(width, height, shouldUseStrictContainerLimits, minContainerWidthIsBannerWidth);
    console.log('x1', elementToMeasure, shouldUseStrictContainerLimits, width, height, adRect, actionsBases);

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
  permanentAdPlacesRules.forEach(
    ({
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
      console.log('x2', adSelector, parentSelector, parents);
      permanentAdsParents = permanentAdsParents.concat(parents);
      parents.forEach(parent => {
        const sliseAdsCount = applyQuerySelector(
          `ins.adsbyslise[data-ad-pub="${SLISE_PUBLISHER_ID}"]`,
          true,
          parent
        ).length;
        let insertionsLeft = insertionsCount - sliseAdsCount;
        console.log('x3', parent, insertionsCount, sliseAdsCount);

        const banners = applyQuerySelector<HTMLElement>(bannerCssString, shouldSearchForManyBannersInParent, parent)
          .map(element => getParentOfDepth(element, bannerParentDepth))
          .filter((value): value is HTMLElement => Boolean(value));
        console.log('x4', banners);
        banners.forEach(banner => {
          console.log('x5', banner, insertionsLeft);
          // Extra logic for increasing reliability
          if (insertionsLeft <= 0) {
            console.log('x6');
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
            console.log(
              'x7',
              banner.parentElement,
              banner.parentElement?.children,
              elementToMeasureSelector,
              elementToMeasure
            );
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
          console.log('x8');
          return;
        }

        let normalizedInsertionIndex = -1;
        let insertionParentElement = parent;
        let elementToMeasure = parent;
        const insertAnchorSelector = insertBeforeSelector || insertAfterSelector;
        if (insertAnchorSelector) {
          const insertAnchorElement = parent.querySelector(insertAnchorSelector);
          const newInsertionParentElement = insertAnchorElement?.parentElement;
          console.log('x9', insertBeforeSelector, insertAfterSelector, insertAnchorElement, newInsertionParentElement);

          if (insertAnchorElement && newInsertionParentElement) {
            insertionParentElement = newInsertionParentElement;
            normalizedInsertionIndex =
              Array.from(parent.children).indexOf(insertAnchorElement) + (insertBeforeSelector ? 0 : 1);
            elementToMeasure =
              (elementToMeasureSelector && document.querySelector(elementToMeasureSelector)) ||
              (insertAnchorElement as HTMLElement);
            console.log('x10', normalizedInsertionIndex);
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
          console.log('x11', normalizedInsertionIndex, parent.children[normalizedInsertionIndex], elementToMeasure);
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
      });
    }
  );

  adPlacesRules.forEach(({ selector, stylesOverrides }) => {
    const { cssString, shouldUseDivWrapper, isMultiple, parentDepth, divWrapperStyle } = selector;
    const selectedElements = applyQuerySelector<HTMLElement>(cssString, isMultiple);

    selectedElements.forEach(selectedElement => {
      const banner = getParentOfDepth(selectedElement, parentDepth);

      if (!banner || permanentAdsParents.some(parent => parent.contains(banner))) {
        return;
      }

      const actionBaseCommonProps = {
        shouldUseDivWrapper,
        divWrapperStyle,
        stylesOverrides
      };
      const replaceElementActionBase: Omit<ReplaceElementWithAdAction, 'adRect'> = {
        type: AdActionType.ReplaceElement,
        element: banner,
        ...actionBaseCommonProps
      };
      const replaceAllChildrenActionBase: Omit<ReplaceAllChildrenWithAdAction, 'adRect'> = {
        type: AdActionType.ReplaceAllChildren,
        parent: banner,
        ...actionBaseCommonProps
      };
      const actionBase: Omit<InsertAdAction, 'adRect'> = shouldUseDivWrapper
        ? replaceElementActionBase
        : replaceAllChildrenActionBase;
      addActionsIfAdRectAvailable(banner, false, false, actionBase);
    });
  });

  const bannersFromProviders = applyQuerySelector(providersSelector, true);
  console.log('x11', bannersFromProviders);
  bannersFromProviders.forEach(banner => {
    const elementToMeasure =
      banner.parentElement?.closest<HTMLElement>('div, article, aside, footer, header') ??
      banner.parentElement ??
      banner;
    console.log('x12', banner, elementToMeasure);

    if (!permanentAdsParents.some(parent => parent.contains(banner))) {
      console.log('x13');
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
