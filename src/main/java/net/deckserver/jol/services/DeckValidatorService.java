package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.model.krcg.KrcgDeck;
import net.deckserver.jol.validation.DeckValidator;

import java.util.Arrays;
import java.util.List;

@ApplicationScoped
public class DeckValidatorService {

    @Inject
    DeckValidatorFactory factory;

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
}
