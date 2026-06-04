package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.GameData;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Smoke-tests that each scenario fixture file parses into a coherent GameData.
 * These files live in src/test/resources/ and are used as starting points for
 * service-level tests (ImpulseWindowTest, ActionWindowTest, MinionContestTest, etc.).
 */
@QuarkusTest
class GameFixtureLoadTest {

    @Inject ObjectMapper mapper;

    // ── game-4p-minion-phase.json ─────────────────────────────────────────────

    @Test
    void load_4pMinionPhase_parsesPlayers() throws Exception {
        GameData game = load("/game-4p-minion-phase.json");

        assertEquals(4, game.getPlayerOrder().size());
        assertEquals("Alice", game.getCurrentPlayerName());
        assertEquals(Phase.MINION, game.getPhase());
        assertTrue(game.isRulesEnforced());
        assertTrue(game.getCards().isEmpty());
    }

    @Test
    void load_4pMinionPhase_predatorPreyRingIsCorrect() throws Exception {
        GameData game = load("/game-4p-minion-phase.json");

        assertEquals("Bob",   game.getPlayer("Alice").getPrey().getName());
        assertEquals("Dave",  game.getPlayer("Alice").getPredator().getName());
        assertEquals("Carol", game.getPlayer("Bob").getPrey().getName());
        assertEquals("Alice", game.getPlayer("Bob").getPredator().getName());
        assertEquals("Dave",  game.getPlayer("Carol").getPrey().getName());
        assertEquals("Bob",   game.getPlayer("Carol").getPredator().getName());
        assertEquals("Alice", game.getPlayer("Dave").getPrey().getName());
        assertEquals("Carol", game.getPlayer("Dave").getPredator().getName());
    }

    // ── game-4p-with-minions.json ─────────────────────────────────────────────

    @Test
    void load_4pWithMinions_aliceAndBobEachHaveOneReadyMinion() throws Exception {
        GameData game = load("/game-4p-with-minions.json");

        assertEquals(1, game.getPlayer("Alice").getRegion(RegionType.READY).getCards().size());
        assertEquals("Dima", game.getPlayer("Alice").getRegion(RegionType.READY).getCard(0).getName());

        assertEquals(1, game.getPlayer("Bob").getRegion(RegionType.READY).getCards().size());
        assertEquals("Meridian", game.getPlayer("Bob").getRegion(RegionType.READY).getCard(0).getName());

        assertTrue(game.getPlayer("Carol").getRegion(RegionType.READY).getCards().isEmpty());
        assertTrue(game.getPlayer("Dave").getRegion(RegionType.READY).getCards().isEmpty());
    }

    @Test
    void load_4pWithMinions_cardsMapContainsBothMinions() throws Exception {
        GameData game = load("/game-4p-with-minions.json");

        assertEquals(2, game.getCards().size());
        assertTrue(game.getCards().values().stream().anyMatch(c -> "Dima".equals(c.getName())));
        assertTrue(game.getCards().values().stream().anyMatch(c -> "Meridian".equals(c.getName())));
    }

    // ── game-1p-with-minions.json ─────────────────────────────────────────────

    @Test
    void load_1pWithMinions_aliceHasMinionInReadyAndTorpor() throws Exception {
        GameData game = load("/game-1p-with-minions.json");

        assertEquals(1, game.getPlayerOrder().size());
        assertEquals("Alice", game.getCurrentPlayerName());

        assertEquals(1, game.getPlayer("Alice").getRegion(RegionType.READY).getCards().size());
        assertEquals("Dima", game.getPlayer("Alice").getRegion(RegionType.READY).getCard(0).getName());

        assertEquals(1, game.getPlayer("Alice").getRegion(RegionType.TORPOR).getCards().size());
        assertEquals("Elena", game.getPlayer("Alice").getRegion(RegionType.TORPOR).getCard(0).getName());
    }

    // ── game-2p-with-cards.json ───────────────────────────────────────────────

    @Test
    void load_2pWithCards_aliceHasHandReadyAndCryptCards() throws Exception {
        GameData game = load("/game-2p-with-cards.json");

        assertEquals(1, game.getPlayer("Alice").getRegion(RegionType.HAND).getCards().size());
        assertEquals("Govern the Unaligned", game.getPlayer("Alice").getRegion(RegionType.HAND).getCard(0).getName());

        assertEquals(2, game.getPlayer("Alice").getRegion(RegionType.READY).getCards().size());
        assertEquals("Dima",  game.getPlayer("Alice").getRegion(RegionType.READY).getCard(0).getName());
        assertEquals("Elena", game.getPlayer("Alice").getRegion(RegionType.READY).getCard(1).getName());

        assertEquals(1, game.getPlayer("Alice").getRegion(RegionType.CRYPT).getCards().size());
        assertEquals("New Vampire", game.getPlayer("Alice").getRegion(RegionType.CRYPT).getCard(0).getName());
    }

    @Test
    void load_2pWithCards_cardsMapHasFourEntries() throws Exception {
        GameData game = load("/game-2p-with-cards.json");
        assertEquals(4, game.getCards().size());
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private GameData load(String resource) throws Exception {
        try (var is = getClass().getResourceAsStream(resource)) {
            assertNotNull(is, "Fixture not found on classpath: " + resource);
            return mapper.readValue(is, GameData.class);
        }
    }
}
