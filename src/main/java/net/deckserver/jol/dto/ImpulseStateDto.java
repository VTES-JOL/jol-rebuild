package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

@RegisterForReflection
public class ImpulseStateDto {
    public boolean active;
    public String context;
    public String actingPlayer;
    public String currentImpulseHolder;
    public List<String> passOrder;
    public int consecutivePasses;
}
