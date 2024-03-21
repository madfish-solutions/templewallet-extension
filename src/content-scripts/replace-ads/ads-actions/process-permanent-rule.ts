import { delay, isTruthy } from 'lib/utils';

import type { PermanentAdPlacesRule } from '../ads-rules';

import {
  AddActionsIfAdResolutionAvailable,
  applyQuerySelector,
  elementIsOurAd,
  getParentOfDepth,
  ourAdQuerySelector
} from './helpers';
import {
  AdAction,
  AdActionType,
  HideElementAction,
  OmitAdInAction,
  ReplaceElementWithAdAction,
  SimpleInsertAdAction
} from './types';

export const processPermanentAdPlacesRule = async (
  rule: PermanentAdPlacesRule,
  addActionsIfAdResolutionAvailable: AddActionsIfAdResolutionAvailable,
  result: AdAction[]
) => {
  const {
    isMultiple: shouldSearchForManyParents,
    cssString: parentCssString,
    parentDepth: parentParentDepth
  } = rule.parentSelector;

  const parents = applyQuerySelector<HTMLElement>(parentCssString, shouldSearchForManyParents)
    .map(element => getParentOfDepth(element, parentParentDepth))
    .filter((value): value is HTMLElement => Boolean(value));

  await Promise.all(
    parents.map(async parent => {
      await delay(0);

      processPermanentAdsParent(parent, rule, addActionsIfAdResolutionAvailable, result);
    })
  );

  return parents;
};

const processPermanentAdsParent = (
  parent: HTMLElement,
  rule: PermanentAdPlacesRule,
  addActionsIfAdResolutionAvailable: AddActionsIfAdResolutionAvailable,
  result: AdAction[]
) => {
  const {
    shouldUseDivWrapper,
    divWrapperStyle,
    elementStyle,
    adSelector,
    insertionIndex,
    insertBeforeSelector,
    insertAfterSelector,
    insertionsCount = 1,
    elementToMeasureSelector,
    stylesOverrides,
    shouldHideOriginal = false,
    isNative
  } = rule;

  const {
    isMultiple: shouldSearchForManyBannersInParent,
    cssString: bannerCssString,
    parentDepth: bannerParentDepth
  } = adSelector;

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
    .filter((value): value is HTMLElement => isTruthy(value) && !elementIsOurAd(value));

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
      const replaceActionBase: OmitAdInAction<ReplaceElementWithAdAction> = {
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
      const insertActionBase: OmitAdInAction<SimpleInsertAdAction> = {
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
    const actionBase: OmitAdInAction<SimpleInsertAdAction> = {
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
};
