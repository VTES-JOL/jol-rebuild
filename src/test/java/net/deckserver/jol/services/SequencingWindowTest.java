package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.enums.ActionType;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for the After Resolution sequencing window: PassSequencing / CloseSequencingWindow.
 * Four-player game: Alice → Bob → Carol → Dave.
 * After resolution the sequencing window passes clockwise from Alice.
 */
@QuarkusTest
class SequencingWindowTest {

    @Inject GameCommandService gameCommandService;
    @Inject GameStateStore gameStateStore;
    @Inject ObjectMapper mapper;

    private GameData game;
    private String gameId;
    private CardRef aliceMinion;

    @BeforeEach
    void setup() throws Exception {
        try (var is = getClass().getResourceAsStream("/game-4p-with-minions.json")) {
            game = mapper.readValue(is, GameData.class);
        }
        aliceMinion = new CardRef("Alice", RegionType.READY, 0, -1);
        gameId = game.getId();
        gameStateStore.put(gameId, game);
    }

    @AfterEach
    void cleanup() {
        gameStateStore.remove(gameId);
    }

    // ── PassSequencing ────────────────────────────────────────────────────────

    @Test
    void passSequencing_advancesHolder() {
        openAfterResolutionWindow();

        gameCommandService.execute("Alice", new PassSequencing(gameId, "Alice"));

        assertNotNull(game.getSequencingWindow());
        assertTrue(game.getSequencingWindow().isActive());
        assertEquals(1, game.getSequencingWindow().getConsecutivePasses());
        assertNotEquals("Alice", game.getSequencingWindow().getCurrentHolder());
    }

    @Test
    void passSequencing_byNonHolder_throws() {
        openAfterResolutionWindow();

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Bob", new PassSequencing(gameId, "Bob")));
    }

    @Test
    void passSequencing_allPassConsecutively_closesWindowAndClearsPendingAction() {
        openAfterResolutionWindow();

        assertEquals(ActionStatus.AFTER_RESOLUTION, game.getPendingAction().getStatus());

        // UNDIRECTED passOrder from Alice: [Alice, Bob, Dave, Carol]
        gameCommandService.execute("Alice", new PassSequencing(gameId, "Alice"));
        gameCommandService.execute("Bob",   new PassSequencing(gameId, "Bob"));
        gameCommandService.execute("Dave",  new PassSequencing(gameId, "Dave"));
        gameCommandService.execute("Carol", new PassSequencing(gameId, "Carol"));

        assertNull(game.getSequencingWindow());
        assertNull(game.getPendingAction());
    }

    @Test
    void passSequencing_whenNoWindowOpen_isNoOp() {
        assertNull(game.getSequencingWindow());
        var result = gameCommandService.execute("Alice", new PassSequencing(gameId, "Alice"));
        assertNotNull(result);
        assertNull(game.getSequencingWindow());
    }

    // ── CloseSequencingWindow ─────────────────────────────────────────────────

    @Test
    void closeSequencingWindow_clearsWindowAndPendingAction() {
        openAfterResolutionWindow();

        assertNotNull(game.getPendingAction());
        gameCommandService.execute("Alice", new CloseSequencingWindow(gameId));

        assertNull(game.getSequencingWindow());
        assertNull(game.getPendingAction());
    }

    // ── Sequencing gate ───────────────────────────────────────────────────────

    @Test
    void commandBlockedWhenActorLacksSequencingPriority() {
        openAfterResolutionWindow();
        assertEquals("Alice", game.getSequencingWindow().getCurrentHolder());

        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Bob", new DrawCard(gameId, 1)));
    }

    @Test
    void passSequencingIsAlwaysAllowedRegardlessOfImpulseWindow() {
        openAfterResolutionWindow();

        var result = gameCommandService.execute("Alice", new PassSequencing(gameId, "Alice"));

        assertNotNull(result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void openAfterResolutionWindow() {
        gameCommandService.execute("Alice",
                new DeclareAction(gameId, aliceMinion, ActionType.HUNT, null));
        gameCommandService.execute("Alice",
                new CloseImpulseWindow(gameId));
        gameCommandService.execute("Alice",
                new ResolveAction(gameId));
    }
}
