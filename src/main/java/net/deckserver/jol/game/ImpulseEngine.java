package net.deckserver.jol.game;

import net.deckserver.jol.enums.ImpulseContext;

import java.util.LinkedHashSet;
import java.util.List;

public final class ImpulseEngine {
    private ImpulseEngine() {}

    public static ImpulseState open(GameData game, ImpulseContext ctx, String actingPlayer, String targetPlayer) {
        ImpulseState state = new ImpulseState();
        state.setActive(true);
        state.setContext(ctx);
        state.setActingPlayer(actingPlayer);
        state.setCurrentImpulseHolder(actingPlayer);
        state.setConsecutivePasses(0);
        state.setPassOrder(buildPassOrder(game, ctx, actingPlayer, targetPlayer));
        return state;
    }

    /** Returns the updated window, or null when all players have passed and the window should close. */
    public static ImpulseState pass(ImpulseState state) {
        int passes = state.getConsecutivePasses() + 1;
        if (passes >= state.getPassOrder().size()) {
            return null;
        }
        List<String> order = state.getPassOrder();
        int idx = order.indexOf(state.getCurrentImpulseHolder());
        if (idx < 0) {
            throw new IllegalStateException(
                    "Impulse holder '" + state.getCurrentImpulseHolder() + "' is not in the pass order");
        }
        String nextHolder = order.get((idx + 1) % order.size());
        ImpulseState updated = new ImpulseState(state);
        updated.setCurrentImpulseHolder(nextHolder);
        updated.setConsecutivePasses(passes);
        return updated;
    }

    public static ImpulseState claim(ImpulseState state) {
        ImpulseState updated = new ImpulseState(state);
        updated.setCurrentImpulseHolder(state.getActingPlayer());
        updated.setConsecutivePasses(0);
        return updated;
    }

    public static List<String> buildPassOrder(GameData game, ImpulseContext context, String actingPlayer, String targetPlayerName) {
        List<String> active = game.getCurrentPlayers().stream()
                .map(PlayerData::getName)
                .toList();
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
