package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.enums.ActionType;
import net.deckserver.jol.game.command.CardRef;

@RegisterForReflection
public class PendingActionState {
    private CardRef actorRef;
    private ActionType actionType;
    private String targetPlayerName;
    private ActionStatus status;
    private CardRef blockerRef;

    public PendingActionState() {}

    public PendingActionState(PendingActionState src) {
        this.actorRef = src.actorRef;
        this.actionType = src.actionType;
        this.targetPlayerName = src.targetPlayerName;
        this.status = src.status;
        this.blockerRef = src.blockerRef;
    }

    public PendingActionState withStatus(ActionStatus newStatus) {
        PendingActionState copy = new PendingActionState(this);
        copy.status = newStatus;
        return copy;
    }

    public CardRef getActorRef() { return actorRef; }
    public void setActorRef(CardRef actorRef) { this.actorRef = actorRef; }

    public ActionType getActionType() { return actionType; }
    public void setActionType(ActionType actionType) { this.actionType = actionType; }

    public String getTargetPlayerName() { return targetPlayerName; }
    public void setTargetPlayerName(String targetPlayerName) { this.targetPlayerName = targetPlayerName; }

    public ActionStatus getStatus() { return status; }
    public void setStatus(ActionStatus status) { this.status = status; }

    public CardRef getBlockerRef() { return blockerRef; }
    public void setBlockerRef(CardRef blockerRef) { this.blockerRef = blockerRef; }
}
