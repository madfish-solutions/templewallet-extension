import { SUN_RADIUS } from './constants';

/**
 * Calculates an angle between a horizontal and a line through the center of the 'sun' and the point where
 * a 'planet' hits the bottom gap.
 */
export const calculateBottomGapAngle = (bottomGap: number, orbitRadius: number, planetRadius: number) =>
  Math.asin((SUN_RADIUS + bottomGap - planetRadius) / orbitRadius);
