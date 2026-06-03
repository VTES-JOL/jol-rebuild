package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.Phase;

import java.util.List;
import java.util.Map;

@RegisterForReflection
public class GameStateDto {
    public String gameId;
    public String gameName;
    public String turn;
    public Phase phase;
    public String currentPlayer;
    public String edgeHolder;
    public boolean orderReversed;
    public String notes;
    /** Ordered player list (predator → prey direction). */
    public List<String> playerOrder;
    public List<PlayerStateDto> players;
    /** Cards visible to this viewer — keyed by card UUID. Hidden cards are omitted entirely. */
    public Map<String, CardStateDto> cards;
    /** Influence transfers remaining for the current player this turn (0 outside INFLUENCE phase). */
    public int transfersRemaining;
    /** Active impulse window, or null when no impulse window is open. */
    public ImpulseStateDto impulseWindow;
    /** Active action declaration, or null when no action is in progress. */
    public PendingActionStateDto pendingAction;
    /** Active sequencing window (AS_ANNOUNCED or AFTER_RESOLUTION), or null. */
    public SequencingWindowStateDto sequencingWindow;
}
