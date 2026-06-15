package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.CardType;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.*;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.*;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

import java.util.List;

public final class ReferendumHandler {
    private ReferendumHandler() {}

    public static CommandResult handleOpenPolling(GameData game, OpenPolling cmd, String actor) {
        ReferendumState ref = requireReferendum(game);
        if (ref.isPollingOpen()) {
            throw new GameRuleException("Polling is already open");
        }
        ReferendumState updated = copyReferendum(ref);
        updated.setPollingOpen(true);

        String msg = actor + " opened polling";
        return new CommandResult(game, msg, null,
                List.of(new ReferendumStateChangedEffect(updated)));
    }

    public static CommandResult handleCastVotes(GameData game, CastVotes cmd, String actor) {
        ReferendumState ref = requireReferendum(game);
        requirePollingOpen(ref);

        CardData card = GameRules.requireCard(game, cmd.cardRef());
        GameRules.requireCardInRegion(card, RegionType.READY);
        if (!actor.equals(cmd.playerName())) {
            throw new GameRuleException("You may only cast votes for your own vampires");
        }
        if (!actor.equals(card.getOwnerName())) {
            throw new GameRuleException("You do not control this vampire");
        }

        int titleVotes = titleVoteCount(card.getTitle());
        if (titleVotes == 0) {
            throw new GameRuleException(card.getName() + " has no title and cannot cast votes");
        }
        if (cmd.amount() <= 0) {
            throw new GameRuleException("Vote amount must be positive");
        }

        int[] cardVotes = ref.getVotesByCardId().getOrDefault(card.getId(), new int[]{0, 0});
        int alreadyCast = cardVotes[0] + cardVotes[1];
        if (alreadyCast + cmd.amount() > titleVotes) {
            throw new GameRuleException(card.getName() + " can only cast " + titleVotes + " vote(s) total (title: " + card.getTitle() + ")");
        }

        boolean voteFor = parseForOrAgainst(cmd.forOrAgainst());
        ReferendumState updated = copyReferendum(ref);

        if (voteFor) {
            updated.setBaseVotesFor(updated.getBaseVotesFor() + cmd.amount());
        } else {
            updated.setBaseVotesAgainst(updated.getBaseVotesAgainst() + cmd.amount());
        }

        int[] newCardVotes = new int[]{cardVotes[0], cardVotes[1]};
        if (voteFor) newCardVotes[0] += cmd.amount(); else newCardVotes[1] += cmd.amount();
        updated.getVotesByCardId().put(card.getId(), newCardVotes);

        int[] playerVotes = updated.getVotesByPlayer().getOrDefault(actor, new int[]{0, 0});
        int[] newPlayerVotes = new int[]{playerVotes[0], playerVotes[1]};
        if (voteFor) newPlayerVotes[0] += cmd.amount(); else newPlayerVotes[1] += cmd.amount();
        updated.getVotesByPlayer().put(actor, newPlayerVotes);

        String direction = voteFor ? "for" : "against";
        String msg = actor + " cast " + cmd.amount() + " vote(s) " + direction + " via " + card.getName();
        return new CommandResult(game, msg, null,
                List.of(new ReferendumStateChangedEffect(updated)));
    }

