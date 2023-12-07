Feature: Notifications
  @notifications
  Scenario: As a user, I'd like to read some news
    Given I make request for creating a notification
    And I have imported an existing account
    And I press Notification Icon Button on the Home page

    And I am on the NotificationsList page
    And I check that new notification is displayed
    And I click on the new notification

    And I am on the NotificationContent page
    And The Notification Title Text on the Notification Content page has correct Test Title value
    And The Notification Description Text on the Notification Content page has correct Test content value

    And I press Got it Button on the Notification Content page
    And I am on the NotificationsList page

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Settings Button on the Account Drop-down page
    And I am on the Settings page

    And I press General Button on the Settings page
    And I am on the GeneralSettings page
#    turning off notifications
    And I scroll 900 pixels on the GeneralSettings page
    And I press Notification Check Box on the Setting General page

    And I scroll -900 pixels on the GeneralSettings page
    And I press Temple Logo Icon on the Header page
    And I am on the Home page

    And I press Notification Icon Button on the Home page
    And I am on the NotificationsList page

    Then I check that new notification is NOT displayed




