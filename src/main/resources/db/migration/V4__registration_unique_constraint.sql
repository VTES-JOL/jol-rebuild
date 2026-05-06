alter table Registration
    add constraint uq_registration_game_user unique (game_id, user_id);
