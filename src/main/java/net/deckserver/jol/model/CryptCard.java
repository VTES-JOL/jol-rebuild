package net.deckserver.jol.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * A crypt card — either a Vampire or an Imbued.
 *
 * Disciplines contain space-separated codes preserving case:
 *   lowercase = inferior (e.g. "ani"), UPPERCASE = superior (e.g. "ANI").
 * For Imbued cards these are virtue codes (mar, inn, jud, def, red, viz, ven).
 *
 * Clan holds the vampire clan or the Imbued creed (Martyr, Judge, etc.).
 *
 * Group is "1"–"7" or "ANY" (Anarch Convert, New Blood).
 */
@RegisterForReflection
public record CryptCard(
        String id,
        String name,
        List<String> aka,
        String cardText,
        String artist,
        boolean banned,
        CryptType type,
        String clan,
        String path,
        String group,
        boolean advanced,
        int capacity,
        List<String> disciplines,
        String title
) implements Card {}