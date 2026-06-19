package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.game.command.CardRef;

import java.util.Map;
import java.util.Set;

@RegisterForReflection
public class PendingActionStateDto {
    public CardRef actorRef;
    public String actionType;
    public String targetPlayerName;
    public String status;
    public CardRef blockerRef;
    public int stealth;
    public Map<String, Integer> interceptsByBlockerRef;
    public boolean blocksDeclined;
    public CardRef currentBlockerRef;
    public Set<String> wakePermissionByCardId;
}
