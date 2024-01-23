import type { SliseAdStylesOverrides } from 'lib/apis/temple';

export enum AdActionType {
  ReplaceAllChildren = 'replace-all-children',
  ReplaceElement = 'replace-element',
  SimpleInsertAd = 'simple-insert-ad',
  RemoveElement = 'remove-element',
  HideElement = 'hide-element'
}

interface AdActionBase {
  type: AdActionType;
}

interface AdRect {
  width: number;
  height: number;
}

interface InsertAdActionProps {
  adRect: AdRect;
  shouldUseDivWrapper: boolean;
  divWrapperStyle?: Record<string, string>;
  stylesOverrides?: SliseAdStylesOverrides[];
}

export interface ReplaceAllChildrenWithAdAction extends AdActionBase, InsertAdActionProps {
  type: AdActionType.ReplaceAllChildren;
  parent: HTMLElement;
}

export interface ReplaceElementWithAdAction extends AdActionBase, InsertAdActionProps {
  type: AdActionType.ReplaceElement;
  element: HTMLElement;
}

export interface SimpleInsertAdAction extends AdActionBase, InsertAdActionProps {
  type: AdActionType.SimpleInsertAd;
  parent: HTMLElement;
  insertionIndex: number;
}

export interface RemoveElementAction extends AdActionBase {
  type: AdActionType.RemoveElement;
  element: HTMLElement;
}

export interface HideElementAction extends AdActionBase {
  type: AdActionType.HideElement;
  element: HTMLElement;
}

export type InsertAdAction = ReplaceAllChildrenWithAdAction | ReplaceElementWithAdAction | SimpleInsertAdAction;

export type AdAction =
  | ReplaceAllChildrenWithAdAction
  | ReplaceElementWithAdAction
  | SimpleInsertAdAction
  | RemoveElementAction
  | HideElementAction;
