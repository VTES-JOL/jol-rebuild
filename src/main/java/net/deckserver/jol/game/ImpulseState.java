package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.ImpulseContext;

import java.util.ArrayList;
import java.util.List;

@RegisterForReflection
public class ImpulseState {
    private boolean active;
    private ImpulseContext context;
    private String actingPlayer;
    private String currentImpulseHolder;
    private List<String> passOrder = new ArrayList<>();
    private int consecutivePasses;

    public ImpulseState() {}

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public ImpulseContext getContext() { return context; }
    public void setContext(ImpulseContext context) { this.context = context; }

    public String getActingPlayer() { return actingPlayer; }
    public void setActingPlayer(String actingPlayer) { this.actingPlayer = actingPlayer; }

    public String getCurrentImpulseHolder() { return currentImpulseHolder; }
    public void setCurrentImpulseHolder(String currentImpulseHolder) { this.currentImpulseHolder = currentImpulseHolder; }

    public List<String> getPassOrder() { return passOrder; }
    public void setPassOrder(List<String> passOrder) { this.passOrder = passOrder; }

    public int getConsecutivePasses() { return consecutivePasses; }
    public void setConsecutivePasses(int consecutivePasses) { this.consecutivePasses = consecutivePasses; }
}
