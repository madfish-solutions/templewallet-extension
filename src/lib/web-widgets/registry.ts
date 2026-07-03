import type { Detector } from './engine/types';

export class DetectorRegistry {
  private readonly detectors: Detector[] = [];

  register(detector: Detector): void {
    this.detectors.push(detector);
  }

  getAll(): readonly Detector[] {
    return this.detectors;
  }
}
