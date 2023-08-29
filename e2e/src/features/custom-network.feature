Feature: Add Custom Node
@custom_node
  Scenario: As a user, I'd like to add custom network
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Networks Button on the Settings page

    And I am on the Networks page
# scroll down
    And I scroll 500 pixels on the Networks page
    And I enter customTestName into Name Input on the Networks Settings page
    And I enter customNetworkRPC into RPC base URL Input on the Networks Settings page
    And I press Add Network Button on the Networks Settings page
# scroll up
    And I scroll -500 pixels on the Networks page

    And I check if added custom network = 'customNetworkRPC' is displayed on 'Current networks' list
    And I press Selected Network Button on the Header page

    And I select Custom Test Net node in the networks drop-down list on the Header page
    And I press Temple Logo Icon on the Header page

    Then I check that Custom Test Net node is selected correctly





