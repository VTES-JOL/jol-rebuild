package net.deckserver.jol.game;

import net.deckserver.jol.enums.ImpulseContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ImpulseEngine. Four-player ring: Alice → Bob → Carol → Dave → Alice.
 * Alice's prey=Bob, predator=Dave; Bob's prey=Carol, predator=Alice, etc.
 */
class ImpulseEngineTest {

    private GameData game;
    private PlayerData alice, bob, carol, dave;

    @BeforeEach
    void setup() {
        alice = new PlayerData("Alice");
        bob   = new PlayerData("Bob");
        carol = new PlayerData("Carol");
        dave  = new PlayerData("Dave");

        alice.setPrey(bob);   alice.setPredator(dave);
        bob.setPrey(carol);   bob.setPredator(alice);
        carol.setPrey(dave);  carol.setPredator(bob);
        dave.setPrey(alice);  dave.setPredator(carol);

        game = new GameData("test");
        game.addPlayer(alice);
        game.addPlayer(bob);
        game.addPlayer(carol);
        game.addPlayer(dave);
    }

    // ── open() ───────────────────────────────────────────────────────────────

    @Test
    void open_undirected_setsStateFields() {
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.UNDIRECTED, "Alice", null);

        assertTrue(state.isActive());
        assertEquals(ImpulseContext.UNDIRECTED, state.getContext());
        assertEquals("Alice", state.getActingPlayer());
        assertEquals("Alice", state.getCurrentImpulseHolder());
        assertEquals(0, state.getConsecutivePasses());
    }

    @Test
    void open_undirected_passOrder_preyThenPredatorThenRest() {
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.UNDIRECTED, "Alice", null);
        // Alice's prey=Bob, predator=Dave; remaining=Carol
        assertEquals(List.of("Alice", "Bob", "Dave", "Carol"), state.getPassOrder());
    }

    @Test
    void open_directedSingle_targetIsSecond() {
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.DIRECTED_SINGLE, "Alice", "Carol");
        List<String> order = state.getPassOrder();
        assertEquals("Alice", order.get(0));
        assertEquals("Carol", order.get(1));
        assertEquals(4, order.size());
    }

    @Test
    void open_directedMulti_clockwiseFromActing() {
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.DIRECTED_MULTI, "Alice", null);
        // No prey/predator priority — just acting + clockwise rest
        List<String> order = state.getPassOrder();
        assertEquals("Alice", order.get(0));
        assertEquals(4, order.size());
    }

    @Test
    void open_combat_targetIsSecond() {
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.COMBAT, "Bob", "Dave");
        List<String> order = state.getPassOrder();
        assertEquals("Bob", order.get(0));
        assertEquals("Dave", order.get(1));
    }

    // ── pass() ───────────────────────────────────────────────────────────────

    @Test
    void pass_advancesHolderToNextInOrder() {
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.UNDIRECTED, "Alice", null);
        // Order: [Alice, Bob, Dave, Carol]
        ImpulseState after = ImpulseEngine.pass(state);

        assertNotNull(after);
        assertEquals("Bob", after.getCurrentImpulseHolder());
        assertEquals(1, after.getConsecutivePasses());
    }

    @Test
    void pass_returnsNullWhenAllPlayersPassed() {
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.UNDIRECTED, "Alice", null);
        // Pass 3 times to reach the 4th (final) pass
        state = ImpulseEngine.pass(state); // 1
        state = ImpulseEngine.pass(state); // 2
        state = ImpulseEngine.pass(state); // 3
        assertNotNull(state);
        ImpulseState closed = ImpulseEngine.pass(state); // 4 — all passed
        assertNull(closed);
    }

    @Test
    void pass_singlePlayerWindow_closesImmediately() {
        // If only one player in game, pass order size = 1; first pass closes
        GameData solo = new GameData("solo");
        PlayerData only = new PlayerData("Only");
        solo.addPlayer(only);

        ImpulseState state = ImpulseEngine.open(solo, ImpulseContext.UNDIRECTED, "Only", null);
        assertNull(ImpulseEngine.pass(state));
    }

    // ── claim() ──────────────────────────────────────────────────────────────

    @Test
    void claim_returnsImpulseToActingPlayer() {
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.UNDIRECTED, "Alice", null);
        state = ImpulseEngine.pass(state); // Bob now holds

        ImpulseState claimed = ImpulseEngine.claim(state);

        assertNotNull(claimed);
        assertEquals("Alice", claimed.getCurrentImpulseHolder());
    }

    @Test
    void claim_resetsConsecutivePasses() {
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.UNDIRECTED, "Alice", null);
        state = ImpulseEngine.pass(state); // consecutivePasses = 1
        state = ImpulseEngine.pass(state); // consecutivePasses = 2

        ImpulseState claimed = ImpulseEngine.claim(state);
        assertEquals(0, claimed.getConsecutivePasses());
    }

    // ── buildPassOrder() ─────────────────────────────────────────────────────

    @Test
    void buildPassOrder_actorNotInGame_returnsActorOnly() {
        List<String> order = ImpulseEngine.buildPassOrder(game, ImpulseContext.UNDIRECTED, "Ghost", null);
        assertEquals(List.of("Ghost"), order);
    }
}
