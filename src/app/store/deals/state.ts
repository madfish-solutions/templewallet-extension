export interface DealsState {
  enabled: boolean;
  snoozedUntil: number;
}

export const dealsInitialState: DealsState = {
  enabled: false,
  snoozedUntil: 0
};
