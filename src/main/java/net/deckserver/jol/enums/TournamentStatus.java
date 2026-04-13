package net.deckserver.jol.enums;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum TournamentStatus {
    Starting, Active, Seeding, Finals, Completed
}
