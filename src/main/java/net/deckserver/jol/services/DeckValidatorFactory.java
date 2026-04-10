package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.validation.DeckValidator;
import net.deckserver.jol.validation.DuelDeckValidator;
import net.deckserver.jol.validation.StandardDeckValidator;
import net.deckserver.jol.validation.V5DeckValidator;

@ApplicationScoped
public class DeckValidatorFactory {

    @Inject
    StandardDeckValidator standardDeckValidator;

    @Inject
    V5DeckValidator v5DeckValidator;

    @Inject
    DuelDeckValidator duelDeckValidator;

    public DeckValidator createDeckValidator(GameFormat format) {
        return switch (format) {
            case STANDARD -> standardDeckValidator;
            case DUEL -> duelDeckValidator;
            case V5 -> v5DeckValidator;
        };
    }

}
