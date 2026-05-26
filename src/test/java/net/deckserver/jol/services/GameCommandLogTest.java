package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies that CommandLogData records contain correct visibility (hidden/revealed)
 * information for card references depending on the regions involved.
 *
 * Uses a pregenerated game snapshot (game-full-detail.json) loaded directly into the
 * store, so no DB or game-init setup is required.
 */
@QuarkusTest
class GameCommandLogTest {

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

    // ── TRANSFER_BLOOD ────────────────────────────────────────────────────────

    @Test
    void transferBlood_fromUncontrolled_logIsHidden() {
        // Grant budget and set influence phase as current player to allow the transfer
        gameData.setTransfersRemaining(4);
        gameData.setPhase(Phase.INFLUENCE);
        gameData.setCurrentPlayer(gameData.getPlayer(ACTOR));
        CardRef ref = CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0);

        var result = gameCommandService.execute(ACTOR, new TransferBlood(gameId, ref, 1));

        var log = assertInstanceOf(CommandLogData.TransferBloodLog.class, result.commandLog());
        assertTrue(log.card().hidden(), "card in UNCONTROLLED must be hidden in log");
        assertNull(log.card().cardId(), "hidden card must not expose cardId");
        assertNull(log.card().cardName(), "hidden card must not expose cardName");
        assertNotNull(log.card().owner(), "hidden card must still report owner");
        assertEquals(RegionType.UNCONTROLLED, log.card().region());
    }

    @Test
    void transferBlood_fromReadyRegion_logIsVisible() {
        // Move a card to READY first so we can transfer blood back from it
        setupInfluenceAsActor();
        gameCommandService.execute(ACTOR, new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0)));

        var result = gameCommandService.execute(ACTOR,
                new TransferBlood(gameId, CardRef.of(ACTOR, RegionType.READY, 0), -1));

        var log = assertInstanceOf(CommandLogData.TransferBloodLog.class, result.commandLog());
        assertFalse(log.card().hidden(), "card in READY must be visible in log");
        assertNotNull(log.card().cardId());
        assertNotNull(log.card().cardName());
    }

    // ── INFLUENCE_CARD ────────────────────────────────────────────────────────

    @Test
    void influenceCard_logIsVisible() {
        setupInfluenceAsActor();
        var result = gameCommandService.execute(ACTOR,
                new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0)));

        var log = assertInstanceOf(CommandLogData.InfluenceCardLog.class, result.commandLog());
        assertFalse(log.card().hidden(), "card moved to READY must be revealed in log");
        assertNotNull(log.card().cardId());
        assertNotNull(log.card().cardName());
    }

    // ── DISCARD_CARD ──────────────────────────────────────────────────────────

    @Test
    void discardCard_fromHand_logIsVisible() {
        CardData handCard = gameData.getPlayer(ACTOR).getRegion(RegionType.HAND).getCards().getFirst();

        var result = gameCommandService.execute(ACTOR,
                new DiscardCard(gameId, CardRef.of(ACTOR, RegionType.HAND, 0)));

        var log = assertInstanceOf(CommandLogData.DiscardCardLog.class, result.commandLog());
        assertFalse(log.card().hidden(), "discarded card goes to ASH_HEAP and must be revealed in log");
        assertEquals(handCard.getCardId(), log.card().cardId());
    }

    // ── MOVE_CARD ─────────────────────────────────────────────────────────────

    @Test
    void moveCard_fromHiddenToHidden_logIsHidden() {
        // LIBRARY → HAND: both hidden from other players
        var result = gameCommandService.execute(ACTOR,
                new MoveCard(gameId, CardRef.of(ACTOR, RegionType.LIBRARY, 0), ACTOR, RegionType.HAND, -1));

        var log = assertInstanceOf(CommandLogData.MoveCardLog.class, result.commandLog());
        assertTrue(log.card().hidden(), "move between hidden regions must stay hidden in log");
        assertNull(log.card().cardId());
    }

    @Test
    void moveCard_fromHiddenToVisible_logIsVisible() {
        // HAND → ASH_HEAP: destination is visible, so card is revealed
        var result = gameCommandService.execute(ACTOR,
                new MoveCard(gameId, CardRef.of(ACTOR, RegionType.HAND, 0), ACTOR, RegionType.ASH_HEAP, -1));

        var log = assertInstanceOf(CommandLogData.MoveCardLog.class, result.commandLog());
        assertFalse(log.card().hidden(), "move to visible region must reveal card in log");
        assertNotNull(log.card().cardId());
    }

    @Test
    void moveCard_fromVisibleToHidden_logIsVisible() {
        // Move to READY first, then back to LIBRARY: source was visible so card is revealed
        setupInfluenceAsActor();
        gameCommandService.execute(ACTOR, new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0)));

        var result = gameCommandService.execute(ACTOR,
                new MoveCard(gameId, CardRef.of(ACTOR, RegionType.READY, 0), ACTOR, RegionType.LIBRARY, -1));

        var log = assertInstanceOf(CommandLogData.MoveCardLog.class, result.commandLog());
        assertFalse(log.card().hidden(), "move from visible region must remain revealed in log");
        assertNotNull(log.card().cardId());
    }

    // ── ADD / REMOVE COUNTER ──────────────────────────────────────────────────

    @Test
    void addCounter_onUncontrolledCard_logIsHidden() {
        var result = gameCommandService.execute(ACTOR,
                new AddCounter(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0), 2));

        var log = assertInstanceOf(CommandLogData.AddCounterLog.class, result.commandLog());
        assertTrue(log.card().hidden());
        assertNull(log.card().cardId());
    }

    @Test
    void addCounter_onReadyCard_logIsVisible() {
        setupInfluenceAsActor();
        gameCommandService.execute(ACTOR, new InfluenceCard(gameId, CardRef.of(ACTOR, RegionType.UNCONTROLLED, 0)));

        var result = gameCommandService.execute(ACTOR,
                new AddCounter(gameId, CardRef.of(ACTOR, RegionType.READY, 0), 1));

        var log = assertInstanceOf(CommandLogData.AddCounterLog.class, result.commandLog());
        assertFalse(log.card().hidden());
        assertNotNull(log.card().cardId());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Sets INFLUENCE phase with ACTOR as current player so InfluenceCard commands are accepted. */
    private void setupInfluenceAsActor() {
        gameData.setPhase(Phase.INFLUENCE);
        gameData.setCurrentPlayer(gameData.getPlayer(ACTOR));
    }
}
