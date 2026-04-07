package net.deckserver.jol.dto;

import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Status;

public class GameDto {
    public Long id;
    public String name;
    public Status status;
    public GameFormat format;
    public String owner;

    public GameDto(Long id, String name, Status status, GameFormat format, String owner) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.format = format;
        this.owner = owner;
    }
}
