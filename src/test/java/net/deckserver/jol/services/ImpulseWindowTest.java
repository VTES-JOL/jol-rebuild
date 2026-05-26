package net.deckserver.jol.services;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.ImpulseContext;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.AdvancePhase;
import net.deckserver.jol.game.command.ClaimImpulse;
import net.deckserver.jol.game.command.CloseImpulseWindow;
import net.deckserver.jol.game.command.DrawCard;
import net.deckserver.jol.game.command.OpenImpulseWindow;
import net.deckserver.jol.game.command.PassImpulse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for the impulse/sequencing window commands.
 * Four-player game: Alice → Bob → Carol → Dave → (back to Alice).
 * Alice is prey of Dave, Bob is prey of Alice, etc.
 */
@QuarkusTest
class ImpulseWindowTest {

    @Inject GameCommandService gameCommandService;
    @Inject GameStateStore gameStateStore;

    private GameData game;
    private String gameId;

    @BeforeEach
    void setup() {
        game = new GameData("impulse-test", "Impulse Test");
        PlayerData alice = new PlayerData("Alice");
        PlayerData bob   = new PlayerData("Bob");
        PlayerData carol = new PlayerData("Carol");
        PlayerData dave  = new PlayerData("Dave");
        game.addPlayer(alice);
        game.addPlayer(bob);
        game.addPlayer(carol);
        game.addPlayer(dave);
        game.updatePredatorMapping();
        game.setCurrentPlayer(alice);
        game.setPhase(Phase.MINION);
        game.setTurn("1.1");
        gameId = game.getId();
        gameStateStore.put(gameId, game);
    }

    @AfterEach
    void cleanup() {
        gameStateStore.remove(gameId);
    }

    // ── Open window ───────────────────────────────────────────────────────────

    @Test
    void openUndirected_setsActiveAndPassOrder() {
        gameCommandService.execute("Alice", new OpenImpulseWindow(gameId, ImpulseContext.UNDIRECTED, "Alice", null));

        assertNotNull(game.getImpulseWindow());
        assertTrue(game.getImpulseWindow().isActive());
        assertEquals("Alice", game.getImpulseWindow().getActingPlayer());
        assertEquals("Alice", game.getImpulseWindow().getCurrentImpulseHolder());
        assertEquals(0, game.getImpulseWindow().getConsecutivePasses());

        // UNDIRECTED: [acting=Alice, prey=Bob, predator=Dave, then Carol]
        var order = game.getImpulseWindow().getPassOrder();
        assertEquals(4, order.size());
        assertEquals("Alice", order.get(0));
        assertEquals("Bob",   order.get(1));  // Alice's prey
        assertEquals("Dave",  order.get(2));  // Alice's predator
        assertEquals("Carol", order.get(3));  // remaining clockwise
    }

    @Test
    void openDirectedSingle_putsTargetSecond() {
        gameCommandService.execute("Alice", new OpenImpulseWindow(gameId, ImpulseContext.DIRECTED_SINGLE, "Alice", "Carol"));

        var order = game.getImpulseWindow().getPassOrder();
        assertEquals(4, order.size());
        assertEquals("Alice", order.get(0));
        assertEquals("Carol", order.get(1));  // target goes first after acting
        // remaining clockwise from Alice, skipping Carol: Bob, Dave
        assertEquals("Bob",  order.get(2));
        assertEquals("Dave", order.get(3));
    }

    @Test
    void openCombat_behavesSameAsDirectedSingle() {
        gameCommandService.execute("Alice", new OpenImpulseWindow(gameId, ImpulseContext.COMBAT, "Alice", "Dave"));

        var order = game.getImpulseWindow().getPassOrder();
        assertEquals(4, order.size());
        assertEquals("Alice", order.get(0));
        assertEquals("Dave",  order.get(1));  // defender
        // remaining clockwise: Bob, Carol
        assertEquals("Bob",   order.get(2));
        assertEquals("Carol", order.get(3));
    }

    // ── Pass impulse ──────────────────────────────────────────────────────────

    @Test
    void passImpulse_advancesHolder() {
        openUndirected("Alice");

        gameCommandService.execute("Alice", new PassImpulse(gameId, "Alice"));

        assertEquals("Bob", game.getImpulseWindow().getCurrentImpulseHolder());
        assertEquals(1, game.getImpulseWindow().getConsecutivePasses());
        assertTrue(game.getImpulseWindow().isActive());
    }

    @Test
    void passImpulse_byNonHolder_isNoOp() {
        openUndirected("Alice");

        gameCommandService.execute("Bob", new PassImpulse(gameId, "Bob")); // Alice holds, not Bob

        assertEquals("Alice", game.getImpulseWindow().getCurrentImpulseHolder());
        assertEquals(0, game.getImpulseWindow().getConsecutivePasses());
    }

    @Test
    void passImpulse_allPassConsecutively_closesWindow() {
        openUndirected("Alice");
        // passOrder: [Alice, Bob, Dave, Carol]

        gameCommandService.execute("Alice", new PassImpulse(gameId, "Alice"));
        gameCommandService.execute("Bob",   new PassImpulse(gameId, "Bob"));
        gameCommandService.execute("Dave",  new PassImpulse(gameId, "Dave"));
        gameCommandService.execute("Carol", new PassImpulse(gameId, "Carol"));

        assertFalse(game.getImpulseWindow().isActive());
    }

