package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * Full card data returned by /cards/details.
 * Combines the entry metadata from CardSuggestionDto (types, group, banned)
 * with the display data from CardIconDto (clan, disciplines, costs, etc.)
 * so a single fetch provides everything the deck editor needs.
 *
 * For crypt cards: types = ["Vampire"] or ["Imbued"], group = "1"–"7"|"ANY".
 * For library cards: types = card type list, group = null.
 */
@RegisterForReflection
public record CardDetailDto(
        String id,
        String name,
        boolean crypt,
        // Entry metadata
        List<String> types,
        String group,
        boolean banned,
        // Crypt display data
        String clan,
        String path,
        Integer capacity,
        List<String> disciplines,
        // Library display data
        List<String> andDisciplines,
        List<String> orDisciplines,
        List<String> requirementClans,
        String requirementPath,
        Integer poolCost,
        Integer bloodCost
) {}
