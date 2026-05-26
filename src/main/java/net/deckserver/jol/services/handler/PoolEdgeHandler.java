package net.deckserver.jol.services.handler;

import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.command.GainEdge;
import net.deckserver.jol.game.command.SetPool;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

public final class PoolEdgeHandler {
    private PoolEdgeHandler() {}

    public static CommandResult handleSetPool(GameData game, SetPool cmd, String actor) {
        PlayerData player = GameRules.requirePlayer(game, cmd.playerName());
        player.setPool(cmd.amount());
        String msg = actor + " set " + cmd.playerName() + "'s pool to " + cmd.amount();
        return new CommandResult(game, msg, new CommandLogData.SetPoolLog(actor, cmd.playerName(), cmd.amount()));
    }

    public static CommandResult handleGainEdge(GameData game, GainEdge cmd, String actor) {
        PlayerData player = GameRules.requirePlayer(game, cmd.playerName());
        game.setEdge(player);
        String msg = actor + " gained the Edge";
        return new CommandResult(game, msg, new CommandLogData.GainEdgeLog(actor));
    }
}
