Feature: Reveal seed phrase

  Scenario: As a user, I'd like to reveal my seed phrase
    Given I have imported an existing account

    And I press AccountIcon on the Header page
    And I am on the AccountsDropdown page
    And I press SettingsButton on the AccountsDropdown page

    And I am on the Settings page
    And I press RevealSeedPhraseButton on the Settings page

    And I am on the RevealSecrets page
    And I enter DEFAULT_PASSWORD into Reveal Password Field on the RevealSecrets page
    And I press Reveal Button on the RevealSecrets page

    Then I compare my Seed Phrase to Revealed value

