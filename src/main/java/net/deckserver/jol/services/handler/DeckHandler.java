package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.command.DrawCard;
import net.deckserver.jol.game.command.DrawCrypt;
import net.deckserver.jol.game.effect.CardMovedEffect;
import net.deckserver.jol.game.effect.GameEffect;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

import java.util.List;

public final class DeckHandler {
    private DeckHandler() {}

    public static CommandResult handleDrawCard(GameData game, DrawCard cmd, String actor) {
        PlayerData player = GameRules.requirePlayer(game, actor);
        RegionData library = player.getRegion(RegionType.LIBRARY);
        int toDraw = Math.min(cmd.count(), library.getCards().size());
        List<GameEffect> effects = library.getCards().stream()
                .limit(toDraw)
                .map(card -> (GameEffect) new CardMovedEffect(card.getId(), actor, RegionType.HAND.name()))
                .toList();
        String msg = actor + " drew " + toDraw + " card(s)";
        return new CommandResult(game, msg, new CommandLogData.DrawCardLog(actor, toDraw), effects);
    }

    public static CommandResult handleDrawCrypt(GameData game, DrawCrypt cmd, String actor) {
        PlayerData player = GameRules.requirePlayer(game, actor);
        RegionData crypt = player.getRegion(RegionType.CRYPT);
        int toDraw = Math.min(cmd.count(), crypt.getCards().size());
        List<GameEffect> effects = crypt.getCards().stream()
                .limit(toDraw)
                .map(card -> (GameEffect) new CardMovedEffect(card.getId(), actor, RegionType.UNCONTROLLED.name()))
                .toList();
        String msg = actor + " drew " + toDraw + " card(s) from crypt";
        return new CommandResult(game, msg, new CommandLogData.DrawCryptLog(actor, toDraw), effects);
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
