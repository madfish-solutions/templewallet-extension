Feature: Notifications
  @dev
  Scenario: As a user, I'd like to read some news
    Given I make request for creating a notification
    And I have imported an existing account
    And I press Notification Icon Button on the Home page

    And I am on the  page
