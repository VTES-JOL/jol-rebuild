-- Tables now span the whole tournament lifetime.
-- Round number moves from tournament_table onto tournament_seat.
-- A new tournament_table_game join table links (table, round) → game.
-- original_number_of_rounds is captured on beginSeating to enforce the +1 extra-round cap.

-- 1. Add round_number to tournament_seat and populate it before dropping source columns

ALTER TABLE tournament_seat ADD COLUMN round_number INT;

UPDATE tournament_seat ts
SET round_number = tt.round_number
FROM tournament_table tt
WHERE ts.table_id = tt.id AND ts.bye = false;

UPDATE tournament_seat
SET round_number = bye_round
WHERE bye = true;

ALTER TABLE tournament_seat ALTER COLUMN round_number SET NOT NULL;

ALTER TABLE tournament_seat DROP COLUMN bye_round;

-- 2. Migrate game_id off tournament_table into a dedicated join table

CREATE TABLE tournament_table_game (
    id          BIGSERIAL PRIMARY KEY,
    table_id    BIGINT NOT NULL REFERENCES tournament_table(id),
    round_number INT   NOT NULL,
    game_id     BIGINT NOT NULL REFERENCES game(id)
);

INSERT INTO tournament_table_game (table_id, round_number, game_id)
SELECT id, round_number, game_id
FROM tournament_table
WHERE game_id IS NOT NULL;

ALTER TABLE tournament_table DROP COLUMN game_id;
ALTER TABLE tournament_table DROP COLUMN round_number;

-- 3. Track the originally-configured round count so extra-round additions are capped at +1

ALTER TABLE tournament ADD COLUMN original_number_of_rounds INT NOT NULL DEFAULT 0;

UPDATE tournament
SET original_number_of_rounds = number_of_rounds
WHERE status IN ('SEATING', 'ACTIVE', 'SEEDING', 'FINALS', 'COMPLETED');
