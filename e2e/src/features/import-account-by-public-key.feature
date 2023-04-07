Feature: Import an account by public key (Watch-only)

  Scenario: As a user, I'd like to import an account by public key
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Accounts Drop-down page
    And I am on the ImportAccountTab page

    And I select Watch-only tab
    And I am on the ImportAccountWatchOnly page

    And I enter watchOnlyPublicKey into Watch Only Input on the Import Account(Watch-Only) page
    And I press Watch Only Import Button on the Import Account(Watch-Only) page

    Then I compare my Watch-only Public hash with imported account
