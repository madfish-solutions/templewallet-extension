import Color from '@dicebear/avatars/lib/color';
import Random from '@dicebear/avatars/lib/random';
import { ColorCollection, Color as ColorType } from '@dicebear/avatars/lib/types';

type Options = {
  margin?: number;
  background?: string;
  userAgent?: string;
  backgroundColors?: Array<keyof ColorCollection>;
  backgroundColorLevel?: keyof ColorType;
  fontSize?: number;
  chars?: number;
  bold?: boolean;
};

export default function initialsSprites(random: Random, options: Options = {}) {
  options.backgroundColorLevel = options.backgroundColorLevel || 600;
  options.fontSize = options.fontSize || 50;
  options.chars = options.chars || 2;

  const backgroundColors: string[] = [];

  if (options.background) {
    backgroundColors.push(options.background);

    options.background = undefined;
  } else {
    Object.keys(Color.collection).forEach((backgroundColorInner: any) => {
      if (
        options.backgroundColors === undefined ||
        options.backgroundColors.length === 0 ||
        options.backgroundColors.indexOf(backgroundColorInner) !== -1
      ) {
        backgroundColors.push((Color.collection as any)[backgroundColorInner][options.backgroundColorLevel!]);
      }
    });
  }

  const backgroundColor = random.pickone(backgroundColors);
  const seedInitials = random.seed.trim().slice(0, options.chars);
  const fontFamily = 'Menlo,Monaco,monospace';

  // prettier-ignore
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="isolation:isolate;" viewBox="0 0 1 1" version="1.1">`,
    `<rect width="1" height="1" fill="${backgroundColor}"></rect>`,
    options.margin ? `<g transform="translate(${options.margin / 100}, ${options.margin / 100})">` : '',
    options.margin ? `<g transform="scale(${1 - (options.margin * 2) / 100})">` : '',
    `<text x="50%" y="50%" style="${options.bold ? 'font-weight: bold;' : ''} font-family: ${fontFamily}; font-size: ${options.fontSize / 100}px" fill="#FFF" text-anchor="middle" dy=".4em">${seedInitials.replace(/</g, '').replace(/>/g, '')}</text>`,
    options.margin ? '</g>' : '',
    options.margin ? '</g>' : '',
    '</svg>'
  ].join('');

  options.margin = undefined;

  return svg;
}
