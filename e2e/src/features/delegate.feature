Feature: Delegate

  Scenario: As a user, i'd like to re-delegate TEZ to a baker
    Given I have imported an existing account
    And I press Selected Network Button on the Network Select page
    And I select ECAD Labs Mainnet node in the networks drop-down list on the Header page
    And I check that ECAD Labs Mainnet node is selected correctly
    And I press Asset Item Apy Button on the Assets page

    And I am on the DelegateTab page
    And I check who the delegated baker is
    And I press Re-Delegate Button on the Baking Section page

    And I am on the DelegateForm page
    And I enter bakerAddress into Baker Input on the Delegate Form page
    And I press Baker Item Delegate Button on the Delegate Form page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page

    Then I'm waiting for 'success ✓' operation status
