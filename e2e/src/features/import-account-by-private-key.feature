Feature: Import Account by Private Key
  @dev
  Scenario: As a user, I'd like to import account by private key
    Given I have imported an existing account

    And I press AccountIcon on the Header page
    And I am on the AccountsDropdown page

    And I press ImportAccountButton on the AccountsDropdown page
    And I am on the ImportAccountTab page

    And I select Private Key tab
    And I am on the ImportAccountPrivateKey page

    And I enter second private key into Private Key Input on the Import Account(Private Key) page
    And I press Private Key Import Button on the Import Account(Private Key) page

    Then I reveal a private key and compare with private key of second seed phrase
