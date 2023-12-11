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


@custom_node
  Scenario: Validation check on Add Asset page + other checks [Negative]
     Given I have imported an existing account

     And I press Account Icon on the Header page
     And I am on the AccountsDropdown page
     And I press Settings Button on the Account Drop-down page

     And I am on the Settings page
     And I press Networks Button on the Settings page

     And I am on the Networks page
     And I scroll 500 pixels on the Networks page
      # both inputs validation
     And I press Add Network Button on the Networks Settings page
     And I got the validation-error 'Required' in the Name Input Section on the Networks Settings page
     And I got the validation-error 'Required' in the RPC base URL Input Section on the Networks Settings page

     And I enter shortRandomContent into Name Input on the Networks Settings page
     And I enter shortRandomContent into RPC base URL Input on the Networks Settings page
     And I got the validation-error 'Must be a valid URL' in the RPC base URL Input Section on the Networks Settings page

     And I clear RPC base URL Input value on the Networks Settings page
     And I enter customNetworkRPC into RPC base URL Input on the Networks Settings page
     And I press Add Network Button on the Networks Settings page

     And I scroll -500 pixels on the Networks page
     And I check if added custom network = 'customNetworkRPC' is displayed on 'Current networks' list
     And I scroll 500 pixels on the Networks page
      #  duplicate validation error
     And I enter shortRandomContent into Name Input on the Networks Settings page
     And I enter customNetworkRPC into RPC base URL Input on the Networks Settings page

     And I got the validation-error 'Must be unique' in the RPC base URL Input Section on the Networks Settings page

      #  adding custom network after validation errors
     And I clear Name Input value on the Networks Settings page
     And I clear RPC base URL Input value on the Networks Settings page
     And I enter customTestName into Name Input on the Networks Settings page
     And I enter secondCustomNetworkRPC into RPC base URL Input on the Networks Settings page

     And I press Add Network Button on the Networks Settings page
# scroll up
     And I scroll -500 pixels on the Networks page

     And I check if added custom network = 'customNetworkRPC' is displayed on 'Current networks' list
     And I press Selected Network Button on the Header page

     And I select Custom Test Net node in the networks drop-down list on the Header page
     And I press Temple Logo Icon on the Header page

     Then I check that Custom Test Net node is selected correctly
