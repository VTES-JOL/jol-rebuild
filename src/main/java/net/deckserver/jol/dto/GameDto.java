package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.Registration;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Status;
import net.deckserver.jol.enums.Visibility;

@RegisterForReflection
public class GameDto {
    public String id;
    public String name;
    public Status status;
    public GameFormat format;
    public String owner;
    public Visibility visibility;
    public int registrationCount;
    public int maxPlayers;

    public GameDto(Game game, int registrationCount) {
        this.id = game.id;
        this.name = game.name;
        this.status = game.status;
        this.format = game.gameFormat;
        this.owner = game.owner != null ? game.owner.username : null;
        this.visibility = game.visibility;
        this.registrationCount = registrationCount;
        this.maxPlayers = game.gameFormat.getMaxPlayers();
    }

    public GameDto(Game game) {
        this(game, (int) Registration.countForGame(game.id));
    }
}
