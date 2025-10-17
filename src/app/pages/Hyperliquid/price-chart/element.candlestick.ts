import { defaults } from 'chart.js';
import { AnyObject } from 'chart.js/dist/types/basic';
import { valueOrDefault } from 'chart.js/helpers';

import { FinancialElement } from './element.financial';

export class CandlestickElement extends FinancialElement {
  constructor(cfg: AnyObject) {
    super(cfg);

    this.draw = this.draw.bind(this);
  }

  static id = 'candlestick';

  static defaults = {
    ...FinancialElement.defaults,
    borderWidth: 1
  };

  draw(ctx: any) {
    // @ts-expect-error
    const { x, open, high, low, close } = this;

    // @ts-expect-error
    let borderColors = this.options.borderColors;
    if (typeof borderColors === 'string') {
      borderColors = {
        up: borderColors,
        down: borderColors,
        unchanged: borderColors
      };
    }

    let borderColor;
    if (close < open) {
      borderColor = valueOrDefault(
        borderColors ? borderColors.up : undefined,
        // @ts-expect-error
        defaults.elements.candlestick.borderColors.up
      );
      ctx.fillStyle = valueOrDefault(
        // @ts-expect-error
        this.options.backgroundColors ? this.options.backgroundColors.up : undefined,
        // @ts-expect-error
        defaults.elements.candlestick.backgroundColors.up
      );
    } else if (close > open) {
      borderColor = valueOrDefault(
        borderColors ? borderColors.down : undefined,
        // @ts-expect-error
        defaults.elements.candlestick.borderColors.down
      );
      ctx.fillStyle = valueOrDefault(
        // @ts-expect-error
        this.options.backgroundColors ? this.options.backgroundColors.down : undefined,
        // @ts-expect-error
        defaults.elements.candlestick.backgroundColors.down
      );
    } else {
      borderColor = valueOrDefault(
        borderColors ? borderColors.unchanged : undefined,
        // @ts-expect-error
        defaults.elements.candlestick.borderColors.unchanged
      );
      ctx.fillStyle = valueOrDefault(
        // @ts-expect-error
        this.backgroundColors ? this.backgroundColors.unchanged : undefined,
        // @ts-expect-error
        defaults.elements.candlestick.backgroundColors.unchanged
      );
    }

    // @ts-expect-error
    ctx.lineWidth = valueOrDefault(this.options.borderWidth, defaults.elements.candlestick.borderWidth);
    ctx.strokeStyle = borderColor;

    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, Math.min(open, close));
    ctx.moveTo(x, low);
    ctx.lineTo(x, Math.max(open, close));
    ctx.stroke();
    // @ts-expect-error
    ctx.fillRect(x - this.width / 2, close, this.width, open - close);
    // @ts-expect-error
    ctx.strokeRect(x - this.width / 2, close, this.width, open - close);
    ctx.closePath();
  }
}
