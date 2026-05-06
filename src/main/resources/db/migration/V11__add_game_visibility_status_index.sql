-- Composite index for the two high-traffic open/active game list queries that
-- filter by both visibility and status simultaneously.
CREATE INDEX idx_game_visibility_status ON game(visibility, status);
