package net.deckserver.jol.cucumber.steps;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.cucumber.java.After;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.quarkus.arc.Arc;
import net.deckserver.jol.cucumber.GameWorld;
import net.deckserver.jol.enums.CardType;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.CardRef;
import net.deckserver.jol.services.GameStateStore;

public class GameSetupSteps {

    private final GameWorld world;
    private final GameStateStore gameStateStore;
    private final ObjectMapper mapper;

    public GameSetupSteps(GameWorld world) {
        this.world = world;
        this.gameStateStore = Arc.container().select(GameStateStore.class).get();
        this.mapper = Arc.container().select(ObjectMapper.class).get();
    }

    @After
    public void cleanup() {
        if (world.gameId != null) {
            gameStateStore.remove(world.gameId);
        }
    }

    @Given("a {int}-player game in {string} phase with rules enforced")
    public void aGameInPhaseWithRulesEnforced(int playerCount, String phase) throws Exception {
        try (var is = getClass().getResourceAsStream("/game-4p-with-minions.json")) {
            world.game = mapper.readValue(is, GameData.class);
        }
        world.game.setPhase(Phase.valueOf(phase));
        world.game.setRulesEnforced(true);
        world.gameId = world.game.getId();

        // Clear all READY and TORPOR regions so each scenario builds its own minions
        for (String player : world.game.getPlayerOrder()) {
            world.game.getPlayer(player).getRegion(RegionType.READY).getCards().clear();
            world.game.getPlayer(player).getRegion(RegionType.TORPOR).getCards().clear();
        }

        gameStateStore.put(world.gameId, world.game);
    }

    @Given("{string} controls a ready vampire {string} with {int} blood and capacity {int}")
    public void addReadyVampire(String player, String name, int blood, int capacity) {
        addVampire(player, name, blood, capacity, RegionType.READY);
    }

    @Given("{string} controls a torpor vampire {string} with {int} blood and capacity {int}")
    public void addTorporVampire(String player, String name, int blood, int capacity) {
        addVampire(player, name, blood, capacity, RegionType.TORPOR);
    }

    @Given("{string} controls a ready vampire {string} with {int} blood and capacity {int} in ready")
    public void addReadyVampireAlt(String player, String name, int blood, int capacity) {
        addVampire(player, name, blood, capacity, RegionType.READY);
    }

    @Given("{string}'s pool is {int}")
    public void setPool(String player, int pool) {
        world.game.getPlayer(player).setPool(pool);
    }

    @And("{string} is unlocked")
    public void unlockMinion(String minionName) {
        CardRef ref = world.minionRefs.get(minionName);
        if (ref != null) {
            CardData card = world.game.getCardByRef(ref);
            if (card != null) card.setLocked(false);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void addVampire(String player, String name, int blood, int capacity, RegionType region) {
        CardData card = new CardData("card-" + name, world.game.getPlayer(player));
        card.setName(name);
        card.setMinion(true);
        card.setType(CardType.VAMPIRE);
        card.setCounters(blood);
        card.setCapacity(capacity);
        world.game.registerCard(card);

        RegionData regionData = world.game.getPlayer(player).getRegion(region);
        regionData.addCard(card, false);
        world.game.registerCard(card);

        int position = regionData.getCards().size() - 1;
        world.minionRefs.put(name, new CardRef(player, region, position, -1));
    }
}
