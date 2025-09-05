import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Candle, Subscription } from '@nktkas/hyperliquid';
import { Chart, TimeSeriesScale, LinearScale, Tooltip, defaults as chartDefaults } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { isNullOrUndef } from 'chart.js/helpers';
import AnnotationPlugin from 'chartjs-plugin-annotation';

import { getCurrentLocale, toLocalFixed } from 'lib/i18n';
import { getDateFnsLocale } from 'lib/i18n/core';
import { useUpdatableRef } from 'lib/ui/hooks/useUpdatableRef';

import { useClients } from '../clients';
import { CandleChartInterval } from '../types';

import { CandlestickController } from './controller.candlestick.js';
import { CandlestickElement } from './element.candlestick.js';

Chart.register(CandlestickController, CandlestickElement, TimeSeriesScale, LinearScale, AnnotationPlugin, Tooltip);

const toDataRow = ({ t, o, c, l, h }: Candle) => ({
  x: t,
  o: Number(o),
  h: Number(h),
  l: Number(l),
  c: Number(c)
});

const fetchTimeIntervalsMins = {
  '1m': 240, // 4 hours
  '3m': 480, // 8 hours
  '5m': 720, // 12 hours
  '15m': 1440, // 1 day
  '30m': 7200, // 5 days
  '1h': 10080, // 1 week
  '2h': 20160, // 2 weeks
  '4h': 43200, // 1 month
  '8h': 86400, // 2 months
  '12h': 129600, // 3 months
  '1d': 259200, // 6 months
  '3d': 527040, // 1 leap year
  '1w': 1058400, // ~2 years, rounded up to the nearest full week
  '1M': 2635200 // ~5 years, rounded up to the nearest 30 days period
};

const candlesCountByInterval = {
  '1m': 240,
  '3m': 160,
  '5m': 144,
  '15m': 96,
  '30m': 240,
  '1h': 168,
  '2h': 168,
  '4h': 180,
  '8h': 180,
  '12h': 180,
  '1d': 180,
  '3d': 122,
  '1w': 105,
  '1M': 61
};

interface PriceChartProps {
  coinName: string;
  interval: CandleChartInterval;
}

const getSuggestedCanvasWidth = (candlesCount: number) => candlesCount * 12 + 50;

chartDefaults.font.family = `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", \
Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`;
chartDefaults.font.size = 12;
chartDefaults.font.lineHeight = 1.25;

