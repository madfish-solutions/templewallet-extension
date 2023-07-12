Feature: Create or restore an account
  @create_account
  Scenario: [Positive] As a user, I'd like to create or restore an account
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Create Or Restore Account Button on the Account Drop-down page
    And I am on the CreateOrRestoreAnAccount page

    And I press Create Or Restore Button on the Create Account page
    And I am on the Home page

    Then I reveal a private key and compare with defaultSecondPrivateKey



  @create_account
  Scenario: [Negative] As a user, I'd like to create or restore an account with edited name + validation errors
    Given I have imported an existing account

  #   create an account with edited name
    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Create Or Restore Account Button on the Account Drop-down page
    And I am on the CreateOrRestoreAnAccount page

    And I clear Account Name Input value on the Create Account page
    And I enter shortRandomContent into Account Name Input on the Create Account page
    And I press Create Or Restore Button on the Create Account page

    And I am on the Home page
    And I check if shortRandomContent is edited name for created account

  #   check validation error
    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Create Or Restore Account Button on the Account Drop-down page
    And I am on the CreateOrRestoreAnAccount page

    And I clear Account Name Input value on the Create Account page
    And I enter longRandomContent into Account Name Input on the Create Account page
    And I press Create Or Restore Button on the Create Account page

    Then I got the 'Invalid name. It should be: 1-16 characters, without special' error with Input Error element on the Universal Component page
