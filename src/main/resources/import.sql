-- ============================================================
-- JOL Quarkus Dev Mode Sample Data
--
-- Users:       Player1–Player10 (USER) + Admin1 (USER, ADMIN, TOURNAMENT_ADMIN)
-- Password:    "password" for all accounts
-- Decks:       5 real KRCG tournament decks (2025 season)
-- Games:       8 games across all formats, statuses, and visibilities
-- Tournaments: 4 tournaments spanning SETUP → COMPLETED
-- ============================================================

-- ── Users ────────────────────────────────────────────────────

INSERT INTO users (id, username, password, email, discord_id, tournament_id, preferences) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Player1',  '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player1@test.com',  NULL, NULL, '{"countryCode":"US","zoneId":"America/New_York","enableImages":true}'),
  ('00000000-0000-0000-0000-000000000002', 'Player2',  '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player2@test.com',  NULL, NULL, '{"countryCode":"GB","zoneId":"Europe/London","enableImages":true}'),
  ('00000000-0000-0000-0000-000000000003', 'Player3',  '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player3@test.com',  NULL, NULL, '{"countryCode":"AU","zoneId":"Australia/Sydney","enableImages":true}'),
  ('00000000-0000-0000-0000-000000000004', 'Player4',  '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player4@test.com',  NULL, NULL, '{"countryCode":"FR","zoneId":"Europe/Paris","enableImages":true}'),
  ('00000000-0000-0000-0000-000000000005', 'Player5',  '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player5@test.com',  NULL, NULL, '{"countryCode":"DE","zoneId":"Europe/Berlin","enableImages":false}'),
  ('00000000-0000-0000-0000-000000000006', 'Player6',  '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player6@test.com',  NULL, NULL, '{"countryCode":"JP","zoneId":"Asia/Tokyo","enableImages":true}'),
  ('00000000-0000-0000-0000-000000000007', 'Player7',  '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player7@test.com',  NULL, NULL, '{"countryCode":"CA","zoneId":"America/Toronto","enableImages":true}'),
  ('00000000-0000-0000-0000-000000000008', 'Player8',  '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player8@test.com',  NULL, NULL, '{"countryCode":"NZ","zoneId":"Pacific/Auckland","enableImages":true}'),
  ('00000000-0000-0000-0000-000000000009', 'Player9',  '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player9@test.com',  NULL, NULL, '{"countryCode":"BR","zoneId":"America/Sao_Paulo","enableImages":true}'),
  ('00000000-0000-0000-0000-000000000010', 'Player10', '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'player10@test.com', NULL, NULL, '{"countryCode":null,"zoneId":"UTC","enableImages":true}'),
  ('00000000-0000-0000-0000-000000000099', 'Admin1',   '$2a$10$lRqqX9Yt5tPNuz1N8ZneSOSNU62DZ9uoCyw70FbQSAs2aDriRkiaK', 'admin1@test.com',   NULL, NULL, '{"countryCode":null,"zoneId":"UTC","enableImages":true}');

-- ── Roles ─────────────────────────────────────────────────────

INSERT INTO user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'USER'),
  ('00000000-0000-0000-0000-000000000002', 'USER'),
  ('00000000-0000-0000-0000-000000000003', 'USER'),
  ('00000000-0000-0000-0000-000000000004', 'USER'),
  ('00000000-0000-0000-0000-000000000005', 'USER'),
  ('00000000-0000-0000-0000-000000000006', 'USER'),
  ('00000000-0000-0000-0000-000000000007', 'USER'),
  ('00000000-0000-0000-0000-000000000008', 'USER'),
  ('00000000-0000-0000-0000-000000000009', 'USER'),
  ('00000000-0000-0000-0000-000000000010', 'USER'),
  ('00000000-0000-0000-0000-000000000099', 'USER'),
  ('00000000-0000-0000-0000-000000000099', 'ADMIN'),
  ('00000000-0000-0000-0000-000000000099', 'TOURNAMENT_ADMIN');

-- ── Decks (real 2025 KRCG tournament decks) ──────────────────

