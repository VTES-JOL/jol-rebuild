package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.CardDetailDto;
import net.deckserver.jol.model.Card;
import net.deckserver.jol.model.CryptCard;
import net.deckserver.jol.model.CryptType;
import net.deckserver.jol.model.LibraryCard;
import org.apache.commons.lang3.StringUtils;

import java.util.*;

/**
 * Card lookup and autocomplete. All reads go through {@link CardRegistry}; this
 * service adds search scoring, DTO projection, and the canonical name logic.
 */
@ApplicationScoped
public class CardSearchService {

    @Inject
    CardRegistry registry;

    public List<Card> findAll() {
        return registry.allCards().stream()
                .sorted(Comparator.comparing(Card::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public List<CardDetailDto> findDetailsByIds(List<String> ids) {
        return ids.stream()
                .map(registry::findById)
                .filter(Objects::nonNull)
                .map(this::toDetailDto)
                .toList();
    }

    public CardDetailDto findDetailById(String id) {
        Card card = registry.findById(id);
        return card != null ? toDetailDto(card) : null;
    }

    public List<CardDetailDto> autocomplete(String q) {
        String normalizedQuery = StringUtils.stripAccents(q).toLowerCase();

        record Match(String displayName, Card card, int score) {}
        Map<String, Match> best = new HashMap<>();

        for (Map.Entry<String, Card> entry : registry.lookupEntries().entrySet()) {
            String normalizedKey = StringUtils.stripAccents(entry.getKey()).toLowerCase();
            int score = matchScore(normalizedQuery, normalizedKey);
            if (score < 0) continue;

            String displayName = canonicalName(entry.getValue());
            Match existing = best.get(displayName);
            if (existing == null || score < existing.score()) {
                best.put(displayName, new Match(displayName, entry.getValue(), score));
            }
        }

        return best.values().stream()
                .sorted(Comparator.comparingInt(Match::score)
                        .thenComparingInt(m -> m.displayName().length())
                        .thenComparing(Match::displayName, String.CASE_INSENSITIVE_ORDER))
                .limit(5)
                .map(m -> toDetailDto(m.card()))
                .toList();
    }

    public CardDetailDto toDetailDto(Card card) {
        if (card instanceof CryptCard c) {
            List<String> types = List.of(c.type() == CryptType.IMBUED ? "Imbued" : "Vampire");
            return new CardDetailDto(
                    c.id(), c.name(), true,
                    types, c.group(), c.banned(), c.advanced(),
                    c.clan(), c.path(), c.capacity(), c.disciplines(),
                    List.of(), List.of(), List.of(), null, null, null
            );
        }
        LibraryCard l = (LibraryCard) card;
        return new CardDetailDto(
                l.id(), l.name(), false,
                l.types(), null, l.banned(), false,
                null, null, null, List.of(),
                l.andDisciplines(), l.orDisciplines(),
                l.requirementClans(), l.requirementPath(),
                l.poolCost(), l.bloodCost()
        );
    }

    // ── Search scoring ────────────────────────────────────────────────────────

    /**
     * Score a query against a normalized key. Lower is better.
     * 0 = exact, 1 = word-prefix, 2 = key-prefix, 3 = contains, 4 = fuzzy-prefix, -1 = no match.
     */
    private int matchScore(String normalizedQuery, String normalizedKey) {
        if (normalizedKey.equals(normalizedQuery)) return 0;
        for (String token : normalizedKey.split("[\\s(]")) {
            if (!token.isEmpty() && token.startsWith(normalizedQuery)) return 1;
        }
        if (normalizedKey.startsWith(normalizedQuery)) return 2;
        if (normalizedKey.contains(normalizedQuery))   return 3;
        int fuzzyLen = Math.max(normalizedQuery.length() - 2, 4);
        if (normalizedQuery.length() >= fuzzyLen) {
            String queryPrefix = normalizedQuery.substring(0, fuzzyLen);
            for (String token : normalizedKey.split("[\\s(]")) {
                if (token.length() >= fuzzyLen && token.startsWith(queryPrefix)) return 4;
            }
        }
        return -1;
    }

    private String canonicalName(Card card) {
        if (card instanceof CryptCard c) return c.name() + cryptSuffix(c);
        return card.name();
    }

    private String cryptSuffix(CryptCard c) {
        return "ANY".equals(c.group())
                ? (c.advanced() ? " (ADV)" : "")
                : " (G" + c.group() + (c.advanced() ? " ADV" : "") + ")";
    }
}
