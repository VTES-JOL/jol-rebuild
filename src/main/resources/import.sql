INSERT INTO preferences (enable_images, id, country_code, zone_id) VALUES (true, 9000, NULL, 'Australia/Brisbane');
INSERT INTO preferences (enable_images, id, country_code, zone_id) VALUES (true, 9001, NULL, 'Pacific/Auckland');
INSERT INTO users (preferences_id, discord_id, email, id, password, tournament_id, username) VALUES (9000, NULL, 'shannon.dowley@gmail.com', '5ef41d62-05b6-49a2-8ee2-816e83da54d5', '$2a$10$2/gKRPgCxx9bJHn6bmJNJ.Ug9PtEp7tgt4BlZJfeXCFkDr6Sk0KlC', NULL, 'ShanDow');
INSERT INTO users (preferences_id, discord_id, email, id, password, tournament_id, username) VALUES (9001, NULL, 'shade_nz@gmail.com', 'bdd85b37-d82b-4044-b0e9-cce08f12737b', '$2a$10$SKTmu84V5nCOtb8.IMrJXOIi282pwyAzzEs.z3Xtwd4LCm/vliY7.', NULL, 'shade_nz');
INSERT INTO user_roles (role, user_id) VALUES ('USER', '5ef41d62-05b6-49a2-8ee2-816e83da54d5');
INSERT INTO user_roles (role, user_id) VALUES ('USER', 'bdd85b37-d82b-4044-b0e9-cce08f12737b');
INSERT INTO user_roles (role, user_id) VALUES ('TOURNAMENT_ADMIN', '5ef41d62-05b6-49a2-8ee2-816e83da54d5');
