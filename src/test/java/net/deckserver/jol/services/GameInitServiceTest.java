package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.Registration;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.*;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.model.krcg.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class GameInitServiceTest {

    @Inject GameInitService gameInitService;
    @Inject GameStateStore gameStateStore;
    @Inject ObjectMapper mapper;

    private String gameId;
    private List<String> playerNames;

    @BeforeEach
    @Transactional
    void setup() throws Exception {
        Registration.deleteAll();
        Game.deleteAll();
        User.deleteAll();

        playerNames = List.of("player0", "player1", "player2", "player3", "player4");
        for (String name : playerNames)
            User.create(name, "password", name + "@example.com", Role.USER);

        User owner = User.findByUsername("player0");
        Game game  = Game.create(owner, "Test Game", Visibility.PUBLIC, GameFormat.STANDARD);
        gameId = game.id;

        String deckJson = mapper.writeValueAsString(standardSizedDeck());
        Game managed = Game.findById(gameId);
        for (String name : playerNames) {
            User u = User.findByUsername(name);
            Registration r = new Registration();
            r.game = managed; r.user = u;
            r.deck = deckJson; r.deckName = "Test Deck";
            r.lastUpdated = OffsetDateTime.now();
            r.persist();
            managed.registrations.add(r);
            u.registrations.add(r);
        }
    }

    @AfterEach
    @Transactional
    void cleanup() {
        if (gameId != null) gameStateStore.remove(gameId);
        Registration.deleteAll();
        Game.deleteAll();
        User.deleteAll();
    }

    @Test
    @Transactional
    void initGame_setsActiveStatusAndAddsToStore() {
        initGame();

        Game persisted = Game.findById(gameId);
        assertEquals(Status.ACTIVE, persisted.status);
        assertNotNull(persisted.gameState);
        assertTrue(gameStateStore.contains(gameId));
    }

    @Test
    void initGame_dealsCorrectCardsToEachPlayer() {
        GameData gd = initGame();

        for (String name : playerNames) {
            PlayerData player = gd.getPlayer(name);
            assertNotNull(player, "PlayerData missing for " + name);
            assertEquals(7,  player.getRegion(RegionType.HAND).getCards().size(),         name + " HAND");
            assertEquals(53, player.getRegion(RegionType.LIBRARY).getCards().size(),      name + " LIBRARY");
            assertEquals(4,  player.getRegion(RegionType.UNCONTROLLED).getCards().size(), name + " UNCONTROLLED");
            assertEquals(8,  player.getRegion(RegionType.CRYPT).getCards().size(),        name + " CRYPT");
            assertEquals(30, player.getPool(),                                             name + " pool");
        }
    }

    @Test
    void initGame_setsPhaseAndTurnAndCurrentPlayer() {
        GameData gd = initGame();

        assertEquals(Phase.UNLOCK, gd.getPhase());
        assertEquals("1.1", gd.getTurn());
        assertNotNull(gd.getCurrentPlayer());
        assertTrue(playerNames.contains(gd.getCurrentPlayerName()));
    }

    @Test
    void initGame_establishesPredatorPreyRing() {
        GameData gd = initGame();

        for (String name : playerNames) {
            PlayerData p = gd.getPlayer(name);
            assertNotNull(p.getPredator(), name + " has no predator");
            assertNotNull(p.getPrey(),     name + " has no prey");
        }

        PlayerData cursor = gd.getPlayer(playerNames.getFirst());
        for (int i = 0; i < playerNames.size(); i++) cursor = cursor.getPrey();
        assertEquals(playerNames.getFirst(), cursor.getName(), "Prey pointers do not form a closed ring");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    @Transactional
    GameData initGame() {
        Game managed = Game.findById(gameId);
        return gameInitService.initializeGame(managed);
    }

    private static KrcgDeck standardSizedDeck() {
        var crypt   = new KrcgCrypt(12, List.of(new KrcgCard("200076", 12, "Anarch Convert")));
        var library = new KrcgLibrary(60, List.of(
                new KrcgLibraryGroup("Reaction", 60, List.of(new KrcgCard("100518", 60, "Deflection")))));
        return new KrcgDeck(null, null, crypt, library);
    }
}
