Feature: Create or restore an account

  Scenario: As a user, I'd like to create or restore an account
    Given I have imported an existing account

    And I press AccountIcon on the Header page
    And I am on the AccountsDropdown page

    And I press CreateOrRestoreAccountButton on the AccountsDropdown page
    And I am on the CreateOrRestoreAnAccount page

    And I press Create Or Restore Button on the Create Account page
    And I am on the Home page

    Then I reveal a private key and compare with DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY


