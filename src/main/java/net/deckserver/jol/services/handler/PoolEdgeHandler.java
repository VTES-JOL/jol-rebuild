package net.deckserver.jol.services.handler;

import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.command.GainEdge;
import net.deckserver.jol.game.command.SetPool;
import net.deckserver.jol.game.effect.EdgeChangedEffect;
import net.deckserver.jol.game.effect.PlayerPoolChangedEffect;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

import java.util.List;

public final class PoolEdgeHandler {
    private PoolEdgeHandler() {}

    public static CommandResult handleSetPool(GameData game, SetPool cmd, String actor) {
        PlayerData player = GameRules.requirePlayer(game, cmd.playerName());
        int delta = cmd.amount() - player.getPool();
        String msg = actor + " set " + cmd.playerName() + "'s pool to " + cmd.amount();
        return new CommandResult(game, msg, new CommandLogData.SetPoolLog(actor, cmd.playerName(), cmd.amount()),
                List.of(new PlayerPoolChangedEffect(cmd.playerName(), delta)));
    }

    public static CommandResult handleGainEdge(GameData game, GainEdge cmd, String actor) {
        GameRules.requirePlayer(game, cmd.playerName());
        String msg = actor + " gained the Edge";
        return new CommandResult(game, msg, new CommandLogData.GainEdgeLog(actor),
                List.of(new EdgeChangedEffect(cmd.playerName())));
    }
}
