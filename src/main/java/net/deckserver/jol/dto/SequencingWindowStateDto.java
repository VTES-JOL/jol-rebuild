package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

@RegisterForReflection
public class SequencingWindowStateDto {
    public boolean active;
    public String windowType;
    public List<String> passOrder;
    public int consecutivePasses;
    public String currentHolder;
}
