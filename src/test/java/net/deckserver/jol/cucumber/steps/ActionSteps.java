package net.deckserver.jol.cucumber.steps;

import io.cucumber.java.en.And;
import io.cucumber.java.en.When;
import io.quarkus.arc.Arc;
import net.deckserver.jol.cucumber.GameWorld;
import net.deckserver.jol.enums.ActionType;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.services.GameCommandService;

public class ActionSteps {

    private final GameWorld world;
    private final GameCommandService commandService;

    public ActionSteps(GameWorld world) {
        this.world = world;
        this.commandService = Arc.container().select(GameCommandService.class).get();
    }

    @When("{string} declares a {word} action")
    public void declareUndirectedAction(String player, String actionType) {
        world.lastException = null;
        CardRef ref = firstMinionOf(player);
        try {
            commandService.execute(player, new DeclareAction(
                    world.gameId, ref, ActionType.valueOf(actionType), null));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} declares a {word} action targeting {string}")
    public void declareDirectedAction(String player, String actionType, String target) {
        world.lastException = null;
        CardRef ref = firstMinionOf(player);
        try {
            commandService.execute(player, new DeclareAction(
                    world.gameId, ref, ActionType.valueOf(actionType), target));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} declares a {word} action with {string}")
    public void declareActionWithMinion(String player, String actionType, String minionName) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(minionName);
        try {
            commandService.execute(player, new DeclareAction(
                    world.gameId, ref, ActionType.valueOf(actionType), null));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("all players pass the impulse window")
    public void passAllImpulse() {
        world.lastException = null;
        try {
            commandService.execute(world.game.getCurrentPlayerName(),
                    new CloseImpulseWindow(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} passes the impulse")
    public void passImpulse(String player) {
        world.lastException = null;
        try {
            commandService.execute(player, new PassImpulse(world.gameId, player));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} resolves the action")
    public void resolveAction(String player) {
        world.lastException = null;
        // Snapshot pool values before resolution for "decrease by" assertions
        world.game.getPlayerOrder().forEach(p ->
                world.poolBefore.put(p, world.game.getPlayer(p).getPool()));
        try {
            commandService.execute(player, new ResolveAction(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} attempts to block with {string}")
    public void attemptBlock(String player, String minionName) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(minionName);
        try {
            commandService.execute(player, new AttemptBlock(world.gameId, ref));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} cannot block before receiving the impulse")
    public void cannotBlockBeforeImpulse(String player) {
        world.lastException = null;
        CardRef ref = firstMinionOf(player);
        try {
            commandService.execute(player, new AttemptBlock(world.gameId, ref));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @And("the sequencing window closes")
    public void closeSequencing() {
        world.lastException = null;
        try {
            commandService.execute(world.game.getCurrentPlayerName(),
                    new CloseSequencingWindow(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Returns the CardRef of the first minion registered for the given player. */
    private CardRef firstMinionOf(String player) {
        return world.minionRefs.values().stream()
                .filter(ref -> ref.playerName().equals(player))
                .findFirst()
                .orElse(null);
    }
}