    public static CommandResult handleBurnCardForVote(GameData game, BurnCardForVote cmd, String actor) {
        ReferendumState ref = requireReferendum(game);
        requirePollingOpen(ref);

        if (!actor.equals(cmd.playerName())) {
            throw new GameRuleException("You may only burn cards for yourself");
        }
        if (ref.getCardBurnedByPlayer().contains(actor)) {
            throw new GameRuleException("You have already burned a political action card this referendum");
        }

        if (cmd.cardRef().regionType() != RegionType.HAND) {
            throw new GameRuleException("Card must be in hand to burn for a vote");
        }
        CardData card = GameRules.requireCard(game, cmd.cardRef());
        if (!actor.equals(card.getOwnerName())) {
            throw new GameRuleException("You do not control this card");
        }
        if (card.getType() != CardType.POLITICAL) {
            throw new GameRuleException("Only political action cards may be burned for a vote");
        }

        boolean voteFor = parseForOrAgainst(cmd.forOrAgainst());
        ReferendumState updated = copyReferendum(ref);
        updated.getCardBurnedByPlayer().add(actor);

        if (voteFor) {
            updated.setBaseVotesFor(updated.getBaseVotesFor() + 1);
            updated.getVotesByPlayer().merge(actor, new int[]{1, 0}, (a, b) -> new int[]{a[0] + b[0], a[1] + b[1]});
        } else {
            updated.setBaseVotesAgainst(updated.getBaseVotesAgainst() + 1);
            updated.getVotesByPlayer().merge(actor, new int[]{0, 1}, (a, b) -> new int[]{a[0] + b[0], a[1] + b[1]});
        }

        String direction = voteFor ? "for" : "against";
        String msg = actor + " burned " + card.getName() + " for 1 vote " + direction;
        return new CommandResult(game, msg, null,
                List.of(
                        new CardMovedEffect(card.getId(), actor, RegionType.ASH_HEAP.name()),
                        new ReferendumStateChangedEffect(updated)));
    }

    public static CommandResult handleBurnEdgeForVote(GameData game, BurnEdgeForVote cmd, String actor) {
        ReferendumState ref = requireReferendum(game);
        requirePollingOpen(ref);

        if (!actor.equals(cmd.playerName())) {
            throw new GameRuleException("You may only burn the Edge for yourself");
        }
        if (!actor.equals(game.getEdgePlayer())) {
            throw new GameRuleException("You do not hold the Edge");
        }

        boolean voteFor = parseForOrAgainst(cmd.forOrAgainst());
        ReferendumState updated = copyReferendum(ref);

        if (voteFor) {
            updated.setBaseVotesFor(updated.getBaseVotesFor() + 1);
            updated.getVotesByPlayer().merge(actor, new int[]{1, 0}, (a, b) -> new int[]{a[0] + b[0], a[1] + b[1]});
        } else {
            updated.setBaseVotesAgainst(updated.getBaseVotesAgainst() + 1);
            updated.getVotesByPlayer().merge(actor, new int[]{0, 1}, (a, b) -> new int[]{a[0] + b[0], a[1] + b[1]});
        }

        String direction = voteFor ? "for" : "against";
        String msg = actor + " burned the Edge for 1 vote " + direction;
        return new CommandResult(game, msg, null,
                List.of(
                        new EdgeChangedEffect(null),
                        new ReferendumStateChangedEffect(updated)));
    }

    public static CommandResult handleCastPrisciBallot(GameData game, CastPrisciBallot cmd, String actor) {
        ReferendumState ref = requireReferendum(game);
        requirePollingOpen(ref);

        CardData card = GameRules.requireCard(game, cmd.cardRef());
        GameRules.requireCardInRegion(card, RegionType.READY);
        if (!actor.equals(card.getOwnerName())) {
            throw new GameRuleException("You do not control this vampire");
        }
        if (!"Priscus".equalsIgnoreCase(card.getTitle())) {
            throw new GameRuleException(card.getName() + " is not a Priscus and cannot cast a Prisci ballot");
        }
        if (ref.getPrisciBallots().containsKey(card.getId())) {
            throw new GameRuleException(card.getName() + " has already cast a Prisci ballot this referendum");
        }

        boolean voteFor = parseForOrAgainst(cmd.forOrAgainst());
        ReferendumState updated = copyReferendum(ref);
        updated.getPrisciBallots().put(card.getId(), voteFor);
        recomputePrisciContribution(updated);

        String direction = voteFor ? "for" : "against";
        String msg = actor + "'s " + card.getName() + " cast a Prisci ballot " + direction;
        return new CommandResult(game, msg, null,
                List.of(new ReferendumStateChangedEffect(updated)));
    }

