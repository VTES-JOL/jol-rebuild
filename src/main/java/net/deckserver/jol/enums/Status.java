package net.deckserver.jol.enums;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum Status {
    OPEN, ACTIVE, FINISHED, ABANDONED
}
