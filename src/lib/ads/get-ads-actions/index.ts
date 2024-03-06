import type { AdsRules, PermanentAdPlacesRule } from 'lib/ads/get-rules-content-script';
import { TEMPLE_WALLET_AD_ATTRIBUTE_NAME } from 'lib/constants';
import { delay, isTruthy } from 'lib/utils';

import { applyQuerySelector, getFinalSize, getParentOfDepth, pickAdToDisplay } from './helpers';
import {
  AdAction,
  AdActionType,
  HideElementAction,
  InsertAdActionWithoutMeta,
  OmitAdMeta,
  RemoveElementAction,
  ReplaceAllChildrenWithAdAction,
  ReplaceElementWithAdAction,
  SimpleInsertAdAction
} from './types';

export { AdActionType };

const ourAdQuerySelector = `iframe[${TEMPLE_WALLET_AD_ATTRIBUTE_NAME}], div[${TEMPLE_WALLET_AD_ATTRIBUTE_NAME}], \
ins[${TEMPLE_WALLET_AD_ATTRIBUTE_NAME}]`;

const elementIsOurAd = (element: HTMLElement) => {
  const tagName = element.tagName.toLowerCase();

  return (
    (tagName === 'iframe' || tagName === 'div' || tagName === 'ins') &&
    element.hasAttribute(TEMPLE_WALLET_AD_ATTRIBUTE_NAME)
  );
};

type AddActionsIfAdResolutionAvailable = (
  elementToMeasure: Element,
  shouldUseStrictContainerLimits: boolean,
  minContainerWidthIsBannerWidth: boolean,
  adIsNative: boolean,
  ...actionsBases: (InsertAdActionWithoutMeta | HideElementAction | RemoveElementAction)[]
) => boolean;

export const getAdsActions = async ({ providersSelector, adPlacesRules, permanentAdPlacesRules }: AdsRules) => {
  const result: AdAction[] = [];

  const addActionsIfAdResolutionAvailable: AddActionsIfAdResolutionAvailable = (
    elementToMeasure: Element,
    shouldUseStrictContainerLimits: boolean,
    minContainerWidthIsBannerWidth: boolean,
    adIsNative: boolean,
    ...actionsBases: (InsertAdActionWithoutMeta | HideElementAction | RemoveElementAction)[]
  ): boolean => {
    const { width, height } = getFinalSize(elementToMeasure);
    const meta = pickAdToDisplay(
      width,
      height,
      shouldUseStrictContainerLimits,
      minContainerWidthIsBannerWidth,
      adIsNative
    );

    if (!meta) return false;
    const { source, dimensions } = meta;

    result.push(
      ...actionsBases.map<AdAction>(actionBase =>
        actionBase.type === AdActionType.HideElement || actionBase.type === AdActionType.RemoveElement
          ? actionBase
          : { ...actionBase, source, dimensions }
      )
    );

    return true;
  };

  let permanentAdsParents: HTMLElement[] = [];

  for (const rule of permanentAdPlacesRules) {
    await delay(0);

    permanentAdsParents = permanentAdsParents.concat(
      await processPermanentAdPlacesRule(rule, addActionsIfAdResolutionAvailable, result)
    );
  }

  for (const rule of adPlacesRules) {
    await delay(0);

    await processAdPlacesRule(rule, permanentAdsParents, addActionsIfAdResolutionAvailable);
  }

  const bannersFromProviders = applyQuerySelector(providersSelector, true);
  bannersFromProviders.forEach(banner => {
    const elementToMeasure =
      banner.parentElement?.closest<HTMLElement>('div, article, aside, footer, header') ??
      banner.parentElement ??
      banner;

    if (!permanentAdsParents.some(parent => parent.contains(banner))) {
      const actionBase: OmitAdMeta<ReplaceElementWithAdAction> = {
        type: AdActionType.ReplaceElement,
        element: banner as HTMLElement,
        shouldUseDivWrapper: false
      };
      addActionsIfAdResolutionAvailable(elementToMeasure, true, false, false, actionBase);
    }
  });

  return result;
};

const processPermanentAdPlacesRule = async (
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

  for (const parent of parents) {
    await delay(0);

    processPermanentAdsParent(parent, rule, addActionsIfAdResolutionAvailable, result);
  }

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
      const replaceActionBase: OmitAdMeta<ReplaceElementWithAdAction> = {
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
      const insertActionBase: OmitAdMeta<SimpleInsertAdAction> = {
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
    const actionBase: OmitAdMeta<SimpleInsertAdAction> = {
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

const processAdPlacesRule = async (
  rule: AdsRules['adPlacesRules'][number],
  permanentAdsParents: HTMLElement[],
  addActionsIfAdResolutionAvailable: AddActionsIfAdResolutionAvailable
) => {
  const { cssString, isMultiple } = rule.selector;

  const selectedElements = applyQuerySelector<HTMLElement>(cssString, isMultiple);

  for (const selectedElement of selectedElements) {
    await delay(0);

    processSelectedElement(selectedElement, rule, permanentAdsParents, addActionsIfAdResolutionAvailable);
  }
};

const processSelectedElement = (
  selectedElement: HTMLElement,
  rule: AdsRules['adPlacesRules'][number],
  permanentAdsParents: HTMLElement[],
  addActionsIfAdResolutionAvailable: AddActionsIfAdResolutionAvailable
) => {
  const {
    selector: { shouldUseDivWrapper, parentDepth, divWrapperStyle },
    stylesOverrides,
    shouldHideOriginal
  } = rule;

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

  let actionsBases: (InsertAdActionWithoutMeta | HideElementAction | RemoveElementAction)[];
  if (shouldUseDivWrapper && shouldHideOriginal) {
    const parent = banner.parentElement!;
    const insertAdAction: OmitAdMeta<SimpleInsertAdAction> = {
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
    const replaceElementActionBase: OmitAdMeta<ReplaceElementWithAdAction> = {
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
    const insertAdAction: OmitAdMeta<SimpleInsertAdAction> = {
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
    const replaceAllChildrenActionBase: OmitAdMeta<ReplaceAllChildrenWithAdAction> = {
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
};
