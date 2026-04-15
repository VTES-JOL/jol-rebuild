-- Migrate preferences from a separate table to a JSONB column on users

ALTER TABLE users ADD COLUMN preferences jsonb;

UPDATE users u
SET preferences = json_build_object(
    'countryCode', p.country_code,
    'zoneId', p.zone_id,
    'enableImages', p.enable_images
)
FROM "Preferences" p
WHERE u.preferences_id = p.id;

UPDATE users SET preferences = '{"enableImages":true}'::jsonb WHERE preferences IS NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS FK8dqakvw0yliauwe53454he0um;
ALTER TABLE users DROP COLUMN preferences_id;

DROP TABLE "Preferences";
DROP SEQUENCE IF EXISTS "Preferences_SEQ";
