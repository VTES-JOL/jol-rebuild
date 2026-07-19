-- The Strip ('linear') and Table ('circular') board layouts are retired;
-- existing preferences fold into the Stage board.
update users
set preferences = jsonb_set(preferences, '{defaultBoard}', '"stage"')
where preferences ->> 'defaultBoard' in ('linear', 'circular');
