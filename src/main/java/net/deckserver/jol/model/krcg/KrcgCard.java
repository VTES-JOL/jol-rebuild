package net.deckserver.jol.model.krcg;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * A single card entry as it appears in KRCG JSON — used in both crypt and
 * library (as the leaf nodes inside each type group).
 */
@RegisterForReflection
public record KrcgCard(String id, int count, String name) {}
