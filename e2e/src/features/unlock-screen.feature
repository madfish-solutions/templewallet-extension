Feature: Unlock Screen

  Scenario: As a user, I'd like to unlock my wallet
    Given I have imported an existing account
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Logout Button on the Account Drop-down page

    And I am on the UnlockScreen page
    And I enter defaultPassword into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page

    Then I am on the Home page
