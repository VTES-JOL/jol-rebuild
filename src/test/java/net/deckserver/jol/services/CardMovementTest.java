package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
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
 * Tests state mutations for CardMovementHandler (PlayCard, DiscardCard, MoveCard, AttachCard)
 * and DeckHandler (DrawCrypt, ShuffleLibrary, ShuffleCrypt).
 */
@QuarkusTest
class CardMovementTest {

    @Inject GameCommandService gameCommandService;
    @Inject GameStateStore gameStateStore;
    @Inject ObjectMapper mapper;

    private GameData game;
    private String gameId;
    private CardData handCard;
    private CardData readyCard1;
    private CardData readyCard2;
    private CardData cryptCard;
    private CardRef handRef;
    private CardRef ready0Ref;
    private CardRef ready1Ref;
    private CardRef crypt0Ref;

    @BeforeEach
    void setup() throws Exception {
        try (var is = getClass().getResourceAsStream("/game-2p-with-cards.json")) {
            game = mapper.readValue(is, GameData.class);
        }
        handCard   = game.getPlayer("Alice").getRegion(RegionType.HAND).getCard(0);
        readyCard1 = game.getPlayer("Alice").getRegion(RegionType.READY).getCard(0);
        readyCard2 = game.getPlayer("Alice").getRegion(RegionType.READY).getCard(1);
        cryptCard  = game.getPlayer("Alice").getRegion(RegionType.CRYPT).getCard(0);
        handRef   = new CardRef("Alice", RegionType.HAND,  0, -1);
        ready0Ref = new CardRef("Alice", RegionType.READY, 0, -1);
        ready1Ref = new CardRef("Alice", RegionType.READY, 1, -1);
        crypt0Ref = new CardRef("Alice", RegionType.CRYPT, 0, -1);
        gameId = game.getId();
        gameStateStore.put(gameId, game);
    }

    @AfterEach
    void cleanup() {
        gameStateStore.remove(gameId);
    }

    // ── DiscardCard ───────────────────────────────────────────────────────────

    @Test
    void discardCard_movesCardFromHandToAshHeap() {
        gameCommandService.execute("Alice", new DiscardCard(gameId, handRef));

        assertFalse(alice().getRegion(RegionType.HAND).getCards().contains(handCard));
        assertTrue(alice().getRegion(RegionType.ASH_HEAP).getCards().contains(handCard));
    }

