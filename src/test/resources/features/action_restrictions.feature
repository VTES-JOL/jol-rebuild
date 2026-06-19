Feature: Action-scoped eligibility restrictions

  Background:
    Given a 4-player game in "MINION" phase with rules enforced
    And "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Bob" controls a ready vampire "Meridian" with 3 blood and capacity 5

  Scenario: A CANNOT_BLOCK restriction prevents a minion from blocking
    When "Alice" declares a BLEED action
    And a CANNOT_BLOCK restriction is applied to "Meridian" with reason "Seduction"
    Then "Meridian" should be restricted from CANNOT_BLOCK this action
    When "Alice" passes the impulse
    And "Bob" attempts to block with "Meridian"
    Then a rule violation mentioning "cannot block" should occur

  Scenario: An unrestricted minion can still block after a restriction is placed on another
    Given "Carol" controls a ready vampire "Camille" with 3 blood and capacity 5
    When "Alice" declares a BLEED action
    And a CANNOT_BLOCK restriction is applied to "Meridian" with reason "Seduction"
    And "Alice" passes the impulse
    And "Bob" passes the impulse
    And "Carol" passes the impulse
    And "Alice" passes the impulse
    And "Bob" attempts to block with "Meridian"
    Then a rule violation should occur

  Scenario: Restriction map starts empty when action begins
    When "Alice" declares a BLEED action
    Then no action restrictions should be recorded

  Scenario: Multiple restrictions can be recorded for different minions
    Given "Carol" controls a ready vampire "Camille" with 3 blood and capacity 5
    When "Alice" declares a BLEED action
    And a CANNOT_BLOCK restriction is applied to "Meridian" with reason "Seduction"
    And a CANNOT_BLOCK restriction is applied to "Camille" with reason "Seduction"
    Then "Meridian" should be restricted from CANNOT_BLOCK this action
    And "Camille" should be restricted from CANNOT_BLOCK this action

  @pending
  Scenario: Signet of King Saul — passive restriction blocks high-capacity vampires
    # Requires card-text parsing of Signet of King Saul equipment.
    # A vampire with capacity >= 8 cannot block actions declared by the bearer.
    # Passive check via PassiveRestrictionChecker.canBlock(); no RestrictionAddedEffect emitted.
    Given "Carol" controls a ready vampire "AncientVampire" with 8 blood and capacity 10
    And "Alice" equips "Signet of King Saul" on "Dima"
    When "Alice" declares a BLEED action
    And "Carol" attempts to block with "AncientVampire"
    Then a rule violation mentioning "cannot block" should occur
