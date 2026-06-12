package net.deckserver.jol.validation;

import jakarta.inject.Inject;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.model.krcg.KrcgCard;
import net.deckserver.jol.model.krcg.KrcgDeck;
import net.deckserver.jol.services.CardSearchService;
import org.apache.commons.lang3.StringUtils;
import org.jboss.logging.Logger;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

public class BaseValidator implements DeckValidator {

    private static final Logger LOG = Logger.getLogger(BaseValidator.class);

    @Inject
    CardSearchService service;

    @Override
    public ValidationResult validate(KrcgDeck deck, GameFormat format) {
        List<String> errors = new ArrayList<>();

        int cryptCount   = deck.cryptCards().stream().mapToInt(KrcgCard::count).sum();
        int libraryCount = deck.libraryCards().stream().mapToInt(KrcgCard::count).sum();

        if (cryptCount < getCryptMinSize()) {
            errors.add("Crypt must have at least " + getCryptMinSize() + " cards (has " + cryptCount + ").");
        }
        if (libraryCount < getLibraryMinSize()) {
            errors.add("Library must have at least " + getLibraryMinSize() + " cards (has " + libraryCount + ").");
        }
        if (libraryCount > getLibraryMaxSize()) {
            errors.add("Library must have no more than " + getLibraryMaxSize() + " cards (has " + libraryCount + ").");
        }

        errors.addAll(containsBannedCards(deck));
        errors.addAll(outsideWhitelistCards(deck));
        errors.addAll(validateCryptGroups(deck));

        return new ValidationResult(format, errors.isEmpty(), errors);
    }

    List<String> containsBannedCards(KrcgDeck deck) {
        return deck.cardStream()
                .filter(card -> service.isBanned(card.id()))
                .map(card -> card.name() + " is banned in this format.")
                .toList();
    }

    List<String> outsideWhitelistCards(KrcgDeck deck) {
        Set<String> whitelist = getWhitelistIds();
        if (whitelist.isEmpty()) {
            return Collections.emptyList();
        }
        return deck.cardStream()
                .filter(card -> !whitelist.contains(card.id()))
                .map(card -> card.name() + " is not allowed in this format.")
                .toList();
    }

    List<String> validateCryptGroups(KrcgDeck deck) {
        TreeSet<Integer> groups = deck.cryptCards().stream()
                .map(card -> service.getCryptGroup(card.id()))
                .filter(g -> g != null && !g.equals("ANY"))
                .map(Integer::parseInt)
                .collect(Collectors.toCollection(TreeSet::new));

        if (groups.size() <= 1) return Collections.emptyList();
        int min = groups.first();
        int max = groups.last();
        if (groups.size() == 2 && max - min == 1) return Collections.emptyList();
        return List.of("Crypt must use vampires from one group or two consecutive groups.");
    }

    /** Override in subclasses to provide an ID-based card whitelist. */
    Set<String> getWhitelistIds() {
        return Collections.emptySet();
    }

    // ── Size defaults (override in subclasses) ────────────────────────────────

    // ── Resource loading utility ──────────────────────────────────────────────

    protected Set<String> loadResourceLines(String resourcePath) {
        try (InputStream in = Thread.currentThread().getContextClassLoader().getResourceAsStream(resourcePath)) {
            if (in == null) {
                LOG.errorf("Validation resource not found: %s", resourcePath);
                return Collections.emptySet();
            }
            try (BufferedReader br = new BufferedReader(new InputStreamReader(in))) {
                return br.lines()
                        .map(String::trim)
                        .filter(StringUtils::isNotBlank)
                        .collect(Collectors.toUnmodifiableSet());
            }
        } catch (IOException e) {
            LOG.errorf("Failed to load validation resource: %s", resourcePath);
            return Collections.emptySet();
        }
    }
}
