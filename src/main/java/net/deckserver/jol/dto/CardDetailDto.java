package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * Full card data — used by /cards/details, /cards/{id}/detail, and /cards/autocomplete.
 * A single type covers deck enrichment, icon rendering, and search suggestions.
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
        boolean advanced,
        List<String> sets,
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
