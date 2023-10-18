Feature: Import an account by public key (Watch-only)

  @import_account_public_key
  Scenario: As a user, I'd like to import an account by public key
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Watch-only tab
    And I am on the ImportAccountWatchOnly page

    And I enter watchOnlyPublicKey into Watch Only Input on the Import Account(Watch-Only) page
    And I press Watch Only Import Button on the Import Account(Watch-Only) page

    Then I check if watchOnlyAccountShortHash is corresponded to the selected account


  @dev
  Scenario: Check validation importing by public key
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Watch-only tab
    And I am on the ImportAccountWatchOnly page

    And I enter shortRandomContent into Watch Only Input on the Import Account(Watch-Only) page
    And I press Watch Only Import Button on the Import Account(Watch-Only) page
    And I got the validation-error 'Invalid address or domain name' with Input Error element on the Universal Component page

    And I clear Watch Only Input value on the Import Account(Watch-Only) page
    And I enter defaultFirstPublicKey into Watch Only Input on the Import Account(Watch-Only) page
    And I press Watch Only Import Button on the Import Account(Watch-Only) page
#   checking alert type , title and description of the error
    And I got the 'Error' error with Alert title Text element on the Alert page
    And I got the validation-error 'Account already exists' with Alert description Text element on the Alert page

    And I clear Watch Only Input value on the Import Account(Watch-Only) page
    And I clear Watch Only Input value on the Import Account(Watch-Only) page
    And I enter watchOnlyPublicKey into Watch Only Input on the Import Account(Watch-Only) page
    And I press Watch Only Import Button on the Import Account(Watch-Only) page

    Then I check if watchOnlyAccountShortHash is corresponded to the selected account
