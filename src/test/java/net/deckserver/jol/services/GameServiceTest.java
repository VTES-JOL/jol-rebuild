package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.Registration;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.*;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.model.krcg.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class GameServiceTest {

    @Inject GameInitService gameInitService;
    @Inject GameCommandService gameCommandService;
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

    // ── INITIALIZATION ────────────────────────────────────────────────────────

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
            assertEquals(7,  player.getRegion(RegionType.HAND).getCards().size(),        name + " HAND");
            assertEquals(53, player.getRegion(RegionType.LIBRARY).getCards().size(),     name + " LIBRARY");
            assertEquals(4,  player.getRegion(RegionType.UNCONTROLLED).getCards().size(), name + " UNCONTROLLED");
            assertEquals(8,  player.getRegion(RegionType.CRYPT).getCards().size(),       name + " CRYPT");
            assertEquals(30, player.getPool(),                                            name + " pool");
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

        // Following prey pointers N times from any player must return to that player
        PlayerData cursor = gd.getPlayer(playerNames.getFirst());
        for (int i = 0; i < playerNames.size(); i++) cursor = cursor.getPrey();
        assertEquals(playerNames.getFirst(), cursor.getName(), "Prey pointers do not form a closed ring");
    }

    // ── COMMANDS: DECK / HAND ─────────────────────────────────────────────────

    @Test
    void drawCard_movesCardsFromLibraryToHand() {
        GameData gd = initGame();
        String actor = playerNames.getFirst();

        gameCommandService.execute(actor, new DrawCard(gameId, 2));

        PlayerData player = gd.getPlayer(actor);
        assertEquals(9,  player.getRegion(RegionType.HAND).getCards().size());
        assertEquals(51, player.getRegion(RegionType.LIBRARY).getCards().size());
    }

    // ── COMMANDS: PHASE / TURN ────────────────────────────────────────────────

    @Test
    void advancePhase_cyclesThroughAllPhases() {
        GameData gd = initGame();
        String actor = gd.getCurrentPlayerName();

        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.MASTER, gd.getPhase());

        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.MINION, gd.getPhase());

        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.INFLUENCE, gd.getPhase());

        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.DISCARD, gd.getPhase());

        // 5th advance wraps ordinal to 0 — triggers NextTurn
        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.UNLOCK, gd.getPhase());
        assertEquals("1.2", gd.getTurn());
    }

    @Test
    void nextTurn_advancesToNextPlayerAndResetsPhase() {
        GameData gd = initGame();
        String first = gd.getCurrentPlayerName();

        gameCommandService.execute(first, new NextTurn(gameId));

        assertNotEquals(first, gd.getCurrentPlayerName());
        assertEquals("1.2", gd.getTurn());
        assertEquals(Phase.UNLOCK, gd.getPhase());
    }

    // ── COMMANDS: POOL ────────────────────────────────────────────────────────

    @Test
    void setPool_updatesAmount() {
        GameData gd = initGame();
        String actor = playerNames.getFirst();

        gameCommandService.execute(actor, new SetPool(gameId, actor, 15));

        assertEquals(15, gd.getPlayer(actor).getPool());
    }

    @Test
    void transferPool_movesBloodBetweenPoolAndCard() {
        GameData gd = initGame();
        String actor = playerNames.getFirst();
        CardData card = getFirstUncontrolledCard(gd, actor);

        gameCommandService.execute(actor, new TransferPool(gameId, actor, card.getId(), 3));

        assertEquals(27, gd.getPlayer(actor).getPool());
        assertEquals(3,  card.getCounters());
    }

    // ── COMMANDS: CARD STATE ──────────────────────────────────────────────────

    @Test
    void lockCard_andUnlockCard_toggling() {
        GameData gd = initGame();
        String actor = playerNames.getFirst();
        CardData card = getFirstUncontrolledCard(gd, actor);
        String cardId = card.getId();

        gameCommandService.execute(actor, new LockCard(gameId, cardId));
        assertTrue(card.isLocked());

        gameCommandService.execute(actor, new UnlockCard(gameId, cardId));
        assertFalse(card.isLocked());
    }

    @Test
    void unlockAll_unlocksCardsInPlayRegions() {
        GameData gd = initGame();
        String actor = playerNames.getFirst();
        CardData card = getFirstUncontrolledCard(gd, actor);
        String cardId = card.getId();

        // Move card to READY (IN_PLAY_REGIONS), then lock it
        gameCommandService.execute(actor, new MoveToReady(gameId, cardId));
        gameCommandService.execute(actor, new LockCard(gameId, cardId));
        assertTrue(card.isLocked());

        gameCommandService.execute(actor, new UnlockAll(gameId, actor));
        assertFalse(card.isLocked());
    }

    @Test
    void addCounter_removeCounter_clampedAtZero() {
        GameData gd = initGame();
        String actor = playerNames.getFirst();
        CardData card = getFirstUncontrolledCard(gd, actor);
        String cardId = card.getId();

        gameCommandService.execute(actor, new AddCounter(gameId, cardId, 3));
        assertEquals(3, card.getCounters());

        gameCommandService.execute(actor, new RemoveCounter(gameId, cardId, 5));
        assertEquals(0, card.getCounters()); // max(0, 4-5) = 0
    }

    @Test
    void influenceVampire_deductsPoolAndAddsToCard() {
        GameData gd = initGame();
        String actor = playerNames.getFirst();
        CardData card = getFirstUncontrolledCard(gd, actor);

        gameCommandService.execute(actor, new InfluenceVampire(gameId, card.getId(), 3));

        assertEquals(27, gd.getPlayer(actor).getPool());
        assertEquals(3,  card.getCounters()); // 1 + 3
    }

    @Test
    void moveToReady_movesCardFromUncontrolled() {
        GameData gd = initGame();
        String actor = playerNames.getFirst();
        CardData card = getFirstUncontrolledCard(gd, actor);

        gameCommandService.execute(actor, new MoveToReady(gameId, card.getId()));

        PlayerData player = gd.getPlayer(actor);
        assertTrue(player.getRegion(RegionType.READY).getCards().contains(card));
        assertFalse(player.getRegion(RegionType.UNCONTROLLED).getCards().contains(card));
    }

    // ── COMMANDS: PLAYER STATE ────────────────────────────────────────────────

    @Test
    void oustPlayer_marksOustedAndAwardsPredatorVP() {
        GameData gd = initGame();
        PlayerData player1  = gd.getPlayer(playerNames.get(1));
        PlayerData predator = player1.getPredator();
        assertNotNull(predator, "player1 must have a predator");

        gameCommandService.execute(playerNames.get(0), new OustPlayer(gameId, playerNames.get(1)));

        assertTrue(player1.isOusted());
        assertEquals(1.0f, predator.getVictoryPoints(), 0.001f);
    }

    // ── PHASE-GATED VALIDATION ────────────────────────────────────────────────
    // Add tests here as phase enforcement is introduced in GameCommandService.
    // Pattern: initGame(), advance to target phase, attempt command, assert an outcome.

    // ── Helpers ───────────────────────────────────────────────────────────────

    @Transactional
    GameData initGame() {
        Game managed = Game.findById(gameId);
        return gameInitService.initializeGame(managed);
    }

    private CardData getFirstUncontrolledCard(GameData gd, String playerName) {
        return gd.getPlayer(playerName).getRegion(RegionType.UNCONTROLLED).getCards().getFirst();
    }

    /** 12-crypt (Anarch Convert, capacity=1) / 60-library (Deflection). Valid for STANDARD. */
    private static KrcgDeck standardSizedDeck() {
        var crypt   = new KrcgCrypt(12, List.of(new KrcgCard("200076", 12, "Anarch Convert")));
        var library = new KrcgLibrary(60, List.of(
                new KrcgLibraryGroup("Reaction", 60, List.of(new KrcgCard("100518", 60, "Deflection")))));
        return new KrcgDeck(null, null, crypt, library);
    }
}
