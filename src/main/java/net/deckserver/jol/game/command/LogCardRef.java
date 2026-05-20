package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;

@RegisterForReflection
public record LogCardRef(
        String cardId,
        String cardName,
        String owner,
        RegionType region,
        int position,
        int childIndex,
        boolean hidden
) {
    public static LogCardRef of(CardData card, CardRef ref, boolean hidden) {
        String ownerName = card.getOwner() != null ? card.getOwner().getName() : null;
        if (hidden) {
            return new LogCardRef(null, null, ownerName,
                    ref.regionType(), ref.position(), ref.childIndex(), true);
        }
        return new LogCardRef(card.getCardId(), card.getName(), ownerName,
                ref.regionType(), ref.position(), ref.childIndex(), false);
    }
}