export const PriceChart = memo<PriceChartProps>(({ coinName, interval }) => {
  const currentLocale = getCurrentLocale();
  const {
    clients: { subscription, info }
  } = useClients();
  const [candlesError, setCandlesError] = useState<unknown>();
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [priceLabelTop, setPriceLabelTop] = useState<number | undefined>();
  const [priceLabelText, setPriceLabelText] = useState<string>('');
  const pricesDataRef = useRef<Record<'x' | 'o' | 'h' | 'l' | 'c', number>[] | undefined>();
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const yAxisCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rectangleSetRef = useRef(false);
  const initialCanvasWidthRef = useRef(getSuggestedCanvasWidth(candlesCountByInterval[interval]));
  const chartScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chartScrollContainer = chartScrollContainerRef.current;

    if (!chartScrollContainer || !pricesLoaded) {
      return;
    }

    chartScrollContainer.scrollTo({ left: chartScrollContainer.scrollWidth, behavior: 'instant' });
  }, [pricesLoaded]);

  const generateAnnotationsConfig = useCallback(() => {
    const pricesData = pricesDataRef.current;

    if (!pricesData || pricesData.length === 0) {
      return {};
    }

    const { c: closePrice } = pricesData.at(-1)!;

    return {
      priceLine: {
        type: 'line',
        yMin: closePrice,
        yMax: closePrice,
        borderColor: '#E4E4E4',
        borderDash: [8, 2],
        borderWidth: 1
      }
    };
  }, []);

  const priceChart = useMemo(() => {
    const pricesData = pricesDataRef.current;

    const chartCanvas = chartCanvasRef.current;

    if (!chartCanvas) {
      return;
    }

    const ctx = chartCanvas.getContext('2d')!;
    const prevChart = Chart.getChart(chartCanvas);
    prevChart?.destroy();

    if (!pricesData || !pricesLoaded) {
      return;
    }

    rectangleSetRef.current = false;

    const chart = new Chart(ctx, {
      type: 'candlestick' as any,
      data: {
        datasets: [
          {
            label: 'Spot HYPE/USDC',
            data: pricesData,
            backgroundColors: { up: '#34CC4E', down: '#FF3B30', unchanged: '#C2C2C8' },
            borderColors: { up: '#34CC4E', down: '#FF3B30', unchanged: '#C2C2C8' }
          }
        ]
      },
      options: {
        color: '#151618',
        borderColor: '#e4e4e4',
        hoverBorderColor: '#e4e4e4',
        backgroundColor: '#fbfbfb',
        maintainAspectRatio: false,
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
            },
            adapters: {
              date: {
                locale: getDateFnsLocale()
              }
            },
            time: {
              displayFormats: {
                hour: 'HH:mm'
              }
            }
          },
          y: {
            type: 'linear',
            position: 'right',
            ticks: {
              format: { minimumSignificantDigits: 5, maximumSignificantDigits: 5, useGrouping: false }
            }
          }
        },
        locale: currentLocale.replace('_', '-'),
        animation: {
          onComplete: () => {
            if (rectangleSetRef.current) {
              return;
            }

            const yScale = chart.scales.y;
            const closePrice = pricesDataRef.current?.at(-1)?.c;
            setPriceLabelTop(closePrice === undefined ? undefined : yScale.getPixelForValue(closePrice) - 8);

            const scale = window.devicePixelRatio;

            const sourceCanvas = chart.canvas;
            const copyWidth = yScale.width;
            const copyHeight = yScale.height + yScale.top + 10;

            const targetCtx = yAxisCanvasRef.current?.getContext('2d');

            if (!targetCtx) {
              return;
            }

            targetCtx.canvas.width = copyWidth * scale;
            targetCtx.canvas.height = copyHeight * scale;

            targetCtx.canvas.style.width = `${copyWidth}px`;
            targetCtx.canvas.style.height = `${copyHeight}px`;
            ctx.save();
            targetCtx.fillStyle = '#fbfbfb';
            targetCtx.fillRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
            ctx.restore();
            targetCtx.drawImage(
              sourceCanvas,
              sourceCanvas.width - copyWidth * scale,
              0,
              copyWidth * scale,
              copyHeight * scale,
              0,
              0,
              copyWidth * scale,
              copyHeight * scale
            );

            const sourceCtx = sourceCanvas.getContext('2d');

            if (!sourceCtx) {
              return;
            }

            // Normalize coordinate system to use css pixels.

            rectangleSetRef.current = true;
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
                  return chartDefaults.plugins.tooltip.callbacks.label(ctx);
                }

                const { o, h, l, c } = point;

                return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
              }
            }
          },
          annotation: {
            annotations: generateAnnotationsConfig()
          }
        }
      }
    });

    return chart;
  }, [pricesLoaded, currentLocale, generateAnnotationsConfig]);
  const priceChartRef = useUpdatableRef(priceChart);

  const updatePriceLabel = useCallback(() => {
    if (!priceChartRef.current) {
      return;
    }

    const closePrice = pricesDataRef.current?.at(-1)?.c;
    setPriceLabelText(
      closePrice === undefined ? '' : toLocalFixed(closePrice, Math.max(4 - Math.floor(Math.log10(closePrice)), 0))
    );
    setPriceLabelTop(
      closePrice === undefined ? undefined : priceChartRef.current.scales.y.getPixelForValue(closePrice) - 8
    );
  }, [priceChartRef]);

  const updateChart = useCallback(() => {
    if (!priceChartRef.current) {
      return;
    }

    const priceChart = priceChartRef.current;
    rectangleSetRef.current = false;
    priceChart.config.options!.plugins.annotation.annotations = generateAnnotationsConfig();
    chartContainerRef.current!.style.width = `${getSuggestedCanvasWidth(pricesDataRef.current!.length)}px`;
    updatePriceLabel();
    priceChart.update();
  }, [generateAnnotationsConfig, priceChartRef, updatePriceLabel]);

  useEffect(() => {
    const subState: { sub?: Subscription } = {};

    info
      .candleSnapshot({
        coin: coinName,
        interval,
        startTime: Date.now() - 1000 * 60 * fetchTimeIntervalsMins[interval]
      })
      .then(async candles => {
        pricesDataRef.current = candles.map(toDataRow);
        setPricesLoaded(true);
        setCandlesError(undefined);
        updatePriceLabel();
        subState.sub = await subscription.candle({ coin: coinName, interval }, data => {
          const currentPricesData = pricesDataRef.current;
          if (data.t === currentPricesData?.at(-1)?.x) {
            currentPricesData[currentPricesData.length - 1] = toDataRow(data);
            updateChart();
          } else if (currentPricesData) {
            currentPricesData.push(toDataRow(data));
            updateChart();
          }
        });
      })
      .catch(e => {
        console.error(e);
        setCandlesError(e);
      });

    return () => {
      subState.sub?.unsubscribe();
      pricesDataRef.current = undefined;
      setCandlesError(undefined);
      setPricesLoaded(false);
    };
  }, [subscription, info, updateChart, coinName, interval, updatePriceLabel]);

  const scale = window.devicePixelRatio;

  return (
    <>
      {candlesError ? <p className="text-font-small text-error">Failed to fetch data</p> : null}
      <div className="w-full relative">
        <div className="w-full h-96 overflow-x-auto" ref={chartScrollContainerRef}>
          <div className="h-full" style={{ width: initialCanvasWidthRef.current }} ref={chartContainerRef}>
            <canvas ref={chartCanvasRef} width={initialCanvasWidthRef.current * scale} height={384 * scale} />
          </div>
        </div>
        <canvas
          className="absolute top-0 right-0 pointer-events-none"
          ref={yAxisCanvasRef}
          width={0}
          height={384 * scale}
        />
        {priceLabelTop !== undefined && (
          <div
            className="absolute flex items-center justify-center bg-grey-2 text-grey-1 text-font-description px-px"
            style={{ top: priceLabelTop, right: 2 }}
          >
            {priceLabelText}
          </div>
        )}
      </div>
    </>
  );
});
