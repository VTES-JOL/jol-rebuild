package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.command.DrawCard;
import net.deckserver.jol.game.command.DrawCrypt;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

public final class DeckHandler {
    private DeckHandler() {}

    public static CommandResult handleDrawCard(GameData game, DrawCard cmd, String actor) {
        PlayerData player = GameRules.requirePlayer(game, actor);
        RegionData library = player.getRegion(RegionType.LIBRARY);
        RegionData hand = player.getRegion(RegionType.HAND);
        int toDraw = Math.min(cmd.count(), library.getCards().size());
        for (int i = 0; i < toDraw; i++) {
            if (library.getCards().isEmpty()) break;
            hand.addCard(library.getFirstCard(), false);
        }
        String msg = actor + " drew " + toDraw + " card(s)";
        return new CommandResult(game, msg, new CommandLogData.DrawCardLog(actor, toDraw));
    }

    public static CommandResult handleDrawCrypt(GameData game, DrawCrypt cmd, String actor) {
        PlayerData player = GameRules.requirePlayer(game, actor);
        RegionData crypt = player.getRegion(RegionType.CRYPT);
        RegionData uncontrolled = player.getRegion(RegionType.UNCONTROLLED);
        int toDraw = Math.min(cmd.count(), crypt.getCards().size());
        for (int i = 0; i < toDraw; i++) {
            if (crypt.getCards().isEmpty()) break;
            uncontrolled.addCard(crypt.getFirstCard(), false);
        }
        String msg = actor + " drew " + toDraw + " card(s) from crypt";
        return new CommandResult(game, msg, new CommandLogData.DrawCryptLog(actor, toDraw));
    }

    public static CommandResult handleShuffleLibrary(GameData game, String actor) {
        PlayerData player = GameRules.requirePlayer(game, actor);
        player.getRegion(RegionType.LIBRARY).shuffle(0);
        String msg = actor + " shuffled their library";
        return new CommandResult(game, msg, new CommandLogData.ShuffleLibraryLog(actor));
    }

    public static CommandResult handleShuffleCrypt(GameData game, String actor) {
        PlayerData player = GameRules.requirePlayer(game, actor);
        player.getRegion(RegionType.CRYPT).shuffle(0);
        String msg = actor + " shuffled their crypt";
        return new CommandResult(game, msg, new CommandLogData.ShuffleCryptLog(actor));
    }
}
