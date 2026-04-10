package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.model.krcg.KrcgDeck;

import java.util.Collections;
import java.util.List;

@ApplicationScoped
public class DeckValidatorService {

    public List<GameFormat> validate(KrcgDeck deck) {
        return Collections.emptyList();
    }
}
