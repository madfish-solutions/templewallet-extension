import type { TempleMessageBase, TempleMessageType } from './types';

export enum AnalyticsEventCategory {
  General = 'General',
  ButtonPress = 'ButtonPress',
  LinkPress = 'LinkPress',
  CheckboxChange = 'CheckboxChange',
  FormChange = 'FormChange',
  FormSubmit = 'FormSubmit',
  FormSubmitSuccess = 'FormSubmitSuccess',
  FormSubmitFail = 'FormSubmitFail',
  PageOpened = 'PageOpened',
  DropdownOpened = 'DropdownOpened',
  Error = 'Error'
}

export enum AnalyticsEventEnum {
  AnalyticsEnabled = 'AnalyticsEnabled',
  AnalyticsDisabled = 'AnalyticsDisabled',
  LanguageChanged = 'LanguageChanged',
  FiatCurrencyChanged = 'FiatCurrencyChanged'
}

export interface TempleSendTrackEventRequest extends TempleMessageBase {
  type: TempleMessageType.SendTrackEventRequest;
  userId: string;
  chainId?: string;
  event: string;
  category: AnalyticsEventCategory;
  properties?: object;
}

export interface TempleSendTrackEventResponse extends TempleMessageBase {
  type: TempleMessageType.SendTrackEventResponse;
}

export interface TempleSendPageEventRequest extends TempleMessageBase {
  type: TempleMessageType.SendPageEventRequest;
  userId: string;
  chainId?: string;
  path: string;
  search: string;
  additionalProperties: object;
}

export interface TempleSendPageEventResponse extends TempleMessageBase {
  type: TempleMessageType.SendPageEventResponse;
}
