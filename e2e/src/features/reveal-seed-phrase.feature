Feature: Reveal seed phrase

  Scenario: As a user, I'd like to reveal my seed phrase
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Reveal Seed Phrase Button on the Settings page

    And I am on the RevealSecrets page
    And I enter defaultPassword into Reveal Password Input on the Reveal Secrets page
    And I press Reveal Button on the Reveal Secrets page

    Then I compare my Seed Phrase to Revealed value

