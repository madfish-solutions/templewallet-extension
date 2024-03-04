export interface AdView {
  element: HTMLDivElement | HTMLIFrameElement | HTMLModElement;
  postAppend?: () => void | Promise<unknown>;
}
