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

import net.deckserver.jol.exception.GameRuleException;

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
    void transferBlood_uncontrolled_requiresBudget() {
        // In UNLOCK phase — transfer to UNCONTROLLED must be rejected with a rule violation
        String currentPlayer = gameData.getCurrentPlayerName(); // Player5

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(currentPlayer,
                        new TransferBlood(gameId, CardRef.of(currentPlayer, RegionType.UNCONTROLLED, 0), 1)));
    }

    @Test
    void transferBlood_uncontrolled_deductsFromBudget() {
        // Advance to INFLUENCE phase — budget = 1 (turn 1.1, round 1)
        String actor = gameData.getCurrentPlayerName(); // Player5
        advanceToInfluence(actor);

        assertEquals(1, gameData.getTransfersRemaining());

        CardData card = firstUncontrolled(actor);
        int initialPool     = gameData.getPlayer(actor).getPool();
        int initialCounters = card.getCounters();

        gameCommandService.execute(actor, new TransferBlood(gameId, CardRef.of(actor, RegionType.UNCONTROLLED, 0), 1));

        assertEquals(initialPool - 1,     gameData.getPlayer(actor).getPool());
        assertEquals(initialCounters + 1, card.getCounters());
        assertEquals(0, gameData.getTransfersRemaining());
    }

    @Test
    void transferBlood_uncontrolled_blockedWhenBudgetExhausted() {
        String actor = gameData.getCurrentPlayerName(); // Player5, budget = 1
        advanceToInfluence(actor);

        CardRef ref = CardRef.of(actor, RegionType.UNCONTROLLED, 0);
        gameCommandService.execute(actor, new TransferBlood(gameId, ref, 1)); // uses the 1 transfer
        assertEquals(0, gameData.getTransfersRemaining());

        CardData card = firstUncontrolled(actor);
        int poolAfterFirst = gameData.getPlayer(actor).getPool();
        int countersAfterFirst = card.getCounters();

        // Second transfer should be rejected with a rule violation
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(actor, new TransferBlood(gameId, ref, 1)));
    }

    @Test
    void transferBlood_uncontrolled_extractionCostsTwoTransfers() {
        // Advance to round 4+ to have a budget of 4
        gameData.setTurn("4.1");
        String actor = gameData.getCurrentPlayerName(); // Player5
        advanceToInfluence(actor);

        assertEquals(4, gameData.getTransfersRemaining());

        // Put some blood on the card first (bypassing budget by setting counters directly)
        CardData card = firstUncontrolled(actor);
        card.setCounters(3);

        // Extract 1 blood (card → pool): costs 2 transfers
        CardRef ref = CardRef.of(actor, RegionType.UNCONTROLLED, 0);
        gameCommandService.execute(actor, new TransferBlood(gameId, ref, -1));

        assertEquals(2, gameData.getTransfersRemaining());
    }

    @Test
    void advancePhase_toInfluence_turn1_1_budgetIs1() {
        assertEquals("1.1", gameData.getTurn());
        advanceToInfluence(gameData.getCurrentPlayerName());
        assertEquals(1, gameData.getTransfersRemaining());
    }

    @Test
    void advancePhase_toInfluence_turn1_2_budgetIs2() {
        gameData.setTurn("1.2");
        advanceToInfluence(gameData.getCurrentPlayerName());
        assertEquals(2, gameData.getTransfersRemaining());
    }

    @Test
    void advancePhase_toInfluence_turn1_3_budgetIs3() {
        gameData.setTurn("1.3");
        advanceToInfluence(gameData.getCurrentPlayerName());
        assertEquals(3, gameData.getTransfersRemaining());
    }

    @Test
    void advancePhase_toInfluence_turn1_4_budgetCappedAt4() {
        gameData.setTurn("1.4");
        advanceToInfluence(gameData.getCurrentPlayerName());
        assertEquals(4, gameData.getTransfersRemaining());
    }

    @Test
    void advancePhase_toInfluence_round2Plus_budgetAlways4() {
        gameData.setTurn("2.1");
        advanceToInfluence(gameData.getCurrentPlayerName());
        assertEquals(4, gameData.getTransfersRemaining());
    }

    @Test
    void nextTurn_resetsTransferBudget() {
        String actor = gameData.getCurrentPlayerName();
        advanceToInfluence(actor);
        assertEquals(1, gameData.getTransfersRemaining());

        gameCommandService.execute(actor, new NextTurn(gameId));

        assertEquals(0, gameData.getTransfersRemaining());
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
        gameData.setPhase(Phase.INFLUENCE);
        gameData.setCurrentPlayer(gameData.getPlayer(ACTOR));
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
        // Card in fixture already has counters == capacity; set phase and current player
        gameData.setPhase(Phase.INFLUENCE);
        gameData.setCurrentPlayer(gameData.getPlayer(ACTOR));
        CardData card = firstUncontrolled(ACTOR);

        gameCommandService.execute(ACTOR, new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0)));

        PlayerData player = gameData.getPlayer(ACTOR);
        assertTrue(player.getRegion(RegionType.READY).getCards().contains(card));
        assertFalse(player.getRegion(RegionType.UNCONTROLLED).getCards().contains(card));
    }

    @Test
    void influenceCard_blockedWhenCapacityNotMet() {
        gameData.setPhase(Phase.INFLUENCE);
        gameData.setCurrentPlayer(gameData.getPlayer(ACTOR));
        CardData card = firstUncontrolled(ACTOR);
        card.setCounters(card.getCapacity() - 1); // one short

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(ACTOR, new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0))));
    }

    @Test
    void influenceCard_blockedOutsideInfluencePhase() {
        // Phase is UNLOCK in the fixture — should be rejected
        gameData.setCurrentPlayer(gameData.getPlayer(ACTOR));

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(ACTOR, new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0))));
    }

    @Test
    void influenceCard_blockedForNonCurrentPlayer() {
        gameData.setPhase(Phase.INFLUENCE);
        // Current player remains Player5, ACTOR is Player1

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(ACTOR, new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0))));
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

    @Test
    void oustPlayer_lastOust_marksGameCompletedAndAwardsSurvivorVP() {
        // Directly eliminate 3 of 5 players so only Player4 and Player5 remain
        gameData.getPlayer("Player1").setPool(0);
        gameData.getPlayer("Player2").setPool(0);
        gameData.getPlayer("Player3").setPool(0);
        gameData.updatePredatorMapping();

        PlayerData survivor = gameData.getPlayer("Player5");
        float vpBefore = survivor.getVictoryPoints();

        // Player5 ousts Player4 — the last remaining opponent
        gameCommandService.execute("Player5", new OustPlayer(gameId, "Player4"));

        assertTrue(gameData.isCompleted());
        // survivor bonus (+1 VP) stacks on top of the predator VP (+1 VP for ousting Player4)
        assertEquals(vpBefore + 2.0f, survivor.getVictoryPoints(), 0.001f);
        // game evicted from store
        assertFalse(gameStateStore.contains(gameId));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private CardData firstUncontrolled(String playerName) {
        return gameData.getPlayer(playerName).getRegion(RegionType.UNCONTROLLED).getCards().getFirst();
    }

    /** Advances through UNLOCK → MASTER → MINION → INFLUENCE, setting the transfer budget. */
    private void advanceToInfluence(String actor) {
        gameCommandService.execute(actor, new AdvancePhase(gameId)); // → MASTER
        gameCommandService.execute(actor, new AdvancePhase(gameId)); // → MINION
        gameCommandService.execute(actor, new AdvancePhase(gameId)); // → INFLUENCE
    }
}
