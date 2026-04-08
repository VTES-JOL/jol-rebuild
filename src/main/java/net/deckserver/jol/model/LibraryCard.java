package net.deckserver.jol.model;

import java.util.List;

/**
 * A library card.
 *
 * types — one or more card types, split from the "/" delimited Type column
 *   (e.g. ["Action", "Combat"]).
 *
 * requirementClans — zero or more clan requirements, split from "/" delimited Clan column.
 *
 * andDisciplines — disciplines where ALL must be present on the acting vampire
 *   (original "A & B" form in the data).
 *
 * orDisciplines — disciplines where ANY ONE is sufficient
 *   (original "A/B/C" form in the data). A single discipline with no delimiter
 *   is placed here for consistency.
 *
 * Costs are null when not applicable, -1 when variable (X).
 *
 * burnOption — true when the Burn Option column contains "Y" or "Yes".
 */
public record LibraryCard(
        String id,
        String name,
        List<String> aka,
        String cardText,
        String artist,
        boolean banned,
        String flavorText,
        List<String> types,
        List<String> requirementClans,
        String requirementPath,
        List<String> andDisciplines,
        List<String> orDisciplines,
        Integer poolCost,
        Integer bloodCost,
        Integer convictionCost,
        boolean burnOption
) implements Card {}