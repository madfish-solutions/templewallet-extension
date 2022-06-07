import { TempleMessageBase, TempleMessageType } from './types';

export enum AnalyticsEventCategory {
  General = 'General',
  ButtonPress = 'ButtonPress',
  FormChange = 'FormChange',
  FormSubmit = 'FormSubmit',
  FormSubmitSuccess = 'FormSubmitSuccess',
  FormSubmitFail = 'FormSubmitFail',
  PageOpened = 'PageOpened'
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
  rpc: string | undefined;
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
  rpc: string | undefined;
  path: string;
  search: string;
  additionalProperties: object;
}

export interface TempleSendPageEventResponse extends TempleMessageBase {
  type: TempleMessageType.SendPageEventResponse;
}
