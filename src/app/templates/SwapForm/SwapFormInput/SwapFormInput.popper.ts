import { Modifier } from '@popperjs/core';

export const sameWidthModifiers: Array<Modifier<string, any>> = [
  {
    name: 'sameWidth',
    enabled: true,
    phase: 'beforeWrite',
    requires: ['computeStyles'],
    fn: ({ state }) => {
      state.styles.popper.width = `${state.rects.reference.width}px`;
    },
    effect: ({ state }) => {
      state.elements.popper.style.width = `${(state.elements.reference as any).offsetWidth}px`;
      return () => {};
    }
  }
];
