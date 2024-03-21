export const overrideElementStyles = (element: HTMLElement, overrides: StringRecord) => {
  for (const stylePropName in overrides) {
    element.style.setProperty(stylePropName, overrides[stylePropName]);
  }
};
