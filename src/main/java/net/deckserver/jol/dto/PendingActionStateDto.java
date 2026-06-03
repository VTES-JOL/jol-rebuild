package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.game.command.CardRef;

@RegisterForReflection
public class PendingActionStateDto {
    public CardRef actorRef;
    public String actionType;
    public String targetPlayerName;
    public String status;
    public CardRef blockerRef;
}
