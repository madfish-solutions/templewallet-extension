export interface PlanetProps {
  startAlpha: number;
  /** Must be unique */
  id: string | number;
  radius: number;
  item: ReactChildren;
}

export interface OrbitProps {
  fullRotationPeriod: number;
  radius: number;
  planets: PlanetProps[];
  direction: 'clockwise' | 'counter-clockwise';
}

export interface PlanetsAnimationProps {
  bottomGap: number;
}

interface PlanetStickAnimationParamsBase {
  bounces: boolean;
  duration: number;
}

interface NormalPlanetAnimationParams extends PlanetStickAnimationParamsBase {
  bounces: false;
}

interface BouncingPlanetAnimationParams extends PlanetStickAnimationParamsBase {
  bounces: true;
  leftEdgeAlpha: number;
  rightEdgeAlpha: number;
  beforeFirstBumpPercentage: number;
  beforeSecondBumpPercentage: number;
}

export type PlanetAnimationParams = NormalPlanetAnimationParams | BouncingPlanetAnimationParams;
