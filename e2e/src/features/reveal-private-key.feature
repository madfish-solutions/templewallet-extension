Feature: Reveal private key
@reveal_private_key
  Scenario: As a user, I'd like to reveal my private key
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Reveal Private Key Button on the Settings page

    And I am on the RevealSecrets page
    And I enter defaultPassword into Reveal Password Input on the Reveal Secrets page
    And I press Reveal Button on the Reveal Secrets page

    And I press Reveal Secrets Protected Mask on the Reveal Secrets page
    Then I compare my Private Key to Revealed value

