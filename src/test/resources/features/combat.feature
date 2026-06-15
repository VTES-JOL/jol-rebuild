Feature: Combat system

  Background:
    Given a 4-player game in "MINION" phase with rules enforced
    And "Alice" controls a ready vampire "VampA" with 3 blood and capacity 5
    And "Bob" controls a ready vampire "VampB" with 3 blood and capacity 5

  Scenario: StartCombat requires existing minions
    When "Alice" starts combat with "VampA" vs a non-existent card
    Then a rule violation should occur

  Scenario: StartCombat opens BEFORE_RANGE impulse window
    When "Alice" starts combat between "VampA" and "VampB"
    Then combat is active with attacker "VampA" and defender "VampB"
    And the combat step is "BEFORE_RANGE"
    And an impulse window is open with context "COMBAT"

  Scenario: All-pass in BEFORE_RANGE advances to DETERMINE_RANGE
    When "Alice" starts combat between "VampA" and "VampB"
    And all combatants pass the combat impulse window
    Then the combat step is "DETERMINE_RANGE"

  Scenario: Maneuver changes range during DETERMINE_RANGE
    When "Alice" starts combat between "VampA" and "VampB"
    And all combatants pass the combat impulse window
    And "Alice" maneuvers "VampA" to range "LONG"
    Then the combat range is "LONG"

  Scenario: All-pass in DETERMINE_RANGE advances to BEFORE_STRIKES
    When "Alice" starts combat between "VampA" and "VampB"
    And all combatants pass the combat impulse window
    And all combatants pass the combat impulse window
    Then the combat step is "BEFORE_STRIKES"

  Scenario: All-pass in BEFORE_STRIKES advances to STRIKE_DECLARATION
    When "Alice" starts combat between "VampA" and "VampB"
    And all combatants pass the combat impulse window
    And all combatants pass the combat impulse window
    And all combatants pass the combat impulse window
    Then the combat step is "STRIKE_DECLARATION"

  Scenario: Both combatants declaring HAND strikes opens the damage prevention window
    When "Alice" starts combat between "VampA" and "VampB"
    And all combatants pass the combat impulse window
    And all combatants pass the combat impulse window
    And all combatants pass the combat impulse window
    And "Alice" declares a "HAND" strike for "VampA"
    And "Bob" declares a "HAND" strike for "VampB"
    Then the damage prevention window is open

  Scenario: Vampire with insufficient blood goes to torpor when damage resolves
    Given "Carol" controls a ready vampire "VampC" with 1 blood and capacity 5
    And "Dave" controls a ready vampire "VampD" with 3 blood and capacity 5
    When "Carol" starts combat between "VampC" and "VampD"
    And all combatants pass the combat impulse window
    And all combatants pass the combat impulse window
    And all combatants pass the combat impulse window
    And "Carol" declares a "HAND" strike for "VampC"
    And "Dave" declares a "HAND" strike for "VampD"
    And the combat damage prevention window closes
    Then "VampC" is in torpor

  Scenario: Both pressing CONTINUE starts a new round
    When "Alice" starts combat between "VampA" and "VampB"
    And the combat reaches the press step
    And "Alice" declares press "CONTINUE" for "VampA"
    And "Bob" declares press "CONTINUE" for "VampB"
    Then the combat round is 2
    And the combat step is "BEFORE_RANGE"

  Scenario: Press END ends combat and resolves a continuing action
    Given there is a pending action in status "ACTION_CONTINUING"
    When "Alice" starts combat between "VampA" and "VampB"
    And the combat reaches the press step
    And "Alice" declares press "END" for "VampA"
    And "Bob" declares press "END" for "VampB"
    And all combat ending windows complete
    Then combat is cleared
    And the action status should be "DURING_ACTION"