    // ── Claim impulse ─────────────────────────────────────────────────────────

    @Test
    void claimImpulse_resetsToActingPlayer() {
        openUndirected("Alice");

        gameCommandService.execute("Alice", new PassImpulse(gameId, "Alice"));
        assertEquals("Bob", game.getImpulseWindow().getCurrentImpulseHolder());

        gameCommandService.execute("Bob", new ClaimImpulse(gameId, "Bob"));

        assertEquals("Alice", game.getImpulseWindow().getCurrentImpulseHolder());
        assertEquals(0, game.getImpulseWindow().getConsecutivePasses());
        assertTrue(game.getImpulseWindow().isActive());
    }

    @Test
    void claimImpulse_afterSomePasses_preventsAutoClose() {
        openUndirected("Alice");
        // Alice passes → Bob; Bob passes → Dave; Dave claims → back to Alice; now need 4 more passes to close
        gameCommandService.execute("Alice", new PassImpulse(gameId, "Alice"));
        gameCommandService.execute("Bob",   new PassImpulse(gameId, "Bob"));
        gameCommandService.execute("Dave",  new ClaimImpulse(gameId, "Dave"));

        assertEquals("Alice", game.getImpulseWindow().getCurrentImpulseHolder());
        assertEquals(0, game.getImpulseWindow().getConsecutivePasses());
        assertTrue(game.getImpulseWindow().isActive());
    }

    @Test
    void claimImpulse_byNonHolder_isNoOp() {
        openUndirected("Alice"); // Alice holds impulse

        gameCommandService.execute("Bob", new ClaimImpulse(gameId, "Bob")); // Bob doesn't hold it

        assertEquals("Alice", game.getImpulseWindow().getCurrentImpulseHolder());
        assertEquals(0, game.getImpulseWindow().getConsecutivePasses());
    }

    // ── Close window ──────────────────────────────────────────────────────────

    @Test
    void closeImpulseWindow_deactivatesAndClearsState() {
        openUndirected("Alice");

        gameCommandService.execute("Alice", new CloseImpulseWindow(gameId));

        assertNull(game.getImpulseWindow());
    }

    @Test
    void closeImpulseWindow_whenNoWindowOpen_isNoOp() {
        assertNull(game.getImpulseWindow());
        gameCommandService.execute("Alice", new CloseImpulseWindow(gameId));
        assertNull(game.getImpulseWindow());
    }

    // ── Auto-open impulse on phase advance ────────────────────────────────────

    @Test
    void advancePhase_autoOpensImpulseWindow() {
        assertNull(game.getImpulseWindow());

        gameCommandService.execute("Alice", new AdvancePhase(gameId));

        assertEquals(Phase.INFLUENCE, game.getPhase());
        assertNotNull(game.getImpulseWindow());
        assertTrue(game.getImpulseWindow().isActive());
        assertEquals("Alice", game.getImpulseWindow().getActingPlayer());
        assertEquals("Alice", game.getImpulseWindow().getCurrentImpulseHolder());
    }

    @Test
    void nextTurn_autoOpensImpulseWindowForNewPlayer() {
        game.setPhase(Phase.DISCARD);

        gameCommandService.execute("Alice", new AdvancePhase(gameId));

        assertEquals(Phase.UNLOCK, game.getPhase());
        assertEquals("Bob", game.getCurrentPlayerName());
        assertNotNull(game.getImpulseWindow());
        assertTrue(game.getImpulseWindow().isActive());
        assertEquals("Bob", game.getImpulseWindow().getActingPlayer());
        assertEquals("Bob", game.getImpulseWindow().getCurrentImpulseHolder());
    }

    // ── Impulse gate ──────────────────────────────────────────────────────────

    @Test
    void commandBlockedWhenActorLacksImpulse() {
        openUndirected("Alice");

        var result = gameCommandService.execute("Bob", new DrawCard(gameId, 1));

        assertNull(result.logMessage());
    }

    @Test
    void commandAllowedWhenActorHoldsImpulse() {
        openUndirected("Alice");

        var result = gameCommandService.execute("Alice", new DrawCard(gameId, 1));

        assertNotNull(result.logMessage());
    }

    @Test
    void advancePhaseWorksRegardlessOfImpulseHolder() {
        openUndirected("Alice");
        gameCommandService.execute("Alice", new PassImpulse(gameId, "Alice"));
        assertEquals("Bob", game.getImpulseWindow().getCurrentImpulseHolder());

        var result = gameCommandService.execute("Alice", new AdvancePhase(gameId));

        assertNotNull(result.logMessage());
        assertEquals(Phase.INFLUENCE, game.getPhase());
        assertNotNull(game.getImpulseWindow());
        assertEquals("Alice", game.getImpulseWindow().getCurrentImpulseHolder());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void openUndirected(String actor) {
        gameCommandService.execute(actor, new OpenImpulseWindow(gameId, ImpulseContext.UNDIRECTED, actor, null));
    }
}
