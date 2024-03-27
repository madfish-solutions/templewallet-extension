export interface AdView {
  element: HTMLDivElement | HTMLIFrameElement;
  postAppend?: () => void | Promise<unknown>;
}
