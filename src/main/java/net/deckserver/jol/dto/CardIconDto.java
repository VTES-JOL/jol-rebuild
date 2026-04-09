package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * Returned by /cards/icons — the subset of card data needed to render icons in the deck editor.
 *
 * Crypt-only fields: clan, path, capacity, disciplines.
 * Library-only fields: andDisciplines, orDisciplines, requirementClans, requirementPath, poolCost, bloodCost.
 */
@RegisterForReflection
public record CardIconDto(
        String id,
        boolean crypt,
        // Crypt
        String clan,
        String path,
        Integer capacity,
        List<String> disciplines,
        // Library
        List<String> andDisciplines,
        List<String> orDisciplines,
        List<String> requirementClans,
        String requirementPath,
        Integer poolCost,
        Integer bloodCost
) {}