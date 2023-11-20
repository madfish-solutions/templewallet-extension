Feature: Import Account by Private Key

  @import_account_private_key
  Scenario: As a user, I'd like to import account by private key
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Private Key tab
    And I am on the ImportAccountPrivateKey page

    And I enter importedFirstPrivateKey into Private Key Input on the Import Account(Private Key) page
    And I press Private Key Import Button on the Import Account(Private Key) page

    Then I reveal a private key and compare with importedFirstPrivateKey



  Scenario: Check validation importing by private key
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Private Key tab
    And I am on the ImportAccountPrivateKey page

    And I press Private Key Import Button on the Import Account(Private Key) page
    And I got the validation-error 'Required' with Input Error element on the Universal Component page

    And I enter shortRandomContent into Private Key Input on the Import Account(Private Key) page
    And I press Private Key Import Button on the Import Account(Private Key) page
#   checking alert type , title and description of the error
    And I got the 'Error' error with Alert title Text element on the Alert page
    And I got the validation-error 'Failed to import account. This may happen because provided Key is invalid' with Alert description Text element on the Alert page

    And I clear Private Key Input value on the Import Account(Private Key) page
    And I enter defaultFirstPrivateKey into Private Key Input on the Import Account(Private Key) page
    And I press Private Key Import Button on the Import Account(Private Key) page
 #   checking duplicate importing account error
    And I got the 'Error' error with Alert title Text element on the Alert page
    And I got the validation-error 'Account already exists' with Alert description Text element on the Alert page

    And I clear Private Key Input value on the Import Account(Private Key) page
    And I enter importedFirstPrivateKey into Private Key Input on the Import Account(Private Key) page
    And I press Private Key Import Button on the Import Account(Private Key) page

    And I am on the Home page
    Then I check if importedAccountShortHash is corresponded to the selected account


