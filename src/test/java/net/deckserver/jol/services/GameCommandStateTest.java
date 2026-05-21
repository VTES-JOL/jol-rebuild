package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests command state mutations (pool, counters, card movement, phase cycling)
 * against a pregenerated game snapshot. No DB or game-init setup required.
 */
@QuarkusTest
class GameCommandStateTest {

    @Inject GameCommandService gameCommandService;
    @Inject GameStateStore gameStateStore;
    @Inject ObjectMapper mapper;

    private static final String ACTOR = "Player1";

    private GameData gameData;
    private String gameId;

    @BeforeEach
    void setup() throws Exception {
        try (var is = getClass().getResourceAsStream("/game-full-detail.json")) {
            gameData = mapper.readValue(is, GameData.class);
        }
        gameId = gameData.getId();
        gameStateStore.put(gameId, gameData);
    }

    @AfterEach
    void cleanup() {
        gameStateStore.remove(gameId);
    }

    // ── Deck / hand ───────────────────────────────────────────────────────────

    @Test
    void drawCard_movesCardsFromLibraryToHand() {
        PlayerData player = gameData.getPlayer(ACTOR);

        gameCommandService.execute(ACTOR, new DrawCard(gameId, 2));

        assertEquals(9,  player.getRegion(RegionType.HAND).getCards().size());
        assertEquals(81, player.getRegion(RegionType.LIBRARY).getCards().size());
    }

    // ── Phase / turn ──────────────────────────────────────────────────────────

    @Test
    void advancePhase_cyclesThroughAllPhases() {
        String actor = gameData.getCurrentPlayerName(); // Player5 in the snapshot

        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.MASTER, gameData.getPhase());

        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.MINION, gameData.getPhase());

        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.INFLUENCE, gameData.getPhase());

        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.DISCARD, gameData.getPhase());

        // 5th advance wraps ordinal to 0 — triggers NextTurn
        gameCommandService.execute(actor, new AdvancePhase(gameId));
        assertEquals(Phase.UNLOCK, gameData.getPhase());
        assertEquals("1.2", gameData.getTurn());
    }

    @Test
    void nextTurn_advancesToNextPlayerAndResetsPhase() {
        String first = gameData.getCurrentPlayerName(); // Player5 in the snapshot

        gameCommandService.execute(first, new NextTurn(gameId));

        assertNotEquals(first, gameData.getCurrentPlayerName());
        assertEquals("1.2", gameData.getTurn());
        assertEquals(Phase.UNLOCK, gameData.getPhase());
    }

    // ── Pool ──────────────────────────────────────────────────────────────────

    @Test
    void setPool_updatesAmount() {
        gameCommandService.execute(ACTOR, new SetPool(gameId, ACTOR, 15));

        assertEquals(15, gameData.getPlayer(ACTOR).getPool());
    }

    @Test
    void transferBlood_deductsPoolAndAddsToCard() {
        CardData card = firstUncontrolled(ACTOR);
        int initialPool     = gameData.getPlayer(ACTOR).getPool();
        int initialCounters = card.getCounters();

        gameCommandService.execute(ACTOR, new TransferBlood(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0), 3));

        assertEquals(initialPool - 3,     gameData.getPlayer(ACTOR).getPool());
        assertEquals(initialCounters + 3, card.getCounters());
    }

    // ── Card state ────────────────────────────────────────────────────────────

    @Test
    void lockCard_andUnlockCard_toggling() {
        CardRef ref  = CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0);
        CardData card = firstUncontrolled(ACTOR);

        gameCommandService.execute(ACTOR, new LockCard(gameId, ref));
        assertTrue(card.isLocked());

        gameCommandService.execute(ACTOR, new UnlockCard(gameId, ref));
        assertFalse(card.isLocked());
    }

    @Test
    void unlockAll_unlocksCardsInPlayRegions() {
        CardData card = firstUncontrolled(ACTOR);

        gameCommandService.execute(ACTOR, new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0)));
        gameCommandService.execute(ACTOR, new LockCard(gameId, CardRef.of(ACTOR, RegionType.READY, 0)));
        assertTrue(card.isLocked());

        gameCommandService.execute(ACTOR, new UnlockAll(gameId, ACTOR));
        assertFalse(card.isLocked());
    }

    @Test
    void addCounter_removeCounter_clampedAtZero() {
        CardData card = firstUncontrolled(ACTOR);
        CardRef ref = CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0);
        int initial = card.getCounters();

        gameCommandService.execute(ACTOR, new AddCounter(gameId, ref, 3));
        assertEquals(initial + 3, card.getCounters());

        gameCommandService.execute(ACTOR, new RemoveCounter(gameId, ref, initial + 3 + 1)); // more than exists
        assertEquals(0, card.getCounters()); // clamped: max(0, n - (n+1)) = 0
    }

    // ── Influence / crypt ─────────────────────────────────────────────────────

    @Test
    void influenceCard_movesCardFromUncontrolledToReady() {
        CardData card = firstUncontrolled(ACTOR);

        gameCommandService.execute(ACTOR, new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0)));

        PlayerData player = gameData.getPlayer(ACTOR);
        assertTrue(player.getRegion(RegionType.READY).getCards().contains(card));
        assertFalse(player.getRegion(RegionType.UNCONTROLLED).getCards().contains(card));
    }

    // ── Player state ──────────────────────────────────────────────────────────

    @Test
    void oustPlayer_marksOustedAndAwardsPredatorVP() {
        // In the snapshot: Player1's predator is Player5
        PlayerData player1  = gameData.getPlayer("Player1");
        PlayerData predator = player1.getPredator();
        assertNotNull(predator);

        gameCommandService.execute("Player5", new OustPlayer(gameId, "Player1"));

        assertTrue(player1.isOusted());
        assertEquals(1.0f, predator.getVictoryPoints(), 0.001f);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private CardData firstUncontrolled(String playerName) {
        return gameData.getPlayer(playerName).getRegion(RegionType.UNCONTROLLED).getCards().getFirst();
    }
}