    public static CommandResult handleClosePolling(GameData game, ClosePolling cmd, String actor) {
        ReferendumState ref = requireReferendum(game);
        requirePollingOpen(ref);

        PendingActionState pending = game.getPendingAction();
        if (pending == null) {
            throw new GameRuleException("No pending action to record referendum result against");
        }

        int totalFor = ref.totalVotesFor();
        int totalAgainst = ref.totalVotesAgainst();
        boolean passes = totalFor > totalAgainst;

        PendingActionState resolved = new PendingActionState(pending);
        resolved.setReferendumSuccessful(passes);
        resolved.setReachedResolution(true);
        resolved.setActionSuccessful(passes);

        String outcome = passes
                ? "PASSED (" + totalFor + " for, " + totalAgainst + " against)"
                : "FAILED (" + totalFor + " for, " + totalAgainst + " against)";
        String msg = actor + " closed polling — referendum " + outcome;
        return new CommandResult(game, msg, null,
                List.of(
                        new PendingActionChangedEffect(true, resolved),
                        new ReferendumStateChangedEffect(null)));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public static ReferendumState openReferendum(GameData game, String actingPlayer, String terms) {
        ReferendumState ref = new ReferendumState();
        ref.setActingPlayerName(actingPlayer);
        ref.setTerms(terms != null ? terms : "");
        ref.setPollingOpen(false);
        return ref;
    }

    private static ReferendumState requireReferendum(GameData game) {
        ReferendumState ref = game.getReferendum();
        if (ref == null) {
            throw new GameRuleException("No referendum is currently in progress");
        }
        return ref;
    }

    private static void requirePollingOpen(ReferendumState ref) {
        if (!ref.isPollingOpen()) {
            throw new GameRuleException("Polling has not been opened yet");
        }
    }

    private static boolean parseForOrAgainst(String forOrAgainst) {
        if ("FOR".equalsIgnoreCase(forOrAgainst)) return true;
        if ("AGAINST".equalsIgnoreCase(forOrAgainst)) return false;
        throw new GameRuleException("forOrAgainst must be FOR or AGAINST");
    }

    static int titleVoteCount(String title) {
        if (title == null) return 0;
        return switch (title.toLowerCase()) {
            case "primogen", "bishop" -> 1;
            case "prince", "archbishop", "baron" -> 2;
            case "justicar", "cardinal" -> 3;
            case "inner circle", "regent" -> 4;
            default -> 0;
        };
    }

    private static void recomputePrisciContribution(ReferendumState ref) {
        long castFor = ref.getPrisciBallots().values().stream().filter(v -> v).count();
        long castAgainst = ref.getPrisciBallots().values().stream().filter(v -> !v).count();
        if (castFor > castAgainst) {
            ref.setPrisciVotesFor(3);
            ref.setPrisciVotesAgainst(0);
        } else if (castAgainst > castFor) {
            ref.setPrisciVotesFor(0);
            ref.setPrisciVotesAgainst(3);
        } else {
            ref.setPrisciVotesFor(0);
            ref.setPrisciVotesAgainst(0);
        }
    }

    private static ReferendumState copyReferendum(ReferendumState src) {
        ReferendumState copy = new ReferendumState();
        copy.setTerms(src.getTerms());
        copy.setActingPlayerName(src.getActingPlayerName());
        copy.setBloodHunt(src.isBloodHunt());
        copy.setTargetRef(src.getTargetRef());
        copy.setBaseVotesFor(src.getBaseVotesFor());
        copy.setBaseVotesAgainst(src.getBaseVotesAgainst());
        copy.setPrisciVotesFor(src.getPrisciVotesFor());
        copy.setPrisciVotesAgainst(src.getPrisciVotesAgainst());
        copy.setPollingOpen(src.isPollingOpen());

        // Deep-copy mutable collections
        src.getVotesByPlayer().forEach((k, v) -> copy.getVotesByPlayer().put(k, new int[]{v[0], v[1]}));
        src.getVotesByCardId().forEach((k, v) -> copy.getVotesByCardId().put(k, new int[]{v[0], v[1]}));
        copy.getPrisciBallots().putAll(src.getPrisciBallots());
        copy.getCardBurnedByPlayer().addAll(src.getCardBurnedByPlayer());
        return copy;
    }
}
