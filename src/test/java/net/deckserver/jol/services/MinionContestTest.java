package net.deckserver.jol.services;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for MinionHandler (MoveToTorpor, RescueFromTorpor, BurnMinion)
 * and ContestHandler (ContestCard, ClearContestCard, SetTitle).
 */
@QuarkusTest
class MinionContestTest {

    @Inject GameCommandService gameCommandService;
    @Inject GameStateStore gameStateStore;

    private GameData game;
    private String gameId;
    private CardData readyCard;
    private CardData torporCard;
    private CardRef readyRef;
    private CardRef torporRef;

    @BeforeEach
    void setup() {
        game = new GameData("minion-test", "Minion Test");
        PlayerData alice = new PlayerData("Alice");
        game.addPlayer(alice);
        game.updatePredatorMapping();
        game.setCurrentPlayer(alice);
        game.setPhase(Phase.MINION);
        game.setTurn("1.1");

        readyCard = new CardData("vamp-001", alice);
        readyCard.setName("Dima");
        readyCard.setMinion(true);
        alice.getRegion(RegionType.READY).addCard(readyCard, false);
        game.registerCard(readyCard);

        torporCard = new CardData("vamp-002", alice);
        torporCard.setName("Elena");
        torporCard.setMinion(true);
        alice.getRegion(RegionType.TORPOR).addCard(torporCard, false);
        game.registerCard(torporCard);

        readyRef  = new CardRef("Alice", RegionType.READY,  0, -1);
        torporRef = new CardRef("Alice", RegionType.TORPOR, 0, -1);

        gameId = game.getId();
        gameStateStore.put(gameId, game);
    }

    @AfterEach
    void cleanup() {
        gameStateStore.remove(gameId);
    }

    // ── MoveToTorpor ──────────────────────────────────────────────────────────

    @Test
    void moveToTorpor_movesCardFromReadyToTorpor() {
        gameCommandService.execute("Alice", new MoveToTorpor(gameId, readyRef));

        assertFalse(alice().getRegion(RegionType.READY).getCards().contains(readyCard));
        assertTrue(alice().getRegion(RegionType.TORPOR).getCards().contains(readyCard));
    }

    @Test
    void moveToTorpor_invalidRef_throwsGameRuleException() {
        CardRef bad = new CardRef("Alice", RegionType.READY, 99, -1);
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new MoveToTorpor(gameId, bad)));
    }

    // ── RescueFromTorpor ──────────────────────────────────────────────────────

    @Test
    void rescueFromTorpor_movesCardFromTorporToReady() {
        gameCommandService.execute("Alice", new RescueFromTorpor(gameId, torporRef));

        assertFalse(alice().getRegion(RegionType.TORPOR).getCards().contains(torporCard));
        assertTrue(alice().getRegion(RegionType.READY).getCards().contains(torporCard));
    }

    @Test
    void rescueFromTorpor_invalidRef_throwsGameRuleException() {
        CardRef bad = new CardRef("Alice", RegionType.TORPOR, 99, -1);
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new RescueFromTorpor(gameId, bad)));
    }

    // ── BurnMinion ────────────────────────────────────────────────────────────

    @Test
    void burnMinion_fromReady_movesCardToAshHeap() {
        gameCommandService.execute("Alice", new BurnMinion(gameId, readyRef));

        assertFalse(alice().getRegion(RegionType.READY).getCards().contains(readyCard));
        assertTrue(alice().getRegion(RegionType.ASH_HEAP).getCards().contains(readyCard));
    }

    @Test
    void burnMinion_fromTorpor_movesCardToAshHeap() {
        gameCommandService.execute("Alice", new BurnMinion(gameId, torporRef));

        assertFalse(alice().getRegion(RegionType.TORPOR).getCards().contains(torporCard));
        assertTrue(alice().getRegion(RegionType.ASH_HEAP).getCards().contains(torporCard));
    }

    @Test
    void burnMinion_invalidRef_throwsGameRuleException() {
        CardRef bad = new CardRef("Alice", RegionType.READY, 99, -1);
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new BurnMinion(gameId, bad)));
    }

    // ── ContestCard / ClearContestCard ────────────────────────────────────────

    @Test
    void contestCard_setsContestedTrue() {
        assertFalse(readyCard.isContested());

        gameCommandService.execute("Alice", new ContestCard(gameId, readyRef));

        assertTrue(readyCard.isContested());
    }

    @Test
    void clearContestCard_setsContestedFalse() {
        readyCard.setContested(true);

        gameCommandService.execute("Alice", new ClearContestCard(gameId, readyRef));

        assertFalse(readyCard.isContested());
    }

    @Test
    void contestCard_invalidRef_throwsGameRuleException() {
        CardRef bad = new CardRef("Alice", RegionType.READY, 99, -1);
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new ContestCard(gameId, bad)));
    }

    // ── SetTitle ──────────────────────────────────────────────────────────────

    @Test
    void setTitle_storesTitle() {
        assertNull(readyCard.getTitle());

        gameCommandService.execute("Alice", new SetTitle(gameId, readyRef, "Prince of Vienna"));

        assertEquals("Prince of Vienna", readyCard.getTitle());
    }

    @Test
    void setTitle_updatesExistingTitle() {
        readyCard.setTitle("Baron");

        gameCommandService.execute("Alice", new SetTitle(gameId, readyRef, "Prince of Vienna"));

        assertEquals("Prince of Vienna", readyCard.getTitle());
    }

    @Test
    void setTitle_clearsTitle_whenSetToNull() {
        readyCard.setTitle("Prince of Vienna");

        gameCommandService.execute("Alice", new SetTitle(gameId, readyRef, null));

        assertNull(readyCard.getTitle());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PlayerData alice() {
        return game.getPlayer("Alice");
    }
}
