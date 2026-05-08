create table chat_message_reactions
(
    emoji      varchar(32)  not null,
    sender     varchar(64)  not null,
    id         varchar(255) not null,
    message_id varchar(255) not null,
    primary key (id),
    unique (message_id, sender, emoji)
);

create table chat_messages
(
    timestamp   timestamp(6) with time zone not null,
    gameId      varchar(64),
    sender      varchar(64)                 not null,
    content     TEXT                        not null,
    id          varchar(255)                not null,
    reply_to_id varchar(255),
    primary key (id)
);

create table Deck
(
    timestamp timestamp(6) with time zone not null,
    comments  TEXT,
    id        varchar(255)                not null,
    name      varchar(255),
    summary   varchar(255),
    user_id   varchar(255)                not null,
    contents  jsonb,
    primary key (id)
);

create table deck_format_validity
(
    valid       boolean                     not null,
    computed_at timestamp(6) with time zone not null,
    format      varchar(32)                 not null check ((format in ('STANDARD', 'DUEL', 'V5'))),
    deck_id     varchar(255)                not null,
    id          varchar(255)                not null,
    errors      jsonb,
    primary key (id),
    unique (deck_id, format)
);

create table Game
(
    format        smallint check ((format between 0 and 2)),
    status        smallint check ((status between 0 and 3)),
    visibility    smallint check ((visibility between 0 and 1)),
    created_at    timestamp(6) with time zone,
    updated_at    timestamp(6) with time zone,
    game_state    TEXT,
    id            varchar(255) not null,
    name          varchar(255),
    owner_id      varchar(255),
    tournament_id varchar(255),
    primary key (id)
);

create table Registration
(
    created_at   timestamp(6) with time zone,
    last_updated timestamp(6) with time zone,
    updated_at   timestamp(6) with time zone,
    version      bigint       not null,
    deck_name    varchar(255),
    game_id      varchar(255),
    id           varchar(255) not null,
    summary      varchar(255),
    user_id      varchar(255),
    deck         jsonb,
    primary key (id)
);

create table Tournament
(
    final_round               boolean,
    number_of_rounds          integer,
    original_number_of_rounds integer,
    requires_id               boolean,
    created_at                timestamp(6) with time zone,
    playing_end               timestamp(6) with time zone,
    playing_start             timestamp(6) with time zone,
    registration_end          timestamp(6) with time zone,
    registration_start        timestamp(6) with time zone,
    updated_at                timestamp(6) with time zone,
    format                    varchar(255) check ((format in ('SINGLE_DECK', 'MULTI_DECK'))),
    game_format               varchar(255) check ((game_format in ('STANDARD', 'DUEL', 'V5'))),
    id                        varchar(255) not null,
    name                      varchar(255),
    status                    varchar(255) check ((status in
                                                   ('SETUP', 'REGISTRATION', 'SEATING', 'ACTIVE', 'SEEDING', 'FINALS',
                                                    'COMPLETED'))),
    conditions                jsonb,
    rules                     jsonb,
    primary key (id)
);

create table tournament_registration
(
    id            varchar(255) not null,
    tournament_id varchar(255),
    user_id       varchar(255),
    decks         jsonb,
    primary key (id),
    unique (tournament_id, user_id)
);

create table tournament_seat
(
    bye             boolean      not null,
    round_number    integer,
    seat_position   integer,
    id              varchar(255) not null,
    registration_id varchar(255),
    table_id        varchar(255),
    primary key (id)
);

create table tournament_table
(
    createdAt     timestamp(6) with time zone,
    id            varchar(255) not null,
    tournament_id varchar(255),
    primary key (id)
);

create table tournament_table_game
(
    round_number integer,
    game_id      varchar(255),
    id           varchar(255) not null,
    table_id     varchar(255),
    primary key (id)
);

create table user_roles
(
    role    varchar(255),
    user_id varchar(255) not null
);

create table users
(
    discord_id    varchar(255),
    email         varchar(255) not null,
    id            varchar(255) not null,
    password      varchar(255) not null,
    tournament_id varchar(255),
    username      varchar(255) not null,
    preferences   jsonb,
    primary key (id),
    unique (username)
);

alter table if exists chat_message_reactions
    add constraint FK5r5vgdnjj6k6ivkdokg4yqrpv
        foreign key (message_id)
            references chat_messages;

alter table if exists chat_messages
    add constraint FKbrvto53oo11ra25g8y5ynlojw
        foreign key (reply_to_id)
            references chat_messages;

alter table if exists Deck
    add constraint FK4itpbacchvns32g0tmg9yoxvt
        foreign key (user_id)
            references users;

alter table if exists deck_format_validity
    add constraint FKgmkoinvx5c6g831rq8jlp99u2
        foreign key (deck_id)
            references Deck
            on delete cascade;

alter table if exists Game
    add constraint FK54vf37bphh5oxul11wfe8h0l8
        foreign key (owner_id)
            references users;

alter table if exists Game
    add constraint FKa5etox4o0n9ad6t34yy9nxbxq
        foreign key (tournament_id)
            references Tournament;

alter table if exists Registration
    add constraint FKr6fdx5jnap7pig9r6u10a2xfy
        foreign key (game_id)
            references Game;

alter table if exists Registration
    add constraint FK29sthtfonowruif3oe6pxusr0
        foreign key (user_id)
            references users;

alter table if exists tournament_registration
    add constraint FKk7pm8i5i4uwhdwdqppkt6xpay
        foreign key (tournament_id)
            references Tournament;

alter table if exists tournament_registration
    add constraint FKrw0yongchpdod8y1g4yb560k1
        foreign key (user_id)
            references users;

alter table if exists tournament_seat
    add constraint FK2ra26cjb6x509ny0n29yqyfcg
        foreign key (registration_id)
            references tournament_registration;

alter table if exists tournament_seat
    add constraint FK5v9qgy1sx46fpew13hqjfluej
        foreign key (table_id)
            references tournament_table;

alter table if exists tournament_table
    add constraint FKiam03r19df8jgggqloashgqkh
        foreign key (tournament_id)
            references Tournament
            on delete cascade;

alter table if exists tournament_table_game
    add constraint FKb4854gmp8cldlhb0u12xat9k3
        foreign key (game_id)
            references Game;

alter table if exists tournament_table_game
    add constraint FKaavtj75riqaab6fek99b6cars
        foreign key (table_id)
            references tournament_table;

alter table if exists user_roles
    add constraint FKhfh9dx7w3ubf1co1vdev94g3f
        foreign key (user_id)
            references users;