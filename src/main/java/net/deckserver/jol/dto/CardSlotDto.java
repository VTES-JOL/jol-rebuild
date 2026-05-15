package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Positional slot for a hidden card — conveys state visible to opponents (e.g. blood counters
 * on uncontrolled vampires) without revealing the card's identity or UUID.
 */
@RegisterForReflection
public class CardSlotDto {
    public int index;
    public int counters;
    public boolean locked;
    public int childCount;
}
