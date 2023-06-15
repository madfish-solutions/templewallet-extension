Feature: Import Account by Private Key

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
