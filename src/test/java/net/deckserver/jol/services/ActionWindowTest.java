package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.enums.ActionType;
import net.deckserver.jol.enums.CardType;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for the formal action lifecycle: DeclareAction → impulse window →
 * AttemptBlock/ResolveAction → After Resolution sequencing window.
 *
 * Four-player game: Alice → Bob → Carol → Dave → (back to Alice).
 * Alice is current player. Alice has minion at READY[0]; Bob has minion at READY[0].
 */
@QuarkusTest
class ActionWindowTest {

    @Inject GameCommandService gameCommandService;
    @Inject GameStateStore gameStateStore;
    @Inject ObjectMapper mapper;

    private GameData game;
    private String gameId;
    private CardRef aliceMinion;
    private CardRef bobMinion;

    @BeforeEach
    void setup() throws Exception {
        try (var is = getClass().getResourceAsStream("/game-4p-with-minions.json")) {
            game = mapper.readValue(is, GameData.class);
        }
        aliceMinion = new CardRef("Alice", RegionType.READY, 0, -1);
        bobMinion   = new CardRef("Bob",   RegionType.READY, 0, -1);
        gameId = game.getId();
        gameStateStore.put(gameId, game);
    }

    @AfterEach
    void cleanup() {
        gameStateStore.remove(gameId);
    }

    // ── DeclareAction ─────────────────────────────────────────────────────────

