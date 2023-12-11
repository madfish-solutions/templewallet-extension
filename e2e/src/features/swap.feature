Feature: Swap

  @swap
  Scenario: As a user, i'd like to swap assets
    Given I have imported an existing account
    And I press Selected Network Button on the Header page
    And I select Marigold Mainnet node in the networks drop-down list on the Header page
    And I check that Marigold Mainnet node is selected correctly
    And I press Swap Button on the Home page

    And I am on the Swap page
  # 1.Swap  TEZ -> kUSD (TEZ -> FA2)
    And I enter amount_0_005 into Asset Input on the Swap Form (From) Input page
    And I press Asset Drop-down Button on the Swap Form (To) Input page
    And I enter uUSD into Search Input on the Swap Form (To) Input page
    And I select uUSD token in the token drop-down list on the Swap page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status

    And I am on the Swap page
  # 2.Swap TEZ -> kUSD (TEZ -> FA1.2)
    And I press Asset Drop-down Button on the Swap Form (To) Input page
    And I clear Search Input value on the Swap Form (To) Input page
    And I enter kUSD into Search Input on the Swap Form (To) Input page
    And I select kUSD token in the token drop-down list on the Swap page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status

    And I am on the Swap page
   # 3.Swap kUSD -> TEZ (FA1.2 -> TEZ)
    And I press Swap Places Button on the Swap Form page
    And I enter amount_0_005 into Asset Input on the Swap Form (From) Input page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status


    And I am on the Swap page
   # 4.Swap uUSD -> TEZ (FA2 -> TEZ)
    And I press Asset Drop-down Button on the Swap Form (From) Input page
    And I enter uUSD into Search Input on the Swap Form (From) Input page
    And I select uUSD token in the token drop-down list on the Swap page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status


    And I am on the Swap page
   # 5.Swap  uUSD -> WTZ (FA2 -> FA1.2)
    And I press Asset Drop-down Button on the Swap Form (To) Input page
    And I enter WTZ into Search Input on the Swap Form (To) Input page
    And I select WTZ token in the token drop-down list on the Swap page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status


    And I am on the Swap page
   # 6.Swap WTZ -> uUSD (FA1.2 -> FA2)
    And I press Swap Places Button on the Swap Form page
    And I enter amount_0_005 into Asset Input on the Swap Form (From) Input page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status


    And I am on the Swap page
   # 7.Swap WTZ -> kUSD (FA1.2 -> FA1.2)
    And I press Asset Drop-down Button on the Swap Form (To) Input page
    And I enter kUSD into Search Input on the Swap Form (To) Input page
    And I select kUSD token in the token drop-down list on the Swap page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status


    And I am on the Swap page
   # 8.Swap kUSD -> WTZ (FA1.2 -> FA1.2)
    And I press Swap Places Button on the Swap Form page
    And I enter amount_0_005 into Asset Input on the Swap Form (From) Input page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status


    And I am on the Swap page
   # 9.Swap wUSDT -> uUSD (FA2 -> FA2)
    And I press Asset Drop-down Button on the Swap Form (From) Input page
    And I enter wUSDT into Search Input on the Swap Form (From) Input page
    And I select wUSDT token in the token drop-down list on the Swap page
    And I clear Asset Input value on the Swap Form (From) Input page
    And I enter amount_0_1 into Asset Input on the Swap Form (From) Input page
    And I press Asset Drop-down Button on the Swap Form (To) Input page
    And I enter uUSD into Search Input on the Swap Form (To) Input page
    And I select uUSD token in the token drop-down list on the Swap page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status


    And I am on the Swap page
   # 10.Swap wUSDT -> uUSD (FA2 -> FA2)
    And I press Swap Places Button on the Swap Form page
    And I enter amount_0_1 into Asset Input on the Swap Form (From) Input page
    And I click on animated Swap button on the Swap page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status

    Then I am on the Swap page
