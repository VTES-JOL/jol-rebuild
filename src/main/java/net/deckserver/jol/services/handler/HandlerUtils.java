package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.ImpulseContext;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.CardRef;

import java.util.LinkedHashSet;
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

    static void unlockPlayerCards(GameData game, String playerName) {
        PlayerData player = game.getPlayer(playerName);
        if (player == null) return;
        for (RegionType type : RegionType.IN_PLAY_REGIONS) {
            RegionData region = player.getRegion(type);
            for (CardData card : region.getCards()) {
                card.setLocked(false);
                for (CardData child : card.getCards()) {
                    child.setLocked(false);
                }
            }
        }
    }

    static List<String> buildPassOrder(GameData game, ImpulseContext context, String actingPlayer, String targetPlayerName) {
        List<String> active = game.getCurrentPlayers().stream()
                .map(PlayerData::getName)
                .collect(java.util.stream.Collectors.toList());
        if (!active.contains(actingPlayer)) return List.of(actingPlayer);

        LinkedHashSet<String> order = new LinkedHashSet<>();
        order.add(actingPlayer);

        int actingIdx = active.indexOf(actingPlayer);
        int n = active.size();

        PlayerData acting = game.getPlayer(actingPlayer);
        String prey = acting.getPrey() != null ? acting.getPrey().getName() : null;
        String predator = acting.getPredator() != null ? acting.getPredator().getName() : null;

        switch (context) {
            case UNDIRECTED -> {
                if (prey != null && active.contains(prey)) order.add(prey);
                if (predator != null && active.contains(predator)) order.add(predator);
                for (int i = 1; i < n; i++) order.add(active.get((actingIdx + i) % n));
            }
            case DIRECTED_SINGLE, COMBAT -> {
                if (targetPlayerName != null && active.contains(targetPlayerName)) order.add(targetPlayerName);
                for (int i = 1; i < n; i++) order.add(active.get((actingIdx + i) % n));
            }
            case DIRECTED_MULTI -> {
                for (int i = 1; i < n; i++) order.add(active.get((actingIdx + i) % n));
            }
        }
        return List.copyOf(order);
    }
}
