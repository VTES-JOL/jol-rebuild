package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.CardRef;
import net.deckserver.jol.game.effect.CardLockedEffect;
import net.deckserver.jol.game.effect.GameEffect;

import java.util.ArrayList;
import java.util.List;

final class HandlerUtils {
    private HandlerUtils() {}

    static String cardToken(CardData card) {
        return "[card:" + card.getCardId() + ":" + card.getName() + "]";
    }

    static String cardLabel(CardData card, CardRef ref) {
        RegionData region = card.getRegion();
        if (region == null) return cardToken(card);
        RegionType type = region.getType();
        String ownerName = card.getOwner() != null ? card.getOwner().getName() : "unknown";
        if (type == RegionType.UNCONTROLLED) {
            return "card #" + (ref.position() + 1) + " in " + ownerName + "'s uncontrolled region";
        }
        if (RegionType.OTHER_HIDDEN_REGIONS.contains(type)) {
            return "a card in " + ownerName + "'s " + type.description();
        }
        return cardToken(card);
    }

    static boolean isHidden(CardData card) {
        RegionData region = card.getRegion();
        if (region == null) return false;
        RegionType type = region.getType();
        return type == RegionType.UNCONTROLLED || RegionType.OTHER_HIDDEN_REGIONS.contains(type);
    }

    static List<GameEffect> buildUnlockEffects(PlayerData player) {
        List<GameEffect> effects = new ArrayList<>();
        for (RegionType type : RegionType.IN_PLAY_REGIONS) {
            RegionData region = player.getRegion(type);
            for (CardData card : region.getCards()) {
                if (card.isLocked()) effects.add(new CardLockedEffect(card.getId(), false));
                for (CardData child : card.getCards()) {
                    if (child.isLocked()) effects.add(new CardLockedEffect(child.getId(), false));
                }
            }
        }
        return effects;
    }

}
