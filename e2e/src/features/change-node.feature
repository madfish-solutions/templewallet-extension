Feature: Change node
@change_node
  Scenario: As a user, i'd like to change node
    Given I have imported an existing account
    And I am on the Header page

    And I press Selected Network Button on the Header page
    And I select Ghostnet Testnet node in the networks drop-down list on the Header page

    Then I check that Ghostnet Testnet node is selected correctly