-- Deck 1: Gangrel Anarch Toolbox (Player1)
INSERT INTO deck (id, timestamp, name, summary, comments, user_id, contents) VALUES (
  '00000000-0000-0000-0000-000000000d01',
  '2025-01-20 10:00:00+00',
  'Gangrel Anarch Toolbox',
  '12,90,5/6',
  'Final Table: Gangrel V5 Toolbox — Cariocão de VtES 2025',
  '00000000-0000-0000-0000-000000000001',
  $d1${"name":"Gangrel Anarch Toolbox","comments":"Final Table: Gangrel V5 Toolbox > Malkshat > Tzim Living Manse > !Ventrue Blackhorse > Toreador Grand Ball\n","crypt":{"count":12,"cards":[{"count":2,"id":"200081","name":"André the Manipulator"},{"count":2,"id":"201521","name":"Casey Snyder"},{"count":2,"id":"201574","name":"Kuyén"},{"count":1,"id":"201602","name":"Massimiliano"},{"count":1,"id":"201601","name":"Martina Srnankova"},{"count":1,"id":"201597","name":"Kamile Paukstys"},{"count":1,"id":"201590","name":"Hanna Nokelainen"},{"count":1,"id":"201606","name":"Nathan Turner"},{"count":1,"id":"201592","name":"Indira"}]},"library":{"count":90,"cards":[{"type":"Master","count":21,"cards":[{"count":1,"id":"100052","name":"The Anarch Free Press"},{"count":1,"id":"100055","name":"Anarch Revolt"},{"count":1,"id":"100126","name":"Backways"},{"count":1,"id":"100366","name":"Club Illusion"},{"count":2,"id":"100545","name":"Direct Intervention"},{"count":1,"id":"100588","name":"Dreams of the Sphinx"},{"count":1,"id":"100609","name":"Ecoterrorists"},{"count":4,"id":"100616","name":"Effective Management"},{"count":1,"id":"100809","name":"Garibaldi-Meucci Museum"},{"count":1,"id":"100984","name":"Information Highway"},{"count":1,"id":"101439","name":"Powerbase: Montreal"},{"count":1,"id":"101811","name":"Smiling Jack, The Anarch"},{"count":3,"id":"102113","name":"Vessel"},{"count":2,"id":"102121","name":"Villein"}]},{"type":"Action","count":21,"cards":[{"count":1,"id":"100093","name":"Army of Rats"},{"count":2,"id":"100416","name":"Constant Revolution"},{"count":4,"id":"100515","name":"Deep Song"},{"count":1,"id":"100716","name":"Fee Stake: Perth"},{"count":1,"id":"101632","name":"Rewilding"},{"count":12,"id":"101972","name":"Thing"}]},{"type":"Ally","count":1,"cards":[{"count":1,"id":"102220","name":"Double Deuce"}]},{"type":"Equipment","count":1,"cards":[{"count":1,"id":"100903","name":"Heart of Nizchetus"}]},{"type":"Retainer","count":1,"cards":[{"count":1,"id":"101249","name":"Mr. Winthrop"}]},{"type":"Action Modifier","count":5,"cards":[{"count":3,"id":"100600","name":"Earth Control"},{"count":2,"id":"101239","name":"Monkey Wrench"}]},{"type":"Action Modifier/Reaction","count":3,"cards":[{"count":3,"id":"102223","name":"Form of the Bat"}]},{"type":"Reaction","count":22,"cards":[{"count":6,"id":"102218","name":"Bait and Switch"},{"count":4,"id":"102219","name":"Deep Ecology"},{"count":2,"id":"100519","name":"Delaying Tactics"},{"count":10,"id":"102230","name":"Organized Resistance"}]},{"type":"Combat","count":15,"cards":[{"count":2,"id":"100356","name":"Claws of the Dead"},{"count":10,"id":"100601","name":"Earth Meld"},{"count":3,"id":"100771","name":"Form of Mist"}]}]}}$d1$
);

-- Deck 2: Shalmath (Player2)
INSERT INTO deck (id, timestamp, name, summary, comments, user_id, contents) VALUES (
  '00000000-0000-0000-0000-000000000d02',
  '2025-01-25 14:00:00+00',
  'Shalmath Colecionador de Cabeças',
  '12,78,5/6',
  'Fee Stake: Fortaleza 2025 — Ally toolbox',
  '00000000-0000-0000-0000-000000000002',
  $d2${"name":"Shalmath Colecionador de Cabeças","comments":"Description: My version\n","crypt":{"count":12,"cards":[{"count":5,"id":"201274","name":"Shalmath"},{"count":2,"id":"200076","name":"Anarch Convert"},{"count":1,"id":"200080","name":"Andre LeRoux"},{"count":1,"id":"200365","name":"Donald Cargill"},{"count":1,"id":"200482","name":"Freddy Gage"},{"count":1,"id":"200641","name":"Iris Bennett"},{"count":1,"id":"201462","name":"Walker Grimes"}]},"library":{"count":78,"cards":[{"type":"Master","count":12,"cards":[{"count":2,"id":"100545","name":"Direct Intervention"},{"count":1,"id":"100824","name":"Giant's Blood"},{"count":1,"id":"101067","name":"KRCG News Radio"},{"count":2,"id":"101388","name":"Perfectionist"},{"count":2,"id":"101536","name":"The Rack"},{"count":1,"id":"101924","name":"Tabriz Assembly"},{"count":2,"id":"102113","name":"Vessel"},{"count":1,"id":"102189","name":"WMRH Talk Radio"}]},{"type":"Action","count":13,"cards":[{"count":1,"id":"100079","name":"Aranthebes, The Immortal"},{"count":9,"id":"101897","name":"Summon History"},{"count":3,"id":"101902","name":"The Summoning"}]},{"type":"Ally","count":7,"cards":[{"count":1,"id":"100298","name":"Carlton Van Wyk"},{"count":1,"id":"100929","name":"High Top"},{"count":1,"id":"101250","name":"Muddled Vampire Hunter"},{"count":1,"id":"101261","name":"Mylan Horseed"},{"count":1,"id":"101333","name":"Ossian"},{"count":1,"id":"101419","name":"Ponticulus"},{"count":1,"id":"101600","name":"Remnant of the Endless Storm"}]},{"type":"Equipment","count":9,"cards":[{"count":1,"id":"100071","name":"The Ankara Citadel, Turkey"},{"count":3,"id":"100903","name":"Heart of Nizchetus"},{"count":2,"id":"101681","name":"The Sargon Fragment"},{"count":3,"id":"101860","name":"Starshell Grenade Launcher"}]},{"type":"Action Modifier","count":18,"cards":[{"count":12,"id":"100571","name":"Domain of Evernight"},{"count":4,"id":"100645","name":"Enkil Cog"},{"count":2,"id":"101935","name":"Tangle Atropos' Hand"}]},{"type":"Reaction","count":1,"cards":[{"count":1,"id":"101633","name":"Rewind Time"}]},{"type":"Combat","count":16,"cards":[{"count":6,"id":"100511","name":"Decapitate"},{"count":10,"id":"101338","name":"Outside the Hourglass"}]},{"type":"Event","count":2,"cards":[{"count":2,"id":"102079","name":"The Unmasking"}]}]}}$d2$
);

