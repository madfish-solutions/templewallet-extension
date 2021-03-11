export enum AnalyticsEventEnum {
  AnalyticsEnabled = 'AnalyticsEnabled', // !
  PageOpened = 'PageOpened',
  LanguageChanged = 'LanguageChanged', // !
  ImportAccountFormSubmit = 'ImportAccountFormSubmit', // ! add success/failed actions?
  AccountDropdownButtonPress = 'AccountDropdownButtonPress', // !
  CreateAccountFormSubmit = 'CreateAccountFormSubmit', // ! add success/failed actions?
  ConnectLedgerFormSubmit = 'ConnectLedgerFormSubmit' // ! add success/failed actions?
}

// - View on block-explorer
// - DApp Permission confirm
// - DApp Operations confirm
// - DApp Sign confirm
// - DApp Revoke permission
// - Internal Confirm
// - Send form submit
// - Delegate form submit
// - Add Token submit
// - Change account name
