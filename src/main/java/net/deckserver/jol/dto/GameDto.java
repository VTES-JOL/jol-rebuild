package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Status;

@RegisterForReflection
public class GameDto {
    public Long id;
    public String name;
    public Status status;
    public GameFormat format;
    public String owner;

    public GameDto(Game game) {
        this.id = game.id;
        this.name = game.name;
        this.status = game.status;
        this.format = game.gameFormat;
        this.owner = game.owner != null ? game.owner.username : null;
    }
}
