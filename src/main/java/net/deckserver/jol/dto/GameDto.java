package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.Status;

@RegisterForReflection
public class GameDto {
    public String id;
    public String name;
    public Status status;

    public GameDto(String id, String name, Status status) {
        this.id = id;
        this.name = name;
        this.status = status;
    }
}
