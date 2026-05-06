-- Performance indexes for high-traffic foreign key columns and query patterns.

CREATE INDEX idx_registration_game     ON registration(game_id);
CREATE INDEX idx_registration_user     ON registration(user_id);
CREATE INDEX idx_game_owner            ON game(owner_id);
CREATE INDEX idx_chat_messages_game    ON chat_messages(gameid);
CREATE INDEX idx_chat_messages_time    ON chat_messages(timestamp DESC);
CREATE INDEX idx_deck_user             ON deck(user_id);
CREATE INDEX idx_deck_format_validity  ON deck_format_validity(deck_id);
CREATE INDEX idx_tournament_table      ON tournament_table(tournament_id);
CREATE INDEX idx_tournament_seat_reg   ON tournament_seat(registration_id);
CREATE INDEX idx_tournament_seat_round ON tournament_seat(registration_id, round_number);
CREATE INDEX idx_treg_tournament       ON tournament_registration(tournament_id);
CREATE INDEX idx_treg_user             ON tournament_registration(user_id);
CREATE INDEX idx_user_roles_user       ON user_roles(user_id);