    @Test
    void discardCard_invalidRef_throwsGameRuleException() {
        CardRef bad = new CardRef("Alice", RegionType.HAND, 99, -1);
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new DiscardCard(gameId, bad)));
    }

    // ── PlayCard ──────────────────────────────────────────────────────────────

    @Test
    void playCard_withoutTarget_movesCardToAshHeap() {
        gameCommandService.execute("Alice", new PlayCard(gameId, handRef, null, null));

        assertFalse(alice().getRegion(RegionType.HAND).getCards().contains(handCard));
        assertTrue(alice().getRegion(RegionType.ASH_HEAP).getCards().contains(handCard));
    }

    @Test
    void playCard_withTarget_movesCardToTargetRegion() {
        gameCommandService.execute("Alice", new PlayCard(gameId, handRef, "Alice", RegionType.READY));

        assertFalse(alice().getRegion(RegionType.HAND).getCards().contains(handCard));
        assertTrue(alice().getRegion(RegionType.READY).getCards().contains(handCard));
    }

    @Test
    void playCard_toAnotherPlayer_movesCardToTheirRegion() {
        gameCommandService.execute("Alice", new PlayCard(gameId, handRef, "Bob", RegionType.READY));

        assertFalse(alice().getRegion(RegionType.HAND).getCards().contains(handCard));
        assertTrue(game.getPlayer("Bob").getRegion(RegionType.READY).getCards().contains(handCard));
    }

    @Test
    void playCard_invalidTargetPlayer_throwsGameRuleException() {
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice",
                        new PlayCard(gameId, handRef, "Nobody", RegionType.READY)));
    }

    // ── MoveCard ──────────────────────────────────────────────────────────────

    @Test
    void moveCard_movesCardToTargetPlayerAndRegion() {
        gameCommandService.execute("Alice",
                new MoveCard(gameId, ready0Ref, "Bob", RegionType.READY, -1));

        assertFalse(alice().getRegion(RegionType.READY).getCards().contains(readyCard1));
        assertTrue(game.getPlayer("Bob").getRegion(RegionType.READY).getCards().contains(readyCard1));
    }

    @Test
    void moveCard_withinSamePlayerRegion_repositionsCard() {
        gameCommandService.execute("Alice",
                new MoveCard(gameId, ready0Ref, "Alice", RegionType.TORPOR, -1));

        assertFalse(alice().getRegion(RegionType.READY).getCards().contains(readyCard1));
        assertTrue(alice().getRegion(RegionType.TORPOR).getCards().contains(readyCard1));
    }

    @Test
    void moveCard_invalidTargetPlayer_throwsGameRuleException() {
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice",
                        new MoveCard(gameId, ready0Ref, "Nobody", RegionType.READY, -1)));
    }

    // ── AttachCard ────────────────────────────────────────────────────────────

    @Test
    void attachCard_addsCardAsChildOfTarget() {
        gameCommandService.execute("Alice", new AttachCard(gameId, handRef, ready0Ref));

        assertTrue(readyCard1.getCards().contains(handCard));
        assertFalse(alice().getRegion(RegionType.HAND).getCards().contains(handCard));
    }

    @Test
    void attachCard_invalidCardRef_throwsGameRuleException() {
        CardRef bad = new CardRef("Alice", RegionType.HAND, 99, -1);
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new AttachCard(gameId, bad, ready0Ref)));
    }

    @Test
    void attachCard_invalidTargetRef_throwsGameRuleException() {
        CardRef bad = new CardRef("Alice", RegionType.READY, 99, -1);
        assertThrows(GameRuleException.class,
                () -> gameCommandService.execute("Alice", new AttachCard(gameId, handRef, bad)));
    }

    // ── DrawCrypt ─────────────────────────────────────────────────────────────

    @Test
    void drawCrypt_movesTopCardFromCryptToUncontrolled() {
        int cryptBefore        = alice().getRegion(RegionType.CRYPT).getCards().size();
        int uncontrolledBefore = alice().getRegion(RegionType.UNCONTROLLED).getCards().size();

        gameCommandService.execute("Alice", new DrawCrypt(gameId, 1));

        assertEquals(cryptBefore - 1,        alice().getRegion(RegionType.CRYPT).getCards().size());
        assertEquals(uncontrolledBefore + 1,  alice().getRegion(RegionType.UNCONTROLLED).getCards().size());
        assertTrue(alice().getRegion(RegionType.UNCONTROLLED).getCards().contains(cryptCard));
    }

    @Test
    void drawCrypt_drawMoreThanAvailable_drawsAllRemaining() {
        gameCommandService.execute("Alice", new DrawCrypt(gameId, 100));

        assertEquals(0, alice().getRegion(RegionType.CRYPT).getCards().size());
    }

    @Test
    void drawCrypt_fromEmptyCrypt_drawsNothing() {
        // Drain the crypt first
        gameCommandService.execute("Alice", new DrawCrypt(gameId, 100));
        int uncontrolledCount = alice().getRegion(RegionType.UNCONTROLLED).getCards().size();

        gameCommandService.execute("Alice", new DrawCrypt(gameId, 1));

        assertEquals(uncontrolledCount, alice().getRegion(RegionType.UNCONTROLLED).getCards().size());
    }

    // ── ShuffleLibrary / ShuffleCrypt ─────────────────────────────────────────

    @Test
    void shuffleLibrary_preservesLibrarySize() {
        for (int i = 0; i < 5; i++) {
            CardData lib = new CardData("lib-" + (i + 10), alice());
            lib.setName("Library Card " + i);
            alice().getRegion(RegionType.LIBRARY).addCard(lib, false);
            game.registerCard(lib);
        }
        int sizeBefore = alice().getRegion(RegionType.LIBRARY).getCards().size();

        gameCommandService.execute("Alice", new ShuffleLibrary(gameId));

        assertEquals(sizeBefore, alice().getRegion(RegionType.LIBRARY).getCards().size());
    }

    @Test
    void shuffleCrypt_preservesCryptSize() {
        for (int i = 0; i < 3; i++) {
            CardData crypt = new CardData("crypt-" + (i + 10), alice());
            crypt.setName("Crypt Card " + i);
            alice().getRegion(RegionType.CRYPT).addCard(crypt, false);
            game.registerCard(crypt);
        }
        int sizeBefore = alice().getRegion(RegionType.CRYPT).getCards().size();

        gameCommandService.execute("Alice", new ShuffleCrypt(gameId));

        assertEquals(sizeBefore, alice().getRegion(RegionType.CRYPT).getCards().size());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private PlayerData alice() {
        return game.getPlayer("Alice");
    }
}