-- Deck 3: The Path of Enkidu (Player3)
INSERT INTO deck (id, timestamp, name, summary, comments, user_id, contents) VALUES (
  '00000000-0000-0000-0000-000000000d03',
  '2025-02-01 09:00:00+00',
  'The Path of Enkidu',
  '12,90,4/5',
  'Adeus 2025 — Heavy combat toolbox',
  '00000000-0000-0000-0000-000000000003',
  $d3${"name":"The Path of Enkidu","crypt":{"count":12,"cards":[{"count":4,"id":"200424","name":"Enkidu, The Noah"},{"count":2,"id":"200435","name":"Ermenegildo, The Rake"},{"count":2,"id":"201104","name":"Paulo de Castille"},{"count":1,"id":"200046","name":"Alessandro Garcia"},{"count":1,"id":"200497","name":"Gavrylo"},{"count":1,"id":"200829","name":"Leila Monroe"},{"count":1,"id":"201459","name":"Volo"}]},"library":{"count":90,"cards":[{"type":"Master","count":13,"cards":[{"count":1,"id":"100303","name":"Carver's Meat Packing and Storage"},{"count":1,"id":"100588","name":"Dreams of the Sphinx"},{"count":2,"id":"100698","name":"Fame"},{"count":1,"id":"100824","name":"Giant's Blood"},{"count":1,"id":"101242","name":"Monster"},{"count":1,"id":"101958","name":"Tension in the Ranks"},{"count":2,"id":"102113","name":"Vessel"},{"count":3,"id":"102121","name":"Villein"},{"count":1,"id":"102199","name":"Yawp Court"}]},{"type":"Action","count":9,"cards":[{"count":3,"id":"102309","name":"Abuse of Power"},{"count":2,"id":"100515","name":"Deep Song"},{"count":1,"id":"100852","name":"Graverobbing"},{"count":3,"id":"102333","name":"Pillars Fall"}]},{"type":"Equipment","count":1,"cards":[{"count":1,"id":"100239","name":"The Book of Going Forth by Night"}]},{"type":"Retainer","count":1,"cards":[{"count":1,"id":"102344","name":"Twisted Bloodhound"}]},{"type":"Action Modifier","count":7,"cards":[{"count":3,"id":"100761","name":"Forced March"},{"count":4,"id":"100788","name":"Freak Drive"}]},{"type":"Action Modifier/Combat","count":4,"cards":[{"count":4,"id":"101736","name":"Shadow Boxing"}]},{"type":"Reaction","count":8,"cards":[{"count":3,"id":"100518","name":"Deflection"},{"count":1,"id":"100519","name":"Delaying Tactics"},{"count":2,"id":"101717","name":"Sense the Savage Way"},{"count":2,"id":"102339","name":"Sentry Signal"}]},{"type":"Combat","count":47,"cards":[{"count":3,"id":"100356","name":"Claws of the Dead"},{"count":4,"id":"100585","name":"Drawing Out the Beast"},{"count":5,"id":"100749","name":"Flesh of Marble"},{"count":3,"id":"100918","name":"Hidden Strength"},{"count":3,"id":"102329","name":"Hunting the Quarry"},{"count":8,"id":"100959","name":"Immortal Grapple"},{"count":4,"id":"101523","name":"Pursuit"},{"count":6,"id":"102340","name":"Soulgrinder"},{"count":5,"id":"101945","name":"Taste of Vitae"},{"count":5,"id":"102347","name":"Wall of Filth"},{"count":1,"id":"102190","name":"Wolf Claws"}]}]}}$d3$
);

-- Deck 4: Popó (Player4)
INSERT INTO deck (id, timestamp, name, summary, comments, user_id, contents) VALUES (
  '00000000-0000-0000-0000-000000000d04',
  '2025-02-10 16:00:00+00',
  'Popó',
  '13,90,1/2',
  'Torneio dos Herdeiros — Appolonius combat rush',
  '00000000-0000-0000-0000-000000000004',
  $d4${"name":"Popó","crypt":{"count":13,"cards":[{"count":4,"id":"200126","name":"Appolonius (ADV)"},{"count":1,"id":"200125","name":"Appolonius"},{"count":4,"id":"200076","name":"Anarch Convert"},{"count":2,"id":"200705","name":"Jimmy Dunn"},{"count":1,"id":"201187","name":"Richter, The Templar of Du Mont"},{"count":1,"id":"200652","name":"Jack"}]},"library":{"count":90,"cards":[{"type":"Master","count":18,"cards":[{"count":1,"id":"100052","name":"The Anarch Free Press"},{"count":1,"id":"100085","name":"Archon Investigation"},{"count":1,"id":"100297","name":"Carfax Abbey"},{"count":1,"id":"100526","name":"Depravity"},{"count":1,"id":"100588","name":"Dreams of the Sphinx"},{"count":1,"id":"100698","name":"Fame"},{"count":1,"id":"100740","name":"Flames of Insurrection"},{"count":1,"id":"100809","name":"Garibaldi-Meucci Museum"},{"count":1,"id":"101100","name":"Libertas"},{"count":1,"id":"101242","name":"Monster"},{"count":1,"id":"101435","name":"Powerbase: Los Angeles"},{"count":1,"id":"101958","name":"Tension in the Ranks"},{"count":5,"id":"102121","name":"Villein"},{"count":1,"id":"102180","name":"Wider View"}]},{"type":"Action","count":15,"cards":[{"count":2,"id":"100747","name":"Fleetness"},{"count":1,"id":"100913","name":"Heroic Might"},{"count":5,"id":"101085","name":"Legacy"},{"count":3,"id":"102229","name":"Line Brawl"},{"count":1,"id":"101324","name":"Open War"},{"count":3,"id":"101483","name":"Preternatural Strength"}]},{"type":"Action Modifier","count":7,"cards":[{"count":1,"id":"100645","name":"Enkil Cog"},{"count":4,"id":"100761","name":"Forced March"},{"count":2,"id":"100788","name":"Freak Drive"}]},{"type":"Reaction","count":14,"cards":[{"count":4,"id":"102218","name":"Bait and Switch"},{"count":2,"id":"100519","name":"Delaying Tactics"},{"count":2,"id":"101321","name":"On the Qui Vive"},{"count":4,"id":"102230","name":"Organized Resistance"},{"count":2,"id":"101501","name":"Protection Racket"}]},{"type":"Combat","count":36,"cards":[{"count":2,"id":"100232","name":"Bollix"},{"count":3,"id":"100549","name":"Disarm"},{"count":7,"id":"100563","name":"Diversion"},{"count":5,"id":"100597","name":"Dust Up"},{"count":8,"id":"100959","name":"Immortal Grapple"},{"count":2,"id":"101071","name":"Lam Into"},{"count":2,"id":"101523","name":"Pursuit"},{"count":2,"id":"101649","name":"Rolling with the Punches"},{"count":5,"id":"101945","name":"Taste of Vitae"}]}]}}$d4$
);

