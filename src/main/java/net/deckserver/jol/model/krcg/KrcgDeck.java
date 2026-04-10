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
 *   "meta":    { "name": "...", "author": "..." },   // optional
 *   "crypt":   { "count": 12, "cards": [...] },
 *   "library": { "count": 60, "cards": [ { "type": "Action", "count": 8, "cards": [...] } ] }
 * }
 * }</pre>
 *
 * {@code meta} is omitted from serialisation when null.
 */
@RegisterForReflection
@JsonInclude(JsonInclude.Include.NON_NULL)
public record KrcgDeck(KrcgMeta meta, KrcgCrypt crypt, KrcgLibrary library) {

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
        Stream<KrcgCard> cryptStream = cryptCards().stream();
        Stream<KrcgCard> libraryStream = libraryCards().stream();
        return Stream.concat(cryptStream, libraryStream);
    }

    /** Total crypt count as recorded in the document. */
    public int cryptCount() {
        return crypt == null ? 0 : crypt.count();
    }

    /** Total library count as recorded in the document. */
    public int libraryCount() {
        return library == null ? 0 : library.count();
    }
}
