package net.deckserver.jol.services;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.GameStateDto;
import net.deckserver.jol.dto.PlayerStateDto;
import net.deckserver.jol.dto.RegionStateDto;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for GameStateProjector visibility rules.
 * GameStateProjector has no injected dependencies so a two-player in-memory
 * GameData is built directly in each test without touching the database.
 *
 * Visibility contract (from RegionType):
 *   OWNER_VISIBLE: READY, UNCONTROLLED, ASH_HEAP, HAND, TORPOR, REMOVED_FROM_GAME, RESEARCH
 *   OTHER_VISIBLE: READY, ASH_HEAP, TORPOR, REMOVED_FROM_GAME
 *   Hidden from others: HAND, LIBRARY, CRYPT, UNCONTROLLED (position/slot data only)
 */
@QuarkusTest
class GameStateProjectorTest {

    @Inject
    GameStateProjector projector;

    private GameData game;
    private PlayerData alice;
    private PlayerData bob;

    @BeforeEach
    void setup() {
        game  = new GameData("g1", "Test Game");
        alice = new PlayerData("alice");
        bob   = new PlayerData("bob");
        game.addPlayer(alice);
        game.addPlayer(bob);
        game.updatePredatorMapping();
        game.setCurrentPlayer(alice);
        game.setPhase(Phase.UNLOCK);
        game.setTurn("1.1");
    }

    // ── Top-level metadata ────────────────────────────────────────────────────

    @Test
    void project_includesCorrectGameMetadata() {
        GameStateDto dto = projector.project(game, "alice");

        assertEquals("g1",       dto.gameId);
        assertEquals("Test Game", dto.gameName);
        assertEquals("1.1",      dto.turn);
        assertEquals(Phase.UNLOCK, dto.phase);
        assertEquals("alice",    dto.currentPlayer);
    }

    @Test
    void project_playerOrderMatchesAddOrder() {
        GameStateDto dto = projector.project(game, "alice");

        assertEquals(List.of("alice", "bob"), dto.playerOrder);
    }

    @Test
    void project_includesAllPlayersInPlayerStates() {
        GameStateDto dto = projector.project(game, "alice");

        assertThat(dto.players, hasSize(2));
        List<String> names = dto.players.stream().map(p -> p.name).toList();
        assertThat(names, containsInAnyOrder("alice", "bob"));
    }

    // ── Player state fields ───────────────────────────────────────────────────

    @Test
    void project_playerState_hasCorrectPool() {
        alice.setPool(15);

        GameStateDto dto = projector.project(game, "alice");

        PlayerStateDto aliceState = dto.players.stream().filter(p -> "alice".equals(p.name)).findFirst().orElseThrow();
        assertEquals(15, aliceState.pool);
    }

    @Test
    void project_playerState_predatorPreyLinked() {
        GameStateDto dto = projector.project(game, "alice");

        PlayerStateDto aliceState = playerState(dto, "alice");
        PlayerStateDto bobState   = playerState(dto, "bob");

        // In a 2-player ring: alice's prey is bob, bob's prey is alice
        assertEquals("bob",   aliceState.prey);
        assertEquals("alice", bobState.prey);
    }

    // ── Visibility: HAND (owner-only) ─────────────────────────────────────────

    @Test
    void project_handRegion_visibleToOwner() {
        addCard("200076", "Vessel", alice, RegionType.HAND);

        GameStateDto dto = projector.project(game, "alice");

        RegionStateDto hand = regionState(dto, "alice", RegionType.HAND);
        assertTrue(hand.visible);
        assertEquals(1, hand.count);
        assertThat(hand.cardIds, hasSize(1));
    }

    @Test
    void project_handRegion_hiddenFromOpponent() {
        addCard("200076", "Vessel", alice, RegionType.HAND);

        GameStateDto dto = projector.project(game, "bob");

        RegionStateDto hand = regionState(dto, "alice", RegionType.HAND);
        assertFalse(hand.visible);
        assertEquals(1, hand.count);         // count is always exposed
        assertThat(hand.cardIds, empty());   // identity withheld
    }

    @Test
    void project_handCard_inCardMapForOwnerNotOpponent() {
        CardData card = addCard("200076", "Vessel", alice, RegionType.HAND);

        GameStateDto ownerView    = projector.project(game, "alice");
        GameStateDto opponentView = projector.project(game, "bob");

        assertThat(ownerView.cards.keySet(),    hasItem(card.getId()));
        assertThat(opponentView.cards.keySet(), not(hasItem(card.getId())));
    }

    // ── Visibility: READY (public) ────────────────────────────────────────────

