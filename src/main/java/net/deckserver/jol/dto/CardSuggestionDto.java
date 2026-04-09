package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * Returned by /cards/autocomplete.
 *
 * Used by the chat autocomplete (id, name only) and the deck editor (all fields).
 *
 * group    — crypt only: "1"–"7" | "ANY". Null for library cards.
 * cryptType — "Vampire" or "Imbued" for crypt cards. Null for library cards.
 * types    — library card types (e.g. ["Action", "Combat"]). Empty for crypt cards.
 * banned   — true when the card has a ban date in the data.
 */
@RegisterForReflection
public record CardSuggestionDto(
        String id,
        String name,
        boolean crypt,
        String group,
        String cryptType,
        List<String> types,
        boolean banned
) {}
