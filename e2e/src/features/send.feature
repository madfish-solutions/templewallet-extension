Feature: Send
  @dev
  Scenario: As a user, I'd like to send my funds to another account
    Given I have imported an existing account
    And I press Send Button on the Home page

    And I am on the Send page
# Send TEZ
    And I enter watchOnlyPublicKey into Recipient Input on the Send Form page
    And I enter low_amount into Amount Input on the Send Form page
    And I press Send Button on the Send Form page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status

    And I am on the Send page
# Send uUSD
    And I press Asset Drop-down on the Send Form page
    And I enter uUSD into Asset Drop-down Search Input on the Send Form page
    And I select UUSD token in the token drop-down list on the Send page
    And I enter watchOnlyPublicKey into Recipient Input on the Send Form page
    And I enter low_amount into Amount Input on the Send Form page
    And I press Send Button on the Send Form page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status

    And I am on the Send page
# Send KUSD
    And I press Asset Drop-down on the Send Form page
    And I clear Asset Drop-down Search Input value on the Send Form page
    And I enter kUSD into Asset Drop-down Search Input on the Send Form page
    And I select KUSD token in the token drop-down list on the Send page
    And I enter watchOnlyPublicKey into Recipient Input on the Send Form page
    And I enter low_amount into Amount Input on the Send Form page
    And I press Send Button on the Send Form page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status

    And I am on the Send page
# Send NFT
    And I press Asset Drop-down on the Send Form page
    And I clear Asset Drop-down Search Input value on the Send Form page
    And I enter OBJKTCOM into Asset Drop-down Search Input on the Send Form page
    And I select OBJKTCOM token in the token drop-down list on the Send page
    And I enter watchOnlyPublicKey into Recipient Input on the Send Form page
    And I enter high_amount into Amount Input on the Send Form page
    And I press Send Button on the Send Form page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status

    Then I am on the Send page
