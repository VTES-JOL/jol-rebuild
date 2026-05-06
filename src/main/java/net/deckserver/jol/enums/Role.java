package net.deckserver.jol.enums;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum Role {
    USER,
    ADMIN,
    SUPER_USER,
    JUDGE,
    PLAYTESTER,
    TOURNAMENT_ADMIN
}
