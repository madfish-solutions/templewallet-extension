Feature: Remove an account
  @remove_account
  Scenario: [Positive] As a user, I'd like to remove an imported account by mnemonic, private key and public key
    Given I have imported an existing account
#    Remove an imported account by mnemonic

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Mnemonic tab
    And I am on the ImportAccountMnemonic page

    And I enter importedSeedPhrase mnemonic on the ImportAccountMnemonic page
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page

    And I am on the Home page
    And I check if importedAccountShortHash is corresponded to the selected account
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Remove Account Button on the Settings page

    And I am on the RemoveAccount page
    And I enter defaultPassword into Password Input on the Remove Account page
    And I press Remove Button on the Remove Account page

    And I am on the Home page
    And I check if defaultSecondAccountShortHash is corresponded to the selected account

#    Remove an imported account by private key

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Private Key tab
    And I am on the ImportAccountPrivateKey page

    And I enter importedFirstPrivateKey into Private Key Input on the Import Account(Private Key) page
    And I press Private Key Import Button on the Import Account(Private Key) page

    And I am on the Home page
    And I check if importedAccountShortHash is corresponded to the selected account
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Remove Account Button on the Settings page

    And I am on the RemoveAccount page
    And I enter defaultPassword into Password Input on the Remove Account page
    And I press Remove Button on the Remove Account page

    And I am on the Home page
    And I check if defaultFirstAccountShortHash is corresponded to the selected account

#    Remove an imported account by public key

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Watch-only tab
    And I am on the ImportAccountWatchOnly page

    And I enter watchOnlyPublicKey into Watch Only Input on the Import Account(Watch-Only) page
    And I press Watch Only Import Button on the Import Account(Watch-Only) page

    And I check if watchOnlyAccountShortHash is corresponded to the selected account

    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Remove Account Button on the Settings page

    And I am on the RemoveAccount page
    And I enter defaultPassword into Password Input on the Remove Account page
    And I press Remove Button on the Remove Account page

    And I am on the Home page

    Then I check if defaultFirstAccountShortHash is corresponded to the selected account



  @remove_account
  Scenario: [Negative] As a user, I'd like to check validations and another errors on the "Remove Account" page
    Given I have imported an existing account

    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Remove Account Button on the Settings page

    And I am on the RemoveAccount page
    And I got the 'Cannot be removed' warning with Alert title Text element on the Alert page

    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Import Account Button on the Account Drop-down page

    And I am on the ImportAccountTab page
    And I select Mnemonic tab

    And I am on the ImportAccountMnemonic page
    And I enter importedSeedPhrase mnemonic on the ImportAccountMnemonic page
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page

    And I am on the Home page
    And I check if importedAccountShortHash is corresponded to the selected account
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Remove Account Button on the Settings page

    And I am on the RemoveAccount page
    And I press Remove Button on the Remove Account page
    And I got the validation-error 'Required' with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Remove Account page
    And I press Remove Button on the Remove Account page
    And I got the validation-error 'Invalid password' with Input Error element on the Universal Component page