-- Deck 5: Banu bleed (Player5)
INSERT INTO deck (id, timestamp, name, summary, comments, user_id, contents) VALUES (
  '00000000-0000-0000-0000-000000000d05',
  '2025-03-01 12:00:00+00',
  'Banu bleed',
  '12,80,5/6',
  'Falha Bestial 2025 — Banu Haqim stealth bleed',
  '00000000-0000-0000-0000-000000000005',
  $d5${"name":"Banu bleed","comments":"Last week I played in Liga Fest with a Path of Power and Inner Voice and voting was a hassle. Everyone had titled vampires, no one was willing to negotiate. So for this tournment I decided to go with a deck that didn't rely in any table talk whatsoever.\n-- I cruised the first 2 rounds quite easily. Got 4 VP and 1 GW in the first table (with 4 players), then 5 VP and 1 GW in the next, puting me in first place drawed with my dear friend Roberto Mautone, who was playing a serious not meme deck like I was.\n","crypt":{"count":12,"cards":[{"count":4,"id":"201596","name":"Kalinda (G6)"},{"count":2,"id":"201472","name":"Wise Frog"},{"count":2,"id":"200062","name":"Alu"},{"count":1,"id":"201599","name":"Khadija Al-Kindi"},{"count":1,"id":"201655","name":"Arjun Shah"},{"count":1,"id":"201589","name":"Greg Mazouni"},{"count":1,"id":"201636","name":"Adisa"}]},"library":{"count":80,"cards":[{"type":"Master","count":17,"cards":[{"count":1,"id":"100435","name":"The Coven"},{"count":1,"id":"100588","name":"Dreams of the Sphinx"},{"count":8,"id":"102226","name":"Haqim's Law: Retribution"},{"count":1,"id":"100984","name":"Information Highway"},{"count":1,"id":"101042","name":"The Khabar: Community"},{"count":1,"id":"101310","name":"Obfuscate"},{"count":1,"id":"101355","name":"The Parthenon"},{"count":3,"id":"102121","name":"Villein"}]},{"type":"Action","count":7,"cards":[{"count":3,"id":"100633","name":"The Embrace"},{"count":2,"id":"101043","name":"Khabar: Glory"},{"count":2,"id":"102165","name":"Web of Knives Recruit"}]},{"type":"Action Modifier","count":14,"cards":[{"count":2,"id":"100362","name":"Cloak the Gathering"},{"count":2,"id":"100617","name":"Elder Impersonation"},{"count":2,"id":"100687","name":"Faceless Night"},{"count":4,"id":"101125","name":"Lost in Crowds"},{"count":2,"id":"101857","name":"Spying Mission"},{"count":2,"id":"102097","name":"Veil the Legions"}]},{"type":"Action Modifier/Combat","count":37,"cards":[{"count":6,"id":"101610","name":"Resist Earth's Grasp"},{"count":31,"id":"101913","name":"Swallowed by the Night"}]},{"type":"Combat","count":3,"cards":[{"count":3,"id":"102185","name":"Wind Dance"}]},{"type":"Event","count":2,"cards":[{"count":1,"id":"100163","name":"The Bitter and Sweet Story"},{"count":1,"id":"101265","name":"Narrow Minds"}]}]}}$d5$
);

-- ── Deck Format Validity ──────────────────────────────────────

INSERT INTO deck_format_validity (id, deck_id, format, valid, errors, computed_at) VALUES
  ('00000000-0000-0000-0000-000000000f01', '00000000-0000-0000-0000-000000000d01', 'STANDARD', true,  NULL, '2025-01-20 10:01:00+00'),
  ('00000000-0000-0000-0000-000000000f02', '00000000-0000-0000-0000-000000000d02', 'STANDARD', true,  NULL, '2025-01-25 14:01:00+00'),
  ('00000000-0000-0000-0000-000000000f03', '00000000-0000-0000-0000-000000000d03', 'STANDARD', true,  NULL, '2025-02-01 09:01:00+00'),
  ('00000000-0000-0000-0000-000000000f04', '00000000-0000-0000-0000-000000000d04', 'STANDARD', true,  NULL, '2025-02-10 16:01:00+00'),
  ('00000000-0000-0000-0000-000000000f05', '00000000-0000-0000-0000-000000000d05', 'STANDARD', true,  NULL, '2025-03-01 12:01:00+00'),
  ('00000000-0000-0000-0000-000000000f06', '00000000-0000-0000-0000-000000000d05', 'DUEL',     false, '["Duel format requires exactly 40 library cards and a crypt of at least 2."]', '2025-03-01 12:01:00+00');

-- ── Games ─────────────────────────────────────────────────────
-- format: STANDARD=0, DUEL=1, V5=2
-- status: OPEN=0, ACTIVE=1, FINISHED=2, ABANDONED=3
-- visibility: PUBLIC=0, PRIVATE=1

