import { delay } from 'lib/utils';

import type { AdsRules } from '../ads-rules';

import {
  AddActionsIfAdResolutionAvailable,
  applyQuerySelector,
  elementIsOurAd,
  getParentOfDepth,
  ourAdQuerySelector
} from './helpers';
import {
  AdActionType,
  HideElementAction,
  InsertAdActionWithoutMeta,
  OmitAdInAction,
  RemoveElementAction,
  ReplaceAllChildrenWithAdAction,
  ReplaceElementWithAdAction,
  SimpleInsertAdAction
} from './types';

export const processAdPlacesRule = async (
  rule: AdsRules['adPlacesRules'][number],
  permanentAdsParents: HTMLElement[],
  addActionsIfAdResolutionAvailable: AddActionsIfAdResolutionAvailable
) => {
  const { cssString, isMultiple } = rule.selector;

  const selectedElements = applyQuerySelector<HTMLElement>(cssString, isMultiple);

  await Promise.all(
    selectedElements.map(async selectedElement => {
      await delay(0);

      processSelectedElement(selectedElement, rule, permanentAdsParents, addActionsIfAdResolutionAvailable);
    })
  );
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
    const insertAdAction: OmitAdInAction<SimpleInsertAdAction> = {
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
    const replaceElementActionBase: OmitAdInAction<ReplaceElementWithAdAction> = {
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
    const insertAdAction: OmitAdInAction<SimpleInsertAdAction> = {
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
    const replaceAllChildrenActionBase: OmitAdInAction<ReplaceAllChildrenWithAdAction> = {
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
