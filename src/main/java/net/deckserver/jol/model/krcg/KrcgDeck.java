package net.deckserver.jol.model.krcg;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;
import java.util.stream.Stream;

/**
 * Root model for a KRCG-format deck document.
 *
 * <pre>{@code
 * {
 *   "name":     "Bleed com Bleed",           // optional
 *   "comments": "Description: ...",           // optional
 *   "crypt":    { "count": 12, "cards": [...] },
 *   "library":  { "count": 60, "cards": [ { "type": "Action", "count": 8, "cards": [...] } ] }
 * }
 * }</pre>
 *
 * Optional fields are omitted from serialisation when null.
 */
@RegisterForReflection
@JsonInclude(JsonInclude.Include.NON_NULL)
public record KrcgDeck(String name, String comments, KrcgCrypt crypt, KrcgLibrary library) {

    /** Convenience: all crypt cards as a flat list. */
    public List<KrcgCard> cryptCards() {
        return crypt == null ? List.of() : crypt.cards();
    }

    /** Convenience: all library cards flattened across type groups. */
    public List<KrcgCard> libraryCards() {
        if (library == null) return List.of();
        return library.cards().stream()
                .flatMap(g -> g.cards().stream())
                .toList();
    }

    @JsonIgnore
    public Stream<KrcgCard> cardStream() {
        return Stream.concat(cryptCards().stream(), libraryCards().stream());
    }
}
