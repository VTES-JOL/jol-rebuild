
create sequence DeckFormatValidity_SEQ start with 1 increment by 50;

create table deck_format_validity (
    id          bigint not null,
    deck_id     bigint not null,
    format      varchar(32) not null,
    valid       boolean not null,
    errors      jsonb,
    computed_at timestamp(6) with time zone not null,
    primary key (id),
    unique (deck_id, format)
);

alter table deck_format_validity
    add constraint fk_dfv_deck
    foreign key (deck_id)
    references Deck
    on delete cascade;
