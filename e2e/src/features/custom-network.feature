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


@custom_node
  Scenario: As a user, i'd like to remove added custom network
     Given I have imported an existing account
     And I press Account Icon on the Header page
     And I am on the AccountsDropdown page
     And I press Settings Button on the Account Drop-down page

     And I am on the Settings page
     And I press Networks Button on the Settings page

     And I am on the Networks page
# scroll down + adding first custom network
     And I scroll 500 pixels on the Networks page
     And I enter customTestName into Name Input on the Networks Settings page
     And I enter customNetworkRPC into RPC base URL Input on the Networks Settings page
     And I press Add Network Button on the Networks Settings page

     And I scroll -500 pixels on the Networks page
     And I check if added custom network = 'customNetworkRPC' is displayed on 'Current networks' list

# scroll down + adding second custom network
     And I scroll 500 pixels on the Networks page

     And I enter shortRandomContent into Name Input on the Networks Settings page
     And I enter secondCustomNetworkRPC into RPC base URL Input on the Networks Settings page
     And I press Add Network Button on the Networks Settings page

     And I scroll -500 pixels on the Networks page
     And I check if added custom network = 'secondCustomNetworkRPC' is displayed on 'Current networks' list

     And I find an added custom network = 'customNetworkRPC' and click to delete it

     And I am on the ConfirmationModal page
     And I press Ok Button on the Confirmation Modal page
     And I check if added custom network = 'customNetworkRPC' is deleted from the 'Current networks' list

#  It runs for understanding that other custom networks are not deleted
     Then I check if added custom network = 'secondCustomNetworkRPC' is displayed on 'Current networks' list