    @Test
    void project_readyRegion_visibleToAllPlayers() {
        addCard("200076", "Anarch Convert", alice, RegionType.READY);

        GameStateDto ownerView    = projector.project(game, "alice");
        GameStateDto opponentView = projector.project(game, "bob");

        assertTrue(regionState(ownerView,    "alice", RegionType.READY).visible);
        assertTrue(regionState(opponentView, "alice", RegionType.READY).visible);
    }

    @Test
    void project_readyCard_inCardMapForAllPlayers() {
        CardData card = addCard("200076", "Anarch Convert", alice, RegionType.READY);

        GameStateDto ownerView    = projector.project(game, "alice");
        GameStateDto opponentView = projector.project(game, "bob");

        assertThat(ownerView.cards.keySet(),    hasItem(card.getId()));
        assertThat(opponentView.cards.keySet(), hasItem(card.getId()));
    }

    // ── Visibility: UNCONTROLLED (hidden identity, slot data exposed) ─────────

    @Test
    void project_uncontrolledRegion_hiddenFromOpponent_butSlotsExposed() {
        addCard("200076", "Some Vampire", alice, RegionType.UNCONTROLLED);

        GameStateDto dto = projector.project(game, "bob");

        RegionStateDto unc = regionState(dto, "alice", RegionType.UNCONTROLLED);
        assertFalse(unc.visible);
        assertEquals(1, unc.count);
        assertThat(unc.cardIds, empty());    // no UUID leak
        assertNotNull(unc.slots);           // positional slot data
        assertThat(unc.slots, hasSize(1));
    }

    @Test
    void project_uncontrolledRegion_visibleToOwner() {
        CardData card = addCard("200076", "Some Vampire", alice, RegionType.UNCONTROLLED);

        GameStateDto dto = projector.project(game, "alice");

        RegionStateDto unc = regionState(dto, "alice", RegionType.UNCONTROLLED);
        assertTrue(unc.visible);
        assertThat(unc.cardIds, hasSize(1));
        assertThat(unc.cardIds, hasItem(card.getId()));
    }

    // ── Visibility: LIBRARY / CRYPT (hidden from everyone except owner) ───────

    @Test
    void project_libraryRegion_hiddenFromOpponent() {
        CardData card = addCard("100518", "Deflection", alice, RegionType.LIBRARY);

        GameStateDto dto = projector.project(game, "bob");

        RegionStateDto lib = regionState(dto, "alice", RegionType.LIBRARY);
        assertFalse(lib.visible);
        assertEquals(1, lib.count);
        assertThat(lib.cardIds, empty());
        assertThat(dto.cards.keySet(), not(hasItem(card.getId())));
    }

    // ── ASH_HEAP (public) ─────────────────────────────────────────────────────

    @Test
    void project_ashHeapRegion_visibleToAll() {
        CardData card = addCard("100518", "Deflection", alice, RegionType.ASH_HEAP);

        GameStateDto opponentView = projector.project(game, "bob");

        RegionStateDto ash = regionState(opponentView, "alice", RegionType.ASH_HEAP);
        assertTrue(ash.visible);
        assertThat(ash.cardIds, hasItem(card.getId()));
        assertThat(opponentView.cards.keySet(), hasItem(card.getId()));
    }

    // ── Card state DTO ────────────────────────────────────────────────────────

    @Test
    void project_cardStateDto_hasCorrectOwnerAndName() {
        CardData card = addCard("200076", "Anarch Convert", alice, RegionType.READY);

        GameStateDto dto = projector.project(game, "alice");

        var cardDto = dto.cards.get(card.getId());
        assertNotNull(cardDto);
        assertEquals(card.getId(),     cardDto.id);
        assertEquals("Anarch Convert", cardDto.name);
        assertEquals("alice",          cardDto.ownerName);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private CardData addCard(String cardId, String name, PlayerData owner, RegionType region) {
        CardData card = new CardData(cardId, owner);
        card.setName(name);
        game.initRegion(owner.getRegion(region), List.of(card));
        return card;
    }

    private PlayerStateDto playerState(GameStateDto dto, String playerName) {
        return dto.players.stream()
                .filter(p -> playerName.equals(p.name))
                .findFirst()
                .orElseThrow(() -> new AssertionError("No player state for " + playerName));
    }

    private RegionStateDto regionState(GameStateDto dto, String playerName, RegionType type) {
        PlayerStateDto player = playerState(dto, playerName);
        RegionStateDto region = player.regions.get(type);
        assertNotNull(region, "No region state for " + playerName + "/" + type);
        return region;
    }
}
