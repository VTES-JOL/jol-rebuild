create sequence chat_message_reactions_SEQ start with 1 increment by 50;

create sequence chat_messages_SEQ start with 1 increment by 50;

create sequence Deck_SEQ start with 1 increment by 50;

create sequence Game_SEQ start with 1 increment by 50;

create sequence Preferences_SEQ start with 1 increment by 50;

create sequence Registration_SEQ start with 1 increment by 50;

create table chat_message_reactions
(
    id         bigint      not null,
    message_id bigint      not null,
    emoji      varchar(32) not null,
    sender     varchar(64) not null,
    primary key (id),
    unique (message_id, sender, emoji)
);

create table chat_messages
(
    id          bigint                      not null,
    reply_to_id bigint,
    timestamp   timestamp(6) with time zone not null,
    gameId      varchar(64),
    sender      varchar(64)                 not null,
    content     TEXT                        not null,
    primary key (id)
);

create table Deck
(
    id       bigint       not null,
    name     varchar(255),
    summary  varchar(255),
    user_id  varchar(255) not null,
    contents jsonb,
    primary key (id)
);

create table Game
(
    format     smallint check ((format between 0 and 3)),
    status     smallint check ((status between 0 and 3)),
    visibility smallint check ((visibility between 0 and 1)),
    id         bigint not null,
    name       varchar(255),
    owner_id   varchar(255),
    primary key (id)
);

create table Preferences
(
    enable_images boolean,
    id            bigint not null,
    country_code  varchar(255),
    zone_id       varchar(255),
    primary key (id)
);

create table Registration
(
    game_id     bigint,
    id          bigint not null,
    lastUpdated timestamp(6) with time zone,
    deckName    varchar(255),
    summary     varchar(255),
    user_id     varchar(255),
    deck        jsonb,
    primary key (id)
);

create table user_roles
(
    role    varchar(255),
    user_id varchar(255) not null
);

create table users
(
    preferences_id bigint unique,
    discord_id     varchar(255),
    email          varchar(255),
    id             varchar(255) not null,
    password       varchar(255),
    tournament_id  varchar(255),
    username       varchar(255) unique,
    primary key (id)
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

alter table if exists Game
    add constraint FK54vf37bphh5oxul11wfe8h0l8
    foreign key (owner_id)
    references users;

alter table if exists Registration
    add constraint FKr6fdx5jnap7pig9r6u10a2xfy
    foreign key (game_id)
    references Game;

alter table if exists Registration
    add constraint FK29sthtfonowruif3oe6pxusr0
    foreign key (user_id)
    references users;

alter table if exists user_roles
    add constraint FKhfh9dx7w3ubf1co1vdev94g3f
    foreign key (user_id)
    references users;

alter table if exists users
    add constraint FK8dqakvw0yliauwe53454he0um
    foreign key (preferences_id)
    references Preferences;
