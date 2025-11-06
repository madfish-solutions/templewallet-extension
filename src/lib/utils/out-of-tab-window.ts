type OutOfTabWindowType = 'sidebar' | 'popup';

const windowsTypes: OutOfTabWindowType[] = ['sidebar', 'popup'];
const isOutOfTabWindowType = (type: string): type is OutOfTabWindowType =>
  windowsTypes.includes(type as OutOfTabWindowType);

export const getOutOfTabWindowPortName = (windowId: number, type: OutOfTabWindowType) => `${type}-${windowId}`;

export const getOutOfTabWindowFromPortName = (portName: string) => {
  const [windowType, rawWindowId] = portName.split('-');

  if (!isOutOfTabWindowType(windowType) || !rawWindowId) {
    return null;
  }

  const windowId = Number(rawWindowId);

  return Number.isInteger(windowId) && windowId >= 0 ? { type: windowType, windowId } : null;
};
