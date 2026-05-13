package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.Registration;
import net.deckserver.jol.enums.*;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.model.Card;
import net.deckserver.jol.model.CryptCard;
import net.deckserver.jol.model.CryptType;
import net.deckserver.jol.model.LibraryCard;
import net.deckserver.jol.model.krcg.KrcgCard;
import net.deckserver.jol.model.krcg.KrcgDeck;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@ApplicationScoped
public class GameInitService {

    private static final Logger LOG = Logger.getLogger(GameInitService.class);

    private static final int INITIAL_HAND_SIZE = 7;
    private static final int INITIAL_UNCONTROLLED = 4;

    @Inject
    CardRegistry cardRegistry;

    @Inject
    GameStateStore store;

    @Inject
    ObjectMapper mapper;

    @Transactional
    public GameData initializeGame(Game game) {
        return initializeGame(game, true);
    }

    @Transactional
    public GameData initializeGame(Game game, boolean randomizePlayerOrder) {
        List<Registration> registrations = new ArrayList<>(Registration.getRegistrations(game));
        if (registrations.isEmpty()) {
            throw new IllegalStateException("No registered players for game " + game.id);
        }

        if (randomizePlayerOrder) {
            Collections.shuffle(registrations);
        }

        GameData gameData = new GameData(game.id, game.name);

        for (Registration reg : registrations) {
            String username = reg.user.username;
            PlayerData player = new PlayerData(username);
            gameData.addPlayer(player);
            loadDeck(gameData, player, reg);
        }

        gameData.updatePredatorMapping();
        gameData.setCurrentPlayer(gameData.getPlayer(gameData.getPlayerOrder().getFirst()));
        gameData.setPhase(Phase.UNLOCK);
        gameData.setTurn("1.1");

        game.status = Status.ACTIVE;
        try {
            game.gameState = mapper.writeValueAsString(gameData);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to serialize initial game state for %s", game.id);
        }

        store.put(game.id, gameData);
        LOG.infof("Initialized game %s with %d players", game.id, registrations.size());
        return gameData;
    }

    private void loadDeck(GameData gameData, PlayerData player, Registration reg) {
        try {
            KrcgDeck deck = mapper.readValue(reg.deck, KrcgDeck.class);

            List<CardData> cryptCards = buildCards(deck.cryptCards(), player);
            RegionData crypt = player.getRegion(RegionType.CRYPT);
            gameData.initRegion(crypt, cryptCards);
            crypt.shuffle(0);
            dealCards(crypt, player.getRegion(RegionType.UNCONTROLLED), INITIAL_UNCONTROLLED);

            List<CardData> libraryCards = buildCards(deck.libraryCards(), player);
            RegionData library = player.getRegion(RegionType.LIBRARY);
            gameData.initRegion(library, libraryCards);
            library.shuffle(0);
            dealCards(library, player.getRegion(RegionType.HAND), INITIAL_HAND_SIZE);

        } catch (Exception e) {
            throw new IllegalStateException("Failed to load deck for player " + player.getName(), e);
        }
    }

    private List<CardData> buildCards(List<KrcgCard> krcgCards, PlayerData player) {
        List<CardData> result = new ArrayList<>();
        for (KrcgCard krcgCard : krcgCards) {
            Card template = cardRegistry.findById(krcgCard.id());
            if (template == null) {
                LOG.warnf("Card id %s not found in registry — skipping", krcgCard.id());
                continue;
            }
            for (int i = 0; i < krcgCard.count(); i++) {
                result.add(buildCard(template, player));
            }
        }
        return result;
    }

    private CardData buildCard(Card template, PlayerData player) {
        CardData card = new CardData(template.id(), player);
        card.setName(template.name());
        card.setOwner(player);
        card.setController(player);

        if (template instanceof CryptCard c) {
            card.setType(c.type() == CryptType.IMBUED ? CardType.IMBUED : CardType.VAMPIRE);
            card.setCapacity(c.capacity());
            card.setAdvanced(c.advanced());
            card.setMinion(true);
            card.setUnique(true);
            if (c.clan() != null) card.setClan(Clan.of(c.clan()));
            if (c.path() != null) card.setPath(Path.of(c.path()));
            c.disciplines().forEach(card::addDiscipline);
            if (c.title() != null) card.setTitle(c.title());
        } else if (template instanceof LibraryCard l) {
            card.setType(libraryCardType(l));
            card.setUnique(false);
        }

        return card;
    }

    private CardType libraryCardType(LibraryCard card) {
        if (card.types().isEmpty()) return CardType.NONE;
        String primary = card.types().getFirst();
        return switch (primary) {
            case "Master"            -> CardType.MASTER;
            case "Action"            -> CardType.ACTION;
            case "Action Modifier"   -> CardType.MODIFIER;
            case "Reaction"          -> CardType.REACTION;
            case "Combat"            -> CardType.COMBAT;
            case "Ally"              -> CardType.ALLY;
            case "Retainer"          -> CardType.RETAINER;
            case "Political Action"  -> CardType.POLITICAL;
            case "Equipment"         -> CardType.EQUIPMENT;
            case "Event"             -> CardType.EVENT;
            case "Location"          -> CardType.LOCATION;
            default                  -> CardType.NONE;
        };
    }

    private void dealCards(RegionData source, RegionData target, int count) {
        int toDeal = Math.min(count, source.getCards().size());
        for (int i = 0; i < toDeal; i++) {
            CardData card = source.getFirstCard();
            target.addCard(card, false);
        }
    }
}
