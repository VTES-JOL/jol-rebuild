package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies that invalid commands throw GameRuleException with a descriptive message
 * rather than silently failing. Uses the same game snapshot as GameCommandStateTest.
 */
@QuarkusTest
class GameRuleViolationTest {

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

    @Test
    void transferBlood_outsideInfluencePhase_throwsGameRuleException() {
        assertNotEquals(Phase.INFLUENCE, gameData.getPhase());

        // Build a ref pointing to an UNCONTROLLED card slot
        PlayerData player = gameData.getPlayer(ACTOR);
        int uncontrolledCount = player.getRegion(net.deckserver.jol.enums.RegionType.UNCONTROLLED).getCards().size();
        if (uncontrolledCount == 0) return; // snapshot has no uncontrolled cards for this player — skip

        CardRef ref = new CardRef(ACTOR, net.deckserver.jol.enums.RegionType.UNCONTROLLED, 0, -1);
        GameRuleException ex = assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(ACTOR, new TransferBlood(gameId, ref, 1)));
        assertTrue(ex.getMessage().contains("phase"), "Error should mention phase, got: " + ex.getMessage());
    }

    @Test
    void influenceCard_notCurrentPlayer_throwsGameRuleException() {
        String currentPlayer = gameData.getCurrentPlayerName();
        String nonCurrentPlayer = gameData.getPlayerOrder().stream()
                .filter(p -> !p.equals(currentPlayer))
                .findFirst()
                .orElseThrow();

        // Force phase to INFLUENCE so we isolate the actor check
        gameData.setPhase(Phase.INFLUENCE);

        PlayerData player = gameData.getPlayer(nonCurrentPlayer);
        int uncontrolledCount = player.getRegion(net.deckserver.jol.enums.RegionType.UNCONTROLLED).getCards().size();
        if (uncontrolledCount == 0) return;

        CardRef ref = new CardRef(nonCurrentPlayer, net.deckserver.jol.enums.RegionType.UNCONTROLLED, 0, -1);
        GameRuleException ex = assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(nonCurrentPlayer, new InfluenceCard(gameId, ref)));
        assertTrue(ex.getMessage().contains("turn"), "Error should mention turn, got: " + ex.getMessage());
    }

    @Test
    void transferBlood_insufficientBudget_throwsGameRuleException() {
        gameData.setPhase(Phase.INFLUENCE);
        gameData.setTransfersRemaining(0);
        String currentPlayer = gameData.getCurrentPlayerName();

        PlayerData player = gameData.getPlayer(currentPlayer);
        int uncontrolledCount = player.getRegion(net.deckserver.jol.enums.RegionType.UNCONTROLLED).getCards().size();
        if (uncontrolledCount == 0) return;

        CardRef ref = new CardRef(currentPlayer, net.deckserver.jol.enums.RegionType.UNCONTROLLED, 0, -1);
        GameRuleException ex = assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(currentPlayer, new TransferBlood(gameId, ref, 1)));
        assertTrue(ex.getMessage().contains("budget") || ex.getMessage().contains("transfer"),
                "Error should mention budget/transfer, got: " + ex.getMessage());
    }

    @Test
    void commandWithInvalidCardRef_throwsGameRuleException() {
        CardRef badRef = new CardRef(ACTOR, net.deckserver.jol.enums.RegionType.READY, 9999, -1);
        GameRuleException ex = assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(ACTOR, new LockCard(gameId, badRef)));
        assertTrue(ex.getMessage().contains("Card"), "Error should mention card, got: " + ex.getMessage());
    }

    @Test
    void commandWithInvalidPlayer_throwsGameRuleException() {
        GameRuleException ex = assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(ACTOR, new SetPool(gameId, "NonExistentPlayer", 10)));
        assertTrue(ex.getMessage().contains("Player") || ex.getMessage().contains("not found"),
                "Error should mention player, got: " + ex.getMessage());
    }

    @Test
    void passImpulse_whenNotHolder_throwsGameRuleException() {
        String currentPlayer = gameData.getCurrentPlayerName();
        // The auto-impulse window is already open from game state; find a non-holder
        var impulse = gameData.getImpulseWindow();
        if (impulse == null || !impulse.isActive()) return;

        String nonHolder = gameData.getPlayerOrder().stream()
                .filter(p -> !p.equals(impulse.getCurrentImpulseHolder()))
                .findFirst()
                .orElse(null);
        if (nonHolder == null) return;

        GameRuleException ex = assertThrows(GameRuleException.class,
                () -> gameCommandService.execute(nonHolder, new PassImpulse(gameId, nonHolder)));
        assertNotNull(ex.getMessage());
    }
}