    @Test
    void declareAction_locksMinionAndOpensPendingAction() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));

        assertNotNull(game.getPendingAction());
        assertEquals(ActionStatus.DURING_ACTION, game.getPendingAction().getStatus());
        assertEquals(ActionType.BLEED, game.getPendingAction().getActionType());
        assertNull(game.getPendingAction().getTargetPlayerName());

        CardData card = game.getCardByRef(aliceMinion);
        assertTrue(card.isLocked());
    }

    @Test
    void declareAction_opensImpulseWindowForActingPlayer() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));

        assertNotNull(game.getImpulseWindow());
        assertTrue(game.getImpulseWindow().isActive());
        assertEquals("Alice", game.getImpulseWindow().getActingPlayer());
        assertEquals("Alice", game.getImpulseWindow().getCurrentImpulseHolder());
    }

    @Test
    void declareAction_directedSingle_setsCorrectImpulseContext() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, "Bob"));

        assertNotNull(game.getImpulseWindow());
        assertEquals("DIRECTED_SINGLE", game.getImpulseWindow().getContext().name());
        assertEquals("Bob", game.getImpulseWindow().getPassOrder().get(1));
    }

    @Test
    void declareAction_failsWhenAlreadyPending() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.HUNT, null)));
    }

    @Test
    void declareAction_failsWhenMinionAlreadyLocked() {
        game.getCardByRef(aliceMinion).setLocked(true);

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null)));
    }

    @Test
    void declareAction_failsWhenNotCurrentPlayer() {
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Bob", new DeclareAction(gameId, bobMinion, ActionType.BLEED, null)));
    }

    @Test
    void declareAction_failsOutsideMinionPhase() {
        game.setPhase(Phase.MASTER);

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null)));
    }

    // ── AttemptBlock ──────────────────────────────────────────────────────────

    @Test
    void attemptBlock_whenBobHoldsImpulse_blocksAndClosesWindow() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));
        // Alice holds impulse; pass to Bob
        gameCommandService.execute("Alice",
                new net.deckserver.jol.game.command.PassImpulse(gameId, "Alice"));

        gameCommandService.execute("Bob", new AttemptBlock(gameId, bobMinion));

        assertNotNull(game.getPendingAction());
        assertEquals(ActionStatus.BLOCKED, game.getPendingAction().getStatus());
        assertNotNull(game.getPendingAction().getBlockerRef());
        assertNull(game.getImpulseWindow());
        assertTrue(game.getCardByRef(bobMinion).isLocked());
    }

    @Test
    void attemptBlock_failsWhenActingPlayerTriesToBlock() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));

        CardData aliceCard2 = new CardData("vamp-003", game.getPlayer("Alice"));
        aliceCard2.setName("DimaCopy");
        aliceCard2.setMinion(true);
        game.getPlayer("Alice").getRegion(RegionType.READY).addCard(aliceCard2, false);
        CardRef alice2Ref = new CardRef("Alice", RegionType.READY, 1, -1);

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new AttemptBlock(gameId, alice2Ref)));
    }

    @Test
    void attemptBlock_failsWhenNoActionPending() {
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Bob", new AttemptBlock(gameId, bobMinion)));
    }

    // ── ResolveAction ─────────────────────────────────────────────────────────

    @Test
    void resolveAction_afterImpulseCloses_opensAfterResolutionWindow() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.HUNT, null));
        closeImpulse();

        gameCommandService.execute("Alice", new ResolveAction(gameId));

        assertEquals(ActionStatus.AFTER_RESOLUTION, game.getPendingAction().getStatus());
        assertNotNull(game.getSequencingWindow());
        assertTrue(game.getSequencingWindow().isActive());
        assertEquals("AFTER_RESOLUTION", game.getSequencingWindow().getWindowType().name());
        assertEquals("Alice", game.getSequencingWindow().getCurrentHolder());
    }

    @Test
    void resolveAction_failsWhenImpulseWindowStillActive() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.HUNT, null));

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new ResolveAction(gameId)));
    }

    @Test
    void resolveAction_failsWhenNoPendingAction() {
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new ResolveAction(gameId)));
    }

    // ── AbortAction ───────────────────────────────────────────────────────────

    @Test
    void abortAction_unlocksActorAndClearsState() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));
        assertTrue(game.getCardByRef(aliceMinion).isLocked());

        gameCommandService.execute("Alice", new AbortAction(gameId));

        assertNull(game.getPendingAction());
        assertNull(game.getImpulseWindow());
        assertFalse(game.getCardByRef(aliceMinion).isLocked());
    }

    @Test
    void abortAction_failsWhenNoPendingAction() {
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new AbortAction(gameId)));
    }

    // ── NRA tracking ─────────────────────────────────────────────────────────

    @Test
    void resolveAction_bleed_recordsNraKey() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));
        closeImpulse();
        gameCommandService.execute("Alice", new ResolveAction(gameId));

        CardData card = game.getCardByRef(aliceMinion);
        assertTrue(game.getNraActionsByCardId()
                .getOrDefault(card.getId(), java.util.Set.of())
                .contains("BLEED"));
    }

    @Test
    void declareAction_bleed_rejectedAfterNraLocksIn() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));
        closeImpulse();
        gameCommandService.execute("Alice", new ResolveAction(gameId));
        gameCommandService.execute("Alice",
                new net.deckserver.jol.game.command.CloseSequencingWindow(gameId));
        game.getCardByRef(aliceMinion).setLocked(false);

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null)));
    }

    @Test
    void declareAction_hunt_repeatable_afterNraDoesNotLockHunt() {
        // HUNT is not NRA-locked, so the same minion may hunt again (if unlocked)
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.HUNT, null));
        closeImpulse();
        gameCommandService.execute("Alice", new ResolveAction(gameId));
        gameCommandService.execute("Alice",
                new net.deckserver.jol.game.command.CloseSequencingWindow(gameId));

        // Unlock the minion so it can act again
        game.getCardByRef(aliceMinion).setLocked(false);

        assertDoesNotThrow(() ->
                gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.HUNT, null)));
    }

    @Test
    void attemptBlock_blocked_recordsNraForActingMinion() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));
        gameCommandService.execute("Alice", new PassImpulse(gameId, "Alice"));
        gameCommandService.execute("Bob", new AttemptBlock(gameId, bobMinion));

        CardData aliceCard = game.getCardByRef(aliceMinion);
        assertTrue(game.getPendingAction().isReachedResolution());
        assertTrue(game.getNraActionsByCardId()
                .getOrDefault(aliceCard.getId(), java.util.Set.of())
                .contains("BLEED"));
    }

    // ── Mandatory hunt gate ───────────────────────────────────────────────────

    @Test
    void declareAction_nonHunt_rejectedWhenActorHasNoBlood() {
        // Give the vampire a capacity so the mandatory hunt check fires
        game.getCardByRef(aliceMinion).setCapacity(5);
        game.getCardByRef(aliceMinion).setCounters(0);

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice",
                        new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null)));
    }

    @Test
    void declareAction_hunt_allowedWhenActorHasNoBlood() {
        game.getCardByRef(aliceMinion).setCapacity(5);
        game.getCardByRef(aliceMinion).setCounters(0);

        assertDoesNotThrow(() ->
                gameCommandService.execute("Alice",
                        new DeclareAction(gameId, aliceMinion, ActionType.HUNT, null)));
    }

    @Test
    void declareAction_nonHunt_rejectedWhenOtherVampireHasMandatoryHunt() {
        // Add a second vampire for Alice with no blood
        CardData vampire2 = new CardData("vamp-extra", game.getPlayer("Alice"));
        vampire2.setName("HungryVamp");
        vampire2.setMinion(true);
        vampire2.setType(CardType.VAMPIRE);
        vampire2.setCapacity(4);
        vampire2.setCounters(0);
        game.getPlayer("Alice").getRegion(RegionType.READY).addCard(vampire2, false);
        game.registerCard(vampire2);

        // Alice's first minion has blood, so it's not the mandatory hunter
        game.getCardByRef(aliceMinion).setCapacity(5);
        game.getCardByRef(aliceMinion).setCounters(3);

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice",
                        new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null)));
    }

    // ── BLEED resolution ──────────────────────────────────────────────────────

    @Test
    void resolveAction_bleed_targetLosesPool() {
        int bobPoolBefore = game.getPlayer("Bob").getPool();
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, "Bob"));
        closeImpulse();
        gameCommandService.execute("Alice", new ResolveAction(gameId));

        assertEquals(bobPoolBefore - 1, game.getPlayer("Bob").getPool());
    }

    @Test
    void resolveAction_bleed_actingPlayerGainsEdge() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, "Bob"));
        closeImpulse();
        gameCommandService.execute("Alice", new ResolveAction(gameId));

        assertEquals("Alice", game.getEdgePlayer());
        assertTrue(game.getPendingAction().isBleedSuccessful());
    }

    @Test
    void resolveAction_bleed_setsActionSuccessful() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, "Bob"));
        closeImpulse();
        gameCommandService.execute("Alice", new ResolveAction(gameId));

        assertTrue(game.getPendingAction().isActionSuccessful());
        assertTrue(game.getPendingAction().isReachedResolution());
    }

    // ── HUNT resolution ───────────────────────────────────────────────────────

    @Test
    void resolveAction_hunt_addsBloodUpToCapacity() {
        game.getCardByRef(aliceMinion).setCapacity(5);
        game.getCardByRef(aliceMinion).setCounters(3);

        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.HUNT, null));
        closeImpulse();
        gameCommandService.execute("Alice", new ResolveAction(gameId));

        assertEquals(4, game.getCardByRef(aliceMinion).getCounters());
    }

    @Test
    void resolveAction_hunt_doesNotExceedCapacity() {
        game.getCardByRef(aliceMinion).setCapacity(5);
        game.getCardByRef(aliceMinion).setCounters(5);

        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.HUNT, null));
        closeImpulse();
        gameCommandService.execute("Alice", new ResolveAction(gameId));

        assertEquals(5, game.getCardByRef(aliceMinion).getCounters());
    }

    // ── LEAVE_TORPOR declaration ──────────────────────────────────────────────

    @Test
    void declareAction_leaveTorpor_acceptedForTorporedVampire() {
        CardData torporVamp = new CardData("vamp-torpor", game.getPlayer("Alice"));
        torporVamp.setName("TorporVamp");
        torporVamp.setMinion(true);
        torporVamp.setType(CardType.VAMPIRE);
        torporVamp.setCapacity(5);
        torporVamp.setCounters(3);
        game.getPlayer("Alice").getRegion(RegionType.TORPOR).addCard(torporVamp, false);
        game.registerCard(torporVamp);

        CardRef torporRef = new CardRef("Alice", RegionType.TORPOR, 0, -1);
        assertDoesNotThrow(() ->
                gameCommandService.execute("Alice",
                        new DeclareAction(gameId, torporRef, ActionType.LEAVE_TORPOR, null)));
    }

    @Test
    void declareAction_leaveTorpor_rejectedForReadyVampire() {
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice",
                        new DeclareAction(gameId, aliceMinion, ActionType.LEAVE_TORPOR, null)));
    }

    // ── Block eligibility ─────────────────────────────────────────────────────

    @Test
    void attemptBlock_rejectedWhenNotCurrentImpulseHolder() {
        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, null));
        // Impulse is with Alice; Bob has not yet received it

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Bob", new AttemptBlock(gameId, bobMinion)));
    }

    @Test
    void attemptBlock_rejectedWhenDirectedActionAndNotTarget() {
        // Alice bleeds Bob (directed); Carol should not be able to block
        CardData carolMinion = new CardData("vamp-carol", game.getPlayer("Carol"));
        carolMinion.setName("Isanwayen");
        carolMinion.setMinion(true);
        game.getPlayer("Carol").getRegion(RegionType.READY).addCard(carolMinion, false);
        game.registerCard(carolMinion);

        gameCommandService.execute("Alice", new DeclareAction(gameId, aliceMinion, ActionType.BLEED, "Bob"));
        // Pass impulse through Alice → Bob would be next, but skip to Carol for testing
        gameCommandService.execute("Alice", new PassImpulse(gameId, "Alice"));
        gameCommandService.execute("Bob", new PassImpulse(gameId, "Bob"));

        CardRef carolRef = new CardRef("Carol", RegionType.READY, 0, -1);
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Carol", new AttemptBlock(gameId, carolRef)));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void closeImpulse() {
        gameCommandService.execute("Alice",
                new net.deckserver.jol.game.command.CloseImpulseWindow(gameId));
    }
}
