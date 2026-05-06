package net.deckserver.jol.validation;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import net.deckserver.jol.dto.CardDetailDto;
import net.deckserver.jol.model.krcg.KrcgCard;
import net.deckserver.jol.model.krcg.KrcgDeck;

import java.util.List;
import java.util.Set;

/**
 * V5 format: same size rules as Standard, but every card must either appear in
 * the explicit V5 card whitelist (by ID) or have been printed in at least one
 * V5-approved set.
 */
@ApplicationScoped
public class V5DeckValidator extends BaseValidator {

    private Set<String> whitelistIds;
    private Set<String> whitelistSets;

    @PostConstruct
    void init() {
        whitelistIds  = loadResourceLines("net/deckserver/jol/validation/valid-v5-cards.txt");
        whitelistSets = loadResourceLines("net/deckserver/jol/validation/valid-v5-sets.txt");
    }

    @Override
    List<String> outsideWhitelistCards(KrcgDeck deck) {
        return deck.cardStream()
                .filter(card -> !isValidForV5(card))
                .map(card -> card.name() + " is not legal in V5 format.")
                .toList();
    }

    private boolean isValidForV5(KrcgCard card) {
        if (whitelistIds.contains(card.id())) return true;
        CardDetailDto detail = service.findDetailById(card.id());
        return detail != null && detail.sets().stream().anyMatch(whitelistSets::contains);
    }
}
