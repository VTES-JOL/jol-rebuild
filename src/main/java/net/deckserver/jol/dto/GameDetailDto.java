package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.Registration;

import java.util.List;

@RegisterForReflection
public class GameDetailDto extends GameDto {
    public List<RegistrationInfoDto> registrations;
    public List<RegistrationInfoDto> invites;

    @RegisterForReflection
    public static class RegistrationInfoDto {
        public String username;
        public String deckName;

        public RegistrationInfoDto(Registration r) {
            this.username = r.user.username;
            this.deckName = r.deckName;
        }
    }

    public GameDetailDto(Game game, List<Registration> registrations, List<Registration> invites) {
        super(game, registrations.size());
        this.registrations = registrations.stream().map(RegistrationInfoDto::new).toList();
        this.invites = invites.stream().map(RegistrationInfoDto::new).toList();
    }
}
