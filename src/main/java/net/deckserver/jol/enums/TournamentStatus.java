package net.deckserver.jol.enums;

import io.quarkus.runtime.annotations.RegisterForReflection;

/*
Tournament Status
STARTING - TOURNAMENT_ADMIN can edit prior to registration start date, players can register between registration start and end date
SETUP - TOURNAMENT_ADMIN can create table / seat allocations
ACTIVE - Players can play their tables between play start and end date
SEEDING - Play end date complete, seeding for final table active
FINALS - Finalists can play at final table
COMPLETED - tournament closed, results available
 */
@RegisterForReflection
public enum TournamentStatus {
    SETUP, REGISTRATION, SEATING, ACTIVE, SEEDING, FINALS, COMPLETED
}
