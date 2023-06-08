Feature: Swap

  Scenario: As a user, i'd like to swap assets
    Given I have imported an existing account
    And I press Swap Button on the Home page

    And I am on the Swap page

  # Swap TEZ -> KUSD
    And I enter medium_amount into Asset Input on the Swap Form (From) Input page
    And I press Asset Drop-down Button on the Swap Form (To) Input page
    And I enter kUSD into Search Input on the Swap Form (To) Input page
    And I select kUSD token in the token drop-down list on the Swap page

