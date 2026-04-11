package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import net.deckserver.jol.entity.Deck;
import net.deckserver.jol.entity.DeckFormatValidity;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.model.krcg.KrcgDeck;
import net.deckserver.jol.validation.DeckValidator;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@ApplicationScoped
public class DeckValidatorService {

    @Inject
    DeckValidatorFactory factory;

    @Inject
    EntityManager em;

    public List<GameFormat> eligibleFormats(KrcgDeck deck) {
        return validate(deck).stream()
                .filter(DeckValidator.ValidationResult::valid)
                .map(DeckValidator.ValidationResult::format)
                .toList();
    }

    public List<DeckValidator.ValidationResult> validate(KrcgDeck deck) {
        return Arrays.stream(GameFormat.values())
                .map(format -> factory.createDeckValidator(format).validate(deck, format))
                .toList();
    }

    /**
     * Runs all format validators against the given deck contents and persists one
     * {@link DeckFormatValidity} row per format, replacing any existing rows.
     * Must be called within an active transaction.
     *
     * @return the freshly-computed validity rows (can be used directly to build a response
     *         without re-reading from the database)
     */
    public List<DeckFormatValidity> validateAndPersist(Deck deck, KrcgDeck contents) {
        List<DeckValidator.ValidationResult> results = validate(contents);
        Instant now = Instant.now();

        // Clear existing rows and flush immediately so the DELETEs reach the DB
        // before the INSERTs — otherwise the unique constraint fires mid-batch.
        deck.formatValidity.clear();
        em.flush();

        List<DeckFormatValidity> rows = results.stream().map(result -> {
            DeckFormatValidity row = new DeckFormatValidity();
            row.deck = deck;
            row.format = result.format();
            row.valid = result.valid();
            row.errors = result.errors().isEmpty() ? null : result.errors();
            row.computedAt = now;
            return row;
        }).toList();

        deck.formatValidity.addAll(rows);
        return rows;
    }
}
