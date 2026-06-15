Feature: Referendum engine

  Background:
    Given a 4-player game in "MINION" phase with rules enforced

  Scenario: Political action opens a referendum with acting player's 1 built-in vote
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    Then a referendum should be open
    And the referendum should not be in polling yet
    And "Alice" should have 1 vote for in the referendum
    And no rule violation should occur

  Scenario: OpenPolling transitions referendum to polling state
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    Then the referendum polling should be open
    And no rule violation should occur

  Scenario: A Prince casts 2 votes for the referendum
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Alice" controls a ready vampire "Maris Streck" with 3 blood and capacity 5
    And "Maris Streck" has title "Prince"
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    And "Alice" casts 2 votes FOR with "Maris Streck"
    Then the referendum should have 3 votes for and 0 against
    And no rule violation should occur

  Scenario: A titled vampire cannot cast more votes than its title allows
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Alice" controls a ready vampire "Maris Streck" with 3 blood and capacity 5
    And "Maris Streck" has title "Prince"
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    And "Alice" tries to cast 3 votes FOR with "Maris Streck"
    Then a rule violation should occur

  Scenario: Burning a political action card from hand adds 1 vote
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Alice" has a "Kine Resources Contested" POLITICAL card in hand
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    And "Alice" burns "Kine Resources Contested" FOR a vote
    Then the referendum should have 2 votes for and 0 against
    And "Kine Resources Contested" should be in the ash heap
    And no rule violation should occur

  Scenario: A player can only burn one political action card per referendum
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Alice" has a "Kine Resources Contested" POLITICAL card in hand
    And "Alice" has a "Parity Shift" POLITICAL card in hand
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    And "Alice" burns "Kine Resources Contested" FOR a vote
    And "Alice" burns "Parity Shift" FOR a vote
    Then a rule violation should occur

  Scenario: Burning the Edge adds 1 vote and clears Edge holder
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Alice" holds the Edge
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    And "Alice" burns the Edge FOR a vote
    Then the referendum should have 2 votes for and 0 against
    And no player should hold the Edge
    And no rule violation should occur

  Scenario: Prisci majority FOR contributes 3 votes for
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Alice" controls a ready vampire "Marcus Vitel" with 3 blood and capacity 5
    And "Marcus Vitel" has title "Priscus"
    And "Bob" controls a ready vampire "Democritus" with 3 blood and capacity 5
    And "Democritus" has title "Priscus"
    And "Carol" controls a ready vampire "Alicia Varela" with 3 blood and capacity 5
    And "Alicia Varela" has title "Priscus"
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    And "Alice" casts a Prisci ballot FOR with "Marcus Vitel"
    And "Bob" casts a Prisci ballot FOR with "Democritus"
    And "Carol" casts a Prisci ballot AGAINST with "Alicia Varela"
    Then the Prisci contribution should be 3 votes for
    And no rule violation should occur

  Scenario: Tied Prisci ballots contribute 0 votes
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Alice" controls a ready vampire "Marcus Vitel" with 3 blood and capacity 5
    And "Marcus Vitel" has title "Priscus"
    And "Bob" controls a ready vampire "Democritus" with 3 blood and capacity 5
    And "Democritus" has title "Priscus"
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    And "Alice" casts a Prisci ballot FOR with "Marcus Vitel"
    And "Bob" casts a Prisci ballot AGAINST with "Democritus"
    Then the Prisci contribution should be 0 votes

  Scenario: ClosePolling with majority FOR passes the referendum
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Alice" controls a ready vampire "Maris Streck" with 3 blood and capacity 5
    And "Maris Streck" has title "Prince"
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    And "Alice" casts 2 votes FOR with "Maris Streck"
    And "Alice" closes polling
    Then the referendum should have passed
    And no referendum should be open
    And no rule violation should occur

  Scenario: ClosePolling with tied votes fails the referendum
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Bob" controls a ready vampire "Don Cruez" with 3 blood and capacity 5
    And "Don Cruez" has title "Prince"
    When "Alice" declares a POLITICAL action
    And all players pass the impulse window
    And "Alice" resolves the action
    And "Alice" opens polling
    And "Bob" casts 2 votes AGAINST with "Don Cruez"
    And "Alice" closes polling
    Then the referendum should have failed
    And no referendum should be open
    And no rule violation should occur