INSERT INTO game (id, name, format, status, visibility, owner_id, tournament_id, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000a01', 'Shadow Conclave',    0, 0, 0, '00000000-0000-0000-0000-000000000001', NULL, '2026-04-01 10:00:00+00', '2026-04-01 12:00:00+00'),  -- STANDARD, OPEN,      PUBLIC
  ('00000000-0000-0000-0000-000000000a02', 'Blood Moon Rising',  0, 1, 0, '00000000-0000-0000-0000-000000000002', NULL, '2026-03-28 08:00:00+00', '2026-03-28 09:20:00+00'),  -- STANDARD, ACTIVE,    PUBLIC
  ('00000000-0000-0000-0000-000000000a03', 'The Final Dusk',     0, 2, 0, '00000000-0000-0000-0000-000000000003', NULL, '2026-02-15 09:00:00+00', '2026-02-15 10:20:00+00'),  -- STANDARD, FINISHED,  PUBLIC
  ('00000000-0000-0000-0000-000000000a04', 'Crimson Accord',     1, 0, 1, '00000000-0000-0000-0000-000000000004', NULL, '2026-04-10 07:00:00+00', '2026-04-10 08:00:00+00'),  -- DUEL,     OPEN,      PRIVATE
  ('00000000-0000-0000-0000-000000000a05', 'Velvet Masquerade',  1, 1, 0, '00000000-0000-0000-0000-000000000005', NULL, '2026-04-05 14:00:00+00', '2026-04-05 15:05:00+00'),  -- DUEL,     ACTIVE,    PUBLIC
  ('00000000-0000-0000-0000-000000000a06', 'Ancient Reckoning',  2, 0, 0, '00000000-0000-0000-0000-000000000006', NULL, '2026-04-12 08:00:00+00', '2026-04-12 09:30:00+00'),  -- V5,       OPEN,      PUBLIC
  ('00000000-0000-0000-0000-000000000a07', 'Midnight Tribunal',  0, 1, 1, '00000000-0000-0000-0000-000000000007', NULL, '2026-04-08 17:00:00+00', '2026-04-08 18:20:00+00'),  -- STANDARD, ACTIVE,    PRIVATE
  ('00000000-0000-0000-0000-000000000a08', 'Forsaken Covenant',  0, 3, 0, '00000000-0000-0000-0000-000000000008', NULL, '2026-03-20 13:00:00+00', '2026-03-20 14:30:00+00');  -- STANDARD, ABANDONED, PUBLIC

-- ── Game Registrations ────────────────────────────────────────
-- deck IS NULL  → invited (no deck chosen yet)
-- deck NOT NULL → registered with a deck

INSERT INTO registration (id, game_id, user_id, deck, deck_name, summary, last_updated, version, created_at, updated_at) VALUES

  -- Game 1 (OPEN): Player1 registered, Player2+3 invited
  ('00000000-0000-0000-0000-000000000r01', '00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000001', '{"name":"Gangrel Anarch Toolbox","crypt":{"count":12,"cards":[{"count":2,"id":"200081","name":"André the Manipulator"},{"count":2,"id":"201521","name":"Casey Snyder"},{"count":2,"id":"201574","name":"Kuyén"},{"count":1,"id":"201602","name":"Massimiliano"},{"count":1,"id":"201601","name":"Martina Srnankova"},{"count":1,"id":"201597","name":"Kamile Paukstys"},{"count":1,"id":"201590","name":"Hanna Nokelainen"},{"count":1,"id":"201606","name":"Nathan Turner"},{"count":1,"id":"201592","name":"Indira"}]},"library":{"count":90,"cards":[{"type":"Master","count":21,"cards":[{"count":1,"id":"100052","name":"The Anarch Free Press"},{"count":4,"id":"100616","name":"Effective Management"},{"count":3,"id":"102113","name":"Vessel"},{"count":2,"id":"102121","name":"Villein"}]},{"type":"Action","count":21,"cards":[{"count":4,"id":"100515","name":"Deep Song"},{"count":12,"id":"101972","name":"Thing"}]},{"type":"Reaction","count":22,"cards":[{"count":10,"id":"102230","name":"Organized Resistance"},{"count":6,"id":"102218","name":"Bait and Switch"}]},{"type":"Combat","count":15,"cards":[{"count":10,"id":"100601","name":"Earth Meld"},{"count":3,"id":"100771","name":"Form of Mist"}]}]}}', 'Gangrel Anarch Toolbox', 'Crypt: 12, Library: 90', '2026-04-01 10:00:00+00', 0, '2026-04-01 10:00:00+00', '2026-04-01 10:00:00+00'),
  ('00000000-0000-0000-0000-000000000r02', '00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000002', NULL, NULL, NULL, '2026-04-01 11:00:00+00', 0, '2026-04-01 11:00:00+00', '2026-04-01 11:00:00+00'),
  ('00000000-0000-0000-0000-000000000r03', '00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000003', NULL, NULL, NULL, '2026-04-01 12:00:00+00', 0, '2026-04-01 12:00:00+00', '2026-04-01 12:00:00+00'),

  -- Game 2 (ACTIVE, STANDARD): all 5 registered
  ('00000000-0000-0000-0000-000000000r04', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000002', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Shalmath Colecionador de Cabecas', 'Crypt: 12, Library: 78', '2026-03-28 09:00:00+00', 0, '2026-03-28 09:00:00+00', '2026-03-28 09:00:00+00'),
  ('00000000-0000-0000-0000-000000000r05', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000003', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'The Path of Enkidu',            'Crypt: 12, Library: 90', '2026-03-28 09:05:00+00', 0, '2026-03-28 09:05:00+00', '2026-03-28 09:05:00+00'),
  ('00000000-0000-0000-0000-000000000r06', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000004', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Popo',                          'Crypt: 13, Library: 90', '2026-03-28 09:10:00+00', 0, '2026-03-28 09:10:00+00', '2026-03-28 09:10:00+00'),
  ('00000000-0000-0000-0000-000000000r07', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000005', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Banu bleed',                    'Crypt: 12, Library: 80', '2026-03-28 09:15:00+00', 0, '2026-03-28 09:15:00+00', '2026-03-28 09:15:00+00'),
  ('00000000-0000-0000-0000-000000000r08', '00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000006', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Camarilla Toolbox',             'Crypt: 12, Library: 90', '2026-03-28 09:20:00+00', 0, '2026-03-28 09:20:00+00', '2026-03-28 09:20:00+00'),

  -- Game 3 (FINISHED, STANDARD): all 5 registered
  ('00000000-0000-0000-0000-000000000r09', '00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000003', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'The Path of Enkidu',  'Crypt: 12, Library: 90', '2026-02-15 10:00:00+00', 0, '2026-02-15 10:00:00+00', '2026-02-15 10:00:00+00'),
  ('00000000-0000-0000-0000-000000000r10', '00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000004', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Popo',                'Crypt: 13, Library: 90', '2026-02-15 10:05:00+00', 0, '2026-02-15 10:05:00+00', '2026-02-15 10:05:00+00'),
  ('00000000-0000-0000-0000-000000000r11', '00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000005', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Banu bleed',          'Crypt: 12, Library: 80', '2026-02-15 10:10:00+00', 0, '2026-02-15 10:10:00+00', '2026-02-15 10:10:00+00'),
  ('00000000-0000-0000-0000-000000000r12', '00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000006', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Camarilla Toolbox',   'Crypt: 12, Library: 90', '2026-02-15 10:15:00+00', 0, '2026-02-15 10:15:00+00', '2026-02-15 10:15:00+00'),
  ('00000000-0000-0000-0000-000000000r13', '00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000007', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Tremere Vote Control', 'Crypt: 12, Library: 90', '2026-02-15 10:20:00+00', 0, '2026-02-15 10:20:00+00', '2026-02-15 10:20:00+00'),

  -- Game 4 (OPEN DUEL, PRIVATE): Player4 invited only
  ('00000000-0000-0000-0000-000000000r14', '00000000-0000-0000-0000-000000000a04', '00000000-0000-0000-0000-000000000004', NULL, NULL, NULL, '2026-04-10 08:00:00+00', 0, '2026-04-10 08:00:00+00', '2026-04-10 08:00:00+00'),

  -- Game 5 (ACTIVE DUEL): both registered
  ('00000000-0000-0000-0000-000000000r15', '00000000-0000-0000-0000-000000000a05', '00000000-0000-0000-0000-000000000005', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Banu bleed',       'Crypt: 12, Library: 80', '2026-04-05 15:00:00+00', 0, '2026-04-05 15:00:00+00', '2026-04-05 15:00:00+00'),
  ('00000000-0000-0000-0000-000000000r16', '00000000-0000-0000-0000-000000000a05', '00000000-0000-0000-0000-000000000006', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Camarilla Toolbox', 'Crypt: 12, Library: 90', '2026-04-05 15:05:00+00', 0, '2026-04-05 15:05:00+00', '2026-04-05 15:05:00+00'),

  -- Game 6 (OPEN V5): Player6+7 invited only
  ('00000000-0000-0000-0000-000000000r17', '00000000-0000-0000-0000-000000000a06', '00000000-0000-0000-0000-000000000006', NULL, NULL, NULL, '2026-04-12 09:00:00+00', 0, '2026-04-12 09:00:00+00', '2026-04-12 09:00:00+00'),
  ('00000000-0000-0000-0000-000000000r18', '00000000-0000-0000-0000-000000000a06', '00000000-0000-0000-0000-000000000007', NULL, NULL, NULL, '2026-04-12 09:30:00+00', 0, '2026-04-12 09:30:00+00', '2026-04-12 09:30:00+00'),

  -- Game 7 (ACTIVE, PRIVATE): all 5 registered
  ('00000000-0000-0000-0000-000000000r19', '00000000-0000-0000-0000-000000000a07', '00000000-0000-0000-0000-000000000007', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Tremere Vote Control', 'Crypt: 12, Library: 90', '2026-04-08 18:00:00+00', 0, '2026-04-08 18:00:00+00', '2026-04-08 18:00:00+00'),
  ('00000000-0000-0000-0000-000000000r20', '00000000-0000-0000-0000-000000000a07', '00000000-0000-0000-0000-000000000008', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Ventrue Lawfirm',      'Crypt: 12, Library: 90', '2026-04-08 18:05:00+00', 0, '2026-04-08 18:05:00+00', '2026-04-08 18:05:00+00'),
  ('00000000-0000-0000-0000-000000000r21', '00000000-0000-0000-0000-000000000a07', '00000000-0000-0000-0000-000000000009', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Ravnos Bleed',         'Crypt: 12, Library: 90', '2026-04-08 18:10:00+00', 0, '2026-04-08 18:10:00+00', '2026-04-08 18:10:00+00'),
  ('00000000-0000-0000-0000-000000000r22', '00000000-0000-0000-0000-000000000a07', '00000000-0000-0000-0000-000000000010', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Malkavian Madness',    'Crypt: 12, Library: 90', '2026-04-08 18:15:00+00', 0, '2026-04-08 18:15:00+00', '2026-04-08 18:15:00+00'),
  ('00000000-0000-0000-0000-000000000r23', '00000000-0000-0000-0000-000000000a07', '00000000-0000-0000-0000-000000000001', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Gangrel Anarch Toolbox','Crypt: 12, Library: 90', '2026-04-08 18:20:00+00', 0, '2026-04-08 18:20:00+00', '2026-04-08 18:20:00+00'),

  -- Game 8 (ABANDONED): Player8 invited, Player9 registered
  ('00000000-0000-0000-0000-000000000r24', '00000000-0000-0000-0000-000000000a08', '00000000-0000-0000-0000-000000000008', NULL, NULL, NULL, '2026-03-20 14:00:00+00', 0, '2026-03-20 14:00:00+00', '2026-03-20 14:00:00+00'),
  ('00000000-0000-0000-0000-000000000r25', '00000000-0000-0000-0000-000000000a08', '00000000-0000-0000-0000-000000000009', '{"name":"Test Deck","crypt":{"count":12,"cards":[{"id":"200076","count":12,"name":"Anarch Convert"}]},"library":{"count":60,"cards":[{"type":"Master","count":60,"cards":[{"id":"102121","count":60,"name":"Villein"}]}]}}', 'Ravnos Bleed', 'Crypt: 12, Library: 90', '2026-03-20 14:30:00+00', 0, '2026-03-20 14:30:00+00', '2026-03-20 14:30:00+00');

-- ── Tournaments ───────────────────────────────────────────────

INSERT INTO tournament (id, name, format, game_format, number_of_rounds, original_number_of_rounds, final_round, requires_id, status, registration_start, registration_end, playing_start, playing_end, rules, conditions, created_at, updated_at) VALUES
  -- T1: COMPLETED — full data with seating history (3 rounds: 2 regular + 1 final)
  ('00000000-0000-0000-0000-000000000t01', 'Grand Camarilla Open',   'SINGLE_DECK', 'STANDARD', 3, 2, true,  false, 'COMPLETED',
    '2025-01-01 00:00:00+00', '2025-01-14 23:59:59+00', '2025-01-15 09:00:00+00', '2025-01-15 20:00:00+00',
    '[]', '[]', '2025-01-01 00:00:00+00', '2025-01-15 20:00:00+00'),
  -- T2: ACTIVE — round 1 seated, round 2 pending
  ('00000000-0000-0000-0000-000000000t02', 'Anarch Freedom Cup',     'MULTI_DECK',  'STANDARD', 2, 2, false, false, 'ACTIVE',
    '2026-03-01 00:00:00+00', '2026-03-14 23:59:59+00', '2026-03-15 09:00:00+00', NULL,
    '[]', '[]', '2026-03-01 00:00:00+00', '2026-03-15 09:00:00+00'),
  -- T3: REGISTRATION — accepting sign-ups, no seating yet
  ('00000000-0000-0000-0000-000000000t03', 'V5 Championship Series', 'SINGLE_DECK', 'V5',       2, 0, true,  true,  'REGISTRATION',
    '2026-04-20 00:00:00+00', '2026-05-01 23:59:59+00', '2026-05-10 09:00:00+00', NULL,
    '[]', '[]', '2026-04-20 00:00:00+00', '2026-04-20 00:00:00+00'),
  -- T4: SETUP — not yet open for registration
  ('00000000-0000-0000-0000-000000000t04', 'Duel Master Invitational','SINGLE_DECK','DUEL',      2, 0, false, false, 'SETUP',
    '2026-06-01 00:00:00+00', '2026-06-14 23:59:59+00', '2026-06-15 09:00:00+00', NULL,
    '[]', '[]', '2026-06-01 00:00:00+00', '2026-06-01 00:00:00+00');

-- ── Tournament Registrations ──────────────────────────────────

INSERT INTO tournament_registration (id, tournament_id, user_id, decks) VALUES
  -- Tournament 1 (COMPLETED): Player1–Player8
  ('00000000-0000-0000-0000-000000000e01', '00000000-0000-0000-0000-000000000t01', '00000000-0000-0000-0000-000000000001', '[{"deckName":"Gangrel Anarch Toolbox","summary":"Crypt: 12, Library: 90"}]'),
  ('00000000-0000-0000-0000-000000000e02', '00000000-0000-0000-0000-000000000t01', '00000000-0000-0000-0000-000000000002', '[{"deckName":"Shalmath Colecionador de Cabecas","summary":"Crypt: 12, Library: 78"}]'),
  ('00000000-0000-0000-0000-000000000e03', '00000000-0000-0000-0000-000000000t01', '00000000-0000-0000-0000-000000000003', '[{"deckName":"The Path of Enkidu","summary":"Crypt: 12, Library: 90"}]'),
  ('00000000-0000-0000-0000-000000000e04', '00000000-0000-0000-0000-000000000t01', '00000000-0000-0000-0000-000000000004', '[{"deckName":"Popo","summary":"Crypt: 13, Library: 90"}]'),
  ('00000000-0000-0000-0000-000000000e05', '00000000-0000-0000-0000-000000000t01', '00000000-0000-0000-0000-000000000005', '[{"deckName":"Banu bleed","summary":"Crypt: 12, Library: 80"}]'),
  ('00000000-0000-0000-0000-000000000e06', '00000000-0000-0000-0000-000000000t01', '00000000-0000-0000-0000-000000000006', '[{"deckName":"Camarilla Toolbox","summary":"Crypt: 12, Library: 90"}]'),
  ('00000000-0000-0000-0000-000000000e07', '00000000-0000-0000-0000-000000000t01', '00000000-0000-0000-0000-000000000007', '[{"deckName":"Tremere Vote Control","summary":"Crypt: 12, Library: 90"}]'),
  ('00000000-0000-0000-0000-000000000e08', '00000000-0000-0000-0000-000000000t01', '00000000-0000-0000-0000-000000000008', '[{"deckName":"Ventrue Lawfirm","summary":"Crypt: 12, Library: 90"}]'),
  -- Tournament 2 (ACTIVE): Player1–Player6
  ('00000000-0000-0000-0000-000000000e09', '00000000-0000-0000-0000-000000000t02', '00000000-0000-0000-0000-000000000001', '[{"deckName":"Gangrel Anarch Toolbox","summary":"Crypt: 12, Library: 90"}]'),
  ('00000000-0000-0000-0000-000000000e10', '00000000-0000-0000-0000-000000000t02', '00000000-0000-0000-0000-000000000002', '[{"deckName":"Shalmath Colecionador de Cabecas","summary":"Crypt: 12, Library: 78"}]'),
  ('00000000-0000-0000-0000-000000000e11', '00000000-0000-0000-0000-000000000t02', '00000000-0000-0000-0000-000000000003', '[{"deckName":"The Path of Enkidu","summary":"Crypt: 12, Library: 90"}]'),
  ('00000000-0000-0000-0000-000000000e12', '00000000-0000-0000-0000-000000000t02', '00000000-0000-0000-0000-000000000004', '[{"deckName":"Popo","summary":"Crypt: 13, Library: 90"}]'),
  ('00000000-0000-0000-0000-000000000e13', '00000000-0000-0000-0000-000000000t02', '00000000-0000-0000-0000-000000000005', '[{"deckName":"Banu bleed","summary":"Crypt: 12, Library: 80"}]'),
  ('00000000-0000-0000-0000-000000000e14', '00000000-0000-0000-0000-000000000t02', '00000000-0000-0000-0000-000000000006', '[{"deckName":"Camarilla Toolbox","summary":"Crypt: 12, Library: 90"}]'),
  -- Tournament 3 (REGISTRATION): Player2, Player3, Player5
  ('00000000-0000-0000-0000-000000000e15', '00000000-0000-0000-0000-000000000t03', '00000000-0000-0000-0000-000000000002', '[{"deckName":"Shalmath Colecionador de Cabecas","summary":"Crypt: 12, Library: 78"}]'),
  ('00000000-0000-0000-0000-000000000e16', '00000000-0000-0000-0000-000000000t03', '00000000-0000-0000-0000-000000000003', '[{"deckName":"The Path of Enkidu","summary":"Crypt: 12, Library: 90"}]'),
  ('00000000-0000-0000-0000-000000000e17', '00000000-0000-0000-0000-000000000t03', '00000000-0000-0000-0000-000000000005', '[{"deckName":"Banu bleed","summary":"Crypt: 12, Library: 80"}]');

-- ── Tournament Tables ─────────────────────────────────────────

INSERT INTO tournament_table (id, tournament_id) VALUES
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000t01'),  -- T1 Table A
  ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000t01'),  -- T1 Table B
  ('00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-000000000t02');  -- T2 Table A

-- ── Tournament Seats ──────────────────────────────────────────

INSERT INTO tournament_seat (id, table_id, registration_id, seat_position, bye, round_number) VALUES
  -- T1 Round 1, Table A (P1–P4)
  ('00000000-0000-0000-0000-000000000s01', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e01', 1, false, 1),
  ('00000000-0000-0000-0000-000000000s02', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e02', 2, false, 1),
  ('00000000-0000-0000-0000-000000000s03', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e03', 3, false, 1),
  ('00000000-0000-0000-0000-000000000s04', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e04', 4, false, 1),
  -- T1 Round 1, Table B (P5–P8)
  ('00000000-0000-0000-0000-000000000s05', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e05', 1, false, 1),
  ('00000000-0000-0000-0000-000000000s06', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e06', 2, false, 1),
  ('00000000-0000-0000-0000-000000000s07', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e07', 3, false, 1),
  ('00000000-0000-0000-0000-000000000s08', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e08', 4, false, 1),
  -- T1 Round 2, Table A (P1, P6, P2, P7 — crossover seating)
  ('00000000-0000-0000-0000-000000000s09', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e01', 1, false, 2),
  ('00000000-0000-0000-0000-000000000s10', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e06', 2, false, 2),
  ('00000000-0000-0000-0000-000000000s11', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e02', 3, false, 2),
  ('00000000-0000-0000-0000-000000000s12', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e07', 4, false, 2),
  -- T1 Round 2, Table B (P4, P8, P5, P3)
  ('00000000-0000-0000-0000-000000000s13', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e03', 4, false, 2),
  ('00000000-0000-0000-0000-000000000s14', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e04', 1, false, 2),
  ('00000000-0000-0000-0000-000000000s15', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e08', 2, false, 2),
  ('00000000-0000-0000-0000-000000000s16', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e05', 3, false, 2),
  -- T1 Final (Round 3), Table A — top 5 scorers
  ('00000000-0000-0000-0000-000000000s17', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e01', 1, false, 3),
  ('00000000-0000-0000-0000-000000000s18', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e02', 2, false, 3),
  ('00000000-0000-0000-0000-000000000s19', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e06', 3, false, 3),
  ('00000000-0000-0000-0000-000000000s20', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e03', 4, false, 3),
  ('00000000-0000-0000-0000-000000000s21', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e07', 5, false, 3),
  -- T1 Round 3 byes — P4, P5, P8 did not qualify for the final
  ('00000000-0000-0000-0000-000000000s28', NULL, '00000000-0000-0000-0000-000000000e04', 0, true, 3),
  ('00000000-0000-0000-0000-000000000s29', NULL, '00000000-0000-0000-0000-000000000e05', 0, true, 3),
  ('00000000-0000-0000-0000-000000000s30', NULL, '00000000-0000-0000-0000-000000000e08', 0, true, 3),
  -- T2 Round 1, Table A (P1–P5)
  ('00000000-0000-0000-0000-000000000s22', '00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-000000000e09', 1, false, 1),
  ('00000000-0000-0000-0000-000000000s23', '00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-000000000e10', 2, false, 1),
  ('00000000-0000-0000-0000-000000000s24', '00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-000000000e11', 3, false, 1),
  ('00000000-0000-0000-0000-000000000s25', '00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-000000000e12', 4, false, 1),
  ('00000000-0000-0000-0000-000000000s26', '00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-000000000e13', 5, false, 1),
  -- T2 Round 1, P6 receives a bye
  ('00000000-0000-0000-0000-000000000s27', NULL, '00000000-0000-0000-0000-000000000e14', 0, true, 1);
