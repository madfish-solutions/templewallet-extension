import type { AdsRules } from 'lib/ads/get-rules-content-script';
import { delay } from 'lib/utils';

import { AddActionsIfAdResolutionAvailable, applyQuerySelector, getFinalSize, pickAdToDisplay } from './helpers';
import { processPermanentAdPlacesRule } from './process-permanent-rule';
import { processAdPlacesRule } from './process-rule';
import {
  AdAction,
  AdActionType,
  HideElementAction,
  InsertAdActionWithoutMeta,
  OmitAdMeta,
  RemoveElementAction,
  ReplaceElementWithAdAction
} from './types';

export { AdActionType };

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
