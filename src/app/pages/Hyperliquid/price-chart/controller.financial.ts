import { BarController, Chart, Scale, defaults } from 'chart.js';
import { clipArea, isNullOrUndef, unclipArea } from 'chart.js/helpers';

type PriceChartAxis = 'x' | 'o' | 'h' | 'l' | 'c';

/**
 * This class is based off controller.bar.js from the upstream Chart.js library
 */
export class FinancialController extends BarController {
  constructor(chart: Chart, datasetIndex: number) {
    super(chart, datasetIndex);

    this.getLabelAndValue = this.getLabelAndValue.bind(this);
    this.calculateElementProperties = this.calculateElementProperties.bind(this);
    this.draw = this.draw.bind(this);
  }

  static overrides = {
    label: '',
    parsing: false,
    hover: {
      mode: 'label'
    },
    animations: {
      numbers: {
        type: 'number',
        properties: ['x', 'y', 'base', 'width', 'open', 'high', 'low', 'close']
      }
    },
    scales: {
      x: {
        type: 'timeseries',
        offset: true,
        ticks: {
          major: {
            enabled: true
          },
          source: 'data',
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 75,
          sampleSize: 100
        }
      },
      y: {
        type: 'linear'
      }
    },
    plugins: {
      tooltip: {
        intersect: false,
        mode: 'index',
        callbacks: {
          label(ctx: any) {
            const point = ctx.parsed;

            if (!isNullOrUndef(point.y)) {
              // @ts-expect-error
              return defaults.plugins.tooltip.callbacks.label(ctx);
            }

            const { o, h, l, c } = point;

            return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
          }
        }
      }
    }
  };

  getLabelAndValue(index: number) {
    const parsed = this.getParsed(index) as unknown as Record<PriceChartAxis, number>;
    const axis = this._cachedMeta.iScale!.axis as PriceChartAxis;

    const { o, h, l, c } = parsed;
    const value = `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;

    return {
      label: `${this._cachedMeta.iScale!.getLabelForValue(parsed[axis])}`,
      value
    };
  }

  getUserBounds(scale: Scale) {
    const { min, max, minDefined, maxDefined } = scale.getUserBounds();
    return {
      min: minDefined ? min : Number.NEGATIVE_INFINITY,
      max: maxDefined ? max : Number.POSITIVE_INFINITY
    };
  }

  /**
   * Implement this ourselves since it doesn't handle high and low values
   * https://github.com/chartjs/Chart.js/issues/7328
   */
  protected getMinMax(scale: Scale) {
    const meta = this._cachedMeta;
    const _parsed = meta._parsed as Record<PriceChartAxis, number>[];
    const axis = meta.iScale!.axis as PriceChartAxis;
    // @ts-expect-error
    const otherScale = this._getOtherScale(scale);
    const { min: otherMin, max: otherMax } = this.getUserBounds(otherScale);

    if (_parsed.length < 2) {
      return { min: 0, max: 1 };
    }

    if (scale === meta.iScale) {
      return { min: _parsed[0][axis], max: _parsed[_parsed.length - 1][axis] };
    }

    const newParsedData = _parsed.filter(({ x }) => x >= otherMin && x < otherMax);

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < newParsedData.length; i++) {
      const data = newParsedData[i];
      min = Math.min(min, data.l);
      max = Math.max(max, data.h);
    }
    return { min, max };
  }

  protected calculateElementProperties(index: number, ruler: any, reset: boolean, options: any) {
    const vscale = this._cachedMeta.vScale!;
    const base = vscale.getBasePixel();
    // @ts-expect-error
    const ipixels = this._calculateBarIndexPixels(index, ruler, options);
    const data = this.chart.data.datasets[this.index].data[index] as unknown as Record<PriceChartAxis, number>;
    const open = vscale.getPixelForValue(data.o);
    const high = vscale.getPixelForValue(data.h);
    const low = vscale.getPixelForValue(data.l);
    const close = vscale.getPixelForValue(data.c);

    return {
      base: reset ? base : low,
      x: ipixels.center,
      y: (low + high) / 2,
      width: ipixels.size,
      open,
      high,
      low,
      close
    };
  }

  draw() {
    const chart = this.chart;
    const rects = this._cachedMeta.data;
    clipArea(chart.ctx, chart.chartArea);
    for (let i = 0; i < rects.length; ++i) {
      // @ts-expect-error
      rects[i].draw(this._ctx);
    }
    unclipArea(chart.ctx);
  }
}
