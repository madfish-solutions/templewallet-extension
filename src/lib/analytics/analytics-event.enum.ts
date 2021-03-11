export enum AnalyticsEventCategory {
  General = 'General',
  ButtonPress = 'ButtonPress',
  FormSubmit = 'FormSubmit',
  FormSubmitSuccess = 'FormSubmitSuccess',
  FormSubmitFail = 'FormSubmitFail'
}

export enum AnalyticsEventEnum {
  AnalyticsEnabled = 'AnalyticsEnabled', // !
  PageOpened = 'PageOpened',
  LanguageChanged = 'LanguageChanged', // !
}

// - View on block-explorer
// - DApp Permission confirm
// - DApp Operations confirm
// - DApp Sign confirm
// - DApp Revoke permission
// - Internal Confirm
// - Send form submit
// - Delegate form submit
