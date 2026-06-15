package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.enums.ActionType;
import net.deckserver.jol.enums.RestrictionType;
import net.deckserver.jol.game.command.CardRef;

import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

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
    private String actionCardId;
    private boolean bleedLimitedUsed;
    private boolean referendumSuccessful;
    private String referendumTerms;
    private Set<String> playedCardNames = new HashSet<>();
    private Map<RestrictionType, Set<CardRef>> actionRestrictions = new EnumMap<>(RestrictionType.class);

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
        this.actionCardId = src.actionCardId;
        this.bleedLimitedUsed = src.bleedLimitedUsed;
        this.referendumSuccessful = src.referendumSuccessful;
        this.referendumTerms = src.referendumTerms;
        this.playedCardNames = new HashSet<>(src.playedCardNames);
        this.actionRestrictions = new EnumMap<>(RestrictionType.class);
        src.actionRestrictions.forEach((k, v) -> this.actionRestrictions.put(k, new HashSet<>(v)));
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

    public String getActionCardId() { return actionCardId; }
    public void setActionCardId(String actionCardId) { this.actionCardId = actionCardId; }

    public boolean isBleedLimitedUsed() { return bleedLimitedUsed; }
    public void setBleedLimitedUsed(boolean bleedLimitedUsed) { this.bleedLimitedUsed = bleedLimitedUsed; }

    public boolean isReferendumSuccessful() { return referendumSuccessful; }
    public void setReferendumSuccessful(boolean referendumSuccessful) { this.referendumSuccessful = referendumSuccessful; }

    public String getReferendumTerms() { return referendumTerms; }
    public void setReferendumTerms(String referendumTerms) { this.referendumTerms = referendumTerms; }

    public Set<String> getPlayedCardNames() { return playedCardNames; }
    public void setPlayedCardNames(Set<String> playedCardNames) { this.playedCardNames = playedCardNames; }

    public Map<RestrictionType, Set<CardRef>> getActionRestrictions() { return actionRestrictions; }
    public void setActionRestrictions(Map<RestrictionType, Set<CardRef>> actionRestrictions) { this.actionRestrictions = actionRestrictions; }

    public boolean isRestricted(RestrictionType type, CardRef ref) {
        return actionRestrictions.getOrDefault(type, Set.of()).contains(ref);
    }
}
