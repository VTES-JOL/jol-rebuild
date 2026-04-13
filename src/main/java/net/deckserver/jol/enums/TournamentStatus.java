package net.deckserver.jol.enums;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum TournamentStatus {
    STARTING, ACTIVE, SEEDING, FINALS, COMPLETED
}
