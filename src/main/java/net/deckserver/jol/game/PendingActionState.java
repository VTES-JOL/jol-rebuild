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
    private boolean reachedResolution;
    private boolean actionSuccessful;
    private boolean bleedSuccessful;
    private int bleedAmount;

    public PendingActionState() {}

    public PendingActionState(PendingActionState src) {
        this.actorRef = src.actorRef;
        this.actionType = src.actionType;
        this.targetPlayerName = src.targetPlayerName;
        this.status = src.status;
        this.blockerRef = src.blockerRef;
        this.reachedResolution = src.reachedResolution;
        this.actionSuccessful = src.actionSuccessful;
        this.bleedSuccessful = src.bleedSuccessful;
        this.bleedAmount = src.bleedAmount;
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

    public boolean isReachedResolution() { return reachedResolution; }
    public void setReachedResolution(boolean reachedResolution) { this.reachedResolution = reachedResolution; }

    public boolean isActionSuccessful() { return actionSuccessful; }
    public void setActionSuccessful(boolean actionSuccessful) { this.actionSuccessful = actionSuccessful; }

    public boolean isBleedSuccessful() { return bleedSuccessful; }
    public void setBleedSuccessful(boolean bleedSuccessful) { this.bleedSuccessful = bleedSuccessful; }

    public int getBleedAmount() { return bleedAmount; }
    public void setBleedAmount(int bleedAmount) { this.bleedAmount = bleedAmount; }
}
