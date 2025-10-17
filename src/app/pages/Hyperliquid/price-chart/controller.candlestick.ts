import { BarController, Element, UpdateMode } from 'chart.js';
import { AnyObject } from 'chart.js/dist/types/basic';

import { FinancialController } from './controller.financial';
import { CandlestickElement } from './element.candlestick';

export class CandlestickController extends FinancialController {
  static id = 'candlestick';

  static defaults = {
    ...FinancialController.defaults,
    dataElementType: CandlestickElement.id
  };

  static defaultRoutes = BarController.defaultRoutes;

  updateElements(elements: Element<AnyObject, AnyObject>[], start: number, count: number, mode: UpdateMode) {
    const reset = mode === 'reset';
    // @ts-expect-error
    const ruler = this._getRuler();
    // @ts-expect-error
    const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);

    for (let i = start; i < start + count; i++) {
      const options = sharedOptions || this.resolveDataElementOptions(i, mode);

      const baseProperties = this.calculateElementProperties(i, ruler, reset, options);

      if (includeOptions) {
        // @ts-expect-error
        baseProperties.options = options;
      }
      this.updateElement(elements[i], i, baseProperties, mode);
    }
  }
}
