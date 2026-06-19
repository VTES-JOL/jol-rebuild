package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.game.command.CardRef;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@RegisterForReflection
public class ReferendumState {
    private String terms;
    private String actingPlayerName;
    private boolean bloodHunt;
    private CardRef targetRef;
    private int baseVotesFor;
    private int baseVotesAgainst;
    private int prisciVotesFor;
    private int prisciVotesAgainst;
    /** Per-player [for, against] vote totals for display. */
    private Map<String, int[]> votesByPlayer = new HashMap<>();
    /** Per-titled-vampire [for, against] votes cast; used to enforce title vote budget. */
    private Map<String, int[]> votesByCardId = new HashMap<>();
    /** Priscus card ID → true (for) / false (against). */
    private Map<String, Boolean> prisciBallots = new HashMap<>();
    /** Players who have already burned a political action card this referendum. */
    private Set<String> cardBurnedByPlayer = new HashSet<>();
    private boolean pollingOpen;

    public ReferendumState() {}

    public String getTerms() { return terms; }
    public void setTerms(String terms) { this.terms = terms; }

    public String getActingPlayerName() { return actingPlayerName; }
    public void setActingPlayerName(String actingPlayerName) { this.actingPlayerName = actingPlayerName; }

    public boolean isBloodHunt() { return bloodHunt; }
    public void setBloodHunt(boolean bloodHunt) { this.bloodHunt = bloodHunt; }

    public CardRef getTargetRef() { return targetRef; }
    public void setTargetRef(CardRef targetRef) { this.targetRef = targetRef; }

    public int getBaseVotesFor() { return baseVotesFor; }
    public void setBaseVotesFor(int baseVotesFor) { this.baseVotesFor = baseVotesFor; }

    public int getBaseVotesAgainst() { return baseVotesAgainst; }
    public void setBaseVotesAgainst(int baseVotesAgainst) { this.baseVotesAgainst = baseVotesAgainst; }

    public int getPrisciVotesFor() { return prisciVotesFor; }
    public void setPrisciVotesFor(int prisciVotesFor) { this.prisciVotesFor = prisciVotesFor; }

    public int getPrisciVotesAgainst() { return prisciVotesAgainst; }
    public void setPrisciVotesAgainst(int prisciVotesAgainst) { this.prisciVotesAgainst = prisciVotesAgainst; }

    public Map<String, int[]> getVotesByPlayer() { return votesByPlayer; }
    public void setVotesByPlayer(Map<String, int[]> votesByPlayer) { this.votesByPlayer = votesByPlayer; }

    public Map<String, int[]> getVotesByCardId() { return votesByCardId; }
    public void setVotesByCardId(Map<String, int[]> votesByCardId) { this.votesByCardId = votesByCardId; }

    public Map<String, Boolean> getPrisciBallots() { return prisciBallots; }
    public void setPrisciBallots(Map<String, Boolean> prisciBallots) { this.prisciBallots = prisciBallots; }

    public Set<String> getCardBurnedByPlayer() { return cardBurnedByPlayer; }
    public void setCardBurnedByPlayer(Set<String> cardBurnedByPlayer) { this.cardBurnedByPlayer = cardBurnedByPlayer; }

    public boolean isPollingOpen() { return pollingOpen; }
    public void setPollingOpen(boolean pollingOpen) { this.pollingOpen = pollingOpen; }

    public int totalVotesFor() { return baseVotesFor + prisciVotesFor; }
    public int totalVotesAgainst() { return baseVotesAgainst + prisciVotesAgainst; }
}
