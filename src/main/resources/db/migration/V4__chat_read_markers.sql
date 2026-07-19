create table chat_read_markers
(
    id                varchar(255)                not null,
    gameId            varchar(64)                 not null,
    username          varchar(64)                 not null,
    lastReadMessageId varchar(255)                not null,
    updatedAt         timestamp(6) with time zone not null,
    primary key (id),
    unique (gameId, username)
);
