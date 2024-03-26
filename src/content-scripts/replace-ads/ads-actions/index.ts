import { delay } from 'lib/utils';

import type { AdsRules } from '../ads-rules';

import { AddActionsIfAdResolutionAvailable, applyQuerySelector, getFinalSize, pickAdsToDisplay } from './helpers';
import { processPermanentAdPlacesRule } from './process-permanent-rule';
import { processAdPlacesRule } from './process-rule';
import {
  AdAction,
  AdActionType,
  HideElementAction,
  InsertAdActionWithoutMeta,
  OmitAdInAction,
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
    const stack = pickAdsToDisplay(
      width,
      height,
      shouldUseStrictContainerLimits,
      minContainerWidthIsBannerWidth,
      adIsNative
    );

    if (!stack.length) return false;

    result.push(
      ...actionsBases.map<AdAction>(actionBase =>
        actionBase.type === AdActionType.HideElement || actionBase.type === AdActionType.RemoveElement
          ? actionBase
          : { ...actionBase, ad: stack[0]!, fallbacks: stack.slice(1) }
      )
    );

    return true;
  };

  let permanentAdsParents: HTMLElement[] = [];

  /*
    Asynchronizing processing to free-up the thread on heavyish work here.
    'Parallelizing' it (through `Promise.all`) to fill-up Event Loop right away.
    Otherwise (with `for` loop), original ads start glitching through more.
  */

  await Promise.all(
    permanentAdPlacesRules.map(async rule => {
      await delay(0);

      permanentAdsParents = permanentAdsParents.concat(
        await processPermanentAdPlacesRule(rule, addActionsIfAdResolutionAvailable, result)
      );
    })
  );

  await Promise.all(
    adPlacesRules.map(async rule => {
      await delay(0);

      await processAdPlacesRule(rule, permanentAdsParents, addActionsIfAdResolutionAvailable);
    })
  );

  const bannersFromProviders = applyQuerySelector(providersSelector, true);

  for (const banner of bannersFromProviders) {
    if (permanentAdsParents.some(parent => parent.contains(banner))) continue;

    const actionBase: OmitAdInAction<ReplaceElementWithAdAction> = {
      type: AdActionType.ReplaceElement,
      element: banner as HTMLElement,
      shouldUseDivWrapper: false
    };

    const elementToMeasure =
      banner.parentElement?.closest<HTMLElement>('div, article, aside, footer, header') ??
      banner.parentElement ??
      banner;

    addActionsIfAdResolutionAvailable(elementToMeasure, true, false, false, actionBase);
  }

  return result;
};
