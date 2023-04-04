Feature: Send
  @dev
  Scenario: As a user, I'd like to send my funds to another account
    And I have imported an existing account
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
# Send KUSD
    And I press Asset Drop-down on the Send Form page
    And I enter KUSD into Asset Drop-down Search Input on the Send Form page
    And I select Kolibri token in the token drop-down list
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
    And I select youves uUSD token in the token drop-down list
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
    And I enter OBJKTCOM into Asset Drop-down Search Input on the Send Form page
    And I select Temple NFT token in the token drop-down list
    And I enter watchOnlyPublicKey into Recipient Input on the Send Form page
    And I enter high_amount into Amount Input on the Send Form page
    And I press Send Button on the Send Form page

    And I am on the InternalConfirmation page
    And I press Confirm Button on the Internal Confirmation page

    And I am on the OperationStatusAlert page
    And I'm waiting for 'success ✓' operation status

    Then I am on the Send page
