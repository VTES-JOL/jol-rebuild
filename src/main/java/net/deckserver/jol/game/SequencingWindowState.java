package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.SequencingWindowType;

import java.util.ArrayList;
import java.util.List;

@RegisterForReflection
public class SequencingWindowState {
    private boolean active;
    private SequencingWindowType windowType;
    private List<String> passOrder = new ArrayList<>();
    private int consecutivePasses;
    private String currentHolder;

    public SequencingWindowState() {}

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public SequencingWindowType getWindowType() { return windowType; }
    public void setWindowType(SequencingWindowType windowType) { this.windowType = windowType; }

    public List<String> getPassOrder() { return passOrder; }
    public void setPassOrder(List<String> passOrder) { this.passOrder = passOrder; }

    public int getConsecutivePasses() { return consecutivePasses; }
    public void setConsecutivePasses(int consecutivePasses) { this.consecutivePasses = consecutivePasses; }

    public String getCurrentHolder() { return currentHolder; }
    public void setCurrentHolder(String currentHolder) { this.currentHolder = currentHolder; }
}
