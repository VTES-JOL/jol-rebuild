package net.deckserver.jol.validation;

import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.model.krcg.KrcgDeck;

import java.util.List;

public interface DeckValidator {

    ValidationResult validate(KrcgDeck deck, GameFormat format);

    default boolean isValid(KrcgDeck deck, GameFormat format) {
        return validate(deck, format).valid();
    }

    default int getCryptMinSize() {
        return 12;
    }

    default int getLibraryMinSize() {
        return 60;
    }

    default int getLibraryMaxSize() {
        return 90;
    }

    record ValidationResult(GameFormat format, boolean valid, List<String> errors) {
    }
}
