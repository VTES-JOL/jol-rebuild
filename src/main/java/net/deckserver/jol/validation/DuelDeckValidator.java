package net.deckserver.jol.validation;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Set;

@ApplicationScoped
public class DuelDeckValidator extends BaseValidator {

    private Set<String> whitelist;

    @PostConstruct
    void init() {
        whitelist = loadResourceLines("net/deckserver/jol/validation/valid-duel-cards.txt");
    }

    @Override
    public int getCryptMinSize() {
        return 6;
    }

    @Override
    public int getLibraryMinSize() {
        return 40;
    }

    @Override
    public int getLibraryMaxSize() {
        return 60;
    }

    @Override
    Set<String> getWhitelistIds() {
        return whitelist;
    }
}
