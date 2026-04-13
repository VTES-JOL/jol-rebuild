INSERT INTO preferences (enable_images, id, country_code, zone_id) VALUES (true, 1, NULL, 'Australia/Brisbane');
INSERT INTO users (preferences_id, discord_id, email, id, password, tournament_id, username) VALUES (1, NULL, 'shannon.dowley@gmail.com', '5ef41d62-05b6-49a2-8ee2-816e83da54d5', '$2a$10$2/gKRPgCxx9bJHn6bmJNJ.Ug9PtEp7tgt4BlZJfeXCFkDr6Sk0KlC', NULL, 'ShanDow');
INSERT INTO user_roles (role, user_id) VALUES ('USER', '5ef41d62-05b6-49a2-8ee2-816e83da54d5');
INSERT INTO user_roles (role, user_id) VALUES ('TOURNAMENT_ADMIN', '5ef41d62-05b6-49a2-8ee2-816e83da54d5');
