-- Migrate all entity primary keys and foreign keys from bigint to uuid.
-- Existing rows are cleared (truncated) because legacy numeric IDs cannot be
-- cast to uuid; import.sql re-seeds dev data and prod data is managed separately.

-- ── 1. Drop FK constraints (leaf tables first) ────────────────────────────────

ALTER TABLE tournament_table_game DROP CONSTRAINT IF EXISTS tournament_table_game_table_id_fkey;
ALTER TABLE tournament_table_game DROP CONSTRAINT IF EXISTS tournament_table_game_game_id_fkey;

ALTER TABLE tournament_seat DROP CONSTRAINT IF EXISTS fkiam03r19df8jgggqloashgqkh;
ALTER TABLE tournament_seat DROP CONSTRAINT IF EXISTS fk_seat_registration;

ALTER TABLE tournament_table DROP CONSTRAINT IF EXISTS fk_ttable_tournament;

ALTER TABLE tournament_registration DROP CONSTRAINT IF EXISTS fk_treg_tournament;
ALTER TABLE tournament_registration DROP CONSTRAINT IF EXISTS fk_treg_user;

ALTER TABLE deck_format_validity DROP CONSTRAINT IF EXISTS fk_dfv_deck;

ALTER TABLE registration DROP CONSTRAINT IF EXISTS FKr6fdx5jnap7pig9r6u10a2xfy;
ALTER TABLE registration DROP CONSTRAINT IF EXISTS FK29sthtfonowruif3oe6pxusr0;

ALTER TABLE chat_message_reactions DROP CONSTRAINT IF EXISTS FK5r5vgdnjj6k6ivkdokg4yqrpv;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS FKbrvto53oo11ra25g8y5ynlojw;

-- ── 2. Truncate all tables with bigint IDs (cascade handles child rows) ───────

TRUNCATE TABLE tournament_table_game CASCADE;
TRUNCATE TABLE tournament_seat CASCADE;
TRUNCATE TABLE tournament_table CASCADE;
TRUNCATE TABLE tournament_registration CASCADE;
TRUNCATE TABLE tournament CASCADE;
TRUNCATE TABLE registration CASCADE;
TRUNCATE TABLE deck_format_validity CASCADE;
TRUNCATE TABLE chat_message_reactions CASCADE;
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE "Deck" CASCADE;
TRUNCATE TABLE "Game" CASCADE;
TRUNCATE TABLE "Preferences" CASCADE;

-- ── 3. Drop sequences ──────────────────────────────────────────────────────────

DROP SEQUENCE IF EXISTS chat_message_reactions_seq;
DROP SEQUENCE IF EXISTS chat_messages_seq;
DROP SEQUENCE IF EXISTS "Deck_SEQ";
DROP SEQUENCE IF EXISTS "Game_SEQ";
DROP SEQUENCE IF EXISTS "Preferences_SEQ";
DROP SEQUENCE IF EXISTS "Registration_SEQ";
DROP SEQUENCE IF EXISTS "DeckFormatValidity_SEQ";

-- ── 4. Alter primary key columns to uuid ──────────────────────────────────────

ALTER TABLE chat_message_reactions ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE chat_messages          ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE chat_messages          ALTER COLUMN reply_to_id TYPE uuid USING NULL;

ALTER TABLE "Deck"                 ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE deck_format_validity   ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE deck_format_validity   ALTER COLUMN deck_id TYPE uuid USING gen_random_uuid();

ALTER TABLE "Game"                 ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE "Preferences"          ALTER COLUMN id TYPE uuid USING gen_random_uuid();

ALTER TABLE registration           ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE registration           ALTER COLUMN game_id TYPE uuid USING NULL;

ALTER TABLE tournament             ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE tournament_registration ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE tournament_registration ALTER COLUMN tournament_id TYPE uuid USING gen_random_uuid();

ALTER TABLE tournament_table       ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE tournament_table       ALTER COLUMN tournament_id TYPE uuid USING gen_random_uuid();

ALTER TABLE tournament_seat        ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE tournament_seat        ALTER COLUMN table_id TYPE uuid USING NULL;
ALTER TABLE tournament_seat        ALTER COLUMN registration_id TYPE uuid USING gen_random_uuid();

ALTER TABLE tournament_table_game  ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE tournament_table_game  ALTER COLUMN table_id TYPE uuid USING gen_random_uuid();
ALTER TABLE tournament_table_game  ALTER COLUMN game_id TYPE uuid USING gen_random_uuid();

-- users.preferences_id already references Preferences; update its type too
ALTER TABLE users ALTER COLUMN preferences_id TYPE uuid USING NULL;

-- ── 5. Re-add FK constraints ───────────────────────────────────────────────────

ALTER TABLE chat_message_reactions
    ADD CONSTRAINT fk_reaction_message
    FOREIGN KEY (message_id) REFERENCES chat_messages(id);

ALTER TABLE chat_messages
    ADD CONSTRAINT fk_message_reply
    FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id);

ALTER TABLE "Deck"
    ADD CONSTRAINT fk_deck_user
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE deck_format_validity
    ADD CONSTRAINT fk_dfv_deck
    FOREIGN KEY (deck_id) REFERENCES "Deck"(id) ON DELETE CASCADE;

ALTER TABLE "Game"
    ADD CONSTRAINT fk_game_owner
    FOREIGN KEY (owner_id) REFERENCES users(id);

ALTER TABLE registration
    ADD CONSTRAINT fk_reg_game
    FOREIGN KEY (game_id) REFERENCES "Game"(id);

ALTER TABLE registration
    ADD CONSTRAINT fk_reg_user
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE users
    ADD CONSTRAINT fk_user_preferences
    FOREIGN KEY (preferences_id) REFERENCES "Preferences"(id);

ALTER TABLE tournament_registration
    ADD CONSTRAINT fk_treg_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournament(id);

ALTER TABLE tournament_registration
    ADD CONSTRAINT fk_treg_user
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE tournament_table
    ADD CONSTRAINT fk_ttable_tournament
    FOREIGN KEY (tournament_id) REFERENCES tournament(id);

ALTER TABLE tournament_seat
    ADD CONSTRAINT fk_seat_table
    FOREIGN KEY (table_id) REFERENCES tournament_table(id);

ALTER TABLE tournament_seat
    ADD CONSTRAINT fk_seat_registration
    FOREIGN KEY (registration_id) REFERENCES tournament_registration(id);

ALTER TABLE tournament_table_game
    ADD CONSTRAINT fk_ttg_table
    FOREIGN KEY (table_id) REFERENCES tournament_table(id);

ALTER TABLE tournament_table_game
    ADD CONSTRAINT fk_ttg_game
    FOREIGN KEY (game_id) REFERENCES "Game"(id);
